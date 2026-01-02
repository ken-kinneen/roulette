import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

export function StainedGlassLamp() {
  const { scene } = useGLTF('/src/assets/models/Meshy_AI_Stained_Glass_Radianc_0102170236_texture.glb');

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

  // Position on the table - center back
  // Table height is approximately 1.2 (leg height)
  const tableHeight = 1.2;

  return (
    <group 
      position={[
        0.8,           // Center of table
        tableHeight, // On top of table
        -0.2         // Slightly back from center
      ]}
      rotation={[0, 0, 0]}
      scale={1.1}
    >
      <primitive object={clonedScene} />
      
      {/* Add point light to simulate lamp glow */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={10}
        distance={3}
        color="orange" 
      />
    </group>
  );
}

// Preload the model
useGLTF.preload('/src/assets/models/Meshy_AI_Stained_Glass_Radianc_0102170236_texture.glb');

