// The Revolver is now integrated directly into the Character component
// This file is kept for backwards compatibility but the gun is now attached to the character's hand bone
// See Character.jsx for the implementation

import { useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';

export function Revolver() {
  // Gun rendering is now handled by Character.jsx which attaches it to the hand bone
  // This component is kept as a placeholder but returns null
  
  const gamePhase = useGameStore((state) => state.gamePhase);
  
  // Don't render anything - the gun is now part of the Character component
  return null;
}
