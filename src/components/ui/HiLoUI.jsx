import { useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './HiLoUI.css';

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

export function HiLoUI() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const currentCard = useGameStore((state) => state.currentCard);
  const nextCard = useGameStore((state) => state.nextCard);
  const cardGamePhase = useGameStore((state) => state.cardGamePhase);
  const lastGuess = useGameStore((state) => state.lastGuess);
  const lastGuessResult = useGameStore((state) => state.lastGuessResult);
  const isAnimating = useGameStore((state) => state.isAnimating);
  const makeGuess = useGameStore((state) => state.makeGuess);
  const aiMakeGuess = useGameStore((state) => state.aiMakeGuess);
  
  const aiTimeoutRef = useRef(null);

  // AI makes its guess after a delay
  useEffect(() => {
    if (gamePhase === 'cardGame' && currentTurn === 'ai' && cardGamePhase === 'guessing' && !isAnimating) {
      aiTimeoutRef.current = setTimeout(() => {
        aiMakeGuess();
      }, 1500);
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [gamePhase, currentTurn, cardGamePhase, isAnimating, aiMakeGuess]);

  // Only show during card game phase
  if (gamePhase !== 'cardGame') return null;

  const isPlayerGuessing = currentTurn === 'player' && cardGamePhase === 'guessing';
  const isAIGuessing = currentTurn === 'ai' && cardGamePhase === 'guessing';
  const isRevealing = cardGamePhase === 'revealing' || cardGamePhase === 'result';

  const renderCard = (card, label, isNew = false) => {
    if (!card) return null;
    const symbol = SUIT_SYMBOLS[card.suit];
    const color = SUIT_COLORS[card.suit];
    
    return (
      <div className={`card-container ${isNew ? 'new-card' : 'current-card'}`}>
        <div className="card-label-top">{label}</div>
        <div className={`playing-card ${isNew ? 'card-reveal' : ''}`}>
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
    <div className="hilo-ui">
      <div className="hilo-container">
        {/* Turn indicator */}
        <div className="turn-banner">
          <span className={`turn-text ${currentTurn === 'player' ? 'player' : 'ai'}`}>
            {currentTurn === 'player' ? 'YOUR TURN' : "AI'S TURN"}
          </span>
          <span className="turn-divider">|</span>
          <span className="phase-text">HI-LO CARDS</span>
        </div>

        {/* Cards area */}
        <div className="cards-area">
          {/* Current card */}
          {currentCard && renderCard(currentCard, 'CURRENT')}
          
          {/* Arrow / VS indicator */}
          {isRevealing && nextCard && (
            <div className="card-arrow">
              <span className="arrow-icon">→</span>
            </div>
          )}
          
          {/* Drawn card */}
          {isRevealing && nextCard && renderCard(nextCard, 'DRAWN', true)}
          
          {/* Placeholder when waiting */}
          {!isRevealing && (
            <div className="card-container placeholder-card">
              <div className="card-label-top">NEXT?</div>
              <div className="playing-card card-back">
                <div className="card-back-pattern">
                  <span>?</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action area */}
        <div className="action-area">
          {/* Dealing phase */}
          {cardGamePhase === 'dealing' && (
            <div className="status-message">
              <span>DEALING CARD</span>
              <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
            </div>
          )}

          {/* Player's turn to guess */}
          {isPlayerGuessing && !isAnimating && (
            <div className="guess-controls">
              <span className="guess-question">Higher or Lower?</span>
              <div className="guess-buttons">
                <button 
                  className="guess-btn higher"
                  onClick={() => makeGuess('higher')}
                >
                  <span className="btn-arrow">▲</span>
                  <span className="btn-label">HIGHER</span>
                </button>
                <button 
                  className="guess-btn lower"
                  onClick={() => makeGuess('lower')}
                >
                  <span className="btn-arrow">▼</span>
                  <span className="btn-label">LOWER</span>
                </button>
              </div>
            </div>
          )}

          {/* AI's turn */}
          {isAIGuessing && (
            <div className="status-message ai-thinking">
              <span>AI THINKING</span>
              <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
            </div>
          )}

          {/* Result display */}
          {cardGamePhase === 'result' && lastGuessResult && (
            <div className={`result-banner ${lastGuessResult}`}>
              <span className="result-label">
                {currentTurn === 'player' ? 'YOU' : 'AI'} GUESSED {lastGuess?.toUpperCase()}
              </span>
              <span className="result-outcome">
                {lastGuessResult === 'correct' ? '✓ CORRECT!' : '✗ WRONG!'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
