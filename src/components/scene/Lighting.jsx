export function Lighting() {
  return (
    <>
      {/* Ambient light - warm bunker glow */}
      <ambientLight intensity={2} color="#3d2d1f" />

      {/* Main pendant light - center over table */}
      <pointLight
        position={[0, 4.3, 0]}
        intensity={50}
        color="#ffaa66"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        decay={2}
        distance={8}
      />

      {/* Lantern/lamp glow on table */}
      <pointLight
        position={[0.8, 1.5, -0.2]}
        intensity={5}
        color="#ff9944"
        distance={4}
        decay={2}
      />

      {/* Warm fill from floor area */}
      <pointLight
        position={[0, 0.3, 0]}
        intensity={5}
        color="#553322"
        distance={4}
        decay={2}
      />

      {/* Left corner accent */}
      <pointLight
        position={[-3, 1.5, -2.5]}
        intensity={15}
        color="#ff9955"
        distance={4}
        decay={2}
      />

      {/* Right corner accent */}
      <pointLight
        position={[3, 1.5, -2.5]}
        intensity={15}
        color="#ff9955"
        distance={4}
        decay={2}
      />

      {/* Hemisphere light for color variation */}
      <hemisphereLight
        args={['#332211', '#554433', 0.6]}
        position={[0, 4, 0]}
      />

      {/* Main spotlight on table */}
      <spotLight
        position={[0, 4, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={40}
        color="#ffbb77"
        castShadow
        shadow-mapSize={[1024, 1024]}
        target-position={[0, 0.9, 0]}
        decay={2}
        distance={6}
      />
    </>
  );
}
