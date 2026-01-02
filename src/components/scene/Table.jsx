export function Table() {
  const tableTop = { width: 3, height: 0.15, depth: 2 };
  const legHeight = 1.2;
  const legRadius = 0.08;
  const tableHeight = legHeight + tableTop.height / 2;

  const legPositions = [
    [-tableTop.width / 2 + 0.2, legHeight / 2, -tableTop.depth / 2 + 0.2],
    [tableTop.width / 2 - 0.2, legHeight / 2, -tableTop.depth / 2 + 0.2],
    [-tableTop.width / 2 + 0.2, legHeight / 2, tableTop.depth / 2 - 0.2],
    [tableTop.width / 2 - 0.2, legHeight / 2, tableTop.depth / 2 - 0.2],
  ];

  return (
    <group position={[0, 0, 0]}>
      {/* Table Top */}
      <mesh position={[0, tableHeight, 0]} castShadow receiveShadow>
        <boxGeometry args={[tableTop.width, tableTop.height, tableTop.depth]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.6} />
      </mesh>

      {/* Table Legs */}
      {legPositions.map((pos, index) => (
        <mesh key={index} position={pos} castShadow>
          <cylinderGeometry args={[legRadius, legRadius, legHeight, 8]} />
          <meshStandardMaterial color="#4a3225" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

