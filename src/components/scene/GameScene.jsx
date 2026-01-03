import { useRef, useEffect } from 'react';
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
import { MuzzleFlash } from './MuzzleFlash';
import { BloodSplat } from './BloodSplat';
import { ScreenFlash } from './ScreenFlash';
import { CardTable } from './CardTable';
import { useGameStore } from '../../stores/gameStore';
import * as THREE from 'three';

function CameraController() {
  const cameraRef = useRef();
  const controlsRef = useRef();
  const currentTurn = useGameStore((state) => state.currentTurn);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const targetAngleRef = useRef(0); // 0 for player, Math.PI for AI
  const currentAngleRef = useRef(0);
  const previousTurnRef = useRef('player');
  const shouldResetRef = useRef(false);
  const userInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef(null);
  
  // Camera orbit parameters - higher and further back
  const radius = 5.5; // Distance from center
  const height = 3.5; // Height above table
  const lookAtTarget = new THREE.Vector3(0, 1, 0); // Look at table center
  
  // Detect when turn changes to trigger camera reset
  useEffect(() => {
    if (previousTurnRef.current !== currentTurn) {
      shouldResetRef.current = true;
      userInteractingRef.current = false;
      previousTurnRef.current = currentTurn;
    }
  }, [currentTurn]);
  
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
    
    // Only animate camera during active gameplay
    if (gamePhase !== 'playing' && gamePhase !== 'shooting') return;
    
    // Don't auto-move camera if user is interacting
    if (userInteractingRef.current) return;
    
    // Determine target angle based on current turn
    targetAngleRef.current = currentTurn === 'player' ? 0 : Math.PI;
    
    // Calculate target position
    const targetX = Math.sin(targetAngleRef.current) * radius;
    const targetZ = Math.cos(targetAngleRef.current) * radius;
    
    // If we need to reset (turn changed), smoothly interpolate to target
    if (shouldResetRef.current) {
      // Smoothly interpolate the angle for circular motion around the table
      const angleDiff = targetAngleRef.current - currentAngleRef.current;
      
      // Handle wrapping for shortest path
      let shortestAngleDiff = angleDiff;
      if (Math.abs(angleDiff) > Math.PI) {
        shortestAngleDiff = angleDiff - Math.sign(angleDiff) * 2 * Math.PI;
      }
      
      currentAngleRef.current += shortestAngleDiff * delta * 1.5; // Smooth rotation speed
      
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
  
  return (
    <>
      <PerspectiveCamera 
        ref={cameraRef}
        makeDefault 
        position={[0, 3.5, 5.5]} 
        fov={50} 
      />
      <OrbitControls 
        ref={controlsRef}
        target={[0, 1, 0]}
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        enablePan={false}
      />
    </>
  );
}

export function GameScene() {
  return (
    <Canvas shadows style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <CameraController />

 
      <Lighting />
      <Room />
      <Table />
      <WhiskeyBottle />
      <Ashtray scale={5} />
      <CashBowl />
      
      {/* Stained Glass Lamp on table */}
      <StainedGlassLamp />
      
      {/* Vintage Lanterns on walls */}
      <VintageLantern position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} />
      <VintageLantern position={[6.5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Player (you) - facing the table from the front */}
      <Character position={[0, 0, 1.2]} rotation={[0, Math.PI, 0]} isPlayer />

      {/* AI opponent - facing the table from the back */}
      <Character position={[0, 0, -1.2]} rotation={[0, 0, 0]} isAI />

      {/* Revolver held by current player */}
      <Revolver />

      {/* Card game on table */}
      <CardTable />

      {/* Effects */}
      <MuzzleFlash />
      <BloodSplat />
      <ScreenFlash />
    </Canvas>
  );
}
