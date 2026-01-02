import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Room } from './Room';
import { Table } from './Table';
import { Character } from './Character';
import { Revolver } from './Revolver';
import { Lighting } from './Lighting';
import { MuzzleFlash } from './MuzzleFlash';
import { BloodSplat } from './BloodSplat';
import { ScreenFlash } from './ScreenFlash';

export function GameScene() {
  return (
    <Canvas shadows style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <PerspectiveCamera makeDefault position={[0, 2.5, 4]} fov={50} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.2}
        minAzimuthAngle={-Math.PI / 6}
        maxAzimuthAngle={Math.PI / 6}
      />

      <color attach="background" args={['#0a0908']} />
      <fog attach="fog" args={['#0a0908', 5, 15]} />

      <Lighting />
      <Room />
      <Table />

      {/* Player (you) - facing the table from the front */}
      <Character position={[0, 0, 1.8]} rotation={[0, Math.PI, 0]} isPlayer />

      {/* AI opponent - facing the table from the back */}
      <Character position={[0, 0, -1.8]} rotation={[0, 0, 0]} isAI />

      {/* Revolver held by current player */}
      <Revolver />

      {/* Effects */}
      <MuzzleFlash />
      <BloodSplat />
      <ScreenFlash />
    </Canvas>
  );
}
