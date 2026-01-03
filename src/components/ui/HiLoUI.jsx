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
  clubs: '#d4c4a8',
  spades: '#d4c4a8',
};

export function HiLoUI() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const currentCard = useGameStore((state) => state.currentCard);
  const nextCard = useGameStore((state) => state.nextCard);
  const cardGamePhase = useGameStore((state) => state.cardGamePhase);
  const lastGuess = useGameStore((state) => state.lastGuess);
  const lastGuessResult = useGameStore((state) => state.lastGuessResult);
  const cardGameWinner = useGameStore((state) => state.cardGameWinner);
  const isAnimating = useGameStore((state) => state.isAnimating);
  const makeGuess = useGameStore((state) => state.makeGuess);
  const aiMakeGuess = useGameStore((state) => state.aiMakeGuess);
  const pullTrigger = useGameStore((state) => state.pullTrigger);
  
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

  // Don't show during non-card phases
  if (gamePhase !== 'cardGame' && gamePhase !== 'playing') return null;

  const isPlayerGuessing = gamePhase === 'cardGame' && currentTurn === 'player' && cardGamePhase === 'guessing';
  const isAIGuessing = gamePhase === 'cardGame' && currentTurn === 'ai' && cardGamePhase === 'guessing';
  const isRevealing = cardGamePhase === 'revealing' || cardGamePhase === 'result';
  const mustShoot = gamePhase === 'playing' && cardGameWinner !== null;

  const renderCardDisplay = (card, label) => {
    if (!card) return null;
    const symbol = SUIT_SYMBOLS[card.suit];
    const color = SUIT_COLORS[card.suit];
    
    return (
      <div className="card-display">
        <div className="card-label">{label}</div>
        <div className="card-face">
          <span className="card-value" style={{ color }}>{card.value}</span>
          <span className="card-suit" style={{ color }}>{symbol}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="hilo-ui">
      {/* Cards display */}
      <div className="cards-section">
        {currentCard && renderCardDisplay(currentCard, 'CURRENT CARD')}
        
        {isRevealing && nextCard && (
          <div className="vs-indicator">→</div>
        )}
        
        {isRevealing && nextCard && renderCardDisplay(nextCard, 'DRAWN CARD')}
      </div>

      {/* Dealing phase */}
      {cardGamePhase === 'dealing' && (
        <div className="dealing-notice">
          <span className="dealing-text">DEALING CARD</span>
          <span className="loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </div>
      )}

      {/* Player's turn to guess */}
      {isPlayerGuessing && !isAnimating && (
        <div className="guess-section">
          <div className="guess-prompt">Will the next card be HIGHER or LOWER?</div>
          <div className="guess-buttons">
            <button 
              className="guess-button higher-button"
              onClick={() => makeGuess('higher')}
              disabled={isAnimating}
            >
              <span className="button-arrow">▲</span>
              <span className="button-text">HIGHER</span>
            </button>
            <button 
              className="guess-button lower-button"
              onClick={() => makeGuess('lower')}
              disabled={isAnimating}
            >
              <span className="button-arrow">▼</span>
              <span className="button-text">LOWER</span>
            </button>
          </div>
        </div>
      )}

      {/* AI's turn to guess */}
      {isAIGuessing && (
        <div className="ai-guess-notice">
          <span className="ai-thinking-text">AI IS GUESSING</span>
          <span className="loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </div>
      )}

      {/* Result display */}
      {cardGamePhase === 'result' && lastGuessResult && (
        <div className={`result-display ${lastGuessResult}`}>
          <div className="result-who">
            {currentTurn === 'player' ? 'YOU' : 'AI'} GUESSED {lastGuess?.toUpperCase()}
          </div>
          <div className="result-text">
            {lastGuessResult === 'correct' ? 'CORRECT!' : 'WRONG!'}
          </div>
        </div>
      )}

      {/* Must shoot notice */}
      {mustShoot && (
        <div className="shoot-notice">
          <div className="shoot-text">
            {currentTurn === 'player' 
              ? 'YOU LOST THE CARD GAME - PULL THE TRIGGER!'
              : 'AI LOST - THEY MUST SHOOT!'
            }
          </div>
          {currentTurn === 'player' && (
            <button 
              className="trigger-button"
              onClick={pullTrigger}
              disabled={isAnimating}
            >
              {isAnimating ? 'FIRING...' : 'PULL TRIGGER'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

