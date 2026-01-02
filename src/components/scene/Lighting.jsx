export function Lighting() {
  return (
    <>
      {/* Very dim ambient light - barely visible bunker */}
      <ambientLight intensity={5} color="#4a4540" />

      {/* Main overhead light - single bare bulb in cage */}
      <pointLight
        position={[0, 6.3, 0]}
        intensity={40}
        color="#ffcc88"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        decay={2}
        distance={12}
      />

      {/* Main overhead light - single bare bulb in cage */}
      <pointLight
        position={[0,2, 5]}
        intensity={30}
        color="#ffcc88"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        decay={2}
        distance={12}
      />

      {/* Subtle blue emergency light glow from back corner */}
      <pointLight
        position={[-5, 2, -6]}
        intensity={10}
        color="orange"
        distance={4}
        decay={3}
      />

      {/* Dim red indicator light on junction box */}
      <pointLight
        position={[-6.5, 6.5, 2]}
        intensity={0.5}
        color="#ff3322"
        distance={3}
      />

      {/* Subtle backlight from ventilation - very dim */}
      <pointLight
        position={[-4, 6, -6.8]}
        intensity={15}
        color="#667788"
        distance={4}
      />

      {/* Rim light from side - creates subtle depth */}
      <pointLight
        position={[6, 3, -3]}
        intensity={3}
        color="#554433"
        distance={8}
        decay={2}
      />

      {/* Subtle fill light under table area */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={1}
        color="#886644"
        distance={5}
      />
    </>
  );
}


