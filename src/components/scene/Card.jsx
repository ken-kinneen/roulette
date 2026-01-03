import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// Card dimensions (poker card proportions)
const CARD_WIDTH = 0.25;
const CARD_HEIGHT = 0.35;
const CARD_DEPTH = 0.008;

// Suit symbols and colors
const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS = {
  hearts: '#c45c45',
  diamonds: '#c45c45',
  clubs: '#1a1816',
  spades: '#1a1816',
};

function CardFace({ card, isBack = false }) {
  if (isBack) {
    return (
      <group>
        {/* Card back pattern */}
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[CARD_WIDTH - 0.02, CARD_HEIGHT - 0.02]} />
          <meshStandardMaterial color="#4a3020" />
        </mesh>
        {/* Inner pattern */}
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[CARD_WIDTH - 0.04, CARD_HEIGHT - 0.04]} />
          <meshStandardMaterial color="#6a4535" />
        </mesh>
        {/* Diamond pattern */}
        {Array.from({ length: 3 }).map((_, row) => (
          Array.from({ length: 2 }).map((_, col) => (
            <mesh 
              key={`${row}-${col}`}
              position={[
                (col - 0.5) * 0.06,
                (row - 1) * 0.08,
                0.003
              ]}
              rotation={[0, 0, Math.PI / 4]}
            >
              <planeGeometry args={[0.03, 0.03]} />
              <meshStandardMaterial color="#4a3020" />
            </mesh>
          ))
        )).flat()}
      </group>
    );
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = SUIT_COLORS[card.suit];

  return (
    <group>
      {/* Card face background */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[CARD_WIDTH - 0.01, CARD_HEIGHT - 0.01]} />
        <meshStandardMaterial color="#f5f0e8" />
      </mesh>
      
      {/* Value - top left */}
      <Text
        position={[-CARD_WIDTH / 2 + 0.04, CARD_HEIGHT / 2 - 0.04, 0.002]}
        fontSize={0.04}
        color={suitColor}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {card.value}
      </Text>
      
      {/* Small suit - below value */}
      <Text
        position={[-CARD_WIDTH / 2 + 0.04, CARD_HEIGHT / 2 - 0.08, 0.002]}
        fontSize={0.03}
        color={suitColor}
        anchorX="center"
        anchorY="middle"
      >
        {suitSymbol}
      </Text>
      
      {/* Center suit - large */}
      <Text
        position={[0, 0, 0.002]}
        fontSize={0.12}
        color={suitColor}
        anchorX="center"
        anchorY="middle"
      >
        {suitSymbol}
      </Text>
      
      {/* Value - bottom right (upside down) */}
      <group position={[CARD_WIDTH / 2 - 0.04, -CARD_HEIGHT / 2 + 0.04, 0.002]} rotation={[0, 0, Math.PI]}>
        <Text
          position={[0, 0.02, 0]}
          fontSize={0.04}
          color={suitColor}
          anchorX="center"
          anchorY="middle"
        >
          {card.value}
        </Text>
        <Text
          position={[0, -0.02, 0]}
          fontSize={0.03}
          color={suitColor}
          anchorX="center"
          anchorY="middle"
        >
          {suitSymbol}
        </Text>
      </group>
    </group>
  );
}

export function Card({ 
  card, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  isRevealing = false,
  isBack = false,
}) {
  const groupRef = useRef();
  const flipProgress = useRef(isBack ? 0 : 1);
  const slideProgress = useRef(0);
  
  // Animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Slide in animation
    if (slideProgress.current < 1) {
      slideProgress.current = Math.min(1, slideProgress.current + delta * 3);
      const eased = 1 - Math.pow(1 - slideProgress.current, 3);
      groupRef.current.position.y = position[1] + (1 - eased) * 0.5;
      groupRef.current.scale.setScalar(eased);
    }
    
    // Flip animation
    if (isRevealing && flipProgress.current < 1) {
      flipProgress.current = Math.min(1, flipProgress.current + delta * 4);
    }
    
    // Apply rotation based on flip
    const flipAngle = flipProgress.current * Math.PI;
    groupRef.current.rotation.y = flipAngle;
  });

  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={rotation}
    >
      {/* Card body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]} />
        <meshStandardMaterial color="#f8f4ec" roughness={0.3} />
      </mesh>
      
      {/* Front face */}
      <group position={[0, 0, CARD_DEPTH / 2]}>
        <CardFace card={card} isBack={false} />
      </group>
      
      {/* Back face */}
      <group position={[0, 0, -CARD_DEPTH / 2]} rotation={[0, Math.PI, 0]}>
        <CardFace card={card} isBack={true} />
      </group>
    </group>
  );
}

// Face down card (just shows back)
export function CardBack({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const groupRef = useRef();
  const slideProgress = useRef(0);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (slideProgress.current < 1) {
      slideProgress.current = Math.min(1, slideProgress.current + delta * 3);
      const eased = 1 - Math.pow(1 - slideProgress.current, 3);
      groupRef.current.position.y = position[1] + (1 - eased) * 0.3;
      groupRef.current.scale.setScalar(0.5 + eased * 0.5);
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]} />
        <meshStandardMaterial color="#f8f4ec" roughness={0.3} />
      </mesh>
      
      <group position={[0, 0, CARD_DEPTH / 2]}>
        <CardFace card={{ suit: 'spades', value: 'A' }} isBack={true} />
      </group>
      
      <group position={[0, 0, -CARD_DEPTH / 2]} rotation={[0, Math.PI, 0]}>
        <CardFace card={{ suit: 'spades', value: 'A' }} isBack={true} />
      </group>
    </group>
  );
}

