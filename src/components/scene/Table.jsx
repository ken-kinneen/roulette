import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

export function Table() {
  const { scene } = useGLTF('/table.glb');

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

  if (!clonedScene) return null;

  // Position the table model
  // Adjust scale and position to match the previous table dimensions
  return (
    <group 
      position={[0, 0, 0]} 
      rotation={[0, 0, 0]}
      scale={1}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/table.glb');


