import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { cloneAndFixMaterials } from '../../utils/modelUtils';

export function Table() {
  const { scene } = useGLTF('/table2.glb');

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return cloneAndFixMaterials(scene);
  }, [scene]);

  if (!clonedScene) return null;

  return (
    <group position={[0, 0, 0]} rotation={[0, 0, 0]} scale={1}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/table2.glb');
