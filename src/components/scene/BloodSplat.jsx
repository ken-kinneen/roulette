import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';

export function BloodSplat() {
  const groupRef = useRef();
  const [particles, setParticles] = useState([]);
  const [isActive, setIsActive] = useState(false);
  
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const triggerSequencePhase = useGameStore((state) => state.triggerSequencePhase);
  const triggerSequenceShooter = useGameStore((state) => state.triggerSequenceShooter);
  const triggerSequenceWillFire = useGameStore((state) => state.triggerSequenceWillFire);
  
  const prevPhaseRef = useRef(triggerSequencePhase);

  useEffect(() => {
    // Trigger blood splat when result phase happens and bullet fires
    if (triggerSequencePhase === 'result' && prevPhaseRef.current === 'pull' && triggerSequenceWillFire) {
      const isPlayerShot = triggerSequenceShooter === 'player';
      const z = isPlayerShot ? 1.2 : -1.2;

      // Create blood particles emanating from head
      const newParticles = [];
      for (let i = 0; i < 25; i++) {
        // Particles originate from the opposite side of the head from the gun
        const exitSide = isPlayerShot ? -0.2 : 0.2;
        newParticles.push({
          id: i,
          position: [
            exitSide + (Math.random() - 0.5) * 0.2,
            1.7 + (Math.random() - 0.5) * 0.15, // Head height
            z + (Math.random() - 0.5) * 0.2
          ],
          velocity: [
            (isPlayerShot ? -1 : 1) * (Math.random() * 3 + 2), // Spray away from gun
            Math.random() * 2 + 0.5,
            (isPlayerShot ? -1 : 1) * (Math.random() * 2 - 1)
          ],
          scale: Math.random() * 0.08 + 0.03,
          life: 1.0
        });
      }
      setParticles(newParticles);
      setIsActive(true);

      setTimeout(() => {
        setIsActive(false);
        setParticles([]);
      }, 2000);
    }
    
    // Also handle legacy death phases for backwards compatibility
    if (
      (gamePhase === 'playerDead' || gamePhase === 'aiDead' || gamePhase === 'gameOver') &&
      prevPhaseRef.current !== 'result' &&
      !isActive
    ) {
      const wasPlayer = currentTurn === 'player' || gamePhase === 'gameOver';
      const z = wasPlayer ? 1.2 : -1.2;

      const newParticles = [];
      for (let i = 0; i < 25; i++) {
        const exitSide = wasPlayer ? -0.2 : 0.2;
        newParticles.push({
          id: i,
          position: [
            exitSide + (Math.random() - 0.5) * 0.2,
            1.7 + (Math.random() - 0.5) * 0.15,
            z + (Math.random() - 0.5) * 0.2
          ],
          velocity: [
            (wasPlayer ? -1 : 1) * (Math.random() * 3 + 2),
            Math.random() * 2 + 0.5,
            (wasPlayer ? -1 : 1) * (Math.random() * 2 - 1)
          ],
          scale: Math.random() * 0.08 + 0.03,
          life: 1.0
        });
      }
      setParticles(newParticles);
      setIsActive(true);

      setTimeout(() => {
        setIsActive(false);
        setParticles([]);
      }, 2000);
    }
    
    prevPhaseRef.current = triggerSequencePhase;
  }, [triggerSequencePhase, triggerSequenceWillFire, triggerSequenceShooter, gamePhase, currentTurn, isActive]);

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
