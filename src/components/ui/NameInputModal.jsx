import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './NameInputModal.css';

export function NameInputModal() {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const showNameInput = useGameStore((state) => state.showNameInput);
  const roundsSurvived = useGameStore((state) => state.roundsSurvived);
  const submitToGlobalLeaderboard = useGameStore((state) => state.submitToGlobalLeaderboard);
  const skipNameInput = useGameStore((state) => state.skipNameInput);

  if (!showNameInput) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await submitToGlobalLeaderboard(trimmedName);
    } catch (err) {
      setError('Failed to submit score. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    skipNameInput();
  };

  return (
    <div className="name-input-overlay">
      <div className="name-input-modal">
        <div className="trophy-large">🏆</div>
        
        <h2 className="modal-title">NEW HIGH SCORE!</h2>
        
        <div className="score-display">
          <span className="score-label">YOU SURVIVED</span>
          <span className="score-value">{roundsSurvived}</span>
          <span className="score-unit">ROUNDS</span>
        </div>

        <form onSubmit={handleSubmit} className="name-form">
          <label className="input-label">ENTER YOUR NAME FOR THE LEADERBOARD</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name..."
            maxLength={20}
            autoFocus
            className="name-input"
            disabled={isSubmitting}
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="modal-buttons">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT SCORE'}
            </button>
            <button 
              type="button" 
              className="skip-btn"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              SKIP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


