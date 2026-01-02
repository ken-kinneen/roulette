import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';

export function Revolver() {
  const groupRef = useRef();
  const { scene } = useGLTF('/revolver.glb');
  const currentTurn = useGameStore((state) => state.currentTurn);
  const isAnimating = useGameStore((state) => state.isAnimating);
  const gamePhase = useGameStore((state) => state.gamePhase);

  // Clone and prepare the scene
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone();
    // Enable shadows on all meshes
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Position revolver in the character's hand, pointing at their head
  const isPlayer = currentTurn === 'player';
  const playerZ = isPlayer ? 1.45 : -1.8;
  const facingRotation =  4.3;

  useFrame((state) => {
    if (!groupRef.current) return;

    // Recoil animation when shooting
    if (isAnimating) {
      // Kick back slightly
      const recoilOffset = Math.sin(state.clock.elapsedTime * 40) * 0.03;
      groupRef.current.position.x = 0.3 + recoilOffset;
      groupRef.current.rotation.y = (facingRotation - Math.PI / 4) + Math.sin(state.clock.elapsedTime * 35) * 0.1;
    } else {
      // Smooth return to normal position
      groupRef.current.position.x += (0.3 - groupRef.current.position.x) * 0.1;
      const targetRotY = facingRotation - Math.PI / 4;
      groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.1;
    }
  });

  // Hide revolver during death phases
  if (gamePhase === 'playerDead' || gamePhase === 'aiDead' || gamePhase === 'gameOver') {
    return null;
  }

  if (!clonedScene) return null;

  // Position: in the hand (right side), pointing toward head
  // The revolver should be held at head height, to the side
  return (
    <group 
      ref={groupRef} 
      position={[
        0.3,  // To the right side (in hand)
        1.35, // Head height
        playerZ + (isPlayer ? 0.25 : -0.25) // Slightly forward of character
      ]}
      rotation={[
        Math.PI / 12,           // Slight tilt up
        16, // Pointing inward toward head (45 degrees)
        0                       // No roll
      ]}
      scale={[0.12, 0.12, 0.12]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/revolver.glb');
