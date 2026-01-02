import { useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './GameHUD.css';

export function GameHUD() {
  const level = useGameStore((state) => state.level);
  const lives = useGameStore((state) => state.lives);
  const bulletsShot = useGameStore((state) => state.bulletsShot);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const pullTrigger = useGameStore((state) => state.pullTrigger);
  const nextLevel = useGameStore((state) => state.nextLevel);
  const continueAfterDeath = useGameStore((state) => state.continueAfterDeath);
  const getCurrentOdds = useGameStore((state) => state.getCurrentOdds);
  const isAnimating = useGameStore((state) => state.isAnimating);

  const aiTimeoutRef = useRef(null);

  // AI takes its turn automatically after a delay
  useEffect(() => {
    if (currentTurn === 'ai' && gamePhase === 'playing' && !isAnimating) {
      aiTimeoutRef.current = setTimeout(() => {
        const state = useGameStore.getState();
        if (state.currentTurn === 'ai' && state.gamePhase === 'playing' && !state.isAnimating) {
          pullTrigger();
        }
      }, 1500);
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [currentTurn, gamePhase, isAnimating, pullTrigger]);

  if (gamePhase === 'start' || gamePhase === 'gameOver') return null;

  const odds = getCurrentOdds();
  const isPlayerTurn = currentTurn === 'player' && gamePhase === 'playing';
  const isAITurn = currentTurn === 'ai' && gamePhase === 'playing';

  const renderChambers = () => {
    return Array.from({ length: 6 }, (_, i) => (
      <div
        key={i}
        className={`chamber ${i < bulletsShot ? 'fired' : ''}`}
        title={i < bulletsShot ? 'Fired' : 'Unfired'}
      >
        <div className="chamber-inner"></div>
      </div>
    ));
  };

  const renderHearts = () => {
    return Array.from({ length: lives }, (_, i) => (
      <span key={i} className="heart">♥</span>
    ));
  };

  return (
    <div className="game-hud">
      {/* Top bar */}
      <div className="hud-top">
        <div className="hud-stat level-stat">
          <span className="stat-label">LEVEL</span>
          <span className="stat-value">{level}</span>
        </div>
        <div className="hud-stat lives-stat">
          <span className="stat-label">LIVES</span>
          <span className="stat-value hearts">{renderHearts()}</span>
        </div>
      </div>

      {/* Chamber display */}
      <div className="chamber-display">
        <div className="chamber-label">CHAMBER</div>
        <div className="chambers">{renderChambers()}</div>
        <div className="shots-count">{bulletsShot}/6 FIRED</div>
      </div>

      {/* Odds display */}
      <div className="odds-display">
        <div className="odds-label">DEATH ODDS</div>
        <div className="odds-value" style={{ 
          color: odds > 50 ? '#c45c45' : odds > 30 ? '#c4a145' : '#8a9a7a' 
        }}>
          {odds.toFixed(1)}%
        </div>
        <div className="odds-fraction">1 in {6 - bulletsShot}</div>
      </div>

      {/* Turn indicator and action */}
      <div className="turn-section">
        {isPlayerTurn && (
          <>
            <div className="turn-indicator player-turn">YOUR TURN</div>
            <button 
              className="trigger-button" 
              onClick={pullTrigger}
              disabled={isAnimating}
            >
              {isAnimating ? 'FIRING...' : 'PULL TRIGGER'}
            </button>
          </>
        )}

        {isAITurn && (
          <div className="turn-indicator ai-turn">
            <span className="ai-thinking">{isAnimating ? 'AI IS FIRING' : 'AI IS DECIDING'}</span>
            <span className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        )}

        {gamePhase === 'playerDead' && lives > 0 && (
          <div className="death-notice">
            <div className="death-text">YOU GOT SHOT!</div>
            <div className="lives-remaining">{lives} {lives === 1 ? 'LIFE' : 'LIVES'} REMAINING</div>
            <button className="continue-button" onClick={continueAfterDeath}>
              CONTINUE
            </button>
          </div>
        )}

        {gamePhase === 'aiDead' && (
          <div className="victory-notice">
            <div className="victory-text">AI ELIMINATED!</div>
            <div className="level-complete">LEVEL {level} COMPLETE</div>
            <button className="next-level-button" onClick={nextLevel}>
              NEXT LEVEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
