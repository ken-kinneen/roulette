import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import './ScreenFlashOverlay.css';

export function ScreenFlashOverlay() {
  const [isFlashing, setIsFlashing] = useState(false);
  const [showBlood, setShowBlood] = useState(false);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const prevPhaseRef = useRef(gamePhase);

  useEffect(() => {
    // Trigger flash and blood on death
    if (
      (gamePhase === 'playerDead' || gamePhase === 'aiDead' || gamePhase === 'gameOver') &&
      prevPhaseRef.current === 'playing'
    ) {
      setIsFlashing(true);
      setShowBlood(true);
      
      setTimeout(() => setIsFlashing(false), 150);
      setTimeout(() => setShowBlood(false), 1500);
    }
    prevPhaseRef.current = gamePhase;
  }, [gamePhase]);

  return (
    <>
      {isFlashing && <div className="screen-flash" />}
      {showBlood && (
        <div className="blood-overlay">
          <div className="blood-splatter blood-1" />
          <div className="blood-splatter blood-2" />
          <div className="blood-splatter blood-3" />
          <div className="blood-drip blood-drip-1" />
          <div className="blood-drip blood-drip-2" />
          <div className="blood-drip blood-drip-3" />
        </div>
      )}
    </>
  );
}




