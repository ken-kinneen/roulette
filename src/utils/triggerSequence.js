// Trigger Sequence Sound Manager
// Handles the suspenseful automatic trigger pull sequence

// Sound file paths - Add your sound files to the public folder
const SOUND_PATHS = {
  suspenseDrop: '/sounds/suspense-drop.mp3',      // Sudden drop when player learns they lost
  heartbeatSlow: '/sounds/heartbeat-slow.mp3',    // Slow heartbeat starting
  heartbeatFast: '/sounds/heartbeat-fast.mp3',    // Accelerating heartbeat
  cylinderSpin: '/sounds/cylinder-spin.mp3',      // Revolver cylinder spinning
  triggerPull: '/sounds/trigger-pull.mp3',        // Hammer being cocked
  gunshot: '/sounds/gunshot.mp3',                 // Loud bang for when bullet fires
  emptyClick: '/sounds/empty-click.mp3',          // Click for empty chamber
};

// Audio instances cache
const audioCache = {};

// Preload all sounds
export function preloadTriggerSounds() {
  Object.entries(SOUND_PATHS).forEach(([key, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audioCache[key] = audio;
  });
}

// Get or create audio instance
function getAudio(key) {
  if (!audioCache[key]) {
    audioCache[key] = new Audio(SOUND_PATHS[key]);
  }
  return audioCache[key];
}

// Play a sound with optional volume
function playSound(key, volume = 1.0) {
  try {
    const audio = getAudio(key);
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(e => console.warn(`Failed to play ${key}:`, e));
    return audio;
  } catch (e) {
    console.warn(`Error playing sound ${key}:`, e);
    return null;
  }
}

// Stop a sound
function stopSound(key) {
  try {
    const audio = audioCache[key];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  } catch (e) {
    console.warn(`Error stopping sound ${key}:`, e);
  }
}

// Stop all sounds
export function stopAllTriggerSounds() {
  Object.keys(audioCache).forEach(key => stopSound(key));
}

// The main trigger sequence controller
let sequenceTimeouts = [];

export function clearSequenceTimeouts() {
  sequenceTimeouts.forEach(t => clearTimeout(t));
  sequenceTimeouts = [];
}

/**
 * Run the automatic trigger pull sequence
 * @param {Object} options
 * @param {Function} options.onPhaseChange - Callback for phase changes ('drop', 'heartbeat', 'spin', 'pull', 'result')
 * @param {Function} options.onComplete - Callback when sequence completes with result ('shot' or 'empty')
 * @param {boolean} options.willFire - Whether the gun will actually fire (determined by game logic)
 * @param {number} options.volume - Master volume (0-1)
 */
export function runTriggerSequence({ onPhaseChange, onComplete, willFire, volume = 0.7 }) {
  clearSequenceTimeouts();
  stopAllTriggerSounds();

  // Sequence timing (in ms)
  const TIMING = {
    dropDuration: 1500,       // Suspenseful drop
    heartbeatStart: 1500,     // When heartbeat begins
    heartbeatFastStart: 3500, // When heartbeat accelerates
    spinStart: 4000,          // Cylinder spin
    pullStart: 5500,          // Trigger pull
    resultStart: 6200,        // Final result (shot or empty)
    endSequence: 7500,        // Sequence ends
  };

  // Phase 1: Suspenseful Drop
  onPhaseChange?.('drop');
  playSound('suspenseDrop', volume);

  // Phase 2: Slow Heartbeat
  sequenceTimeouts.push(setTimeout(() => {
    onPhaseChange?.('heartbeat');
    playSound('heartbeatSlow', volume * 0.8);
  }, TIMING.heartbeatStart));

  // Phase 3: Fast Heartbeat (increasing intensity)
  sequenceTimeouts.push(setTimeout(() => {
    stopSound('heartbeatSlow');
    playSound('heartbeatFast', volume);
  }, TIMING.heartbeatFastStart));

  // Phase 4: Cylinder Spin
  sequenceTimeouts.push(setTimeout(() => {
    onPhaseChange?.('spin');
    stopSound('heartbeatFast');
    playSound('cylinderSpin', volume);
  }, TIMING.spinStart));

  // Phase 5: Trigger Pull
  sequenceTimeouts.push(setTimeout(() => {
    onPhaseChange?.('pull');
    playSound('triggerPull', volume);
  }, TIMING.pullStart));

  // Phase 6: Result
  sequenceTimeouts.push(setTimeout(() => {
    onPhaseChange?.('result');
    
    if (willFire) {
      playSound('gunshot', volume);
    } else {
      playSound('emptyClick', volume);
    }
  }, TIMING.resultStart));

  // Sequence Complete
  sequenceTimeouts.push(setTimeout(() => {
    stopAllTriggerSounds();
    onComplete?.(willFire ? 'shot' : 'empty');
  }, TIMING.endSequence));

  // Return cleanup function
  return () => {
    clearSequenceTimeouts();
    stopAllTriggerSounds();
  };
}

// Export sound paths for easy reference
export { SOUND_PATHS };

