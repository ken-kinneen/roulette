import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Text, Billboard } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { Chair } from './Chair';

export function Character({ position, rotation = [0, 0, 0], isPlayer = false, isAI = false }) {
  const groupRef = useRef();
  const gunGroupRef = useRef();
  
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const triggerSequencePhase = useGameStore((state) => state.triggerSequencePhase);
  const triggerSequenceShooter = useGameStore((state) => state.triggerSequenceShooter);
  const gameMode = useGameStore((state) => state.gameMode);
  const isHost = useGameStore((state) => state.isHost);
  const playerName = useGameStore((state) => state.playerName);
  const opponentName = useGameStore((state) => state.opponentName);

  // Determine the display name and color for this character
  // Red = player/host (you), Blue = opponent/AI
  const { displayName, nameColor } = useMemo(() => {
    if (gameMode === 'solo') {
      // Solo mode: player is red, AI (Vlad) is blue
      if (isPlayer) {
        return { displayName: playerName || 'You', nameColor: '#ff6b5b' }; // Bright red
      }
      return { displayName: 'Vlad', nameColor: '#6ab0ff' }; // Bright blue
    }
    // PvP mode
    if (isHost) {
      // Host perspective: I am player (red), opponent is AI character (blue)
      if (isPlayer) {
        return { displayName: playerName || 'You', nameColor: '#ff6b5b' }; // Bright red
      }
      return { displayName: opponentName || 'Opponent', nameColor: '#6ab0ff' }; // Bright blue
    } else {
      // Guest perspective: I am AI character (but I see myself as red), host is player (blue from my view)
      if (isPlayer) {
        // This is the host's character - blue from guest's perspective
        return { displayName: opponentName || 'Opponent', nameColor: '#6ab0ff' }; // Bright blue
      }
      // This is me (guest) - red from my perspective
      return { displayName: playerName || 'You', nameColor: '#ff6b5b' }; // Bright red
    }
  }, [gameMode, isHost, isPlayer, playerName, opponentName]);
  
  // Load different models based on whether this is player or AI
  const characterModelPath = isPlayer ? '/solider/Meshy_AI_Character_output.glb' : '/russian/character.glb';
  const animationsModelPath = isPlayer ? '/solider/Meshy_AI_Meshy_Merged_Animations.glb' : '/russian/animations.glb';
  
  // Load the character model, animations, and gun
  const { scene } = useGLTF(characterModelPath);
  const { animations } = useGLTF(animationsModelPath);
  const gunGltf = useGLTF('/revolver.glb');
  
  // Clone the gun scene
  const gunScene = useMemo(() => {
    if (!gunGltf.scene) return null;
    const clone = gunGltf.scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [gunGltf.scene]);

  // Clone the scene using SkeletonUtils for proper skinned mesh cloning
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    
    const clone = SkeletonUtils.clone(scene);
    
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material) {
          const fixMaterial = (mat) => {
            const newMat = mat.clone();
            newMat.roughness = Math.max(newMat.roughness || 0.5, 0.7);
            newMat.metalness = Math.min(newMat.metalness || 0, 0.1);
            newMat.transparent = false;
            newMat.alphaTest = 0.5;
            newMat.depthWrite = true;
            newMat.depthTest = true;
            newMat.side = THREE.FrontSide;
            return newMat;
          };
          
          if (Array.isArray(child.material)) {
            child.material = child.material.map(fixMaterial);
          } else {
            child.material = fixMaterial(child.material);
          }
        }
      }
    });
    
    return clone;
  }, [scene]);

  // Use animations with the cloned scene directly
  const { actions, mixer } = useAnimations(animations, clonedScene);

  // Animation state
  const deathProgress = useRef(0);
  const breathOffset = useMemo(() => (isPlayer ? 0 : Math.PI), [isPlayer]);
  const currentAnimation = useRef(null);
  const hasInitialized = useRef(false);
  const rootBoneRef = useRef(null);
  const rootBoneOriginalPosition = useRef(null);

  // Find and store the root bone position to prevent animation offset
  useEffect(() => {
    if (!clonedScene) return;
    
    clonedScene.traverse((child) => {
      if (child.isBone && !rootBoneRef.current) {
        // Find the root bone (typically named "Hips", "Root", "Pelvis", or similar)
        const boneName = child.name.toLowerCase();
        if (boneName.includes('hips') || boneName.includes('root') || boneName.includes('pelvis') || child.parent?.type !== 'Bone') {
          rootBoneRef.current = child;
          rootBoneOriginalPosition.current = child.position.clone();
        }
      }
    });
  }, [clonedScene]);

  // Determine if this character is currently holding the gun
  const isMyTurn = (isPlayer && currentTurn === 'player') || (isAI && currentTurn === 'ai');
  const isInTriggerSequence = triggerSequencePhase !== null && triggerSequenceShooter === (isPlayer ? 'player' : 'ai');
  
  // Show gun when it's this character's turn during gameplay
  const gunVisible = isMyTurn && (
    gamePhase === 'playing' || 
    gamePhase === 'cardGame' || 
    gamePhase === 'triggerSequence' ||
    isInTriggerSequence
  );

  // Death states
  const isDead = (isPlayer && (gamePhase === 'playerDead' || gamePhase === 'gameOver')) ||
                 (isAI && gamePhase === 'aiDead');

  // Determine target animation name
  const targetAnimation = useMemo(() => {
    if (isDead) {
      return "DeathTrimmed";
    }
    return "Chair_Sit_Idle_M";
  }, [isDead]);

  // Play appropriate animations based on game state
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    
    // Find the best matching animation
    let animationName = targetAnimation;
    if (!actions[animationName]) {
      // Fallback: try to find any idle or sitting animation
      const availableAnims = Object.keys(actions);
      const idleAnim = availableAnims.find(name => 
        name.toLowerCase().includes('idle') || 
        name.toLowerCase().includes('sit')
      );
      animationName = idleAnim || availableAnims[0];
    }
    
    // Skip if already playing this animation
    if (currentAnimation.current === animationName && hasInitialized.current) {
      const action = actions[animationName];
      if (action && action.isRunning()) {
        return;
      }
    }
  
    if (animationName && actions[animationName]) {
      // Stop all other animations
      Object.entries(actions).forEach(([name, action]) => {
        if (name !== animationName && action.isRunning()) {
          action.fadeOut(0.2);
        }
      });

      const action = actions[animationName];
      
      if (isDead) {
        action.setLoop(THREE.LoopOnce, 1);
        // Use method to set clamp behavior
        action.setEffectiveTimeScale(1);
      } else {
        action.setLoop(THREE.LoopRepeat);
      }
      
      action.reset().fadeIn(0.2).play();
      currentAnimation.current = animationName;
      hasInitialized.current = true;
    }

  }, [actions, targetAnimation, isDead]);

  // Ensure animation keeps playing - prevent T-pose on re-renders
  useEffect(() => {
    if (!mixer || !actions || Object.keys(actions).length === 0) return;
    
    // Check periodically if animation is still running
    const checkInterval = setInterval(() => {
      if (!isDead && currentAnimation.current && actions[currentAnimation.current]) {
        const action = actions[currentAnimation.current];
        if (!action.isRunning()) {
          action.reset().play();
        }
      }
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, [mixer, actions, isDead]);

  // Get world position for muzzle flash and effects
  const getMuzzleWorldPosition = useCallback(() => {
    if (!gunGroupRef.current) return new THREE.Vector3();
    const worldPos = new THREE.Vector3();
    gunGroupRef.current.getWorldPosition(worldPos);
    return worldPos;
  }, []);

  // Export muzzle position for effects
  useEffect(() => {
    if (isMyTurn && gunGroupRef.current) {
      window.__muzzlePosition = getMuzzleWorldPosition;
    }
  }, [isMyTurn, getMuzzleWorldPosition]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Lock root bone position to prevent animation offset
    if (rootBoneRef.current && rootBoneOriginalPosition.current && !isDead) {
      rootBoneRef.current.position.copy(rootBoneOriginalPosition.current);
    }

    // Add gun shake during tense moments
    if (gunGroupRef.current && gunVisible) {
      // Subtle shake during trigger sequence
      if (isInTriggerSequence && triggerSequencePhase !== 'result') {
        const shakeAmount = 0.005;
        gunGroupRef.current.position.x += (Math.random() - 0.5) * shakeAmount;
        gunGroupRef.current.position.y += (Math.random() - 0.5) * shakeAmount;
      }
      
      // Recoil on shot
      if (triggerSequencePhase === 'result' && isDead) {
        const recoilTime = state.clock.elapsedTime * 20;
        const recoilDecay = Math.exp(-recoilTime * 0.1);
        gunGroupRef.current.rotation.z += Math.sin(recoilTime) * 0.15 * recoilDecay;
      }
    }

    if (isDead) {
      deathProgress.current = Math.min(deathProgress.current + delta * 2, 1);
      const t = deathProgress.current;
      const easeOut = 1 - Math.pow(1 - t, 3);

      const fallRotationX = isPlayer ? 0.3 : -0.3;
      const fallRotationZ = isPlayer ? 0.2 : -0.2;
      const fallY = -0.3;

      groupRef.current.rotation.x = fallRotationX * easeOut;
      groupRef.current.rotation.z = fallRotationZ * easeOut;
      groupRef.current.position.y = position[1] + fallY * easeOut;
    } else {
      deathProgress.current = 0;
      
      const breathe = Math.sin(state.clock.elapsedTime * 1.5 + breathOffset) * 0.01;
      groupRef.current.position.y = position[1] + breathe;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;
    }
  });

  if (!clonedScene) return null;

  // Gun position at the side of the head, pointing at temple
  // Position gun at temple height - slightly to the side of the head
  const gunPosition = isPlayer 
    ? [0.18, 1.12, 0.1]    // Right side of player's head, at temple height
    : [-0.18, 1.12, -0.1];  // Left side of AI's head
  
  // Rotation: gun barrel pointing at the temple
  const gunRotation = isPlayer
    ? [Math.PI, 0, Math.PI]  // Barrel pointing at left temple
    : [-Math.PI , 0, -Math.PI  ];  // Barrel pointing at right temple

  // Check if we should show the name label (during active gameplay)
  const showNameLabel = gamePhase !== 'start' && gamePhase !== 'lobby';

  return (
    <group ref={groupRef} position={position} scale={1.5} rotation={rotation}>
      {/* Floating name label above head - billboards to always face camera */}
      {showNameLabel && displayName && (
        <Billboard position={[0, 1.4, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={0.065}
            color={nameColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.005}
            outlineColor="#0a0806"
            letterSpacing={0.04}
          >
            {displayName.toUpperCase()}
          </Text>
        </Billboard>
      )}

      {/* Character model - positioned to sit on chair seat level */}
      <group
        position={isPlayer ? [0.03, -0.10, -0.0] : [0.02, 0.1, 0]}
        scale={isPlayer ? 0.8 : 0.8}
      >
        <primitive object={clonedScene} />
      </group>

      {/* Gun positioned at the side of the head */}
      {gunScene && gunVisible && !isDead && (
        <group 
          ref={gunGroupRef} 
          position={gunPosition}
          rotation={gunRotation}
          scale={0.10}
        >
          <primitive object={gunScene} />
        </group>
      )}

      {/* Chair - using the new GLB model */}
      <Chair position={[0, 0, 0]} scale={0.6} />
    </group>
  );
}

// Preload the models
useGLTF.preload('/russian/character.glb');
useGLTF.preload('/russian/animations.glb');
useGLTF.preload('/solider/Meshy_AI_Character_output.glb');
useGLTF.preload('/solider/Meshy_AI_Meshy_Merged_Animations.glb');
useGLTF.preload('/revolver.glb');
