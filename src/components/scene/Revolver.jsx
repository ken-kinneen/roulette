import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';

export function Revolver() {
  const groupRef = useRef();
  const cylinderRef = useRef();
  const currentTurn = useGameStore((state) => state.currentTurn);
  const bulletsShot = useGameStore((state) => state.bulletsShot);
  const isAnimating = useGameStore((state) => state.isAnimating);
  const gamePhase = useGameStore((state) => state.gamePhase);

  // Position revolver at player's position, held up to head
  // Player is at z=1.8, AI is at z=-1.8
  const playerZ = currentTurn === 'player' ? 1.8 : -1.8;
  const playerRotation = currentTurn === 'player' ? Math.PI : 0;

  useFrame((state) => {
    if (!cylinderRef.current || !groupRef.current) return;

    // Cylinder rotation based on bullets shot
    const targetCylinderRotation = bulletsShot * (Math.PI / 3);
    cylinderRef.current.rotation.z += (targetCylinderRotation - cylinderRef.current.rotation.z) * 0.15;

    // Recoil animation when shooting
    if (isAnimating) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 40) * 0.1;
    } else {
      groupRef.current.rotation.z *= 0.9;
    }
  });

  // Hide revolver during death phases
  if (gamePhase === 'playerDead' || gamePhase === 'aiDead' || gamePhase === 'gameOver') {
    return null;
  }

  return (
    <group 
      ref={groupRef} 
      position={[0.3, 1.5, playerZ + (currentTurn === 'player' ? -0.3 : 0.3)]}
      rotation={[0, playerRotation, Math.PI / 2]}
    >
      {/* Barrel - pointing at head (to the side) */}
      <mesh rotation={[0, 0, 0]} position={[0.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Cylinder (chamber) */}
      <group ref={cylinderRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.1, 6]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Chamber holes */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i * Math.PI * 2) / 6;
          const x = Math.cos(angle) * 0.035;
          const z = Math.sin(angle) * 0.035;
          return (
            <mesh key={i} position={[x, 0.06, z]}>
              <cylinderGeometry args={[0.012, 0.012, 0.02, 8]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          );
        })}
      </group>

      {/* Handle/Grip */}
      <mesh position={[-0.08, -0.08, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[0.06, 0.14, 0.05]} />
        <meshStandardMaterial color="#4a3020" roughness={0.6} />
      </mesh>

      {/* Frame */}
      <mesh position={[0.03, 0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.05, 0.04]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Hammer */}
      <mesh position={[-0.05, 0.05, 0]} rotation={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[0.02, 0.05, 0.015]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}
