// Ambient sound generator for bunker atmosphere
let audioContext = null;
let ambienceNodes = [];
let isPlaying = false;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Create continuous low rumble (ventilation/machinery)
function createRumble(ctx, masterGain) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate low frequency noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Heavy low-pass filter for deep rumble
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 80;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.03;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(0);

    return { source: noise, gain, filter };
}

// Create electrical hum (fluorescent light buzz)
function createElectricalHum(ctx, masterGain) {
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();

    oscillator1.type = "sine";
    oscillator1.frequency.value = 120; // 60Hz hum and harmonic

    oscillator2.type = "sine";
    oscillator2.frequency.value = 180;

    const gain = ctx.createGain();
    gain.gain.value = 0.01;

    // Add slight frequency modulation for realism
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.5;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 1;

    lfo.connect(lfoGain);
    lfoGain.connect(oscillator1.frequency);

    oscillator1.connect(gain);
    oscillator2.connect(gain);
    gain.connect(masterGain);

    oscillator1.start(0);
    oscillator2.start(0);
    lfo.start(0);

    return { oscillators: [oscillator1, oscillator2], lfo, gain };
}

// Create occasional water drip sounds
function createWaterDrips(ctx, masterGain) {
    const scheduleNextDrip = () => {
        if (!isPlaying) return;

        // Random interval between 3-8 seconds
        const delay = 3 + Math.random() * 5;

        setTimeout(() => {
            if (!isPlaying) return;

            // Create drip sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.03, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);

            scheduleNextDrip();
        }, delay * 1000);
    };

    scheduleNextDrip();
}

// Create subtle air movement/ventilation
function createAirFlow(ctx, masterGain) {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise for air sound
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Band-pass filter for wind-like sound
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 400;
    filter.Q.value = 0.3;

    const gain = ctx.createGain();
    gain.gain.value = 0.04;

    // Slow LFO for variation
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.1;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(0);
    lfo.start(0);

    return { source: noise, lfo, gain, filter };
}

// Create distant metallic creaks
function createMetallicCreaks(ctx, masterGain) {
    const scheduleNextCreak = () => {
        if (!isPlaying) return;

        // Random interval between 8-15 seconds
        const delay = 8 + Math.random() * 7;

        setTimeout(() => {
            if (!isPlaying) return;

            // Create creak sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            filter.type = "bandpass";
            filter.frequency.value = 300 + Math.random() * 200;
            filter.Q.value = 5;

            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(150 + Math.random() * 50, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(130 + Math.random() * 40, ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);

            scheduleNextCreak();
        }, delay * 1000);
    };

    scheduleNextCreak();
}

export function startAmbience(volume = 0.5) {
    if (isPlaying) return;

    const ctx = getAudioContext();

    // Resume context if suspended (for browser autoplay policies)
    if (ctx.state === "suspended") {
        ctx.resume();
    }

    isPlaying = true;

    // Master gain for all ambient sounds
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);

    // Create all ambient layers
    const rumble = createRumble(ctx, masterGain);
    const hum = createElectricalHum(ctx, masterGain);
    const airFlow = createAirFlow(ctx, masterGain);

    // Start random event sounds
    createWaterDrips(ctx, masterGain);
    createMetallicCreaks(ctx, masterGain);

    // Store references for cleanup
    ambienceNodes = [rumble, hum, airFlow, masterGain];
}

export function stopAmbience() {
    isPlaying = false;

    // Clean up all audio nodes
    ambienceNodes.forEach((node) => {
        if (node.source) {
            try {
                node.source.stop();
            } catch (e) {}
        }
        if (node.oscillators) {
            node.oscillators.forEach((osc) => {
                try {
                    osc.stop();
                } catch (e) {}
            });
        }
        if (node.lfo) {
            try {
                node.lfo.stop();
            } catch (e) {}
        }
    });

    ambienceNodes = [];
}

export function setAmbienceVolume(volume) {
    if (ambienceNodes.length > 0) {
        // Last node should be master gain
        const masterGain = ambienceNodes[ambienceNodes.length - 1];
        if (masterGain.gain) {
            masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}

export function isAmbiencePlaying() {
    return isPlaying;
}


