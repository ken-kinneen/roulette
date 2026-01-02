import { useGLTF } from '@react-three/drei';

export function Ashtray() {
  const { scene } = useGLTF('/ashtray.glb');
  
  // Position on the table - left side
  // Table height is approximately 1.275 (legHeight 1.2 + tableTop.height/2 0.075)
  const tableHeight = 1.275;
  
  return (
    <primitive 
      object={scene.clone()} 
      position={[-0.8, tableHeight + 0.05, 0.3]} 
      scale={0.5}
      rotation={[0, Math.PI / 4, 0]}
    />
  );
}

useGLTF.preload('/ashtray.glb');

