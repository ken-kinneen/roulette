import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import { playMusic } from '../../utils/music';
import './StartScreen.css';

function RevolverModel({ mousePosition }) {
  const groupRef = useRef();
  const { scene } = useGLTF('/revolver.glb');
  
  // Quaternions for smooth interpolation
  const targetQuaternion = useRef(new THREE.Quaternion());
  const currentQuaternion = useRef(new THREE.Quaternion());

  // Clone and prepare the scene
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Point revolver directly at mouse position in 3D space
  useFrame((state) => {
    if (groupRef.current) {
      // Get camera info for proper 3D projection
      const camera = state.camera;
      
      // Calculate target point in 3D space where mouse is pointing
      // Project mouse position onto a plane in front of the camera
      const targetDistance = 15; // Distance from gun to target plane
      const fovRad = (camera.fov * Math.PI) / 180;
      const planeHeight = 2 * Math.tan(fovRad / 2) * targetDistance;
      const planeWidth = planeHeight * camera.aspect;
      
      // Convert normalized mouse position to world coordinates (inverted to point AT mouse)
      const targetX = -mousePosition.x * (planeWidth / 2) * 1.5;
      const targetY = mousePosition.y * (planeHeight / 2) * 1.5;
      const targetZ = -targetDistance; // In front of the gun (gun points along -Z)
      
      // Create target point vector
      const targetPoint = new THREE.Vector3(targetX, targetY, targetZ);
      const gunPosition = new THREE.Vector3(0, 0, 0);
      
      // Create a rotation that points the gun barrel toward the target
      // The gun model's barrel points along the positive X axis, so we need to adjust
      const up = new THREE.Vector3(0, 1, 0);
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.lookAt(gunPosition, targetPoint, up);
      
      // Apply offset rotation since gun barrel points along +X not -Z
      const offsetQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, -Math.PI / 2, 0)
      );
      
      targetQuaternion.current.setFromRotationMatrix(rotationMatrix);
      targetQuaternion.current.multiply(offsetQuaternion);
      
      // Smooth interpolation using quaternion slerp
      currentQuaternion.current.slerp(targetQuaternion.current, 0.12);
      
      // Apply rotation
      groupRef.current.quaternion.copy(currentQuaternion.current);
    }
  });

  if (!clonedScene) return null;

  return (
    <group ref={groupRef} scale={[6, 6, 6]}>
      <primitive object={clonedScene} />
      {/* Red glow behind the revolver */}
      <pointLight 
        position={[0, 0, -5]} 
        color="#c45c45" 
        intensity={8} 
        distance={15}
      />
      {/* Additional front lighting to brighten the revolver */}
      <pointLight 
        position={[0, 0, 3]} 
        color="#ffffff" 
        intensity={45} 
        distance={10}
      />
      {/* Side lights for better definition */}
      <pointLight 
        position={[3, 1, 0]} 
        color="#d4c4a8" 
        intensity={4} 
        distance={8}
      />
      <pointLight 
        position={[-3, 1, 0]} 
        color="#d4c4a8" 
        intensity={4} 
        distance={8}
      />
    </group>
  );
}

export function StartScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const enterLobby = useGameStore((state) => state.enterLobby);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Normalize mouse position to -1 to 1 range relative to container center
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    
    setMousePosition({ x, y });
  }, []);

  const handleStart = () => {
    playMusic(); // Start background music on user interaction
    // startAmbience(0.4); // Start ambient bunker sounds - DISABLED
    startGame();
  };

  const handleMultiplayer = () => {
    playMusic(); // Start background music on user interaction
    enterLobby();
  };

  if (gamePhase !== 'start') return null;

  return (
    <div className="start-screen" ref={containerRef} onMouseMove={handleMouseMove}>
      <div className="start-content">
        <h1 className="game-title">RUSSIAN</h1>
        <h1 className="game-title title-accent">ROULETTE</h1>
        
        <div className="revolver-icon">
          <Canvas 
            camera={{ position: [0, 0.2, 12], fov: 70, near: 0.1, far: 1000 }}
            gl={{ alpha: true }}
          >
            <ambientLight intensity={2.5} />
            <spotLight 
              position={[5, 5, 5]} 
              angle={0.5} 
              penumbra={1} 
              intensity={8}
              castShadow
            />
            <spotLight 
              position={[-5, 5, 5]} 
              angle={0.5} 
              penumbra={1} 
              intensity={6}
              castShadow
            />
            <pointLight position={[0, 5, 5]} intensity={5} color="#ffffff" />
            <pointLight position={[0, -3, 3]} intensity={3} color="#d4c4a8" />
            <RevolverModel mousePosition={mousePosition} />
          </Canvas>
        </div>

     
        <button className="start-button" onClick={handleStart}>
          <span className="button-text">VS VLAD</span>
          <span className="button-underline"></span>
        </button>

        <button className="start-button multiplayer-button" onClick={handleMultiplayer}>
          <span className="button-text">VS FRIEND</span>
          <span className="button-underline"></span>
        </button>
      
      </div>
    </div>
  );
}
