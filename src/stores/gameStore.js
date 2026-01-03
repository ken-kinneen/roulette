import { create } from "zustand";
import {
    playClick,
    playGunshot,
    playCylinderSpin,
    playHammerCock,
    playLevelUp,
    playDeath,
    playCardFlip,
    playCardSlide,
} from "../utils/sounds";
import { runTriggerSequence, clearSequenceTimeouts, stopAllTriggerSounds } from "../utils/triggerSequence";

const STARTING_LIVES = 3;
const LEADERBOARD_KEY = "roulette_leaderboard";
const MAX_LEADERBOARD_ENTRIES = 10;

const getRandomBulletPosition = () => Math.floor(Math.random() * 6) + 1;

// Leaderboard utilities
const loadLeaderboard = () => {
    try {
        const saved = localStorage.getItem(LEADERBOARD_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

const saveLeaderboard = (leaderboard) => {
    try {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch {
        // localStorage not available
    }
};

const addToLeaderboard = (rounds) => {
    const leaderboard = loadLeaderboard();
    const entry = {
        rounds,
        date: new Date().toISOString(),
        id: Date.now(),
    };
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.rounds - a.rounds);
    const trimmed = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    saveLeaderboard(trimmed);
    return trimmed;
};

// Card utilities
const SUITS = ["hearts", "diamonds", "clubs", "spades"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value });
        }
    }
    return shuffleDeck(deck);
};

const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const getCardNumericValue = (card) => {
    const index = VALUES.indexOf(card.value);
    return index + 2; // 2-14 (2 is lowest, A is 14)
};

const compareCards = (currentCard, nextCard) => {
    const currentValue = getCardNumericValue(currentCard);
    const nextValue = getCardNumericValue(nextCard);
    if (nextValue > currentValue) return "higher";
    if (nextValue < currentValue) return "lower";
    return "equal"; // Tie - we'll treat this as a loss for the guesser
};

export const useGameStore = create((set, get) => ({
    // Game state
    roundsSurvived: 0,
    lives: STARTING_LIVES,
    bulletsShot: 0,
    bulletPosition: getRandomBulletPosition(),
    currentTurn: "player",
    gamePhase: "start", // 'start', 'playing', 'triggerSequence', 'cardGame', 'shooting', 'playerDead', 'aiDead', 'roundComplete', 'gameOver'
    shotHistory: [],
    leaderboard: loadLeaderboard(),
    isAnimating: false,

    // Trigger sequence state
    triggerSequencePhase: null, // 'drop', 'heartbeat', 'spin', 'pull', 'result', null
    triggerSequenceCleanup: null,

    // Card game state
    deck: [],
    currentCard: null,
    nextCard: null,
    cardGamePhase: "waiting", // 'waiting', 'dealing', 'guessing', 'revealing', 'result'
    lastGuess: null, // 'higher' or 'lower'
    lastGuessResult: null, // 'correct' or 'wrong'
    cardGameWinner: null, // 'player' or 'ai' or null

    // Audio state
    volume: 30, // 0-100
    isMuted: false,

    // Computed values
    getCurrentOdds: () => {
        const { bulletsShot } = get();
        const remaining = 6 - bulletsShot;
        return remaining > 0 ? (1 / remaining) * 100 : 100;
    },

    // Card game actions
    initCardGame: () => {
        const deck = createDeck();
        const currentCard = deck.pop();

        playCardSlide();

        set({
            deck,
            currentCard,
            nextCard: null,
            cardGamePhase: "dealing",
            lastGuess: null,
            lastGuessResult: null,
            cardGameWinner: null,
        });

        // After dealing animation, move to guessing phase
        setTimeout(() => {
            set({ cardGamePhase: "guessing" });
        }, 800);
    },

    makeGuess: (guess) => {
        const { deck, currentCard, currentTurn, isAnimating } = get();

        if (isAnimating || deck.length === 0) return;

        set({ isAnimating: true, lastGuess: guess, cardGamePhase: "revealing" });

        // Draw the next card
        const newDeck = [...deck];
        const nextCard = newDeck.pop();

        playCardFlip();

        setTimeout(() => {
            const comparison = compareCards(currentCard, nextCard);
            const isCorrect = guess === comparison;

            set({
                deck: newDeck,
                nextCard,
                lastGuessResult: isCorrect ? "correct" : "wrong",
                cardGamePhase: "result",
            });

            // After showing result, proceed
            setTimeout(() => {
                if (isCorrect) {
                    // Winner guessed correctly - opponent must now guess
                    // Move the next card to current position
                    playCardSlide();
                    set({
                        currentCard: nextCard,
                        nextCard: null,
                        currentTurn: currentTurn === "player" ? "ai" : "player",
                        cardGamePhase: "guessing",
                        lastGuess: null,
                        lastGuessResult: null,
                        isAnimating: false,
                    });
                } else {
                    // Loser must shoot the revolver
                    const loser = currentTurn; // The one who guessed wrong
                    set({
                        cardGameWinner: currentTurn === "player" ? "ai" : "player",
                        cardGamePhase: "waiting",
                        isAnimating: false,
                    });

                    // Start automatic trigger sequence for the loser
                    if (loser === "player") {
                        // Player lost - start the suspenseful sequence
                        setTimeout(() => {
                            get().startTriggerSequence();
                        }, 500);
                    } else {
                        // AI lost - go to normal playing phase for AI
                        set({ gamePhase: "playing" });
                    }
                }
            }, 1500);
        }, 600);
    },

    // Start the automatic trigger sequence for the player
    startTriggerSequence: () => {
        const { bulletsShot, bulletPosition } = get();
        const shotNumber = bulletsShot + 1;
        const willFire = shotNumber === bulletPosition;

        // Clean up any previous sequence
        const prevCleanup = get().triggerSequenceCleanup;
        if (prevCleanup) prevCleanup();

        set({
            gamePhase: "triggerSequence",
            triggerSequencePhase: "drop",
            isAnimating: true,
        });

        const cleanup = runTriggerSequence({
            willFire,
            volume: 0.7,
            onPhaseChange: (phase) => {
                set({ triggerSequencePhase: phase });
            },
            onComplete: (result) => {
                // Sequence complete - now process the actual shot
                set({
                    triggerSequencePhase: null,
                    triggerSequenceCleanup: null,
                });
                get().processTriggerResult(result === "shot");
            },
        });

        set({ triggerSequenceCleanup: cleanup });
    },

    // Process the result after trigger sequence completes
    processTriggerResult: (isBulletFired) => {
        const { bulletsShot, currentTurn, lives, roundsSurvived, shotHistory } = get();
        const shotNumber = bulletsShot + 1;

        const newHistory = [...shotHistory, { turn: currentTurn, shotNumber, hit: isBulletFired }];

        if (isBulletFired) {
            if (currentTurn === "player") {
                const newLives = lives - 1;
                if (newLives <= 0) {
                    // Game over - add to leaderboard
                    setTimeout(() => playDeath(), 300);
                    const newLeaderboard = addToLeaderboard(roundsSurvived);
                    set({
                        bulletsShot: shotNumber,
                        shotHistory: newHistory,
                        gamePhase: "gameOver",
                        leaderboard: newLeaderboard,
                        isAnimating: false,
                    });
                } else {
                    // Player loses a life but continues
                    setTimeout(() => playDeath(), 300);
                    set({
                        lives: newLives,
                        bulletsShot: shotNumber,
                        shotHistory: newHistory,
                        gamePhase: "playerDead",
                        isAnimating: false,
                    });
                }
            } else {
                // AI got shot - player survives another round!
                setTimeout(() => playLevelUp(), 500);
                set({
                    bulletsShot: shotNumber,
                    shotHistory: newHistory,
                    roundsSurvived: roundsSurvived + 1,
                    gamePhase: "aiDead",
                    isAnimating: false,
                });
            }
        } else {
            // Empty chamber - start a new card game round
            const deck = createDeck();
            const currentCard = deck.pop();

            set({
                bulletsShot: shotNumber,
                currentTurn: currentTurn === "player" ? "ai" : "player",
                shotHistory: newHistory,
                gamePhase: "cardGame",
                isAnimating: false,
                deck,
                currentCard,
                nextCard: null,
                cardGamePhase: "dealing",
                lastGuess: null,
                lastGuessResult: null,
                cardGameWinner: null,
            });

            setTimeout(() => {
                playCardSlide();
                set({ cardGamePhase: "guessing" });
            }, 800);
        }
    },

    // Vlad makes a guess (with a phase to show his prediction first)
    aiMakeGuess: () => {
        const { currentCard, currentTurn, cardGamePhase, isAnimating } = get();

        if (currentTurn !== "ai" || cardGamePhase !== "guessing" || isAnimating) return;

        // Simple AI: guess based on card value
        const cardValue = getCardNumericValue(currentCard);
        let guess;

        if (cardValue <= 7) {
            guess = "higher";
        } else if (cardValue >= 9) {
            guess = "lower";
        } else {
            // Middle cards - random choice
            guess = Math.random() > 0.5 ? "higher" : "lower";
        }

        // Show Vlad's prediction before revealing
        set({ lastGuess: guess, cardGamePhase: "vladPredicting" });

        // After showing prediction, reveal the card
        setTimeout(() => {
            get().makeGuess(guess);
        }, 1500);
    },

    // Actions
    startGame: () => {
        // Clean up any running trigger sequence
        const cleanup = get().triggerSequenceCleanup;
        if (cleanup) cleanup();
        clearSequenceTimeouts();
        stopAllTriggerSounds();

        playCylinderSpin();
        const deck = createDeck();
        const currentCard = deck.pop();

        set({
            roundsSurvived: 0,
            lives: STARTING_LIVES,
            bulletsShot: 0,
            bulletPosition: getRandomBulletPosition(),
            currentTurn: "player",
            gamePhase: "cardGame",
            shotHistory: [],
            isAnimating: false,
            deck,
            currentCard,
            nextCard: null,
            cardGamePhase: "dealing",
            lastGuess: null,
            lastGuessResult: null,
            cardGameWinner: null,
            triggerSequencePhase: null,
            triggerSequenceCleanup: null,
        });

        // Delay to show card dealing
        setTimeout(() => {
            playCardSlide();
            set({ cardGamePhase: "guessing" });
        }, 800);
    },

    pullTrigger: () => {
        const { bulletsShot, bulletPosition, currentTurn, lives, roundsSurvived, shotHistory, isAnimating } = get();

        if (isAnimating) return; // Prevent multiple triggers during animation

        set({ isAnimating: true });

        // Play hammer cock sound immediately
        playHammerCock();

        const shotNumber = bulletsShot + 1;
        const isBulletFired = shotNumber === bulletPosition;

        // Record this shot in history
        const newHistory = [...shotHistory, { turn: currentTurn, shotNumber, hit: isBulletFired }];

        // Delay the result for dramatic effect
        setTimeout(() => {
            if (isBulletFired) {
                playGunshot();

                if (currentTurn === "player") {
                    const newLives = lives - 1;
                    if (newLives <= 0) {
                        // Game over - add to leaderboard
                        setTimeout(() => playDeath(), 300);
                        const newLeaderboard = addToLeaderboard(roundsSurvived);
                        set({
                            bulletsShot: shotNumber,
                            shotHistory: newHistory,
                            gamePhase: "gameOver",
                            leaderboard: newLeaderboard,
                            isAnimating: false,
                        });
                    } else {
                        // Player loses a life but continues
                        setTimeout(() => playDeath(), 300);
                        set({
                            lives: newLives,
                            bulletsShot: shotNumber,
                            shotHistory: newHistory,
                            gamePhase: "playerDead",
                            isAnimating: false,
                        });
                    }
                } else {
                    // AI got shot - player survives another round!
                    setTimeout(() => playLevelUp(), 500);
                    set({
                        bulletsShot: shotNumber,
                        shotHistory: newHistory,
                        roundsSurvived: roundsSurvived + 1,
                        gamePhase: "aiDead",
                        isAnimating: false,
                    });
                }
            } else {
                // Empty chamber - start a new card game round
                playClick();

                // Reset for next card game round
                const deck = createDeck();
                const currentCard = deck.pop();

                set({
                    bulletsShot: shotNumber,
                    currentTurn: currentTurn === "player" ? "ai" : "player",
                    shotHistory: newHistory,
                    gamePhase: "cardGame",
                    isAnimating: false,
                    deck,
                    currentCard,
                    nextCard: null,
                    cardGamePhase: "dealing",
                    lastGuess: null,
                    lastGuessResult: null,
                    cardGameWinner: null,
                });

                setTimeout(() => {
                    playCardSlide();
                    set({ cardGamePhase: "guessing" });
                }, 800);
            }
        }, 400); // Delay for dramatic effect
    },

    setPhase: (phase) => set({ gamePhase: phase }),

    nextRound: () => {
        // Clean up any running trigger sequence
        const cleanup = get().triggerSequenceCleanup;
        if (cleanup) cleanup();

        playCylinderSpin();

        const deck = createDeck();
        const currentCard = deck.pop();

        // Keep lives as they are, just reset the revolver for a new round
        set({
            bulletsShot: 0,
            bulletPosition: getRandomBulletPosition(),
            currentTurn: "player",
            gamePhase: "cardGame",
            shotHistory: [],
            isAnimating: false,
            deck,
            currentCard,
            nextCard: null,
            cardGamePhase: "dealing",
            lastGuess: null,
            lastGuessResult: null,
            cardGameWinner: null,
            triggerSequencePhase: null,
            triggerSequenceCleanup: null,
        });

        setTimeout(() => {
            playCardSlide();
            set({ cardGamePhase: "guessing" });
        }, 800);
    },

    continueAfterDeath: () => {
        // Clean up any running trigger sequence
        const cleanup = get().triggerSequenceCleanup;
        if (cleanup) cleanup();

        playCylinderSpin();

        const deck = createDeck();
        const currentCard = deck.pop();

        set({
            bulletsShot: 0,
            bulletPosition: getRandomBulletPosition(),
            currentTurn: "player",
            gamePhase: "cardGame",
            shotHistory: [],
            isAnimating: false,
            deck,
            currentCard,
            nextCard: null,
            cardGamePhase: "dealing",
            lastGuess: null,
            lastGuessResult: null,
            cardGameWinner: null,
            triggerSequencePhase: null,
            triggerSequenceCleanup: null,
        });

        setTimeout(() => {
            playCardSlide();
            set({ cardGamePhase: "guessing" });
        }, 800);
    },

    resetGame: () => {
        // Clean up any running trigger sequence
        const cleanup = get().triggerSequenceCleanup;
        if (cleanup) cleanup();
        clearSequenceTimeouts();
        stopAllTriggerSounds();

        set({
            roundsSurvived: 0,
            lives: STARTING_LIVES,
            bulletsShot: 0,
            bulletPosition: getRandomBulletPosition(),
            currentTurn: "player",
            gamePhase: "start",
            shotHistory: [],
            isAnimating: false,
            deck: [],
            currentCard: null,
            nextCard: null,
            cardGamePhase: "waiting",
            lastGuess: null,
            lastGuessResult: null,
            cardGameWinner: null,
            triggerSequencePhase: null,
            triggerSequenceCleanup: null,
        });
    },

    // Audio actions
    setVolume: (volume) => set({ volume }),
    setMuted: (isMuted) => set({ isMuted }),
}));
