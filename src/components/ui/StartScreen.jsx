import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';
import { playMusic } from '../../utils/music';
import './StartScreen.css';

function RevolverModel() {
  const groupRef = useRef();
  const { scene } = useGLTF('/revolver.glb');

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

  // Rotate the revolver slowly
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  if (!clonedScene) return null;

  return (
    <group ref={groupRef} rotation={[0.2, 0, 0]} scale={[4, 4, 4]}>
      <primitive object={clonedScene} />
      {/* Red glow behind the revolver */}
      <pointLight 
        position={[0, 0, -2]} 
        color="#c45c45" 
        intensity={3} 
        distance={10}
      />
    </group>
  );
}

export function StartScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const gamePhase = useGameStore((state) => state.gamePhase);

  const handleStart = () => {
    playMusic(); // Start background music on user interaction
    startGame();
  };

  if (gamePhase !== 'start') return null;

  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="game-title">RUSSIAN</h1>
        <h1 className="game-title title-accent">ROULETTE</h1>
        
        <div className="revolver-icon">
          <Canvas 
            camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 1000 }}
            gl={{ alpha: true }}
          >
            <ambientLight intensity={1.2} />
            <spotLight 
              position={[5, 5, 5]} 
              angle={0.5} 
              penumbra={1} 
              intensity={3}
              castShadow
            />
            <pointLight position={[-5, 5, 5]} intensity={1.5} />
            <pointLight position={[0, -3, 3]} intensity={1} />
            <RevolverModel />
          </Canvas>
        </div>

        <p className="instructions">
          One bullet. Six chambers. Take turns pulling the trigger.
          <br />
          Survive to advance. Each level grants an extra life.
        </p>

        <button className="start-button" onClick={handleStart}>
          <span className="button-text">PULL THE TRIGGER</span>
          <span className="button-underline"></span>
        </button>

        <div className="controls-hint">
          <span>DRAG TO LOOK AROUND</span>
        </div>
      </div>
    </div>
  );
}
