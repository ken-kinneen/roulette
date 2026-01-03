import { useState } from 'react';
import './HelpButton.css';

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="help-button"
        onClick={() => setIsOpen(true)}
        aria-label="How to play"
      >
        <span className="help-icon">?</span>
      </button>

      {isOpen && (
        <div className="help-overlay" onClick={() => setIsOpen(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <button className="help-close" onClick={() => setIsOpen(false)}>×</button>
            
            <h2 className="help-title">HOW TO PLAY</h2>
            
            <div className="help-content">
              <div className="rule-section">
                <div className="rule-icon">♠</div>
                <div className="rule-text">
                  <h3>Hi-Lo Cards</h3>
                  <p>Guess if the next card will be <strong>higher</strong> or <strong>lower</strong> than the current card.</p>
                </div>
              </div>

              <div className="rule-section">
                <div className="rule-icon">✓</div>
                <div className="rule-text">
                  <h3>Correct Guess</h3>
                  <p>If you guess right, the turn passes to your opponent who must now guess.</p>
                </div>
              </div>

              <div className="rule-section">
                <div className="rule-icon">🔫</div>
                <div className="rule-text">
                  <h3>Wrong Guess</h3>
                  <p>Guess wrong and you must <strong>pull the trigger</strong> on the revolver. 1 in 6 chance of death.</p>
                </div>
              </div>

              <div className="rule-section">
                <div className="rule-icon">💀</div>
                <div className="rule-text">
                  <h3>Survival</h3>
                  <p>Survive the shot and a new card game begins. Each empty chamber increases the odds.</p>
                </div>
              </div>

              <div className="rule-section">
                <div className="rule-icon">♥</div>
                <div className="rule-text">
                  <h3>Lives & Levels</h3>
                  <p>Eliminate the AI to advance. Each level grants more lives equal to the level number.</p>
                </div>
              </div>
            </div>

            <div className="help-footer">
              <span className="help-tip">Good luck. You'll need it.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

