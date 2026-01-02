import { useMemo } from 'react';
import * as THREE from 'three';

export function Room() {
  const roomSize = { width: 14, height: 8, depth: 14 };

  // Create rustic wooden floor texture
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Base wood color - much darker, aged brown
    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Draw wood planks with more detail
    const plankHeight = 85;
    const plankWidths = [200, 300, 250, 274]; // Varied plank widths
    
    for (let y = 0; y < 1024; y += plankHeight) {
      let xOffset = 0;
      
      // Draw individual planks in this row
      while (xOffset < 1024) {
        const plankWidth = plankWidths[Math.floor(Math.random() * plankWidths.length)];
        
        // Base plank color - darker with more variation
        const colorVariation = Math.random() * 15 - 7;
        const r = Math.floor(35 + colorVariation);
        const g = Math.floor(20 + colorVariation);
        const b = Math.floor(10 + colorVariation);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(xOffset, y, plankWidth, plankHeight);
        
        // Detailed wood grain - multiple layers
        for (let i = 0; i < 15; i++) {
          const grainY = y + (i / 15) * plankHeight;
          const opacity = 0.15 + Math.random() * 0.25;
          ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
          ctx.lineWidth = 0.5 + Math.random() * 1.5;
          ctx.beginPath();
          
          // Wavy grain pattern
          ctx.moveTo(xOffset, grainY);
          for (let x = xOffset; x < xOffset + plankWidth; x += 10) {
            const wave = Math.sin(x * 0.1) * 2;
            ctx.lineTo(x, grainY + wave);
          }
          ctx.stroke();
        }
        
        // Darker grain lines
        for (let i = 0; i < 8; i++) {
          ctx.strokeStyle = `rgba(10, 5, 2, ${0.3 + Math.random() * 0.4})`;
          ctx.lineWidth = 1 + Math.random() * 2;
          ctx.beginPath();
          const grainY = y + Math.random() * plankHeight;
          ctx.moveTo(xOffset, grainY);
          ctx.lineTo(xOffset + plankWidth, grainY);
          ctx.stroke();
        }
        
        // Plank vertical separations
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xOffset + plankWidth, y);
        ctx.lineTo(xOffset + plankWidth, y + plankHeight);
        ctx.stroke();
        
        // Wood knots - larger and more detailed
        const numKnots = Math.floor(Math.random() * 3);
        for (let k = 0; k < numKnots; k++) {
          const knotX = xOffset + Math.random() * plankWidth;
          const knotY = y + Math.random() * plankHeight;
          const knotSize = 4 + Math.random() * 8;
          
          // Knot center
          ctx.fillStyle = 'rgba(15, 8, 3, 0.7)';
          ctx.beginPath();
          ctx.arc(knotX, knotY, knotSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Knot rings
          for (let ring = 1; ring < 4; ring++) {
            ctx.strokeStyle = `rgba(20, 10, 5, ${0.3 - ring * 0.08})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(knotX, knotY, knotSize + ring * 2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        
        // Scratches and wear marks
        for (let s = 0; s < 5; s++) {
          const scratchX = xOffset + Math.random() * plankWidth;
          const scratchY = y + Math.random() * plankHeight;
          const scratchLength = 10 + Math.random() * 40;
          const scratchAngle = Math.random() * Math.PI;
          
          ctx.strokeStyle = `rgba(25, 15, 8, ${0.3 + Math.random() * 0.3})`;
          ctx.lineWidth = 0.5 + Math.random();
          ctx.beginPath();
          ctx.moveTo(scratchX, scratchY);
          ctx.lineTo(
            scratchX + Math.cos(scratchAngle) * scratchLength,
            scratchY + Math.sin(scratchAngle) * scratchLength
          );
          ctx.stroke();
        }
        
        xOffset += plankWidth;
      }
      
      // Plank horizontal separations
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }
    
    // Add large stains across multiple planks
    for (let i = 0; i < 12; i++) {
      const stainX = Math.random() * 1024;
      const stainY = Math.random() * 1024;
      const stainSize = 30 + Math.random() * 80;
      
      const gradient = ctx.createRadialGradient(stainX, stainY, 0, stainX, stainY, stainSize);
      gradient.addColorStop(0, 'rgba(10, 5, 2, 0.5)');
      gradient.addColorStop(0.5, 'rgba(15, 8, 4, 0.3)');
      gradient.addColorStop(1, 'rgba(20, 10, 5, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(stainX, stainY, stainSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Water damage stains (elongated)
    for (let i = 0; i < 8; i++) {
      const stainX = Math.random() * 1024;
      const stainY = Math.random() * 1024;
      ctx.fillStyle = `rgba(8, 4, 2, ${0.3 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(stainX, stainY, 15 + Math.random() * 30, 40 + Math.random() * 60, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Overall darkening and aging overlay
    const overlay = ctx.createLinearGradient(0, 0, 1024, 1024);
    overlay.addColorStop(0, 'rgba(5, 3, 1, 0.2)');
    overlay.addColorStop(1, 'rgba(10, 5, 2, 0.3)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, 1024, 1024);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }, []);

  // Create vintage distressed wallpaper texture inspired by the white tile reference
  const wallpaperTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Base wallpaper color - aged cream/beige similar to the tile base
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Add subtle paper texture
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const brightness = 220 + Math.random() * 30;
      ctx.fillStyle = `rgba(${brightness}, ${brightness - 5}, ${brightness - 10}, ${0.1 + Math.random() * 0.1})`;
      ctx.fillRect(x, y, 1, 1);
    }
    
     
    
    // Add vertical stripe pattern (subtle)
    for (let x = 0; x < 1024; x += 64) {
      ctx.strokeStyle = 'rgba(200, 190, 175, 0.15)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
   
    
    // Water damage drips and runs
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 400; // Start from upper portion
      const dripLength = 100 + Math.random() * 300;
      
      const gradient = ctx.createLinearGradient(x, y, x, y + dripLength);
      gradient.addColorStop(0, `rgba(139, 90, 43, ${0.35 + Math.random() * 0.2})`);
      gradient.addColorStop(0.3, `rgba(150, 100, 50, ${0.25 + Math.random() * 0.15})`);
      gradient.addColorStop(1, 'rgba(170, 130, 80, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y + dripLength / 2, 8 + Math.random() * 12, dripLength / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Mold/mildew patches - greenish-brown
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = 50 + Math.random() * 100;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(90, 95, 70, ${0.25 + Math.random() * 0.2})`);
      gradient.addColorStop(0.6, `rgba(110, 115, 85, ${0.15 + Math.random() * 0.1})`);
      gradient.addColorStop(1, 'rgba(130, 130, 100, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Grout-line inspired cracks and seams
    for (let i = 0; i < 20; i++) {
      const startX = Math.random() * 1024;
      const startY = Math.random() * 1024;
      const length = 60 + Math.random() * 200;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.strokeStyle = `rgba(120, 90, 60, ${0.25 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      let currentX = startX;
      let currentY = startY;
      const segments = 5 + Math.floor(Math.random() * 8);
      for (let j = 0; j < segments; j++) {
        const segmentLength = length / segments;
        const deviation = (Math.random() - 0.5) * 20;
        currentX += Math.cos(angle) * segmentLength + deviation;
        currentY += Math.sin(angle) * segmentLength + deviation;
        ctx.lineTo(currentX, currentY);
      }
      ctx.stroke();
    }
    
    // Yellowing/aging effect - overall tint
    ctx.fillStyle = 'rgba(210, 180, 130, 0.15)';
    ctx.fillRect(0, 0, 1024, 1024);
    
 
    
    // Dirt accumulation at bottom (like the tile grout)
    const dirtGradient = ctx.createLinearGradient(0, 0, 0, 1024);
    dirtGradient.addColorStop(0, 'rgba(100, 80, 50, 0)');
    dirtGradient.addColorStop(0.6, 'rgba(100, 80, 50, 0.08)');
    dirtGradient.addColorStop(1, 'rgba(90, 70, 40, 0.2)');
    ctx.fillStyle = dirtGradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Final aging overlay - subtle vignette
    const vignetteGradient = ctx.createRadialGradient(512, 512, 200, 512, 512, 700);
    vignetteGradient.addColorStop(0, 'rgba(180, 160, 130, 0)');
    vignetteGradient.addColorStop(1, 'rgba(120, 100, 70, 0.12)');
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }, []);

  // Create shared materials to reduce texture units
  const floorMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.85,
      metalness: 0.0,
    }), [floorTexture]
  );

  const wallpaperMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      map: wallpaperTexture,
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.2,
    }), [wallpaperTexture]
  );

  return (
    <group>
      {/* Rustic Wooden Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow material={floorMaterial}>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
      </mesh>

      {/* Back Wall - vintage distressed wallpaper */}
      <mesh position={[0, roomSize.height / 2, -roomSize.depth / 2]} receiveShadow material={wallpaperMaterial}>
        <planeGeometry args={[roomSize.width, roomSize.height]} />
      </mesh>

      {/* Left Wall - vintage distressed wallpaper */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-roomSize.width / 2, roomSize.height / 2, 0]}
        receiveShadow
        material={wallpaperMaterial}
      >
        <planeGeometry args={[roomSize.depth, roomSize.height]} />
      </mesh>

      {/* Right Wall - vintage distressed wallpaper */}
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[roomSize.width / 2, roomSize.height / 2, 0]}
        receiveShadow
        material={wallpaperMaterial}
      >
        <planeGeometry args={[roomSize.depth, roomSize.height]} />
      </mesh>

      {/* Front Wall (South) - vintage distressed wallpaper */}
      <mesh 
        rotation={[0, Math.PI, 0]}
        position={[0, roomSize.height / 2, roomSize.depth / 2]} 
        receiveShadow
        material={wallpaperMaterial}
      >
        <planeGeometry args={[roomSize.width, roomSize.height]} />
      </mesh>

      {/* Ceiling - industrial concrete */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, roomSize.height, 0]}>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
        <meshStandardMaterial 
          color="#1a1816" 
          roughness={0.98}
        />
      </mesh>
 

      {/* Cross pipe */}
      <mesh position={[0, roomSize.height - 0.3, -4]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
        <meshStandardMaterial 
          color="#2a2622" 
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {/* Ventilation duct - back wall */}
      <mesh position={[-4, 6, -roomSize.depth / 2 + 0.1]} castShadow>
        <boxGeometry args={[1.2, 0.6, 0.3]} />
        <meshStandardMaterial 
          color="#1a1715" 
          roughness={0.6}
          metalness={0.5}
        />
      </mesh>

      {/* Ventilation grate */}
      {[...Array(8)].map((_, i) => (
        <mesh 
          key={i}
          position={[-4 + (i * 0.15) - 0.525, 6, -roomSize.depth / 2 + 0.15]}
        >
          <boxGeometry args={[0.02, 0.5, 0.05]} />
          <meshStandardMaterial color="#0a0908" />
        </mesh>
      ))}

      {/* Electrical conduit on left wall */}
      <mesh 
        position={[-roomSize.width / 2 + 0.1, 5, 2]} 
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.04, 0.04, 4, 6]} />
        <meshStandardMaterial 
          color="#3a3632" 
          roughness={0.8}
          metalness={0.3}
        />
      </mesh>

      {/* Junction box */}
      <mesh position={[-roomSize.width / 2 + 0.15, 6.5, 2]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.2]} />
        <meshStandardMaterial 
          color="#2a2622" 
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {/* Support beam - left corner */}
      <mesh position={[-roomSize.width / 2 + 0.5, roomSize.height / 2, -roomSize.depth / 2 + 0.5]} castShadow>
        <boxGeometry args={[0.3, roomSize.height, 0.3]} />
        <meshStandardMaterial 
          color="#1a1614" 
          roughness={0.9}
          metalness={0.2}
        />
      </mesh>

      {/* Support beam - right corner */}
      <mesh position={[roomSize.width / 2 - 0.5, roomSize.height / 2, -roomSize.depth / 2 + 0.5]} castShadow>
        <boxGeometry args={[0.3, roomSize.height, 0.3]} />
        <meshStandardMaterial 
          color="#1a1614" 
          roughness={0.9}
          metalness={0.2}
        />
      </mesh>

      {/* Hanging light fixture cage */}
      <group position={[0, 6.5, 0]}>
        {/* Wire/chain */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 1, 4]} />
          <meshStandardMaterial color="#1a1614" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Cage frame */}
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.4, 6, 1, true]} />
          <meshStandardMaterial 
            color="#2a2622" 
            metalness={0.5} 
            roughness={0.6}
            side={THREE.DoubleSide}
            wireframe
          />
        </mesh>
      </group>

    

      {/* Crates in corner - adds to warehouse feel */}
      <mesh position={[-5, 0.5, -5]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#2a2420" 
          roughness={0.95}
        />
      </mesh>

      <mesh position={[-5, 1.5, -5]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color="#2d2723" 
          roughness={0.95}
        />
      </mesh>

      <mesh position={[5, 0.4, -5.5]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color="#282420" 
          roughness={0.95}
        />
      </mesh>
    </group>
  );
}



