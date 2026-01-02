import { create } from 'zustand';
import { playClick, playGunshot, playCylinderSpin, playHammerCock, playLevelUp, playDeath } from '../utils/sounds';

const getRandomBulletPosition = () => Math.floor(Math.random() * 6) + 1;

export const useGameStore = create((set, get) => ({
  // Game state
  level: 1,
  lives: 1,
  bulletsShot: 0,
  bulletPosition: getRandomBulletPosition(),
  currentTurn: 'player',
  gamePhase: 'start', // 'start', 'playing', 'shooting', 'playerDead', 'aiDead', 'levelComplete', 'gameOver'
  shotHistory: [],
  highestLevel: 1,
  isAnimating: false,

  // Computed values
  getCurrentOdds: () => {
    const { bulletsShot } = get();
    const remaining = 6 - bulletsShot;
    return remaining > 0 ? (1 / remaining) * 100 : 100;
  },

  // Actions
  startGame: () => {
    playCylinderSpin();
    set({
      level: 1,
      lives: 1,
      bulletsShot: 0,
      bulletPosition: getRandomBulletPosition(),
      currentTurn: 'player',
      gamePhase: 'playing',
      shotHistory: [],
      isAnimating: false,
    });
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
        
        if (currentTurn === 'player') {
          const newLives = lives - 1;
          if (newLives <= 0) {
            // Game over
            setTimeout(() => playDeath(), 300);
            set({
              bulletsShot: shotNumber,
              shotHistory: newHistory,
              gamePhase: 'gameOver',
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
              gamePhase: 'playerDead',
              isAnimating: false,
            });
          }
        } else {
          // AI got shot - player wins the round
          setTimeout(() => playLevelUp(), 500);
          set({
            bulletsShot: shotNumber,
            shotHistory: newHistory,
            gamePhase: 'aiDead',
            isAnimating: false,
          });
        }
      } else {
        // Empty chamber - play click and switch turns
        playClick();
        set({
          bulletsShot: shotNumber,
          currentTurn: currentTurn === 'player' ? 'ai' : 'player',
          shotHistory: newHistory,
          gamePhase: 'playing',
          isAnimating: false,
        });
      }
    }, 400); // Delay for dramatic effect
  },

  setPhase: (phase) => set({ gamePhase: phase }),

  nextLevel: () => {
    const { level } = get();
    const newLevel = level + 1;
    playCylinderSpin();
    set({
      level: newLevel,
      lives: newLevel, // Lives = level number
      bulletsShot: 0,
      bulletPosition: getRandomBulletPosition(),
      currentTurn: 'player',
      gamePhase: 'playing',
      shotHistory: [],
      highestLevel: Math.max(get().highestLevel, newLevel),
      isAnimating: false,
    });
  },

  continueAfterDeath: () => {
    playCylinderSpin();
    set({
      bulletsShot: 0,
      bulletPosition: getRandomBulletPosition(),
      currentTurn: 'player',
      gamePhase: 'playing',
      shotHistory: [],
      isAnimating: false,
    });
  },

  resetGame: () => set({
    level: 1,
    lives: 1,
    bulletsShot: 0,
    bulletPosition: getRandomBulletPosition(),
    currentTurn: 'player',
    gamePhase: 'start',
    shotHistory: [],
    isAnimating: false,
  }),
}));
