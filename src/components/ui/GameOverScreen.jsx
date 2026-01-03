import { useGameStore } from '../../stores/gameStore';
import './GameOverScreen.css';

export function GameOverScreen() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const roundsSurvived = useGameStore((state) => state.roundsSurvived);
  const globalLeaderboard = useGameStore((state) => state.globalLeaderboard);
  const submittedRank = useGameStore((state) => state.submittedRank);
  const playerName = useGameStore((state) => state.playerName);
  const showNameInput = useGameStore((state) => state.showNameInput);
  const resetGame = useGameStore((state) => state.resetGame);

  // Don't show if name input modal is open
  if (gamePhase !== 'gameOver' || showNameInput) return null;

  const hasSubmitted = submittedRank !== null;

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
          <div className="final-stat main">
            <span className="final-stat-label">ROUNDS SURVIVED</span>
            <span className="final-stat-value">{roundsSurvived}</span>
          </div>
          {hasSubmitted && (
            <div className="final-stat">
              <span className="final-stat-label">GLOBAL RANK</span>
              <span className="final-stat-value rank">#{submittedRank}</span>
            </div>
          )}
        </div>

        {hasSubmitted && playerName && (
          <div className="submitted-banner">
            <span className="submitted-icon">✓</span>
            <span>Score submitted as <strong>{playerName}</strong></span>
          </div>
        )}

        {globalLeaderboard.length > 0 && (
          <div className="game-over-leaderboard">
            <div className="leaderboard-title-small">🌍 GLOBAL LEADERBOARD</div>
            <div className="top-scores">
              {globalLeaderboard.slice(0, 10).map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`top-score-entry ${hasSubmitted && index === submittedRank - 1 ? 'current' : ''}`}
                >
                  <span className="top-rank">#{index + 1}</span>
                  <span className="top-name">{entry.name}</span>
                  <span className="top-rounds">{entry.rounds}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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



