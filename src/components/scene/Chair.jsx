import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { cloneWithSharedMaterials } from '../../utils/modelUtils';

// Global material cache for all chair instances
const chairMaterialCache = new Map();

export function Chair({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF('/chair.glb');
  
  // Clone the scene with shared materials to reduce texture units
  const clonedScene = useMemo(() => {
    const clone = cloneWithSharedMaterials(scene, chairMaterialCache);
    
    // Enable shadows on the cloned model
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    return clone;
  }, [scene]);

  return (
    <primitive 
      object={clonedScene} 
      position={position} 
      rotation={rotation} 
      scale={scale}
    />
  );
}

// Preload the model
useGLTF.preload('/chair.glb');

