import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';

export function BloodSplat() {
  const groupRef = useRef();
  const [particles, setParticles] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const prevPhaseRef = useRef(gamePhase);

  useEffect(() => {
    // Trigger blood splat on death
    if (
      (gamePhase === 'playerDead' || gamePhase === 'aiDead' || gamePhase === 'gameOver') &&
      prevPhaseRef.current === 'playing'
    ) {
      // Determine which character got shot
      const wasPlayer = currentTurn === 'player' || gamePhase === 'gameOver';
      const z = wasPlayer ? 1.8 : -1.8;

      // Create blood particles
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          position: [
            (Math.random() - 0.5) * 0.3,
            1.3 + (Math.random() - 0.5) * 0.2,
            z + (Math.random() - 0.5) * 0.3
          ],
          velocity: [
            (Math.random() - 0.5) * 3,
            Math.random() * 2 + 1,
            (wasPlayer ? -1 : 1) * (Math.random() * 2 + 1)
          ],
          scale: Math.random() * 0.08 + 0.03,
          life: 1.0
        });
      }
      setParticles(newParticles);
      setIsActive(true);

      // Clear after animation
      setTimeout(() => {
        setIsActive(false);
        setParticles([]);
      }, 2000);
    }
    prevPhaseRef.current = gamePhase;
  }, [gamePhase, currentTurn]);

  useFrame((state, delta) => {
    if (!isActive) return;

    setParticles(prev => prev.map(p => ({
      ...p,
      position: [
        p.position[0] + p.velocity[0] * delta,
        p.position[1] + p.velocity[1] * delta - 9.8 * delta * delta,
        p.position[2] + p.velocity[2] * delta
      ],
      velocity: [
        p.velocity[0] * 0.98,
        p.velocity[1] - 9.8 * delta,
        p.velocity[2] * 0.98
      ],
      life: p.life - delta * 0.5
    })).filter(p => p.life > 0 && p.position[1] > 0));
  });

  if (!isActive || particles.length === 0) return null;

  return (
    <group ref={groupRef}>
      {particles.map(p => (
        <mesh key={p.id} position={p.position}>
          <sphereGeometry args={[p.scale, 6, 6]} />
          <meshStandardMaterial 
            color="#8b0000" 
            transparent 
            opacity={p.life}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

