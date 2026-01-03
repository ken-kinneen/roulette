import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './GameHUD.css';

// Heart SVG component
function HeartIcon({ active, losing }) {
  return (
    <div className={`life-heart ${active ? 'active' : 'empty'} ${losing ? 'losing' : ''}`}>
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

  // Determine risk level
  const getRiskLevel = () => {
    if (odds < 25) return 'low';
    if (odds < 40) return 'medium';
    if (odds < 60) return 'high';
    return 'critical';
  };

  // Cylinder rotation angle (60 degrees per chamber)
  const cylinderRotation = bulletsShot * 60;

  // Render chambers in circular pattern
  const renderChambers = () => {
    const chambers = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const radius = 28;
      const x = 40 + radius * Math.cos(angle);
      const y = 40 + radius * Math.sin(angle);
      
      const isFired = i < bulletsShot;
      const isNext = i === bulletsShot;
      
      chambers.push(
        <div
          key={i}
          className={`chamber ${isFired ? 'fired' : 'live'} ${isNext ? 'next' : ''}`}
          style={{
            left: `${x}px`,
            top: `${y}px`,
          }}
        >
          <div className="chamber-inner">
            {!isFired && <div className="bullet" />}
          </div>
        </div>
      );
    }
    return chambers;
  };

  // Render heart icons
  const renderHearts = () => {
    const maxHearts = Math.max(level, lives);
    return Array.from({ length: maxHearts }, (_, i) => (
      <HeartIcon key={i} active={i < lives} />
    ));
  };

  // Risk gauge arc calculation
  const getGaugeArc = () => {
    const percentage = odds / 100;
    const arcLength = 157; // Half circle circumference (π * 50)
    return arcLength - (percentage * arcLength);
  };

  return (
    <div className="game-hud">
      {/* Level Badge */}
      <div className="level-badge">
        <span className="level-num">{level}</span>
        <span className="level-text">LEVEL</span>
      </div>

      {/* Phase Indicator */}
      <div className={`phase-badge ${isCardGame ? 'card-phase' : 'revolver-phase'}`}>
        <span className="phase-text">PHASE</span>
        <span className="phase-value">
          {isCardGame ? '♠ HI-LO CARDS' : '🔫 REVOLVER'}
        </span>
      </div>

      {/* Lives Panel */}
      <div className="lives-panel">
        <div className="lives-container">
          <div className="lives-hearts">
            {renderHearts()}
          </div>
          <span className="lives-label">LIVES</span>
        </div>
      </div>

      {/* Main HUD - only show when not in card game */}
      {!isCardGame && (
        <div className="hud-main">
          {/* Cylinder Display */}
          <div className="hud-section cylinder-section">
            <div className="cylinder-container">
              <div 
                className="cylinder"
                style={{ transform: `rotate(${cylinderRotation}deg)` }}
              >
                {renderChambers()}
                <div className="cylinder-center" />
              </div>
              <div className="cylinder-label">
                <span className="chambers-left">{6 - bulletsShot}</span>
                <span className="chambers-text">LEFT</span>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="hud-section action-section">
            {/* Player's turn with revolver - must shoot after losing card game */}
            {mustShoot && isPlayerTurn && (
              <button 
                className="trigger-button"
                onClick={pullTrigger}
                disabled={isAnimating}
              >
                <span className="trigger-glow" />
                <span className="trigger-text">
                  {isAnimating ? 'FIRING...' : 'PULL TRIGGER'}
                </span>
              </button>
            )}

            {/* AI's turn with revolver */}
            {mustShoot && !isPlayerTurn && (
              <div className="ai-indicator">
                <div className="ai-dots">
                  <span /><span /><span />
                </div>
                <span className="ai-text">AI FIRING</span>
              </div>
            )}

            {/* Death outcome */}
            {gamePhase === 'playerDead' && lives > 0 && (
              <div className="outcome-panel death-panel">
                <span className="outcome-icon">💀</span>
                <span className="outcome-title">YOU GOT SHOT</span>
                <span className="outcome-subtitle">{lives} {lives === 1 ? 'LIFE' : 'LIVES'} REMAINING</span>
                <button className="outcome-button" onClick={continueAfterDeath}>
                  CONTINUE
                </button>
              </div>
            )}

            {/* Victory outcome */}
            {gamePhase === 'aiDead' && (
              <div className="outcome-panel victory-panel">
                <span className="outcome-icon">🎯</span>
                <span className="outcome-title">AI ELIMINATED</span>
                <span className="outcome-subtitle">LEVEL {level} COMPLETE</span>
                <button className="outcome-button victory" onClick={nextLevel}>
                  NEXT LEVEL
                </button>
              </div>
            )}
          </div>

          {/* Risk Meter */}
          <div className="hud-section risk-section">
            <div className={`risk-meter ${getRiskLevel()} ${riskPulse ? 'pulse' : ''}`}>
              <div className="risk-gauge">
                <svg viewBox="0 0 100 65" className="gauge-svg">
                  {/* Background arc */}
                  <path
                    d="M 10 55 A 40 40 0 0 1 90 55"
                    fill="none"
                    stroke="rgba(60, 50, 40, 0.3)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Risk arc */}
                  <path
                    d="M 10 55 A 40 40 0 0 1 90 55"
                    fill="none"
                    className="risk-arc"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="126"
                    strokeDashoffset={getGaugeArc()}
                  />
                  {/* Needle */}
                  <g 
                    className="needle-group"
                    style={{
                      transform: `rotate(${-90 + (odds / 100) * 180}deg)`,
                      transformOrigin: '50px 55px'
                    }}
                  >
                    <line
                      x1="50"
                      y1="55"
                      x2="50"
                      y2="25"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="50" cy="55" r="4" fill="currentColor" />
                  </g>
                </svg>
              </div>
              <div className="risk-value">
                <span className="risk-percent">{Math.round(odds)}</span>
                <span className="risk-symbol">%</span>
              </div>
              <span className="risk-label">DEATH RISK</span>
              <span className="risk-odds">1 in {6 - bulletsShot}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
