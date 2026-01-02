import { useGLTF } from '@react-three/drei';

export function CashBowl() {
  const { scene } = useGLTF('/cash-bowl.glb');
  
  // Position on the table - right side
  // Table height is approximately 1.275 (legHeight 1.2 + tableTop.height/2 0.075)
  const tableHeight = 1.2;
  
  return (
    <primitive 
      object={scene.clone()} 
      position={[0.8, tableHeight , 0.3]} 
      scale={0.4}
      rotation={[0, -Math.PI / 6, 0]}
    />
  );
}

useGLTF.preload('/cash-bowl.glb');

