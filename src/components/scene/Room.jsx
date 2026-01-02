import { useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function Room() {
  const roomSize = { width: 12, height: 8, depth: 12 };

  // Load wood floor texture - using a darker, more worn texture
  const floorTexture = useTexture(
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_diffuse.jpg'
  );
  
  // Configure texture for rustic, weathered wood flooring
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(3, 3); // Larger planks for rustic look
  floorTexture.anisotropy = 16; // Better texture quality at angles

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
        <meshStandardMaterial 
          map={floorTexture}
          color="#3d2f1f" // Dark brown tint for stained, dirty oak
          roughness={0.95} // Very rough for weathered wood
          metalness={0.0} // No metallic shine
          envMapIntensity={0.3} // Reduced reflections
        />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, roomSize.height / 2, -roomSize.depth / 2]} receiveShadow>
        <planeGeometry args={[roomSize.width, roomSize.height]} />
        <meshStandardMaterial color="#3d3632" roughness={0.8} />
      </mesh>

      {/* Left Wall */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-roomSize.width / 2, roomSize.height / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomSize.depth, roomSize.height]} />
        <meshStandardMaterial color="#352f2b" roughness={0.8} />
      </mesh>

      {/* Right Wall */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[roomSize.width / 2, roomSize.height / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomSize.depth, roomSize.height]} />
        <meshStandardMaterial color="#352f2b" roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, roomSize.height, 0]}>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
        <meshStandardMaterial color="#1a1816" roughness={1} />
      </mesh>
    </group>
  );
}


