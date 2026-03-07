// Synthetic Web Audio API sounds for notifications (doesn't require MP3 files)

let audioContext: AudioContext | null = null;
let adminInterval: NodeJS.Timeout | null = null;

export const initAudioContext = () => {
    if (typeof window === "undefined") return;
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
};

// Keep track of active oscillator nodes so we can stop them
let activeAdminOscillators: OscillatorNode[] = [];
let activeAdminGain: GainNode | null = null;
let isAdminAlerting = false;

export const startAdminAlert = () => {
    if (typeof window === "undefined") return;
    initAudioContext();

    if (isAdminAlerting || !audioContext) return;
    isAdminAlerting = true;

    // A discrete, premium pulsing chime (E major triad)
    const freqs = [329.63, 415.30, 493.88]; // E4, G#4, B4
    const oscillators: OscillatorNode[] = [];
    const gainNode = audioContext.createGain();

    freqs.forEach(freq => {
        const osc = audioContext!.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioContext!.currentTime);
        osc.connect(gainNode);
        osc.start();
        oscillators.push(osc);
    });

    // Create a periodic pulsing gain envelope (on for 0.4s, off for 0.6s)
    const now = audioContext.currentTime;
    for (let i = 0; i < 300; i++) { // Pulse for 5 mins max
        const pulseStart = now + (i * 1.0);
        gainNode.gain.setTargetAtTime(0.4, pulseStart, 0.05);
        gainNode.gain.setTargetAtTime(0, pulseStart + 0.4, 0.05);
    }

    gainNode.connect(audioContext.destination);

    activeAdminOscillators = oscillators;
    activeAdminGain = gainNode;
};

export const stopAdminAlert = () => {
    if (!isAdminAlerting || !audioContext || !activeAdminGain) return;

    // Quick fade out to prevent speaker pop
    activeAdminGain.gain.setValueAtTime(activeAdminGain.gain.value, audioContext.currentTime);
    activeAdminGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);

    // Stop and disconnect after fade out
    setTimeout(() => {
        activeAdminOscillators.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch (e) { }
        });
        activeAdminGain?.disconnect();
        activeAdminOscillators = [];
        activeAdminGain = null;
    }, 150);

    isAdminAlerting = false;
};

// Water-specific alert (different frequency and pulsing rhythm)
let isWaterAlerting = false;
let activeWaterOscillators: OscillatorNode[] = [];
let activeWaterGain: GainNode | null = null;

export const startWaterAlert = () => {
    if (typeof window === "undefined") return;
    initAudioContext();

    if (isWaterAlerting || !audioContext) return;
    isWaterAlerting = true;

    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.type = "sine";
    // Higher, more "urgent" but "liquid" frequency
    osc.frequency.setValueAtTime(880, audioContext.currentTime);

    // Create a pulsing rhythm for water (on-off)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    // Create the pulse loop
    const now = audioContext.currentTime;
    for (let i = 0; i < 60; i++) {
        gainNode.gain.setTargetAtTime(0.4, now + (i * 0.4), 0.05);
        gainNode.gain.setTargetAtTime(0, now + (i * 0.4) + 0.2, 0.05);
    }

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc.start();

    activeWaterOscillators = [osc];
    activeWaterGain = gainNode;
};

export const stopWaterAlert = () => {
    if (!isWaterAlerting || !audioContext || !activeWaterGain) return;

    activeWaterGain.gain.cancelScheduledValues(audioContext.currentTime);
    activeWaterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);

    setTimeout(() => {
        activeWaterOscillators.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch (e) { }
        });
        activeWaterGain?.disconnect();
        activeWaterOscillators = [];
        activeWaterGain = null;
    }, 150);

    isWaterAlerting = false;
};

export const playGuestNotification = () => {
    if (typeof window === "undefined") return;
    initAudioContext();

    if (!audioContext) return;

    // A premium, lush crystalline bell sound
    const playBell = (freq: number, startTime: number, outGain: number = 0.5) => {
        const osc = audioContext!.createOscillator();
        const gain = audioContext!.createGain();

        // Sine wave is smooth and "bell-like" when envelope is right
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        // Pluck attack
        gain.gain.linearRampToValueAtTime(outGain, startTime + 0.02);
        // Long smooth decay
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.0);

        osc.connect(gain);
        gain.connect(audioContext!.destination);

        osc.start(startTime);
        osc.stop(startTime + 2.0);
    };

    const now = audioContext.currentTime;
    // Major 7th arpeggio (Cmaj9) for a very relaxing, premium "hotel" feel
    // C5, E5, G5, B5, D6
    playBell(523.25, now, 0.4);         // C5
    playBell(659.25, now + 0.08, 0.3);  // E5
    playBell(783.99, now + 0.16, 0.25); // G5
    playBell(987.77, now + 0.24, 0.2);  // B5
    playBell(1174.66, now + 0.32, 0.15); // D6
};

export const playSuccessNotification = () => {
    if (typeof window === "undefined") return;
    initAudioContext();

    if (!audioContext) return;

    // A slightly more energetic and bright "success / completed" sound
    const playSparkle = (freq: number, startTime: number, outGain: number = 0.5) => {
        const osc = audioContext!.createOscillator();
        const gain = audioContext!.createGain();

        // Mixing sine with a bit of a brighter shape (sine is fine here but fast envelope)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        // Fast pitch envelope for a "sparkle" effect (optional, keep it simple first)

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(outGain, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);

        osc.connect(gain);
        gain.connect(audioContext!.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.0);
    };

    const now = audioContext.currentTime;
    // Fast, ascending major pentatonic flourish for success feeling
    playSparkle(523.25, now, 0.3);          // C5
    playSparkle(659.25, now + 0.1, 0.3);    // E5
    playSparkle(783.99, now + 0.2, 0.3);    // G5
    playSparkle(1046.50, now + 0.3, 0.4);   // C6 (Triumphant finish)
};
