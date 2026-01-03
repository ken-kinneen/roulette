import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { cloneAndFixMaterials } from '../../utils/modelUtils';

export function Chair({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const { scene } = useGLTF('/chair.glb');
  
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return cloneAndFixMaterials(scene);
  }, [scene]);

  if (!clonedScene) return null;

  return (
    <primitive 
      object={clonedScene} 
      position={position} 
      rotation={rotation} 
      scale={scale}
    />
  );
}

useGLTF.preload('/chair.glb');
