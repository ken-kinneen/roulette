import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';

export function ScreenFlash() {
  const meshRef = useRef();
  const [flashIntensity, setFlashIntensity] = useState(0);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const prevPhaseRef = useRef(gamePhase);

  useEffect(() => {
    // Trigger flash on death (bullet fired)
    if (
      (gamePhase === 'playerDead' || gamePhase === 'aiDead' || gamePhase === 'gameOver') &&
      prevPhaseRef.current === 'playing'
    ) {
      setFlashIntensity(1);
    }
    prevPhaseRef.current = gamePhase;
  }, [gamePhase]);

  useFrame((state, delta) => {
    if (flashIntensity > 0) {
      setFlashIntensity(prev => Math.max(0, prev - delta * 3));
    }
  });

  if (flashIntensity <= 0) return null;

  return (
    <>
      {/* Full screen flash effect - positioned in front of camera */}
      <mesh position={[0, 2, 3]} rotation={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial 
          color="#ff4400" 
          transparent 
          opacity={flashIntensity * 0.8}
          depthTest={false}
        />
      </mesh>
      
      {/* Intense point light flash */}
      <pointLight
        position={[0, 2, 0]}
        intensity={flashIntensity * 200}
        color="#ff6600"
        distance={10}
      />
    </>
  );
}




