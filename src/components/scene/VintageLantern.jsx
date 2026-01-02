import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { cloneWithSharedMaterials } from '../../utils/modelUtils';

// Global material cache for all lantern instances
const lanternMaterialCache = new Map();

export function VintageLantern({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/Meshy_AI_Vintage_Lantern_Sconc_0102170712_texture.glb');

  // Clone with shared materials to reduce texture units
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = cloneWithSharedMaterials(scene, lanternMaterialCache);
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

  return (
    <group 
      position={position}
      rotation={rotation}
      scale={5}
    >
      <primitive object={clonedScene} />
      
      {/* Add point light to simulate lantern glow */}
      <pointLight
        position={[0, 0, 0.2]}
        intensity={10}
        distance={4}
        color="#ffaa66"
        castShadow
      />
    </group>
  );
}

// Preload the model
useGLTF.preload('/Meshy_AI_Vintage_Lantern_Sconc_0102170712_texture.glb');

