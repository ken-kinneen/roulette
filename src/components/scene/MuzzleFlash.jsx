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
  const prevPhaseRef = useRef(gamePhase);

  useEffect(() => {
    // Trigger flash on death phases (when bullet fires)
    if (
      (gamePhase === 'playerDead' || gamePhase === 'aiDead' || gamePhase === 'gameOver') &&
      prevPhaseRef.current === 'playing'
    ) {
      // Position flash near the shooter's gun
      const wasPlayer = currentTurn === 'player' || gamePhase === 'gameOver';
      const z = wasPlayer ? 1.5 : -1.5;
      setFlashPosition([0.3, 1.5, z]);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 100);
    }
    prevPhaseRef.current = gamePhase;
  }, [gamePhase, currentTurn]);

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
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.95} />
      </mesh>
      <pointLight ref={lightRef} color="#ff6600" intensity={0} distance={8} />
    </group>
  );
}
