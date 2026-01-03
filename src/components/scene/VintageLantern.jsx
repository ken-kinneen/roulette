import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { cloneAndFixMaterials } from '../../utils/modelUtils';

export function VintageLantern({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const { scene } = useGLTF('/Meshy_AI_Vintage_Lantern_Sconc_0102170712_texture.glb');

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return cloneAndFixMaterials(scene);
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
        intensity={15}
        distance={4}
        color="#ff9944"
        castShadow
      />
    </group>
  );
}

useGLTF.preload('/Meshy_AI_Vintage_Lantern_Sconc_0102170712_texture.glb');
