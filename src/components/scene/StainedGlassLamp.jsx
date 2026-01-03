import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { cloneAndFixMaterials } from '../../utils/modelUtils';

export function StainedGlassLamp() {
  const { scene } = useGLTF('/Meshy_AI_Stained_Glass_Radianc_0102170236_texture.glb');

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return cloneAndFixMaterials(scene);
  }, [scene]);

  if (!clonedScene) return null;

  const tableHeight = 1.2;

  return (
    <group 
      position={[0.8, tableHeight, -0.2]}
      rotation={[0, 0, 0]}
      scale={1.1}
    >
      <primitive object={clonedScene} />
      
      {/* Add point light to simulate lamp glow */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={3}
        distance={2}
        color="#ff9944" 
      />
    </group>
  );
}

useGLTF.preload('/Meshy_AI_Stained_Glass_Radianc_0102170236_texture.glb');
