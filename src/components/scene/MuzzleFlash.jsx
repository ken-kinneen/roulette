import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';

export function MuzzleFlash() {
  const meshRef = useRef();
  const lightRef = useRef();
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashPosition, setFlashPosition] = useState([0, 1.5, 1.5]);
  
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const triggerSequencePhase = useGameStore((state) => state.triggerSequencePhase);
  const triggerSequenceShooter = useGameStore((state) => state.triggerSequenceShooter);
  const triggerSequenceWillFire = useGameStore((state) => state.triggerSequenceWillFire);
  
  const prevPhaseRef = useRef(triggerSequencePhase);

  useEffect(() => {
    // Trigger flash when result phase happens and bullet fires
    if (triggerSequencePhase === 'result' && prevPhaseRef.current === 'pull' && triggerSequenceWillFire) {
      // Position flash near the shooter's head (where gun is pointing)
      const isPlayerShooting = triggerSequenceShooter === 'player';
      const z = isPlayerShooting ? 1.2 : -1.2;
      // Gun is at side of head during shot
      setFlashPosition([
        isPlayerShooting ? 0.3 : -0.3, // Side of head
        1.8, // Head height
        z
      ]);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 100);
    }
    
    // Also handle legacy death phases for backwards compatibility
    if (
      (gamePhase === 'playerDead' || gamePhase === 'aiDead' || gamePhase === 'gameOver') &&
      prevPhaseRef.current !== 'result'
    ) {
      const wasPlayer = currentTurn === 'player' || gamePhase === 'gameOver';
      const z = wasPlayer ? 1.2 : -1.2;
      setFlashPosition([wasPlayer ? 0.3 : -0.3, 1.8, z]);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 100);
    }
    
    prevPhaseRef.current = triggerSequencePhase;
  }, [triggerSequencePhase, triggerSequenceWillFire, triggerSequenceShooter, gamePhase, currentTurn]);

  useFrame((state, delta) => {
    if (!meshRef.current || !lightRef.current) return;

    if (isFlashing) {
      meshRef.current.scale.setScalar(1 + Math.random() * 0.5);
      lightRef.current.intensity = 150 + Math.random() * 100;
    } else {
      meshRef.current.scale.setScalar(0);
      lightRef.current.intensity = 0;
    }
  });

  return (
    <group position={flashPosition}>
      <mesh ref={meshRef} scale={0}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.95} />
      </mesh>
      <pointLight ref={lightRef} color="#ff6600" intensity={0} distance={8} />
    </group>
  );
}
