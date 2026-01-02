import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { Chair } from './Chair';

// Global material cache for all character instances
const characterMaterialCache = new Map();

export function Character({ position, rotation = [0, 0, 0], isPlayer = false, isAI = false }) {
  const groupRef = useRef();
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);

  // Load the character model and animations
  const { scene } = useGLTF('/russian/character.glb');
  const { animations } = useGLTF('/russian/animations.glb');
  
  // Clone the scene using SkeletonUtils for proper skinned mesh cloning
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    
    // Use SkeletonUtils.clone for proper cloning of animated models with skeletons
    const clone = SkeletonUtils.clone(scene);
    
    // Share materials between character instances to reduce texture units
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Share materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(mat => {
              const cacheKey = mat.uuid;
              if (!characterMaterialCache.has(cacheKey)) {
                characterMaterialCache.set(cacheKey, mat);
              }
              return characterMaterialCache.get(cacheKey);
            });
          } else {
            const cacheKey = child.material.uuid;
            if (!characterMaterialCache.has(cacheKey)) {
              characterMaterialCache.set(cacheKey, child.material);
            }
            child.material = characterMaterialCache.get(cacheKey);
          }
        }
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
    console.log("🚀 ~ Character ~ actions:", actions);
    if (!actions || Object.keys(actions).length === 0) return;


    const sitAndWait = "Running";
    const running = "Chair_Sit_Idle_M";
    const sitAndDoze = "Sit_Cross_Legged"; 
    // Determine which animation to play
    let animationName = running
    
     console.log("🚀 ~ Character ~ isDead:", isDead);
     if (isDead) {
      // Look for death/die animation - or use doze off as fallback
      animationName = sitAndWait
    } 
  
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

      currentAnimation.current = animationName;
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
    <group ref={groupRef} position={position} scale={1.5} rotation={rotation}>
      {/* Character model - positioned to sit on chair seat level */}
      <group position={[0, 0.2, 0.1]} scale={0.8}>
        <primitive object={clonedScene} />
      </group>

      {/* Chair - using the new GLB model */}
      <Chair position={[0, 0, 0]} scale={0.6} />
    </group>
  );
}

// Preload the models
useGLTF.preload('/russian/character.glb');
useGLTF.preload('/russian/animations.glb');
