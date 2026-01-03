import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useGameStore } from '../../stores/gameStore';
import { Card, CardBack } from './Card';

export function CardTable() {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentCard = useGameStore((state) => state.currentCard);
  const nextCard = useGameStore((state) => state.nextCard);
  const cardGamePhase = useGameStore((state) => state.cardGamePhase);
  const lastGuessResult = useGameStore((state) => state.lastGuessResult);
  
  // Only show cards during card game phase
  if (gamePhase !== 'cardGame' && gamePhase !== 'playing') return null;
  if (!currentCard && gamePhase === 'cardGame') return null;
  
  // Card positions on the table
  const currentCardPos = [-0.2, 0.82, 0];
  const nextCardPos = [0.2, 0.82, 0];
  const deckPos = [0.5, 0.82, 0];
  
  // Flat on table, rotated to face upward
  const cardRotation = [-Math.PI / 2, 0, 0];
  
  const showCurrentCard = currentCard && (cardGamePhase === 'guessing' || cardGamePhase === 'revealing' || cardGamePhase === 'result');
  const showNextCard = nextCard && (cardGamePhase === 'revealing' || cardGamePhase === 'result');
  const showDeck = gamePhase === 'cardGame';

  return (
    <group>
      {/* Current card (face up) */}
      {showCurrentCard && (
        <Card 
          key={`current-${currentCard.suit}-${currentCard.value}`}
          card={currentCard}
          position={currentCardPos}
          rotation={cardRotation}
        />
      )}
      
      {/* Next card (revealed) */}
      {showNextCard && (
        <group>
          <Card 
            key={`next-${nextCard.suit}-${nextCard.value}`}
            card={nextCard}
            position={nextCardPos}
            rotation={cardRotation}
            isRevealing={cardGamePhase === 'revealing'}
          />
          
          {/* Result indicator */}
          {cardGamePhase === 'result' && lastGuessResult && (
            <Text
              position={[0, 1.2, 0]}
              fontSize={0.08}
              color={lastGuessResult === 'correct' ? '#8a9a7a' : '#c45c45'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.003}
              outlineColor="#0a0908"
            >
              {lastGuessResult === 'correct' ? 'CORRECT!' : 'WRONG!'}
            </Text>
          )}
        </group>
      )}
      
      {/* Deck pile */}
      {showDeck && (
        <group position={deckPos}>
          {/* Stack of cards */}
          {[0, 1, 2].map((i) => (
            <CardBack 
              key={`deck-${i}`}
              position={[0, i * 0.003, 0]}
              rotation={cardRotation}
            />
          ))}
        </group>
      )}
    </group>
  );
}

