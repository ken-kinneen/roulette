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

const getRandomBulletPosition = () => Math.floor(Math.random() * 6) + 1;

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
    level: 1,
    lives: 1,
    bulletsShot: 0,
    bulletPosition: getRandomBulletPosition(),
    currentTurn: "player",
    gamePhase: "start", // 'start', 'playing', 'cardGame', 'shooting', 'playerDead', 'aiDead', 'levelComplete', 'gameOver'
    shotHistory: [],
    highestLevel: 1,
    isAnimating: false,

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
                    set({
                        cardGameWinner: currentTurn === "player" ? "ai" : "player",
                        gamePhase: "playing", // Transition to revolver phase
                        cardGamePhase: "waiting",
                        isAnimating: false,
                    });
                }
            }, 1500);
        }, 600);
    },

    // AI makes a guess
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

        get().makeGuess(guess);
    },

    // Actions
    startGame: () => {
        playCylinderSpin();
        const deck = createDeck();
        const currentCard = deck.pop();

        set({
            level: 1,
            lives: 1,
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
        });

        // Delay to show card dealing
        setTimeout(() => {
            playCardSlide();
            set({ cardGamePhase: "guessing" });
        }, 800);
    },

    pullTrigger: () => {
        const { bulletsShot, bulletPosition, currentTurn, lives, level, shotHistory, isAnimating } = get();

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
                        // Game over
                        setTimeout(() => playDeath(), 300);
                        set({
                            bulletsShot: shotNumber,
                            shotHistory: newHistory,
                            gamePhase: "gameOver",
                            highestLevel: Math.max(get().highestLevel, level),
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
                    // AI got shot - player wins the round
                    setTimeout(() => playLevelUp(), 500);
                    set({
                        bulletsShot: shotNumber,
                        shotHistory: newHistory,
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

    nextLevel: () => {
        const { level } = get();
        const newLevel = level + 1;
        playCylinderSpin();

        const deck = createDeck();
        const currentCard = deck.pop();

        set({
            level: newLevel,
            lives: newLevel, // Lives = level number
            bulletsShot: 0,
            bulletPosition: getRandomBulletPosition(),
            currentTurn: "player",
            gamePhase: "cardGame",
            shotHistory: [],
            highestLevel: Math.max(get().highestLevel, newLevel),
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
    },

    continueAfterDeath: () => {
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
        });

        setTimeout(() => {
            playCardSlide();
            set({ cardGamePhase: "guessing" });
        }, 800);
    },

    resetGame: () =>
        set({
            level: 1,
            lives: 1,
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
        }),

    // Audio actions
    setVolume: (volume) => set({ volume }),
    setMuted: (isMuted) => set({ isMuted }),
}));
