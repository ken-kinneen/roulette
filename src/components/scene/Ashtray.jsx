import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { cloneAndFixMaterials } from '../../utils/modelUtils';

export function Ashtray({ scale = 1 }) {
  const { scene } = useGLTF('/ashtray.glb');
  
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return cloneAndFixMaterials(scene);
  }, [scene]);

  if (!clonedScene) return null;
  
  const tableHeight = 1.2;
  
  return (
    <primitive 
      object={clonedScene} 
      position={[-0.8, tableHeight, 0.3]} 
      scale={scale * 0.1}
      rotation={[0, Math.PI / 4, 0]}
    />
  );
}

useGLTF.preload('/ashtray.glb');
