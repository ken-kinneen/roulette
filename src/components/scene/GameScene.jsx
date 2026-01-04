import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { Room } from './Room';
import { Table } from './Table';
import { Character } from './Character';
import { Revolver } from './Revolver';
import { WhiskeyBottle } from './WhiskeyBottle';
import { Ashtray } from './Ashtray';
import { CashBowl } from './CashBowl';
import { StainedGlassLamp } from './StainedGlassLamp';
import { VintageLantern } from './VintageLantern';
import { Lighting } from './Lighting';
import { Ammo } from './Ammo';
import { Cards } from './Cards';
import { Sandbags } from './Sandbags';
import { Rifle } from './Rifle';
import { Dartboard } from './Dartboard';
import { WeaponCase } from './WeaponCase';
import { MuzzleFlash } from './MuzzleFlash';
import { BloodSplat } from './BloodSplat';
import { ScreenFlash } from './ScreenFlash';
import { useGameStore } from '../../stores/gameStore';
import * as THREE from 'three';

function CameraController() {
  const cameraRef = useRef();
  const controlsRef = useRef();
  const gamePhase = useGameStore((state) => state.gamePhase);
  const gameMode = useGameStore((state) => state.gameMode);
  const isHost = useGameStore((state) => state.isHost);
  const triggerSequencePhase = useGameStore((state) => state.triggerSequencePhase);
  const triggerSequenceShooter = useGameStore((state) => state.triggerSequenceShooter);
  
  const targetAngleRef = useRef(0); // 0 for player character, Math.PI for AI character
  const currentAngleRef = useRef(0);
  const previousShooterRef = useRef(null);
  const shouldResetRef = useRef(false);
  const userInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef(null);
  const hasSetInitialPosition = useRef(false);
  
  // Camera orbit parameters - adjusted for smaller room (8x5x8)
  const radius = 3.5; // Smaller radius for smaller room
  const height = 2.8; // Lower height
  const lookAtTarget = useMemo(() => new THREE.Vector3(0, 0.9, 0), []); // Look at table center
  
  // In PvP: host plays as 'player' character, guest plays as 'ai' character
  const isPvP = gameMode === 'pvp';
  const myRole = isPvP ? (isHost ? 'player' : 'ai') : 'player';
  const myAngle = myRole === 'player' ? 0 : Math.PI;
  
  // Set initial camera position based on role (guest starts behind Vlad)
  useEffect(() => {
    if (!cameraRef.current || hasSetInitialPosition.current) return;
    
    // Only set initial position when entering a game (not start/lobby)
    if (gamePhase !== 'cardGame' && gamePhase !== 'playing') return;
    
    const startAngle = myAngle;
    const x = Math.sin(startAngle) * radius;
    const z = Math.cos(startAngle) * radius;
    
    cameraRef.current.position.set(x, height, z);
    currentAngleRef.current = startAngle;
    targetAngleRef.current = startAngle;
    hasSetInitialPosition.current = true;
    
    if (controlsRef.current) {
      controlsRef.current.target.copy(lookAtTarget);
    }
  }, [gamePhase, myAngle, radius, height, lookAtTarget]);
  
  // Reset flag when going back to start
  useEffect(() => {
    if (gamePhase === 'start' || gamePhase === 'lobby') {
      hasSetInitialPosition.current = false;
    }
  }, [gamePhase]);
  
  // Lock camera to MY POV during MY trigger sequence (not opponent's)
  useEffect(() => {
    if (triggerSequencePhase !== null && triggerSequenceShooter !== null) {
      // Only lock camera if I'm the one shooting
      const isMyShot = triggerSequenceShooter === myRole;
      
      if (isMyShot) {
        // Lock camera behind ME when I'm shooting
        if (previousShooterRef.current !== triggerSequenceShooter) {
          shouldResetRef.current = true;
          userInteractingRef.current = false; // Override user control during MY sequence
          previousShooterRef.current = triggerSequenceShooter;
        }
        
        targetAngleRef.current = myAngle; // Lock to MY angle
      }
      // If opponent is shooting, don't lock camera - let user freely observe
    } else {
      previousShooterRef.current = null;
    }
  }, [triggerSequencePhase, triggerSequenceShooter, myRole, myAngle]);
  
  // Track user interaction with controls
  useEffect(() => {
    if (!controlsRef.current) return;
    
    const controls = controlsRef.current;
    
    const handleStart = () => {
      userInteractingRef.current = true;
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
    
    const handleEnd = () => {
      // Keep user interaction flag for a short time after they stop dragging
      interactionTimeoutRef.current = setTimeout(() => {
        userInteractingRef.current = false;
      }, 100);
    };
    
    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);
    
    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);
  
  useFrame((state, delta) => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    // During trigger sequence, check if it's MY turn
    const isTriggerSequence = gamePhase === 'triggerSequence';
    const isMyShot = isTriggerSequence && triggerSequenceShooter === myRole;
    
    // Only animate camera during active gameplay or MY trigger sequence
    if (gamePhase !== 'playing' && gamePhase !== 'shooting' && gamePhase !== 'cardGame' && !isMyShot) return;
    
    // During MY trigger sequence, override user control and lock to MY POV
    if (isMyShot) {
      userInteractingRef.current = false;
    }
    
    // Don't auto-move camera if user is interacting (except during MY trigger sequence)
    if (userInteractingRef.current && !isMyShot) return;
    
    // Calculate target position
    const targetX = Math.sin(targetAngleRef.current) * radius;
    const targetZ = Math.cos(targetAngleRef.current) * radius;
    
    // If we need to reset (shooter changed or turn changed), smoothly interpolate to target
    if (shouldResetRef.current) {
      // Smoothly interpolate the angle for circular motion around the table
      const angleDiff = targetAngleRef.current - currentAngleRef.current;
      
      // Handle wrapping for shortest path
      let shortestAngleDiff = angleDiff;
      if (Math.abs(angleDiff) > Math.PI) {
        shortestAngleDiff = angleDiff - Math.sign(angleDiff) * 2 * Math.PI;
      }
      
      // Faster rotation during MY trigger sequence for dramatic effect
      const rotationSpeed = isMyShot ? 3.0 : 1.5;
      currentAngleRef.current += shortestAngleDiff * delta * rotationSpeed;
      
      // Calculate camera position in a circle around the table
      const x = Math.sin(currentAngleRef.current) * radius;
      const z = Math.cos(currentAngleRef.current) * radius;
      
      cameraRef.current.position.set(x, height, z);
      controlsRef.current.target.copy(lookAtTarget);
      
      // Check if we're close enough to the target to stop resetting
      const distanceToTarget = Math.sqrt(
        Math.pow(x - targetX, 2) + 
        Math.pow(z - targetZ, 2)
      );
      
      if (distanceToTarget < 0.1) {
        shouldResetRef.current = false;
        currentAngleRef.current = targetAngleRef.current;
      }
    } else {
      // Update current angle to match camera position when user is done interacting
      const currentX = cameraRef.current.position.x;
      const currentZ = cameraRef.current.position.z;
      currentAngleRef.current = Math.atan2(currentX, currentZ);
    }
  });
  
  // Calculate initial camera position based on role
  // Guest starts behind Vlad (angle = Math.PI)
  const initialX = Math.sin(myAngle) * radius;
  const initialZ = Math.cos(myAngle) * radius;
  
  return (
    <>
      <PerspectiveCamera 
        ref={cameraRef}
        makeDefault 
        position={[initialX, height, initialZ]} 
        fov={58} 
        near={0.1}
      />
      <OrbitControls 
        ref={controlsRef}
        target={[0, 0.9, 0]}
        enableDamping
        dampingFactor={0.05}
        minDistance={2.5}
        maxDistance={4}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.3}
        enablePan={false}
      />
    </>
  );
}

export function GameScene() {
  return (
    <Canvas shadows style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <CameraController />
      
      {/* Atmospheric fog for smaller bunker */}
      <fog attach="fog" args={['rgb(61, 31, 2)', 2, 15]} />
      <color attach="background" args={['#0a0806']} />
       <Lighting />
      <Room />
      <Table />
      <WhiskeyBottle />
      <Ashtray scale={4} /> 
      
      {/* Ammo box on table */}
      <Ammo position={[-0.5, 1.16, -0]} rotation={[0, 0.6, 0]} scale={0.8} />
      
      {/* Cards scattered on table */}
      <Cards position={[0,  1.16, -0]} rotation={[0, Math.PI/2, 0]} scale={0.9} />
      
      {/* Stained Glass Lamp on table */}
      <StainedGlassLamp />
      
      {/* Sandbags in corner - scaled for smaller room */}
      <Sandbags position={[-3.3, 0, -4.6]} rotation={[0, 0, 0]} scale={1.4} />
      <Sandbags position={[3.3, 0, -4.6]} rotation={[0, 0, 0]} scale={1.4} />

        {/* Sandbags in corner - scaled for smaller room */}
      <Sandbags position={[-3.6, 0, 6]} rotation={[0, 0, 0]} scale={1.4} />
      <Sandbags position={[3.6, 0, 6]} rotation={[0, 0, 0]} scale={1.4} />

      {/* Rifles leaning against sandbags */}
      <Rifle position={[-1.15, 0.7, 0.1]} rotation={[0.15, Math.PI ,  -Math.PI/2]} scale={2} />
      <Rifle position={[-1.15, 0.7, -0.10]} rotation={[0.15, Math.PI ,  -Math.PI/2]} scale={2} />
      
      {/* Dartboard on wall */}
      <Dartboard position={[5.1, 2.3, 0]} rotation={[-Math.PI,   0, Math.PI/2]} scale={0.6} />
      
      {/* Weapon case on floor */}
      <WeaponCase position={[-3.5, 0.15, -3.5]} rotation={[0, Math.PI / 4, 0]} scale={1} />
      
      {/* Vintage Lantern - one on back wall */}
      <VintageLantern position={[-5, 2, -5]} rotation={[0, Math.PI / 4, 0]} />
      <VintageLantern position={[ 4, 2, -5]} rotation={[0, Math.PI / 4, 0]} />

      {/* Vintage Lantern - one on back wall */}
      <VintageLantern position={[-5, 2, 5]} rotation={[0, -Math.PI / 2, 0]} />
      <VintageLantern position={[ 4, 2, 5]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Player (you) - facing the table from the front */}
      <Character position={[0, 0, 1 ]} rotation={[0, Math.PI, 0]} isPlayer />

      {/* AI opponent - facing the table from the back */}
      <Character position={[0, 0, -1 ]} rotation={[0, 0, 0]} isAI />

      {/* Revolver held by current player */}
      <Revolver />

      {/* Effects */}
      <MuzzleFlash />
      <BloodSplat />
      <ScreenFlash />
    </Canvas>
  );
}
