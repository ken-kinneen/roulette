import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

export function Character({ position, rotation = [0, 0, 0], isPlayer = false, isAI = false }) {
  const groupRef = useRef();
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);

  // Load the character model and animations
  const { scene } = useGLTF('/src/assets/models/russian/Meshy_AI_Character_output.glb');
  const { animations } = useGLTF('/src/assets/models/russian/Meshy_AI_Meshy_Merged_Animations.glb');
  
  // Clone the scene using SkeletonUtils for proper skinned mesh cloning
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    
    // Use SkeletonUtils.clone for proper cloning of animated models with skeletons
    const clone = SkeletonUtils.clone(scene);
    
    // Enable shadows
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    return clone;
  }, [scene]);

  // Use animations with the cloned scene directly (not a wrapper group)
  const { actions } = useAnimations(animations, clonedScene);

  // Death states
  const isDead = (isPlayer && (gamePhase === 'playerDead' || gamePhase === 'gameOver')) ||
                 (isAI && gamePhase === 'aiDead');

  const isHoldingGun = (isPlayer && currentTurn === 'player' && gamePhase === 'playing') || 
                       (isAI && currentTurn === 'ai' && gamePhase === 'playing');

  // Animation state
  const deathProgress = useRef(0);
  const breathOffset = useMemo(() => (isPlayer ? 0 : Math.PI), [isPlayer]);
  const currentAnimation = useRef(null);

  // Play appropriate animations based on game state
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      console.log('No actions available yet');
      return;
    }

    console.log('Available animations:', Object.keys(actions));
    console.log('Game state - isDead:', isDead, 'isHoldingGun:', isHoldingGun, 'gamePhase:', gamePhase, 'currentTurn:', currentTurn);

    // Determine which animation to play
    let animationName = null;
    
    if (isDead) {
      // Look for death/die animation - or use doze off as fallback
      animationName = Object.keys(actions).find(key => 
        key.toLowerCase().includes('death') || 
        key.toLowerCase().includes('die') ||
        key.toLowerCase().includes('dead')
      ) || 'Sit_and_Doze_Off';
    } else if (isHoldingGun) {
      // Use sitting answering questions for holding gun state
      animationName ="Sit_Cross_Legged";
    } else {
      // Use Chair_Sit_Idle_M for idle sitting
      animationName = "Sit_Cross_Legged";
    }

    console.log('Selected animation:', animationName, 'Current animation:', currentAnimation.current);

    // If we found an animation and it's different from current, play it
    if (animationName && actions[animationName]) {
      // Stop ALL animations first
      Object.values(actions).forEach(action => {
        if (action.isRunning()) {
          action.stop();
        }
      });

      // Play the new animation
      const action = actions[animationName];
      
      // Configure and play animation
      if (isDead) {
        action.setLoop(THREE.LoopOnce, 1);
      } else {
        action.setLoop(THREE.LoopRepeat);
      }
      
      action.reset().play();
      
      console.log('✅ Playing animation:', animationName);

      currentAnimation.current = animationName;
    } else {
      console.log('⚠️ Animation not found:', animationName);
    }

  }, [actions, isDead, isHoldingGun, gamePhase, currentTurn]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isDead) {
      // Death animation - fall forward/backward and to the side
      deathProgress.current = Math.min(deathProgress.current + delta * 2, 1);
      const t = deathProgress.current;
      const easeOut = 1 - Math.pow(1 - t, 3);

      // Fall direction based on which character
      const fallRotationX = isPlayer ? 0.3 : -0.3;
      const fallRotationZ = isPlayer ? 0.2 : -0.2;
      const fallY = -0.3;

      groupRef.current.rotation.x = fallRotationX * easeOut;
      groupRef.current.rotation.z = fallRotationZ * easeOut;
      groupRef.current.position.y = position[1] + fallY * easeOut;
    } else {
      // Reset death progress when not dead
      deathProgress.current = 0;
      
      // Subtle breathing animation
      const breathe = Math.sin(state.clock.elapsedTime * 1.5 + breathOffset) * 0.01;
      groupRef.current.position.y = position[1] + breathe;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;
    }
  });

  if (!clonedScene) return null;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Character model - positioned to sit on chair seat level */}
      <group position={[0, 0, 0]} scale={0.8}>
        <primitive object={clonedScene} />
      </group>

      {/* Chair back */}
      <mesh position={[0, 0.5, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.8, 0.1]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>

      {/* Chair seat */}
      <mesh position={[0, 0, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>

      {/* Chair legs */}
      <mesh position={[-0.2, -0.3, 0.15]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>
      <mesh position={[0.2, -0.3, 0.15]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>
      <mesh position={[-0.2, -0.3, -0.25]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>
      <mesh position={[0.2, -0.3, -0.25]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Preload the models
useGLTF.preload('/src/assets/models/russian/Meshy_AI_Character_output.glb');
useGLTF.preload('/src/assets/models/russian/Meshy_AI_Meshy_Merged_Animations.glb');
