import { useGameStore } from '../../stores/gameStore';
import './DevTools.css';

// Only show dev tools on localhost
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '');

// Leaderboard utilities (duplicated from store for dev tools)
const LEADERBOARD_KEY = 'roulette_leaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

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

export function DevTools() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const startTriggerSequence = useGameStore((state) => state.startTriggerSequence);
  const setPhase = useGameStore((state) => state.setPhase);
  const triggerSequencePhase = useGameStore((state) => state.triggerSequencePhase);
  
  // Force death - sets game to gameOver and saves to leaderboard
  const forceDeath = () => {
    const roundsSurvived = useGameStore.getState().roundsSurvived;
    const newLeaderboard = addToLeaderboard(roundsSurvived);
    useGameStore.setState({
      lives: 0,
      gamePhase: 'gameOver',
      leaderboard: newLeaderboard,
      isAnimating: false,
    });
  };
  
  // Force trigger sequence (player shoots themselves)
  const forceShoot = () => {
    if (gamePhase !== 'triggerSequence') {
      startTriggerSequence();
    }
  };
  
  // Force player dead (with lives remaining)
  const forcePlayerDead = () => {
    useGameStore.setState({
      gamePhase: 'playerDead',
      isAnimating: false,
    });
  };
  
  // Force AI dead (also increment rounds survived)
  const forceAIDead = () => {
    const currentRounds = useGameStore.getState().roundsSurvived;
    useGameStore.setState({
      gamePhase: 'aiDead',
      roundsSurvived: currentRounds + 1,
      isAnimating: false,
    });
  };

  if (!isLocalhost) return null;
  if (gamePhase === 'start') return null;

  return (
    <div className="dev-tools">
      <div className="dev-tools-header">🛠 DEV</div>
      <div className="dev-tools-buttons">
        <button 
          className="dev-btn shoot" 
          onClick={forceShoot}
          disabled={gamePhase === 'triggerSequence'}
        >
          🔫 Shoot Self
        </button>
        <button className="dev-btn death" onClick={forceDeath}>
          💀 Game Over
        </button>
        <button className="dev-btn player-dead" onClick={forcePlayerDead}>
          ❤️‍🩹 Player Dead
        </button>
        <button className="dev-btn ai-dead" onClick={forceAIDead}>
          🎯 AI Dead
        </button>
      </div>
      {triggerSequencePhase && (
        <div className="dev-phase">Phase: {triggerSequencePhase}</div>
      )}
    </div>
  );
}

