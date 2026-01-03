import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { cloneAndFixMaterials } from '../../utils/modelUtils';

export function CashBowl() {
  const { scene } = useGLTF('/cash-bowl.glb');
  
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return cloneAndFixMaterials(scene);
  }, [scene]);

  if (!clonedScene) return null;
  
  const tableHeight = 1.2;
  
  return (
    <primitive 
      object={clonedScene} 
      position={[0.8, tableHeight, 0.3]} 
      scale={0.4}
      rotation={[0, -Math.PI / 6, 0]}
    />
  );
}

useGLTF.preload('/cash-bowl.glb');
