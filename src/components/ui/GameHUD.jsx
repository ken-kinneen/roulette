import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './GameHUD.css';

// Heart SVG component
function HeartIcon({ active }) {
  return (
    <div className={`life-heart ${active ? 'active' : 'empty'}`}>
      <svg viewBox="0 0 24 24" className="heart-svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  );
}

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
  const cardGameWinner = useGameStore((state) => state.cardGameWinner);
  
  const [riskPulse, setRiskPulse] = useState(false);
  const prevBulletsShot = useRef(bulletsShot);

  const aiTimeoutRef = useRef(null);

  // AI takes its shot automatically after a delay when it's their turn in the revolver phase
  useEffect(() => {
    if (currentTurn === 'ai' && gamePhase === 'playing' && !isAnimating && cardGameWinner === 'player') {
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
  }, [currentTurn, gamePhase, isAnimating, pullTrigger, cardGameWinner]);

  // Pulse animation when risk changes
  useEffect(() => {
    if (bulletsShot !== prevBulletsShot.current) {
      setRiskPulse(true);
      setTimeout(() => setRiskPulse(false), 300);
      prevBulletsShot.current = bulletsShot;
    }
  }, [bulletsShot]);

  if (gamePhase === 'start' || gamePhase === 'gameOver') return null;

  const odds = getCurrentOdds();
  const isCardGame = gamePhase === 'cardGame';
  const isPlayerTurn = currentTurn === 'player';
  const mustShoot = gamePhase === 'playing' && cardGameWinner !== null;
  const isOutcome = gamePhase === 'playerDead' || gamePhase === 'aiDead';

  // Determine risk level
  const getRiskLevel = () => {
    if (odds < 25) return 'low';
    if (odds < 40) return 'medium';
    if (odds < 60) return 'high';
    return 'critical';
  };

  // Render heart icons
  const renderHearts = () => {
    const maxHearts = Math.max(level, lives);
    return Array.from({ length: maxHearts }, (_, i) => (
      <HeartIcon key={i} active={i < lives} />
    ));
  };

  // Render chambers
  const renderChambers = () => {
    return Array.from({ length: 6 }, (_, i) => (
      <div 
        key={i} 
        className={`chamber-dot ${i < bulletsShot ? 'fired' : 'live'} ${i === bulletsShot ? 'next' : ''}`}
      />
    ));
  };

  return (
    <div className="game-hud">
      {/* Top stats bar */}
      <div className="stats-bar">
        <div className="stat-item level-stat">
          <span className="stat-value">{level}</span>
          <span className="stat-label">LEVEL</span>
        </div>
        
        <div className="stat-item lives-stat">
          <div className="hearts-row">{renderHearts()}</div>
          <span className="stat-label">LIVES</span>
        </div>
      </div>

      {/* Main bottom container - only for revolver phase */}
      {(mustShoot || isOutcome) && !isCardGame && (
        <div className="hud-bottom">
          <div className="hud-container">
            {/* Turn/Phase banner */}
            <div className="hud-banner">
              <span className={`banner-turn ${isPlayerTurn ? 'player' : 'ai'}`}>
                {isPlayerTurn ? 'YOUR TURN' : "AI'S TURN"}
              </span>
              <span className="banner-divider">|</span>
              <span className="banner-phase revolver">🔫 REVOLVER</span>
            </div>

            {/* Content row */}
            <div className="hud-content">
              {/* Chambers display */}
              <div className="chambers-section">
                <div className="chambers-row">{renderChambers()}</div>
                <span className="chambers-label">{6 - bulletsShot} / 6 CHAMBERS LEFT</span>
              </div>

              {/* Action section */}
              <div className="action-section">
                {/* Player must shoot */}
                {mustShoot && isPlayerTurn && !isOutcome && (
                  <div className="shoot-prompt">
                    <span className="prompt-text">You lost the card game!</span>
                    <button 
                      className="trigger-btn"
                      onClick={pullTrigger}
                      disabled={isAnimating}
                    >
                      {isAnimating ? 'FIRING...' : 'PULL TRIGGER'}
                    </button>
                  </div>
                )}

                {/* AI shooting */}
                {mustShoot && !isPlayerTurn && !isOutcome && (
                  <div className="ai-shooting">
                    <span className="ai-text">AI lost - they must shoot!</span>
                    <div className="ai-dots"><span /><span /><span /></div>
                  </div>
                )}

                {/* Death outcome */}
                {gamePhase === 'playerDead' && lives > 0 && (
                  <div className="outcome-section death">
                    <span className="outcome-icon">💀</span>
                    <span className="outcome-title">YOU GOT SHOT</span>
                    <span className="outcome-sub">{lives} {lives === 1 ? 'life' : 'lives'} remaining</span>
                    <button className="outcome-btn" onClick={continueAfterDeath}>
                      CONTINUE
                    </button>
                  </div>
                )}

                {/* Victory outcome */}
                {gamePhase === 'aiDead' && (
                  <div className="outcome-section victory">
                    <span className="outcome-icon">🎯</span>
                    <span className="outcome-title">AI ELIMINATED</span>
                    <span className="outcome-sub">Level {level} complete</span>
                    <button className="outcome-btn victory" onClick={nextLevel}>
                      NEXT LEVEL
                    </button>
                  </div>
                )}
              </div>

              {/* Risk meter */}
              <div className={`risk-section ${getRiskLevel()} ${riskPulse ? 'pulse' : ''}`}>
                <div className="risk-display">
                  <span className="risk-value">{Math.round(odds)}%</span>
                  <span className="risk-label">DEATH RISK</span>
                </div>
                <span className="risk-odds">1 in {6 - bulletsShot}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
