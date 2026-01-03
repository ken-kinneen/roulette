import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './DevTools.css';

// Only show dev tools on localhost
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '');

export function DevTools() {
  const [leaderboardStatus, setLeaderboardStatus] = useState(null);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const startTriggerSequence = useGameStore((state) => state.startTriggerSequence);
  const triggerSequencePhase = useGameStore((state) => state.triggerSequencePhase);
  const submitToGlobalLeaderboard = useGameStore((state) => state.submitToGlobalLeaderboard);
  const loadGlobalLeaderboard = useGameStore((state) => state.loadGlobalLeaderboard);
  
  // Force death - sets game to gameOver with name input
  const forceDeath = () => {
    const { roundsSurvived, globalLeaderboard } = useGameStore.getState();
    // Check if qualifies for leaderboard
    const qualifiesForLeaderboard = roundsSurvived > 0 && (
      globalLeaderboard.length < 100 || 
      roundsSurvived > (globalLeaderboard[globalLeaderboard.length - 1]?.rounds || 0)
    );
    useGameStore.setState({
      lives: 0,
      gamePhase: 'gameOver',
      showNameInput: qualifiesForLeaderboard,
      isAnimating: false,
    });
  };
  
  // Force trigger sequence (player shoots themselves)
  const forceShoot = () => {
    if (gamePhase !== 'triggerSequence') {
      startTriggerSequence();
    }
  };
  
  // Force player dead (with lives remaining)
  const forcePlayerDead = () => {
    useGameStore.setState({
      gamePhase: 'playerDead',
      isAnimating: false,
    });
  };
  
  // Force AI dead (also increment rounds survived)
  const forceAIDead = () => {
    const currentRounds = useGameStore.getState().roundsSurvived;
    useGameStore.setState({
      gamePhase: 'aiDead',
      roundsSurvived: currentRounds + 1,
      isAnimating: false,
    });
  };

  // Test leaderboard submission with score of 5
  const testLeaderboard = async () => {
    setLeaderboardStatus('submitting...');
    try {
      // Temporarily set rounds to 5 for the test
      const originalRounds = useGameStore.getState().roundsSurvived;
      useGameStore.setState({ roundsSurvived: 5 });
      
      const result = await submitToGlobalLeaderboard('TestUser_' + Date.now().toString().slice(-4));
      
      // Restore original rounds
      useGameStore.setState({ roundsSurvived: originalRounds });
      
      setLeaderboardStatus(`✓ Rank #${result.rank}`);
      
      // Reload leaderboard to show updated data
      await loadGlobalLeaderboard();
      
      // Clear status after 3 seconds
      setTimeout(() => setLeaderboardStatus(null), 3000);
    } catch (error) {
      console.error('Leaderboard test failed:', error);
      // Check if it's likely an API not available error (404)
      const isApiUnavailable = error.message?.includes('Failed to submit') || error.message?.includes('fetch');
      if (isApiUnavailable) {
        setLeaderboardStatus('✗ API unavailable (use vercel dev)');
      } else {
        setLeaderboardStatus(`✗ ${error.message}`);
      }
      setTimeout(() => setLeaderboardStatus(null), 5000);
    }
  };

  if (!isLocalhost) return null;
  if (gamePhase === 'start') return null;

  return (
    <div className="dev-tools">
      <div className="dev-tools-header">🛠 DEV</div>
      <div className="dev-tools-buttons">
        <button 
          className="dev-btn shoot" 
          onClick={forceShoot}
          disabled={gamePhase === 'triggerSequence'}
        >
          🔫 Shoot Self
        </button>
        <button className="dev-btn death" onClick={forceDeath}>
          💀 Game Over
        </button>
        <button className="dev-btn player-dead" onClick={forcePlayerDead}>
          ❤️‍🩹 Player Dead
        </button>
        <button className="dev-btn ai-dead" onClick={forceAIDead}>
          🎯 AI Dead
        </button>
        <button 
          className="dev-btn leaderboard" 
          onClick={testLeaderboard}
          disabled={leaderboardStatus === 'submitting...'}
        >
          🏆 Test Leaderboard (5)
        </button>
      </div>
      {leaderboardStatus && (
        <div className={`dev-status ${leaderboardStatus.startsWith('✓') ? 'success' : leaderboardStatus.startsWith('✗') ? 'error' : ''}`}>
          {leaderboardStatus}
        </div>
      )}
      {triggerSequencePhase && (
        <div className="dev-phase">Phase: {triggerSequencePhase}</div>
      )}
    </div>
  );
}

