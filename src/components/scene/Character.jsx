import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../stores/gameStore';

export function Character({ position, rotation = [0, 0, 0], isPlayer = false, isAI = false }) {
  const groupRef = useRef();
  const headRef = useRef();
  const rightArmRef = useRef();
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);

  const bodyColor = isPlayer ? '#4a6b8a' : '#8a4a4a';
  const headColor = '#d4b896';

  // Death states
  const isDead = (isPlayer && (gamePhase === 'playerDead' || gamePhase === 'gameOver')) ||
                 (isAI && gamePhase === 'aiDead');

  const isHoldingGun = (isPlayer && currentTurn === 'player' && gamePhase === 'playing') || 
                       (isAI && currentTurn === 'ai' && gamePhase === 'playing');

  // Animation state
  const deathProgress = useRef(0);
  const breathOffset = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isDead) {
      // Death animation - fall forward/backward and to the side
      deathProgress.current = Math.min(deathProgress.current + delta * 2, 1);
      const t = deathProgress.current;
      const easeOut = 1 - Math.pow(1 - t, 3);

      // Fall direction based on which character
      const fallRotationX = isPlayer ? 0.8 : -0.8;
      const fallRotationZ = isPlayer ? 0.4 : -0.4;
      const fallY = -0.5;

      groupRef.current.rotation.x = fallRotationX * easeOut;
      groupRef.current.rotation.z = fallRotationZ * easeOut;
      groupRef.current.position.y = position[1] + fallY * easeOut;
    } else {
      // Reset death progress when not dead
      deathProgress.current = 0;
      
      // Subtle breathing animation
      const breathe = Math.sin(state.clock.elapsedTime * 1.5 + breathOffset.current) * 0.015;
      groupRef.current.position.y = position[1] + breathe;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;
    }

    // Right arm animation for holding gun
    if (rightArmRef.current) {
      if (isHoldingGun && !isDead) {
        // Raise arm to hold gun at head - bent at elbow, hand near temple
        const targetRotX = -1.4; // Bent up
        const targetRotZ = -2; // Bent inward toward head
        const targetPosX = 0.3;
        const targetPosY = 0.9;
        const targetPosZ = 0.05;

        rightArmRef.current.rotation.x += (targetRotX - rightArmRef.current.rotation.x) * 0.1;
        rightArmRef.current.rotation.z += (targetRotZ - rightArmRef.current.rotation.z) * 0.1;
        rightArmRef.current.position.x += (targetPosX - rightArmRef.current.position.x) * 0.1;
        rightArmRef.current.position.y += (targetPosY - rightArmRef.current.position.y) * 0.1;
        rightArmRef.current.position.z += (targetPosZ - rightArmRef.current.position.z) * 0.1;
      } else {
        // Resting position
        const targetRotX = 0.3;
        const targetRotZ = -0.2;
        const targetPosX = 0.35;
        const targetPosY = 0.5;
        const targetPosZ = 0.1;

        rightArmRef.current.rotation.x += (targetRotX - rightArmRef.current.rotation.x) * 0.1;
        rightArmRef.current.rotation.z += (targetRotZ - rightArmRef.current.rotation.z) * 0.1;
        rightArmRef.current.position.x += (targetPosX - rightArmRef.current.position.x) * 0.1;
        rightArmRef.current.position.y += (targetPosY - rightArmRef.current.position.y) * 0.1;
        rightArmRef.current.position.z += (targetPosZ - rightArmRef.current.position.z) * 0.1;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Body (torso) */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
        <meshStandardMaterial 
          color={bodyColor} 
          roughness={0.7}
          emissive={isHoldingGun ? bodyColor : '#000000'}
          emissiveIntensity={isHoldingGun ? 0.15 : 0}
        />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color={headColor} roughness={0.6} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.35, 1, 0.1]} rotation={[0.3, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>

      {/* Right Arm - animates for gun holding */}
      <mesh ref={rightArmRef} position={[0.35, 0.5, 0.1]} rotation={[0.3, 0, -0.2]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>

      {/* Chair back */}
      <mesh position={[0, 0.8, -0.4]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.1]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>

      {/* Chair seat */}
      <mesh position={[0, 0.1, -0.1]} castShadow>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>
    </group>
  );
}
