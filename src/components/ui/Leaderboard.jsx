import { useGameStore } from '../../stores/gameStore';
import './Leaderboard.css';

export function Leaderboard() {
  const leaderboard = useGameStore((state) => state.leaderboard);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const roundsSurvived = useGameStore((state) => state.roundsSurvived);

  // Don't show during start or game over screens
  if (gamePhase === 'start' || gamePhase === 'gameOver') return null;

  const bestScore = leaderboard.length > 0 ? leaderboard[0].rounds : 0;

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <span className="trophy-icon">🏆</span>
        <span className="leaderboard-title">HIGH SCORES</span>
      </div>
      
      <div className="current-run">
        <span className="current-label">CURRENT</span>
        <span className="current-value">{roundsSurvived}</span>
      </div>

      <div className="best-score">
        <span className="best-label">BEST</span>
        <span className="best-value">{bestScore}</span>
      </div>

      {leaderboard.length > 0 && (
        <div className="score-list">
          {leaderboard.slice(0, 5).map((entry, index) => (
            <div key={entry.id} className={`score-entry ${index === 0 ? 'top' : ''}`}>
              <span className="score-rank">#{index + 1}</span>
              <span className="score-rounds">{entry.rounds}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

