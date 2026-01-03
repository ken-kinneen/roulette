import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './GamePanel.css';

const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS = {
  hearts: '#c45c45',
  diamonds: '#c45c45',
  clubs: '#1a1816',
  spades: '#1a1816',
};

// Heart SVG component
function HeartIcon({ active }) {
  return (
    <div className={`panel-heart ${active ? 'active' : 'empty'}`}>
      <svg viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  );
}

export function GamePanel() {
  const roundsSurvived = useGameStore((state) => state.roundsSurvived);
  const lives = useGameStore((state) => state.lives);
  const bulletsShot = useGameStore((state) => state.bulletsShot);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const pullTrigger = useGameStore((state) => state.pullTrigger);
  const nextRound = useGameStore((state) => state.nextRound);
  const continueAfterDeath = useGameStore((state) => state.continueAfterDeath);
  const getCurrentOdds = useGameStore((state) => state.getCurrentOdds);
  const isAnimating = useGameStore((state) => state.isAnimating);
  const cardGameWinner = useGameStore((state) => state.cardGameWinner);
  const currentCard = useGameStore((state) => state.currentCard);
  const nextCard = useGameStore((state) => state.nextCard);
  const cardGamePhase = useGameStore((state) => state.cardGamePhase);
  const lastGuess = useGameStore((state) => state.lastGuess);
  const lastGuessResult = useGameStore((state) => state.lastGuessResult);
  const makeGuess = useGameStore((state) => state.makeGuess);
  const aiMakeGuess = useGameStore((state) => state.aiMakeGuess);
  const triggerSequencePhase = useGameStore((state) => state.triggerSequencePhase);
  
  const [riskPulse, setRiskPulse] = useState(false);
  const prevBulletsShot = useRef(bulletsShot);
  const vladCardTimeoutRef = useRef(null);
  const vladShotTimeoutRef = useRef(null);

  // Vlad makes card guess
  useEffect(() => {
    if (gamePhase === 'cardGame' && currentTurn === 'ai' && cardGamePhase === 'guessing' && !isAnimating) {
      vladCardTimeoutRef.current = setTimeout(() => {
        aiMakeGuess();
      }, 1500);
    }
    return () => {
      if (vladCardTimeoutRef.current) clearTimeout(vladCardTimeoutRef.current);
    };
  }, [gamePhase, currentTurn, cardGamePhase, isAnimating, aiMakeGuess]);

  // Vlad shoots revolver
  useEffect(() => {
    if (currentTurn === 'ai' && gamePhase === 'playing' && !isAnimating && cardGameWinner === 'player') {
      vladShotTimeoutRef.current = setTimeout(() => {
        const state = useGameStore.getState();
        if (state.currentTurn === 'ai' && state.gamePhase === 'playing' && !state.isAnimating) {
          pullTrigger();
        }
      }, 1500);
    }
    return () => {
      if (vladShotTimeoutRef.current) clearTimeout(vladShotTimeoutRef.current);
    };
  }, [currentTurn, gamePhase, isAnimating, pullTrigger, cardGameWinner]);

  // Risk pulse animation
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
  const isRevolverPhase = gamePhase === 'playing';
  const isTriggerSequence = gamePhase === 'triggerSequence';
  const isPlayerTurn = currentTurn === 'player';
  const mustShoot = isRevolverPhase && cardGameWinner !== null;
  const isOutcome = gamePhase === 'playerDead' || gamePhase === 'aiDead';
  const isPlayerGuessing = isCardGame && currentTurn === 'player' && cardGamePhase === 'guessing';
  const isVladGuessing = isCardGame && currentTurn === 'ai' && cardGamePhase === 'guessing';
  const isVladPredicting = isCardGame && cardGamePhase === 'vladPredicting';
  const isRevealing = cardGamePhase === 'revealing' || cardGamePhase === 'result';

  const getRiskLevel = () => {
    if (odds < 25) return 'low';
    if (odds < 40) return 'medium';
    if (odds < 60) return 'high';
    return 'critical';
  };

  const renderHearts = () => {
    // Always show 3 hearts (fixed starting lives)
    return Array.from({ length: 3 }, (_, i) => (
      <HeartIcon key={i} active={i < lives} />
    ));
  };

  const renderCard = (card, label, isNew = false) => {
    if (!card) return null;
    const symbol = SUIT_SYMBOLS[card.suit];
    const color = SUIT_COLORS[card.suit];
    
    return (
      <div className={`card-slot ${isNew ? 'new-card' : 'current-card'}`}>
        <div className="card-slot-label">{label}</div>
        <div className={`game-card ${isNew ? 'card-reveal' : ''}`}>
          <div className="card-corner top-left">
            <span className="corner-value" style={{ color }}>{card.value}</span>
            <span className="corner-suit" style={{ color }}>{symbol}</span>
          </div>
          <div className="card-center">
            <span className="center-suit" style={{ color }}>{symbol}</span>
          </div>
          <div className="card-corner bottom-right">
            <span className="corner-value" style={{ color }}>{card.value}</span>
            <span className="corner-suit" style={{ color }}>{symbol}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="game-panel">
      <div className="panel-container">
        {/* Left Section - Revolver */}
        <div className="panel-section revolver-section">
          <div className="section-header">
            <span className="section-icon">🔫</span>
            <span className="section-title">REVOLVER</span>
          </div>
          
          {/* Cylinder visualization */}
          <div className="cylinder-visual">
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i * 60 - 90) * (Math.PI / 180);
              const radius = 32;
              const x = 40 + radius * Math.cos(angle);
              const y = 40 + radius * Math.sin(angle);
              const isFired = i < bulletsShot;
              const isNext = i === bulletsShot;
              
              return (
                <div
                  key={i}
                  className={`cylinder-chamber ${isFired ? 'fired' : 'loaded'} ${isNext ? 'next' : ''}`}
                  style={{ left: `${x}px`, top: `${y}px` }}
                >
                  {!isFired && <div className="chamber-bullet" />}
                </div>
              );
            })}
            <div className="cylinder-center" />
          </div>
          
          {/* Risk display */}
          <div className={`risk-display ${getRiskLevel()} ${riskPulse ? 'pulse' : ''}`}>
            <span className="risk-percent">{Math.round(odds)}%</span>
            <span className="risk-text">DEATH RISK</span>
            <span className="risk-odds">1 in {6 - bulletsShot}</span>
          </div>
        </div>

        {/* Center Section - Cards & Actions */}
        <div className="panel-section cards-section">
          {/* Turn Banner */}
          <div className="turn-banner">
            <span className={`turn-who ${isPlayerTurn ? 'player' : 'vlad'}`}>
              {isTriggerSequence ? 'YOUR FATE' : isPlayerTurn ? 'YOUR TURN' : "VLAD'S TURN"}
            </span>
            <span className="turn-phase">
              {isCardGame ? '♠ HI-LO CARDS' : isTriggerSequence ? '💀 RUSSIAN ROULETTE' : isRevolverPhase ? '🎯 SHOOT' : ''}
            </span>
          </div>

          {/* Cards Display */}
          {(isCardGame || isRevolverPhase) && !isOutcome && !isTriggerSequence && (
            <div className="cards-display">
              {currentCard && renderCard(currentCard, 'CURRENT')}
              
              {isRevealing && nextCard && (
                <div className="card-arrow">→</div>
              )}
              
              {isRevealing && nextCard && renderCard(nextCard, 'DRAWN', true)}
              
              {isCardGame && !isRevealing && (
                <div className="card-slot placeholder">
                  <div className="card-slot-label">NEXT?</div>
                  <div className="game-card card-back">
                    <span className="card-mystery">?</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="action-zone">
            {/* Card game - dealing */}
            {isCardGame && cardGamePhase === 'dealing' && (
              <div className="status-msg">DEALING<span className="dots">...</span></div>
            )}

            {/* Card game - player guess */}
            {isPlayerGuessing && !isAnimating && (
              <div className="guess-row">
                <button className="guess-btn hi" onClick={() => makeGuess('higher')}>
                  <span className="btn-icon">▲</span>
                  <span>HIGHER</span>
                </button>
                <button className="guess-btn lo" onClick={() => makeGuess('lower')}>
                  <span className="btn-icon">▼</span>
                  <span>LOWER</span>
                </button>
              </div>
            )}

            {/* Card game - Vlad thinking */}
            {isVladGuessing && (
              <div className="status-msg vlad">VLAD IS THINKING<span className="dots">...</span></div>
            )}

            {/* Card game - Vlad's prediction (shown before reveal) */}
            {isVladPredicting && lastGuess && (
              <div className="vlad-prediction">
                <span className="prediction-label">VLAD PREDICTS:</span>
                <div className={`prediction-choice ${lastGuess}`}>
                  <span className="prediction-icon">{lastGuess === 'higher' ? '▲' : '▼'}</span>
                  <span className="prediction-text">{lastGuess.toUpperCase()}</span>
                </div>
                <span className="revealing-soon">Revealing<span className="dots">...</span></span>
              </div>
            )}

            {/* Card game - result */}
            {cardGamePhase === 'result' && lastGuessResult && (
              <div className={`result-msg ${lastGuessResult}`}>
                <span className="result-who">{currentTurn === 'player' ? 'YOU' : 'VLAD'} GUESSED {lastGuess?.toUpperCase()}</span>
                <span className="result-outcome">{lastGuessResult === 'correct' ? '✓ CORRECT!' : '✗ WRONG!'}</span>
              </div>
            )}

            {/* Trigger Sequence - Automatic suspenseful sequence */}
            {isTriggerSequence && (
              <div className={`trigger-sequence-zone phase-${triggerSequencePhase}`}>
                {triggerSequencePhase === 'drop' && (
                  <div className="sequence-phase drop-phase">
                    <span className="sequence-icon">💀</span>
                    <span className="sequence-text">You lost...</span>
                  </div>
                )}
                {triggerSequencePhase === 'heartbeat' && (
                  <div className="sequence-phase heartbeat-phase">
                    <span className="sequence-icon heartbeat-pulse">❤️</span>
                    <span className="sequence-text">Your heart pounds...</span>
                  </div>
                )}
                {triggerSequencePhase === 'spin' && (
                  <div className="sequence-phase spin-phase">
                    <span className="sequence-icon spin-icon">🔄</span>
                    <span className="sequence-text">The cylinder spins...</span>
                  </div>
                )}
                {triggerSequencePhase === 'pull' && (
                  <div className="sequence-phase pull-phase">
                    <span className="sequence-icon">🎯</span>
                    <span className="sequence-text">Pulling the trigger...</span>
                  </div>
                )}
                {triggerSequencePhase === 'result' && (
                  <div className="sequence-phase result-phase">
                    <span className="sequence-icon flash-icon">💥</span>
                    <span className="sequence-text">...</span>
                  </div>
                )}
              </div>
            )}

            {/* Revolver - must shoot (AI only now, player uses trigger sequence) */}
            {mustShoot && isPlayerTurn && !isOutcome && !isTriggerSequence && (
              <div className="shoot-zone">
                <span className="shoot-msg">You lost - pull the trigger!</span>
                <button className="shoot-btn" onClick={pullTrigger} disabled={isAnimating}>
                  {isAnimating ? 'FIRING...' : 'PULL TRIGGER'}
                </button>
              </div>
            )}

            {/* Revolver - Vlad shooting */}
            {mustShoot && !isPlayerTurn && !isOutcome && (
              <div className="status-msg vlad">VLAD IS SHOOTING<span className="dots">...</span></div>
            )}

            {/* Outcomes */}
            {gamePhase === 'playerDead' && lives > 0 && (
              <div className="outcome death">
                <span className="outcome-emoji">💀</span>
                <span className="outcome-title">YOU GOT SHOT!</span>
                <span className="outcome-sub">{lives} {lives === 1 ? 'life' : 'lives'} left</span>
                <button className="outcome-btn" onClick={continueAfterDeath}>CONTINUE</button>
              </div>
            )}

            {gamePhase === 'aiDead' && (
              <div className="outcome victory">
                <span className="outcome-emoji">🎯</span>
                <span className="outcome-title">VLAD ELIMINATED!</span>
                <span className="outcome-sub">Round {roundsSurvived} survived!</span>
                <button className="outcome-btn win" onClick={nextRound}>NEXT ROUND</button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Stats */}
        <div className="panel-section stats-section">
          <div className="stat-block rounds-block">
            <span className="stat-big">{roundsSurvived}</span>
            <span className="stat-label">ROUNDS</span>
          </div>
          
          <div className="stat-block lives-block">
            <div className="hearts-display">{renderHearts()}</div>
            <span className="stat-label">LIVES</span>
          </div>
          
          <div className="stat-block chambers-block">
            <span className="stat-big">{6 - bulletsShot}</span>
            <span className="stat-label">CHAMBERS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
