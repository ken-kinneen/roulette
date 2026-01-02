import { useGameStore } from '../../stores/gameStore';
import { playMusic } from '../../utils/music';
import './StartScreen.css';

export function StartScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const gamePhase = useGameStore((state) => state.gamePhase);

  const handleStart = () => {
    playMusic(); // Start background music on user interaction
    startGame();
  };

  if (gamePhase !== 'start') return null;

  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="game-title">RUSSIAN</h1>
        <h1 className="game-title title-accent">ROULETTE</h1>
        
        <div className="revolver-icon">
          <svg viewBox="0 0 100 60" fill="currentColor">
            <rect x="35" y="20" width="55" height="8" rx="2" />
            <circle cx="30" cy="24" r="15" fill="none" stroke="currentColor" strokeWidth="3" />
            <rect x="10" y="30" width="15" height="25" rx="3" />
            <circle cx="30" cy="24" r="4" />
            <circle cx="20" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="40" cy="18" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="24" cy="32" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="36" cy="32" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <p className="instructions">
          One bullet. Six chambers. Take turns pulling the trigger.
          <br />
          Survive to advance. Each level grants an extra life.
        </p>

        <button className="start-button" onClick={handleStart}>
          <span className="button-text">PULL THE TRIGGER</span>
          <span className="button-underline"></span>
        </button>

        <div className="controls-hint">
          <span>DRAG TO LOOK AROUND</span>
        </div>
      </div>
    </div>
  );
}
