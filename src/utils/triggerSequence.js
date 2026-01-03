// Trigger Sequence Sound Manager
// Handles the suspenseful automatic trigger pull sequence

import { setMusicVolume, getMusicVolume } from "./music";

// Sound file paths - Add your sound files to the public folder
const SOUND_PATHS = {
    suspenseDrop: "/sounds/Scary Sound Effect Royalty Free.mp3",
    heartbeat: "/sounds/Dramatic Heartbeat Sound Effect (1).mp3",
    cylinderSpin: "/sounds/Chamber spin sound.mp3",
    triggerPull: null, // Not added yet
    gunshot: "/sounds/gunshot.mp3",
    emptyClick: "/sounds/emptyShot.mp3",
    sigh: "/sounds/sigh.mp3", // Relief sigh when gun clicks empty
};

// Store original music volume to restore later
let originalMusicVolume = 0.1;

// Audio instances cache
const audioCache = {};

// Preload all sounds
export function preloadTriggerSounds() {
    Object.entries(SOUND_PATHS).forEach(([key, path]) => {
        if (!path) return; // Skip if no path defined
        const audio = new Audio(path);
        audio.preload = "auto";
        audioCache[key] = audio;
    });
}

// Get or create audio instance
function getAudio(key) {
    const path = SOUND_PATHS[key];
    if (!path) return null; // Skip if no path defined

    if (!audioCache[key]) {
        audioCache[key] = new Audio(path);
    }
    return audioCache[key];
}

// Play a sound with optional volume
function playSound(key, volume = 1.0) {
    try {
        const audio = getAudio(key);
        if (!audio) return null; // Skip if sound not configured

        audio.currentTime = 0;
        audio.volume = volume;
        audio.play().catch((e) => console.warn(`Failed to play ${key}:`, e));
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
    Object.keys(audioCache).forEach((key) => stopSound(key));
}

// The main trigger sequence controller
let sequenceTimeouts = [];

export function clearSequenceTimeouts() {
    sequenceTimeouts.forEach((t) => clearTimeout(t));
    sequenceTimeouts = [];
}

/**
 * Run the automatic trigger pull sequence
 * @param {Object} options
 * @param {Function} options.onPhaseChange - Callback for phase changes ('drop', 'heartbeat', 'spin', 'pull', 'result')
 * @param {Function} options.onComplete - Callback when sequence completes with result ('shot' or 'empty')
 * @param {boolean} options.willFire - Whether the gun will actually fire (determined by game logic)
 * @param {number} options.volume - Master volume (0-1)
 * @param {number} options.musicVolume - Current music volume to restore after sequence
 */
export function runTriggerSequence({ onPhaseChange, onComplete, willFire, volume = 0.7 }) {
    clearSequenceTimeouts();
    stopAllTriggerSounds();

    // Duck the music to 20% of its current volume
    originalMusicVolume = getMusicVolume();
    setMusicVolume(originalMusicVolume * 0.2);

    // Sequence timing (in ms) - SNAPPY timings for tight gameplay feel
    const TIMING = {
        dropDuration: 300, // Quick suspense drop
        heartbeatStart: 800, // Heartbeat begins early
        spinStart: 1500, // Cylinder spin
        pullStart: 4000, // Trigger pull - 500ms after spin starts
        resultStart: 4000, // Result almost instant after pull (150ms)
        sighStart: 5500, // Sigh plays 350ms after the click
        endSequenceShot: 5300, // Quick wrap up for gunshot
        endSequenceEmpty: 8500, // Plenty of time for sigh to play (~2.2s)
    };

    // Phase 1: Suspenseful Drop
    onPhaseChange?.("drop");
    playSound("suspenseDrop", volume);

    // Phase 2: Heartbeat
    sequenceTimeouts.push(
        setTimeout(() => {
            onPhaseChange?.("heartbeat");
            playSound("heartbeat", volume * 0.9);
        }, TIMING.heartbeatStart)
    );

    // Phase 3: Cylinder Spin (heartbeat continues underneath)
    sequenceTimeouts.push(
        setTimeout(() => {
            onPhaseChange?.("spin");
            playSound("cylinderSpin", volume);
        }, TIMING.spinStart)
    );

    // Phase 4: Trigger Pull
    sequenceTimeouts.push(
        setTimeout(() => {
            onPhaseChange?.("pull");
            playSound("triggerPull", volume);
        }, TIMING.pullStart)
    );

    // Phase 5: Result - INSTANT after trigger pull
    sequenceTimeouts.push(
        setTimeout(() => {
            onPhaseChange?.("result");

            if (willFire) {
                playSound("gunshot", 1.0); // Full volume for gunshot
            } else {
                playSound("emptyClick", volume);
            }
        }, TIMING.resultStart)
    );

    // Phase 6: Sigh of relief (only on empty click) - plays AFTER the click
    if (!willFire) {
        sequenceTimeouts.push(
            setTimeout(() => {
                onPhaseChange?.("sigh");
                playSound("sigh", volume * 0.9);
            }, TIMING.sighStart)
        );
    }

    // Sequence Complete - restore music volume
    // Use different timing: quick for gunshot, longer for empty (let sigh play)
    const endTime = willFire ? TIMING.endSequenceShot : TIMING.endSequenceEmpty;
    sequenceTimeouts.push(
        setTimeout(() => {
            stopAllTriggerSounds();
            setMusicVolume(originalMusicVolume); // Restore music volume
            onComplete?.(willFire ? "shot" : "empty");
        }, endTime)
    );

    // Return cleanup function
    return () => {
        clearSequenceTimeouts();
        stopAllTriggerSounds();
        setMusicVolume(originalMusicVolume); // Restore music on cleanup
    };
}

// Export sound paths for easy reference
export { SOUND_PATHS };
