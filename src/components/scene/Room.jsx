import { useMemo } from 'react';
import * as THREE from 'three';

// Seeded random for deterministic texture generation
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Create barrel vault geometry for arched ceiling
function createBarrelVaultGeometry(width, height, depth, segments = 32) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const uvs = [];
  const normals = [];
  
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  
  // Create the curved ceiling (half cylinder)
  for (let z = 0; z <= segments; z++) {
    const zPos = (z / segments) * depth - halfDepth;
    
    for (let a = 0; a <= segments; a++) {
      const angle = (a / segments) * Math.PI; // 0 to PI for half circle
      const x = Math.cos(angle) * halfWidth;
      const y = Math.sin(angle) * height;
      
      vertices.push(x, y, zPos);
      
      // Normal points inward (toward center)
      normals.push(-Math.cos(angle), -Math.sin(angle), 0);
      
      // UVs
      uvs.push(a / segments * 2, z / segments * 2);
    }
  }
  
  // Create indices for the vault
  for (let z = 0; z < segments; z++) {
    for (let a = 0; a < segments; a++) {
      const current = z * (segments + 1) + a;
      const next = current + segments + 1;
      
      indices.push(current, next, current + 1);
      indices.push(current + 1, next, next + 1);
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  return geometry;
}

// Create archway geometry
function ArchWay({ position, size = [3, 4, 0.5], rotation = [0, 0, 0] }) {
  const archGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const [width, height] = [size[0], size[1]];
    const archRadius = width / 2;
    const straightHeight = height - archRadius;
    
    // Outer rectangle
    shape.moveTo(-width / 2 - 0.3, 0);
    shape.lineTo(-width / 2 - 0.3, height + 0.3);
    shape.lineTo(width / 2 + 0.3, height + 0.3);
    shape.lineTo(width / 2 + 0.3, 0);
    shape.lineTo(-width / 2 - 0.3, 0);
    
    // Inner arch hole
    const hole = new THREE.Path();
    hole.moveTo(-width / 2, 0);
    hole.lineTo(-width / 2, straightHeight);
    hole.absarc(0, straightHeight, archRadius, Math.PI, 0, true);
    hole.lineTo(width / 2, 0);
    hole.lineTo(-width / 2, 0);
    
    shape.holes.push(hole);
    
    const extrudeSettings = {
      steps: 1,
      depth: size[2],
      bevelEnabled: false,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [size]);
  
  return (
    <mesh 
      geometry={archGeometry} 
      position={position} 
      rotation={rotation}
      castShadow 
      receiveShadow
    >
      <meshStandardMaterial color="#1a1512" roughness={0.95} />
    </mesh>
  );
}

export function Room() {
  const roomSize = { width: 8, height: 5, depth: 8 };

  // Create aged, dirty concrete/stone floor texture
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    let seed = 12345; // Fixed seed for deterministic results
    const rand = () => { seed++; return seededRandom(seed); };
    
    // Base - dark dirty stone
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Stone/tile pattern with irregular shapes
    for (let i = 0; i < 200; i++) {
      const x = rand() * 1024;
      const y = rand() * 1024;
      const size = 40 + rand() * 120;
      
      const brightness = 20 + rand() * 25;
      ctx.fillStyle = `rgb(${brightness + 5}, ${brightness}, ${brightness - 3})`;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2 + rand() * 0.3;
        const r = size * (0.7 + rand() * 0.3);
        ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
    
    // Dirt and debris patches
    for (let i = 0; i < 80; i++) {
      const x = rand() * 1024;
      const y = rand() * 1024;
      const size = 30 + rand() * 100;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(35, 25, 15, 0.6)');
      gradient.addColorStop(0.5, 'rgba(25, 18, 10, 0.4)');
      gradient.addColorStop(1, 'rgba(20, 15, 8, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Scattered debris/pebbles
    for (let i = 0; i < 500; i++) {
      const x = rand() * 1024;
      const y = rand() * 1024;
      const size = 1 + rand() * 4;
      const brightness = 15 + rand() * 20;
      ctx.fillStyle = `rgba(${brightness + 10}, ${brightness + 5}, ${brightness}, ${0.5 + rand() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Cracks
    for (let i = 0; i < 15; i++) {
      ctx.strokeStyle = `rgba(5, 3, 2, ${0.4 + rand() * 0.4})`;
      ctx.lineWidth = 1 + rand() * 2;
      ctx.beginPath();
      let x = rand() * 1024;
      let y = rand() * 1024;
      ctx.moveTo(x, y);
      for (let j = 0; j < 8; j++) {
        x += (rand() - 0.5) * 80;
        y += (rand() - 0.5) * 80;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }, []);

  // Create weathered concrete/stone wall texture - bunker style
  const wallTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Base - dark weathered concrete
    ctx.fillStyle = '#1f1a15';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Concrete texture - mottled pattern
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const brightness = 25 + Math.random() * 30;
      ctx.fillStyle = `rgba(${brightness + 8}, ${brightness + 3}, ${brightness}, ${0.1 + Math.random() * 0.15})`;
      ctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
    
    // Water stains and seepage - vertical drips
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * 1024;
      const startY = Math.random() * 200;
      const length = 200 + Math.random() * 600;
      
      const gradient = ctx.createLinearGradient(x, startY, x, startY + length);
      gradient.addColorStop(0, 'rgba(60, 45, 30, 0.5)');
      gradient.addColorStop(0.3, 'rgba(50, 38, 25, 0.4)');
      gradient.addColorStop(0.7, 'rgba(40, 30, 20, 0.25)');
      gradient.addColorStop(1, 'rgba(35, 25, 15, 0)');
      
      ctx.fillStyle = gradient;
      const width = 15 + Math.random() * 40;
      ctx.fillRect(x - width/2, startY, width, length);
    }
    
    // Rust stains - orange/brown patches
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = 40 + Math.random() * 120;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(80, 45, 20, 0.4)');
      gradient.addColorStop(0.4, 'rgba(60, 35, 15, 0.25)');
      gradient.addColorStop(1, 'rgba(45, 30, 15, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, size * (0.8 + Math.random() * 0.4), size, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Mold/mildew - dark greenish patches
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = 60 + Math.random() * 150;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(30, 35, 25, 0.35)');
      gradient.addColorStop(0.5, 'rgba(25, 30, 20, 0.2)');
      gradient.addColorStop(1, 'rgba(20, 25, 18, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Cracks and damage
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = `rgba(10, 8, 5, ${0.5 + Math.random() * 0.4})`;
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.beginPath();
      let x = Math.random() * 1024;
      let y = Math.random() * 1024;
      ctx.moveTo(x, y);
      for (let j = 0; j < 5 + Math.random() * 5; j++) {
        x += (Math.random() - 0.5) * 60;
        y += Math.random() * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    
    // Chipped/damaged areas - lighter patches
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = 10 + Math.random() * 40;
      ctx.fillStyle = `rgba(50, 42, 35, ${0.3 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Dirt accumulation at bottom
    const dirtGradient = ctx.createLinearGradient(0, 0, 0, 1024);
    dirtGradient.addColorStop(0, 'rgba(25, 18, 12, 0)');
    dirtGradient.addColorStop(0.7, 'rgba(25, 18, 12, 0.1)');
    dirtGradient.addColorStop(1, 'rgba(20, 15, 10, 0.4)');
    ctx.fillStyle = dirtGradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
  }, []);

  // Barrel vault geometry
  const vaultGeometry = useMemo(() => {
    return createBarrelVaultGeometry(roomSize.width, roomSize.height, roomSize.depth, 48);
  }, [roomSize.width, roomSize.height, roomSize.depth]);

  // Materials
  const floorMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.9,
      metalness: 0.0,
    }), [floorTexture]
  );

  const wallMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.BackSide,
    }), [wallTexture]
  );

  const concreteMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: '#1a1512',
      roughness: 0.95,
      metalness: 0.0,
    }), []
  );

  return (
    <group>
      {/* Dirty Stone Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={floorMaterial}>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
      </mesh>

      {/* Barrel Vault Ceiling/Walls - the curved bunker structure */}
      <mesh geometry={vaultGeometry} material={wallMaterial} receiveShadow />

      {/* Back Wall - closes off the vault */}
      <mesh position={[0, roomSize.height / 2, -roomSize.depth / 2]} receiveShadow>
        <planeGeometry args={[roomSize.width, roomSize.height * 2]} />
        <meshStandardMaterial map={wallTexture} roughness={0.95} />
      </mesh>

      {/* Front Wall - closes off the vault with archway feel */}
      <mesh 
        rotation={[0, Math.PI, 0]}
        position={[0, roomSize.height / 2, roomSize.depth / 2]} 
        receiveShadow
      >
        <planeGeometry args={[roomSize.width, roomSize.height * 2]} />
        <meshStandardMaterial map={wallTexture} roughness={0.95} />
      </mesh>

      {/* Main pendant light - center, high up */}
      <group position={[0, 4.5, 0]}>
        {/* Wire */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.6, 4]} />
          <meshStandardMaterial color="#1a1614" metalness={0.3} roughness={0.7} />
        </mesh>
        {/* Bulb housing */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.15, 8]} />
          <meshStandardMaterial color="#1a1614" metalness={0.2} roughness={0.8} />
        </mesh>
        {/* Warm glowing bulb */}
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial 
            color="#ffaa55" 
            emissive="#ff8833"
            emissiveIntensity={2}
          />
        </mesh>
      </group>

      {/* Map on back wall - scaled for smaller room */}
      <mesh position={[0, 2.5, -3.9]} receiveShadow>
        <planeGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#3a3528" roughness={0.95} />
      </mesh>
      {/* Map pins */}
      {[[0.2, 0.2], [-0.3, 0.1], [0, -0.2], [-0.2, -0.3]].map(([ox, oy], i) => (
        <mesh key={i} position={[ox, 2.5 + oy, -3.85]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#aa3322" : "#886633"} />
        </mesh>
      ))}

      {/* Metal bucket - corner */}
      <mesh position={[2.8, 0.2, -2.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.4, 8]} />
        <meshStandardMaterial color="#2a2622" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Floor debris - scaled for smaller room */}
      {[
        [-1.5, 0.02, -2, 0.1],
        [1, 0.02, -2.5, 0.08],
        [-0.5, 0.02, 1.5, 0.07],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, i * 0.5, 0]}>
          <boxGeometry args={[s, 0.015, s * 0.6]} />
          <meshStandardMaterial color="#252018" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
