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

// Use production API when running on localhost (for testing)
// Change this to your Vercel deployment URL
const PRODUCTION_URL = "https://roulette-mealify.vercel.app/";
const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocalhost ? `${PRODUCTION_URL}/api` : "/api";

const getRandomBulletPosition = () => Math.floor(Math.random() * 6) + 1;

// Global leaderboard API utilities
const fetchGlobalLeaderboard = async () => {
    try {
        const response = await fetch(`${API_BASE}/leaderboard`);
        if (!response.ok) throw new Error("Failed to fetch leaderboard");
        const data = await response.json();
        return data.leaderboard || [];
    } catch (error) {
        console.error("Error fetching global leaderboard:", error);
        return [];
    }
};

const submitScore = async (name, rounds) => {
    try {
        const response = await fetch(`${API_BASE}/leaderboard`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, rounds }),
        });
        if (!response.ok) throw new Error("Failed to submit score");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error submitting score:", error);
        throw error;
    }
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
    isAnimating: false,

    // Global leaderboard state
    globalLeaderboard: [],
    globalLeaderboardLoading: false,
    showNameInput: false,
    submittedRank: null,
    playerName: null,

    // Trigger sequence state
    triggerSequencePhase: null, // 'drop', 'heartbeat', 'spin', 'pull', 'result', null
    triggerSequenceCleanup: null,
    triggerSequenceShooter: null, // 'player' or 'ai' - who is pulling the trigger
    triggerSequenceWillFire: null, // true/false - whether the bullet will fire (for UI)

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

            // After showing result, someone shoots immediately
            // If correct: opponent shoots
            // If wrong: guesser shoots
            setTimeout(() => {
                const shooter = isCorrect ? (currentTurn === "player" ? "ai" : "player") : currentTurn;

                set({
                    cardGameWinner: isCorrect ? currentTurn : currentTurn === "player" ? "ai" : "player",
                    cardGamePhase: "waiting",
                    isAnimating: false,
                });

                // Start the trigger sequence for whoever must shoot
                setTimeout(() => {
                    get().startTriggerSequence(shooter);
                }, 500);
            }, 1500);
        }, 600);
    },

    // Start the automatic trigger sequence for either player or AI
    startTriggerSequence: (shooter = "player") => {
        const { bulletsShot, bulletPosition } = get();
        const shotNumber = bulletsShot + 1;
        const willFire = shotNumber === bulletPosition;

        // Clean up any previous sequence
        const prevCleanup = get().triggerSequenceCleanup;
        if (prevCleanup) prevCleanup();

        set({
            gamePhase: "triggerSequence",
            triggerSequencePhase: "drop",
            triggerSequenceShooter: shooter,
            triggerSequenceWillFire: willFire,
            currentTurn: shooter,
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
                    triggerSequenceShooter: null,
                    triggerSequenceWillFire: null,
                });
                get().processTriggerResult(result === "shot");
            },
        });

        set({ triggerSequenceCleanup: cleanup });
    },

    // Process the result after trigger sequence completes
    processTriggerResult: (isBulletFired) => {
        const { bulletsShot, currentTurn, lives, roundsSurvived, shotHistory, globalLeaderboard } = get();
        const shotNumber = bulletsShot + 1;

        const newHistory = [...shotHistory, { turn: currentTurn, shotNumber, hit: isBulletFired }];

        if (isBulletFired) {
            if (currentTurn === "player") {
                const newLives = lives - 1;
                if (newLives <= 0) {
                    // Game over - check if qualifies for leaderboard
                    setTimeout(() => playDeath(), 300);

                    // Check if score qualifies for leaderboard (top 100 or survived at least 1 round)
                    const qualifiesForLeaderboard =
                        roundsSurvived > 0 &&
                        (globalLeaderboard.length < 100 || roundsSurvived > (globalLeaderboard[globalLeaderboard.length - 1]?.rounds || 0));

                    set({
                        bulletsShot: shotNumber,
                        shotHistory: newHistory,
                        gamePhase: "gameOver",
                        showNameInput: qualifiesForLeaderboard,
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
            triggerSequenceShooter: null,
            triggerSequenceWillFire: null,
        });

        // Delay to show card dealing
        setTimeout(() => {
            playCardSlide();
            set({ cardGamePhase: "guessing" });
        }, 800);
    },

    pullTrigger: () => {
        const { bulletsShot, bulletPosition, currentTurn, lives, roundsSurvived, shotHistory, isAnimating, globalLeaderboard } = get();

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
                        // Game over - check if qualifies for leaderboard
                        setTimeout(() => playDeath(), 300);

                        // Check if score qualifies for leaderboard
                        const qualifiesForLeaderboard =
                            roundsSurvived > 0 &&
                            (globalLeaderboard.length < 100 ||
                                roundsSurvived > (globalLeaderboard[globalLeaderboard.length - 1]?.rounds || 0));

                        set({
                            bulletsShot: shotNumber,
                            shotHistory: newHistory,
                            gamePhase: "gameOver",
                            showNameInput: qualifiesForLeaderboard,
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
            triggerSequenceShooter: null,
            triggerSequenceWillFire: null,
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
            triggerSequenceShooter: null,
            triggerSequenceWillFire: null,
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
            triggerSequenceShooter: null,
            triggerSequenceWillFire: null,
            showNameInput: false,
            submittedRank: null,
            playerName: null,
        });

        // Reload leaderboard
        get().loadGlobalLeaderboard();
    },

    // Audio actions
    setVolume: (volume) => set({ volume }),
    setMuted: (isMuted) => set({ isMuted }),

    // Global leaderboard actions
    loadGlobalLeaderboard: async () => {
        set({ globalLeaderboardLoading: true });
        try {
            const leaderboard = await fetchGlobalLeaderboard();
            set({ globalLeaderboard: leaderboard, globalLeaderboardLoading: false });
        } catch {
            set({ globalLeaderboardLoading: false });
        }
    },

    submitToGlobalLeaderboard: async (name) => {
        const { roundsSurvived } = get();
        const result = await submitScore(name, roundsSurvived);
        set({
            globalLeaderboard: result.leaderboard || [],
            submittedRank: result.rank,
            playerName: name,
            showNameInput: false,
        });
        return result;
    },

    skipNameInput: () => {
        set({ showNameInput: false });
    },
}));

// Initialize by loading global leaderboard
if (typeof window !== "undefined") {
    useGameStore.getState().loadGlobalLeaderboard();
}
