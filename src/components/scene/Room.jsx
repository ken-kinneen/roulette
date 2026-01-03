import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Dresser } from './Dresser';

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

  // Load and process the map texture - make white transparent, darken, add vignette
  const [mapTexture, setMapTexture] = useState(null);
  
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/image/map.png';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
      
      // Process pixels: remove white, darken, and add vignette
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Check if pixel is pure white (threshold: 252+) - make transparent
          if (r > 252 && g > 252 && b > 252) {
            data[i + 3] = 0;
            continue;
          }
          // Soft fade for near-white (threshold: 248-252)
          if (r > 248 && g > 248 && b > 248) {
            const avg = (r + g + b) / 3;
            data[i + 3] = Math.max(0, 255 - (avg - 248) * 50);
            continue;
          }
          
          // Calculate vignette factor (darker at edges)
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const vignette = 1 - Math.pow(dist / maxDist, 1.5) * 0.6;
          
          // Darken the image overall (multiply by 0.7) and apply vignette
          const darkenFactor = 0.65 * vignette;
          data[i] = Math.floor(r * darkenFactor);
          data[i + 1] = Math.floor(g * darkenFactor);
          data[i + 2] = Math.floor(b * darkenFactor);
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      setMapTexture(texture);
    };
  }, []);

  // Load and process bunker floor texture - darken, add vignette, reduce tiling visibility
  const [floorTexture, setFloorTexture] = useState(null);
  
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/image/Bunker_Floor.jpeg';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
      
      // Process pixels: darken significantly and add subtle vignette for tiling blend
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          
          // Calculate vignette factor (darker at edges to help blend tiles)
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const vignette = 1 - Math.pow(dist / maxDist, 2) * 0.25;
          
          // Darken significantly (multiply by 0.4) and apply vignette
          const darkenFactor = 0.35 * vignette;
          data[i] = Math.floor(data[i] * darkenFactor);
          data[i + 1] = Math.floor(data[i + 1] * darkenFactor);
          data[i + 2] = Math.floor(data[i + 2] * darkenFactor);
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1.5, 1.5);
      texture.needsUpdate = true;
      setFloorTexture(texture);
    };
  }, []);

  // Create weathered concrete/stone wall texture - bunker style
  const wallTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    let seed = 54321; // Fixed seed for deterministic results
    const rand = () => { seed++; return seededRandom(seed); };
    
    // Base - dark weathered concrete
    ctx.fillStyle = '#1f1a15';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Concrete texture - mottled pattern
    for (let i = 0; i < 5000; i++) {
      const x = rand() * 1024;
      const y = rand() * 1024;
      const brightness = 25 + rand() * 30;
      ctx.fillStyle = `rgba(${brightness + 8}, ${brightness + 3}, ${brightness}, ${0.1 + rand() * 0.15})`;
      ctx.fillRect(x, y, 2 + rand() * 4, 2 + rand() * 4);
    }
    
    // Water stains and seepage - vertical drips
    for (let i = 0; i < 25; i++) {
      const x = rand() * 1024;
      const startY = rand() * 200;
      const length = 200 + rand() * 600;
      
      const gradient = ctx.createLinearGradient(x, startY, x, startY + length);
      gradient.addColorStop(0, 'rgba(60, 45, 30, 0.5)');
      gradient.addColorStop(0.3, 'rgba(50, 38, 25, 0.4)');
      gradient.addColorStop(0.7, 'rgba(40, 30, 20, 0.25)');
      gradient.addColorStop(1, 'rgba(35, 25, 15, 0)');
      
      ctx.fillStyle = gradient;
      const width = 15 + rand() * 40;
      ctx.fillRect(x - width/2, startY, width, length);
    }
    
    // Rust stains - orange/brown patches
    for (let i = 0; i < 20; i++) {
      const x = rand() * 1024;
      const y = rand() * 1024;
      const size = 40 + rand() * 120;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(80, 45, 20, 0.4)');
      gradient.addColorStop(0.4, 'rgba(60, 35, 15, 0.25)');
      gradient.addColorStop(1, 'rgba(45, 30, 15, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, size * (0.8 + rand() * 0.4), size, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Mold/mildew - dark greenish patches
    for (let i = 0; i < 15; i++) {
      const x = rand() * 1024;
      const y = rand() * 1024;
      const size = 60 + rand() * 150;
      
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
      ctx.strokeStyle = `rgba(10, 8, 5, ${0.5 + rand() * 0.4})`;
      ctx.lineWidth = 1 + rand() * 3;
      ctx.beginPath();
      let x = rand() * 1024;
      let y = rand() * 1024;
      ctx.moveTo(x, y);
      const iterations = 5 + Math.floor(rand() * 5);
      for (let j = 0; j < iterations; j++) {
        x += (rand() - 0.5) * 60;
        y += rand() * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    
    // Chipped/damaged areas - lighter patches
    for (let i = 0; i < 30; i++) {
      const x = rand() * 1024;
      const y = rand() * 1024;
      const size = 10 + rand() * 40;
      ctx.fillStyle = `rgba(50, 42, 35, ${0.3 + rand() * 0.3})`;
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

      {/* Map directly on back wall - large and prominent */}
      {mapTexture && (
        <mesh position={[0, 2.8, -3.95]} receiveShadow>
          <planeGeometry args={[3, 2]} />
          <meshStandardMaterial 
            map={mapTexture} 
            roughness={0.9}
            transparent={true}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Map pins */}
      {[[1.0, 0.5], [-1.2, 0.4], [0.4, -0.5], [-0.8, -0.7], [0.8, -0.2]].map(([ox, oy], i) => (
        <mesh key={i} position={[ox, 2.8 + oy, -3.9]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#aa3322" : "#886633"} />
        </mesh>
      ))}

      {/* Dresser under the map */}
      <Dresser position={[0, 1, -3.5]} rotation={[0, 0, 0]} scale={1} />

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
