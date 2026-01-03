export function Lighting() {
  return (
    <>
      {/* Ambient light - warm bunker glow */}
      <ambientLight intensity={15} color="#3d2d1f" />

      {/* Main pendant light - center over table */}
      <pointLight
        position={[0, 4.3, 0]}
        intensity={20}
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

  
      {/* Hemisphere light for color variation */}
      <hemisphereLight
        args={['#332211', '#554433', 0.6]}
        position={[0, 4, 0]}
      />

   
    </>
  );
}
