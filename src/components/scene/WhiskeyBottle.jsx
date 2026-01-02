import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

export function WhiskeyBottle() {
  const { scene } = useGLTF('/src/assets/whiskey.glb');

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

  // Position on the table
  // Table height is approximately 1.2 (leg height) + 0.075 (half of table top height) = 1.275
  // Place bottle on top of the table, slightly off to the side
  return (
    <group 
      position={[
        -0.8,  // Left side of table
        1.65,  // On top of table
        0      // Center depth
      ]}
      rotation={[0, 0, 0]}
      scale={[0.3, 0.3, 0.3]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/src/assets/whiskey.glb');

