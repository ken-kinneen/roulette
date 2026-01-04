import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { cloneAndFixMaterials } from '../../utils/modelUtils';

export function WhiskeyBottle() {
  const { scene } = useGLTF('/whiskey.glb');

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return cloneAndFixMaterials(scene);
  }, [scene]);

  if (!clonedScene) return null;

  return (
    <group 
      position={[-0.8, 1.49, 0]}
      rotation={[0, 0, 0]}
      scale={0.23}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/whiskey.glb');
