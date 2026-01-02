export function Lighting() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.15} color="#a89080" />

      {/* Main overhead light - harsh single bulb effect */}
      <pointLight
        position={[0, 6, 0]}
        intensity={50}
        color="#ffddaa"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />

      {/* Subtle rim light from behind */}
      <pointLight
        position={[0, 3, -5]}
        intensity={10}
        color="#8899aa"
      />

      {/* Table reflection light */}
      <pointLight
        position={[0, 1.5, 0]}
        intensity={5}
        color="#ffeecc"
      />
    </>
  );
}

