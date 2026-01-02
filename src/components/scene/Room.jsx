import { useRef } from 'react';

export function Room() {
  const roomSize = { width: 12, height: 8, depth: 12 };

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
        <meshStandardMaterial color="#2a2520" roughness={0.9} />
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


