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
import { peerManager } from "../utils/peerConnection";

const STARTING_LIVES = 3;

// Use production API when running on localhost (for testing)
// Change this to your Vercel deployment URL
const PRODUCTION_URL = "https://roulette-mealify.vercel.app";
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
    gamePhase: "start", // 'start', 'lobby', 'playing', 'triggerSequence', 'cardGame', 'shooting', 'playerDead', 'aiDead', 'roundComplete', 'gameOver'
    shotHistory: [],
    isAnimating: false,

    // Multiplayer state
    gameMode: "solo", // 'solo' or 'pvp'
    isHost: false,
    opponentConnected: false,
    roomCode: null,
    connectionError: null,
    pvpPlayerWins: 0, // Best of 3 - host/player wins
    pvpOpponentWins: 0, // Best of 3 - guest/opponent wins
    pvpMatchWinner: null, // 'player' or 'ai' when match is over

    // Global leaderboard state
    globalLeaderboard: [],
    globalLeaderboardLoading: false,
    showNameInput: false,
    submittedRank: null,
    
    // Player name (persisted to localStorage)
    playerName: typeof window !== "undefined" ? localStorage.getItem("playerName") || "" : "",
    opponentName: "",

    // Trigger sequence state
    triggerSequencePhase: null, // 'drop', 'heartbeat', 'spin', 'pull', 'result', 'sigh', null
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
    cardGameGuesser: null, // 'player' or 'ai' - who made the last guess (for turn tracking)

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
            cardGameGuesser: null,
        });

        // After dealing animation, move to guessing phase
        setTimeout(() => {
            set({ cardGamePhase: "guessing" });
        }, 800);
    },

    makeGuess: (guess) => {
        const { deck, currentCard, currentTurn, isAnimating, gameMode, isHost } = get();

        if (isAnimating || deck.length === 0) return;

        // In PvP mode, guest sends their move to host
        if (gameMode === "pvp" && !isHost && currentTurn === "ai") {
            peerManager.sendGameState({
                action: "makeGuess",
                guess: guess,
            });
            return;
        }

        set({ isAnimating: true, lastGuess: guess, cardGamePhase: "revealing", cardGameGuesser: currentTurn });

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

            // Sync state in PvP
            if (gameMode === "pvp") {
                get().syncStateToOpponent();
            }

            // After showing result, someone shoots - SNAPPY timing
            // If correct: opponent shoots
            // If wrong: guesser shoots
            setTimeout(() => {
                const shooter = isCorrect ? (currentTurn === "player" ? "ai" : "player") : currentTurn;

                set({
                    cardGameWinner: isCorrect ? currentTurn : currentTurn === "player" ? "ai" : "player",
                    cardGamePhase: "waiting",
                    isAnimating: false,
                });

                // Sync state in PvP
                if (gameMode === "pvp") {
                    get().syncStateToOpponent();
                }

                // Start the trigger sequence immediately - no extra delay
                get().startTriggerSequence(shooter);
            }, 800);
        }, 400);
    },

    // Start the automatic trigger sequence for either player or AI
    startTriggerSequence: (shooter = "player") => {
        const { bulletsShot, bulletPosition, gameMode } = get();
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

        // Sync state in PvP
        if (gameMode === "pvp") {
            get().syncStateToOpponent();
        }

        const cleanup = runTriggerSequence({
            willFire,
            volume: 0.7,
            onPhaseChange: (phase) => {
                set({ triggerSequencePhase: phase });
                // Sync phase changes in PvP
                if (gameMode === "pvp") {
                    get().syncStateToOpponent();
                }
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
        const { bulletsShot, currentTurn, lives, roundsSurvived, shotHistory, globalLeaderboard, gameMode, cardGameGuesser, pvpPlayerWins, pvpOpponentWins } = get();
        const shotNumber = bulletsShot + 1;

        const newHistory = [...shotHistory, { turn: currentTurn, shotNumber, hit: isBulletFired }];

        if (isBulletFired) {
            // Handle PvP mode (best of 3)
            if (gameMode === "pvp") {
                setTimeout(() => playDeath(), 300);
                
                if (currentTurn === "player") {
                    // Player got shot - opponent wins this round
                    const newOpponentWins = pvpOpponentWins + 1;
                    
                    if (newOpponentWins >= 2) {
                        // Opponent wins the match (best of 3)
                        set({
                            bulletsShot: shotNumber,
                            shotHistory: newHistory,
                            pvpOpponentWins: newOpponentWins,
                            pvpMatchWinner: "ai",
                            gamePhase: "gameOver",
                            isAnimating: false,
                        });
                    } else {
                        // Opponent wins round, but match continues
                        set({
                            bulletsShot: shotNumber,
                            shotHistory: newHistory,
                            pvpOpponentWins: newOpponentWins,
                            gamePhase: "playerDead",
                            isAnimating: false,
                        });
                    }
                } else {
                    // Opponent got shot - player wins this round
                    const newPlayerWins = pvpPlayerWins + 1;
                    
                    if (newPlayerWins >= 2) {
                        // Player wins the match (best of 3)
                        setTimeout(() => playLevelUp(), 500);
                        set({
                            bulletsShot: shotNumber,
                            shotHistory: newHistory,
                            pvpPlayerWins: newPlayerWins,
                            pvpMatchWinner: "player",
                            gamePhase: "gameOver",
                            isAnimating: false,
                        });
                    } else {
                        // Player wins round, but match continues
                        setTimeout(() => playLevelUp(), 500);
                        set({
                            bulletsShot: shotNumber,
                            shotHistory: newHistory,
                            pvpPlayerWins: newPlayerWins,
                            gamePhase: "aiDead",
                            isAnimating: false,
                        });
                    }
                }
                get().syncStateToOpponent();
            } else {
                // Solo mode
                if (currentTurn === "player") {
                    const newLives = lives - 1;
                    if (newLives <= 0) {
                        // Game over - check if qualifies for leaderboard
                        setTimeout(() => playDeath(), 300);

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
            }
        } else {
            // Empty chamber - start a new card game round (snappy transition)
            // Next turn goes to whoever didn't guess last (sequential turns regardless of win/lose)
            const deck = createDeck();
            const currentCard = deck.pop();
            const nextGuesser = cardGameGuesser === "player" ? "ai" : "player";

            set({
                bulletsShot: shotNumber,
                currentTurn: nextGuesser,
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
                cardGameGuesser: null,
            });

            // Sync state in PvP
            if (gameMode === "pvp") {
                get().syncStateToOpponent();
            }

            setTimeout(() => {
                playCardSlide();
                set({ cardGamePhase: "guessing" });
                // Sync state in PvP
                if (gameMode === "pvp") {
                    get().syncStateToOpponent();
                }
            }, 500);
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

        // After showing prediction, reveal the card - snappy timing
        setTimeout(() => {
            get().makeGuess(guess);
        }, 800);
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
            cardGameGuesser: null,
            triggerSequencePhase: null,
            triggerSequenceCleanup: null,
            triggerSequenceShooter: null,
            triggerSequenceWillFire: null,
            gameMode: "solo", // Ensure solo mode
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
            cardGameGuesser: null,
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
            cardGameGuesser: null,
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

    // Continue to next round in PvP (best of 3)
    continuePvpRound: () => {
        const { isHost, gameMode } = get();
        
        if (gameMode !== "pvp") return;

        // Clean up any running trigger sequence
        const cleanup = get().triggerSequenceCleanup;
        if (cleanup) cleanup();

        playCylinderSpin();

        const deck = createDeck();
        const currentCard = deck.pop();
        const bulletPosition = getRandomBulletPosition();

        set({
            bulletsShot: 0,
            bulletPosition,
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
            cardGameGuesser: null,
            triggerSequencePhase: null,
            triggerSequenceCleanup: null,
            triggerSequenceShooter: null,
            triggerSequenceWillFire: null,
        });

        // Sync to opponent
        if (isHost) {
            get().syncStateToOpponent();
        }

        setTimeout(() => {
            playCardSlide();
            set({ cardGamePhase: "guessing" });
            if (isHost) {
                get().syncStateToOpponent();
            }
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
            cardGameGuesser: null,
            triggerSequencePhase: null,
            triggerSequenceCleanup: null,
            triggerSequenceShooter: null,
            triggerSequenceWillFire: null,
            showNameInput: false,
            submittedRank: null,
            playerName: null,
            pvpPlayerWins: 0,
            pvpOpponentWins: 0,
            pvpMatchWinner: null,
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

    // Set player name (persisted to localStorage)
    setPlayerName: (name) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("playerName", name);
        }
        set({ playerName: name });
    },

    // Set opponent name (received from peer)
    setOpponentName: (name) => {
        set({ opponentName: name });
    },

    // Multiplayer actions
    enterLobby: () => {
        set({ gamePhase: "lobby", gameMode: "pvp" });
    },

    createRoom: async () => {
        try {
            const roomCode = await peerManager.createRoom();
            set({ roomCode, isHost: true, connectionError: null });

            // Setup connection handler
            peerManager.onConnection(() => {
                set({ opponentConnected: true });
                // Send our name to the guest
                const { playerName } = get();
                peerManager.sendGameState({
                    type: "playerInfo",
                    name: playerName || "Host",
                });
            });

            // Setup disconnect handler
            peerManager.onDisconnect(() => {
                set({ opponentConnected: false, connectionError: "Opponent disconnected" });
            });

            // Setup error handler
            peerManager.onError((err) => {
                set({ connectionError: err.message || "Connection error" });
            });

            // Setup state sync receiver (for guest moves)
            peerManager.onGameState((state) => {
                // Handle player info from guest
                if (state.type === "playerInfo") {
                    set({ opponentName: state.name || "Guest" });
                    return;
                }
                // Guest sends their moves, host applies them
                if (state.action === "makeGuess") {
                    get().makeGuess(state.guess);
                }
            });

            return roomCode;
        } catch (error) {
            set({ connectionError: error.message || "Failed to create room" });
            throw error;
        }
    },

    joinRoom: async (roomCode) => {
        try {
            await peerManager.joinRoom(roomCode);
            set({ roomCode, isHost: false, opponentConnected: true, connectionError: null });

            // Setup disconnect handler
            peerManager.onDisconnect(() => {
                set({ opponentConnected: false, connectionError: "Host disconnected" });
            });

            // Setup error handler
            peerManager.onError((err) => {
                set({ connectionError: err.message || "Connection error" });
            });

            // Setup state sync receiver (host sends full game state) - BEFORE sending our name
            peerManager.onGameState((state) => {
                // Handle player info from host
                if (state.type === "playerInfo") {
                    set({ opponentName: state.name || "Host" });
                    return;
                }
                // Receive full state updates from host
                if (state.fullSync) {
                    set({
                        roundsSurvived: state.roundsSurvived,
                        bulletsShot: state.bulletsShot,
                        bulletPosition: state.bulletPosition,
                        currentTurn: state.currentTurn,
                        gamePhase: state.gamePhase,
                        shotHistory: state.shotHistory,
                        isAnimating: state.isAnimating,
                        deck: state.deck,
                        currentCard: state.currentCard,
                        nextCard: state.nextCard,
                        cardGamePhase: state.cardGamePhase,
                        lastGuess: state.lastGuess,
                        lastGuessResult: state.lastGuessResult,
                        cardGameWinner: state.cardGameWinner,
                        cardGameGuesser: state.cardGameGuesser,
                        triggerSequencePhase: state.triggerSequencePhase,
                        triggerSequenceShooter: state.triggerSequenceShooter,
                        triggerSequenceWillFire: state.triggerSequenceWillFire,
                        pvpPlayerWins: state.pvpPlayerWins,
                        pvpOpponentWins: state.pvpOpponentWins,
                        pvpMatchWinner: state.pvpMatchWinner,
                    });
                }
            });

            // NOW send our name to the host (after handlers are set up)
            const { playerName } = get();
            setTimeout(() => {
                peerManager.sendGameState({
                    type: "playerInfo",
                    name: playerName || "Guest",
                });
            }, 100);
        } catch (error) {
            set({ connectionError: error.message || "Failed to join room" });
            throw error;
        }
    },

    startPvpGame: () => {
        const { isHost } = get();
        
        if (!isHost) {
            console.warn("Only host can start the game");
            return;
        }

        // Clean up any running trigger sequence
        const cleanup = get().triggerSequenceCleanup;
        if (cleanup) cleanup();
        clearSequenceTimeouts();
        stopAllTriggerSounds();

        playCylinderSpin();
        const deck = createDeck();
        const currentCard = deck.pop();
        const bulletPosition = getRandomBulletPosition();

        const newState = {
            roundsSurvived: 0,
            lives: 1,
            bulletsShot: 0,
            bulletPosition,
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
            cardGameGuesser: null,
            triggerSequencePhase: null,
            triggerSequenceCleanup: null,
            triggerSequenceShooter: null,
            triggerSequenceWillFire: null,
            pvpPlayerWins: 0,
            pvpOpponentWins: 0,
            pvpMatchWinner: null,
        };

        set(newState);

        // Sync to guest
        get().syncStateToOpponent();

        // Delay to show card dealing
        setTimeout(() => {
            playCardSlide();
            set({ cardGamePhase: "guessing" });
            get().syncStateToOpponent();
        }, 800);
    },

    syncStateToOpponent: () => {
        const { isHost, opponentConnected, gameMode } = get();
        
        if (gameMode !== "pvp" || !opponentConnected) return;

        if (isHost) {
            // Host sends full state to guest
            const state = get();
            peerManager.sendGameState({
                fullSync: true,
                roundsSurvived: state.roundsSurvived,
                bulletsShot: state.bulletsShot,
                bulletPosition: state.bulletPosition,
                currentTurn: state.currentTurn,
                gamePhase: state.gamePhase,
                shotHistory: state.shotHistory,
                isAnimating: state.isAnimating,
                deck: state.deck,
                currentCard: state.currentCard,
                nextCard: state.nextCard,
                cardGamePhase: state.cardGamePhase,
                lastGuess: state.lastGuess,
                lastGuessResult: state.lastGuessResult,
                cardGameWinner: state.cardGameWinner,
                cardGameGuesser: state.cardGameGuesser,
                triggerSequencePhase: state.triggerSequencePhase,
                triggerSequenceShooter: state.triggerSequenceShooter,
                triggerSequenceWillFire: state.triggerSequenceWillFire,
                pvpPlayerWins: state.pvpPlayerWins,
                pvpOpponentWins: state.pvpOpponentWins,
                pvpMatchWinner: state.pvpMatchWinner,
            });
        }
    },

    leaveLobby: () => {
        peerManager.disconnect();
        set({
            gamePhase: "start",
            gameMode: "solo",
            isHost: false,
            opponentConnected: false,
            roomCode: null,
            connectionError: null,
            opponentName: "",
        });
    },
}));

// Initialize by loading global leaderboard
if (typeof window !== "undefined") {
    useGameStore.getState().loadGlobalLeaderboard();
}
