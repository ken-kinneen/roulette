import { useGameStore } from '../../stores/gameStore';
import './GameOverScreen.css';

export function GameOverScreen() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const level = useGameStore((state) => state.level);
  const highestLevel = useGameStore((state) => state.highestLevel);
  const resetGame = useGameStore((state) => state.resetGame);

  if (gamePhase !== 'gameOver') return null;

  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <div className="skull-icon">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <ellipse cx="50" cy="45" rx="35" ry="40" />
            <rect x="35" y="75" width="30" height="15" />
            <circle cx="35" cy="40" r="10" fill="#0a0908" />
            <circle cx="65" cy="40" r="10" fill="#0a0908" />
            <path d="M 40 60 Q 50 70 60 60" stroke="#0a0908" strokeWidth="4" fill="none" />
            <rect x="38" y="82" width="4" height="8" fill="#0a0908" />
            <rect x="48" y="82" width="4" height="8" fill="#0a0908" />
            <rect x="58" y="82" width="4" height="8" fill="#0a0908" />
          </svg>
        </div>

        <h1 className="game-over-title">GAME OVER</h1>
        
        <div className="final-stats">
          <div className="final-stat">
            <span className="final-stat-label">REACHED LEVEL</span>
            <span className="final-stat-value">{level}</span>
          </div>
          <div className="final-stat">
            <span className="final-stat-label">HIGHEST LEVEL</span>
            <span className="final-stat-value best">{highestLevel}</span>
          </div>
        </div>

        <p className="epitaph">
          "Fortune favors the bold, but the revolver favors no one."
        </p>

        <button className="play-again-button" onClick={resetGame}>
          <span>TRY AGAIN</span>
        </button>
      </div>
    </div>
  );
}


