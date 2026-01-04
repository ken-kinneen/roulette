import { useGameStore } from '../../stores/gameStore';
import './Leaderboard.css';

export function Leaderboard() {
  const globalLeaderboard = useGameStore((state) => state.globalLeaderboard);
  const globalLeaderboardLoading = useGameStore((state) => state.globalLeaderboardLoading);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const roundsSurvived = useGameStore((state) => state.roundsSurvived);

  // Don't show during start, lobby, or game over screens
  if (gamePhase === 'start' || gamePhase === 'gameOver' || gamePhase === 'lobby') return null;

  const bestScore = globalLeaderboard.length > 0 ? globalLeaderboard[0].rounds : 0;

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <span className="trophy-icon">🏆</span>
        <span className="leaderboard-title">GLOBAL SCORES</span>
      </div>
      
      <div className="current-run">
        <span className="current-label">CURRENT</span>
        <span className="current-value">{roundsSurvived}</span>
      </div>

      <div className="best-score">
        <span className="best-label">TOP</span>
        <span className="best-value">{globalLeaderboardLoading ? '...' : bestScore}</span>
      </div>

      {globalLeaderboard.length > 0 && (
        <div className="score-list">
          {globalLeaderboard.slice(0, 5).map((entry, index) => (
            <div key={entry.id} className={`score-entry ${index === 0 ? 'top' : ''}`}>
              <span className="score-rank">#{index + 1}</span>
              <span className="score-name" title={entry.name}>{entry.name}</span>
              <span className="score-rounds">{entry.rounds}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

