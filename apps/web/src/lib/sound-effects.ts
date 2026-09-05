/**
 * Dealopoly Sound Synthesizer (Web Audio API)
 *
 * Generates crisp, realistic tabletop card & UI sound effects in pure software
 * with ZERO external audio file downloads or bandwidth overhead.
 */

import { getStoredSettings } from "./settings";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
      // Browser autoplay policy might block until explicit user gesture
    });
  }

  return audioCtx;
}

/**
 * Calculates effective volume factoring master mute and user volume preference (0 - 1).
 */
function getEffectiveVolume(userScale = 1): number {
  const settings = getStoredSettings();
  if (settings.masterMute) return 0;
  const sfxScale = (settings.sfxVolume ?? 80) / 100;
  return Math.max(0, Math.min(1, sfxScale * userScale));
}

/**
 * Play an airy paper swoosh when dealing or picking up a card.
 */
export function playCardSwoosh(scale = 1): void {
  const ctx = getAudioContext();
  const volume = getEffectiveVolume(scale);
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;
  const duration = 0.12;

  // Generate a buffer of white noise
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Bandpass filter to sculpt into a crisp airy whoosh
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(600, now + duration);
  filter.Q.setValueAtTime(1.8, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.35 * volume, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + duration);
}

/**
 * Play a solid felt/wood slam when playing a card on the table.
 */
export function playCardSlam(scale = 1): void {
  const ctx = getAudioContext();
  const volume = getEffectiveVolume(scale);
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;

  // 1. Low frequency thump
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(32, now + 0.14);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.6 * volume, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  // 2. Crisp slap snap
  const noiseSize = Math.floor(ctx.sampleRate * 0.05);
  const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(1800, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4 * volume, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.14);
  noise.start(now);
  noise.stop(now + 0.05);
}

/**
 * Play a sparkling metallic chime when banking money, completing a set, or collecting rent.
 */
export function playCoinChime(scale = 1): void {
  const ctx = getAudioContext();
  const volume = getEffectiveVolume(scale);
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;
  const frequencies = [1760, 2640, 3520]; // A6 harmonics
  const duration = 0.35;

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.02);

    const gain = ctx.createGain();
    const peak = (0.2 / (idx + 1)) * volume;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peak, now + idx * 0.02 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.02);
    osc.stop(now + duration);
  });
}

/**
 * Play a short victory fanfare / celebratory jingle.
 */
export function playVictoryFanfare(scale = 1): void {
  const ctx = getAudioContext();
  const volume = getEffectiveVolume(scale);
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;
  // Arpeggio notes (C5, E5, G5, C6)
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.12 },
    { freq: 659.25, time: 0.1, dur: 0.12 },
    { freq: 783.99, time: 0.2, dur: 0.14 },
    { freq: 1046.5, time: 0.32, dur: 0.4 },
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now + time);
    gain.gain.linearRampToValueAtTime(0.28 * volume, now + time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur);
  });
}

/**
 * Play a subtle tactile click for UI switches and buttons.
 */
export function playToggleClick(scale = 1): void {
  const settings = getStoredSettings();
  if (settings.uiSounds === false) return;
  const ctx = getAudioContext();
  const volume = getEffectiveVolume(scale);
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(950, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.02);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.22 * volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.02);
}

/**
 * Play a bright, pleasant 2-note chime when it becomes the player's turn.
 */
export function playYourTurnSound(scale = 1): void {
  const settings = getStoredSettings();
  if (settings.turnAlertSound === false) return;
  const ctx = getAudioContext();
  const volume = getEffectiveVolume(scale);
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 659.25, time: 0.0, dur: 0.16 }, // E5
    { freq: 1046.5, time: 0.09, dur: 0.35 }, // C6
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now + time);
    gain.gain.linearRampToValueAtTime(0.32 * volume, now + time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur);
  });
}

/**
 * Play an urgent double-tick warning sound when timer is running out or during reaction window.
 */
export function playTimerWarningSound(scale = 1): void {
  const settings = getStoredSettings();
  if (settings.timerWarningSound === false) return;
  const ctx = getAudioContext();
  const volume = getEffectiveVolume(scale);
  if (!ctx || volume <= 0) return;

  const now = ctx.currentTime;
  const pings = [
    { freq: 880, time: 0.0, dur: 0.05 },
    { freq: 1100, time: 0.08, dur: 0.07 },
  ];

  pings.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + time + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now + time);
    gain.gain.linearRampToValueAtTime(0.25 * volume, now + time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur);
  });
}

/**
 * Triggers subtle vibration feedback on supporting mobile devices.
 */
export function triggerHaptic(
  type: "light" | "medium" | "heavy" | "success" | "warning" = "light"
): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  const settings = getStoredSettings();
  if (settings.hapticFeedback === false) return;
  if (!("vibrate" in navigator) || typeof navigator.vibrate !== "function") return;

  try {
    switch (type) {
      case "light":
        navigator.vibrate(12);
        break;
      case "medium":
        navigator.vibrate(28);
        break;
      case "heavy":
        navigator.vibrate(50);
        break;
      case "success":
        navigator.vibrate([15, 50, 25]);
        break;
      case "warning":
        navigator.vibrate([30, 40, 30]);
        break;
    }
  } catch {
    // Ignore unsupported vibration errors
  }
}

// ============================================================================
// TABLE AMBIANCE SYNTHESIZER (Pink Noise Felt Filter + 55Hz Warm Sub Drone)
// ============================================================================

let ambienceSource: AudioBufferSourceNode | null = null;
let ambienceDrone: OscillatorNode | null = null;
let ambienceGainNode: GainNode | null = null;
let isAmbienceRunning = false;

function getAmbienceEffectiveGain(): number {
  const settings = getStoredSettings();
  if (settings.masterMute) return 0;
  const vol = (settings.ambienceVolume ?? 40) / 100;
  // Scaled so max volume is subtle (0.12) to stay warm, non-fatiguing, and non-distracting
  return Math.max(0, Math.min(1, vol)) * 0.12;
}

/**
 * Start or resume the warm low-frequency casino lounge hum.
 */
export function startTableAmbience(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (isAmbienceRunning && ambienceGainNode) {
    updateAmbienceVolume();
    return;
  }

  const settings = getStoredSettings();
  if (settings.masterMute || (settings.ambienceVolume ?? 40) <= 0) {
    // Let it initialize so unmuting later smoothly brings it up
  }

  try {
    // 1. Generate 5 seconds of authentic Paul Kellet pink noise
    const duration = 5.0;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // 2. Warm lowpass filter to mimic acoustic felt & room absorption
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, ctx.currentTime);
    filter.Q.setValueAtTime(1.4, ctx.currentTime);

    // 3. Subtle sub-frequency warm hum (55Hz sine) for physical table presence
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.setValueAtTime(55, ctx.currentTime);
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.04, ctx.currentTime);
    drone.connect(droneGain);

    // 4. Master ambience gain node with gentle fade-in
    const masterAmbience = ctx.createGain();
    const targetGain = getAmbienceEffectiveGain();
    masterAmbience.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterAmbience.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.6);

    noise.connect(filter);
    filter.connect(masterAmbience);
    droneGain.connect(masterAmbience);
    masterAmbience.connect(ctx.destination);

    noise.start();
    drone.start();

    ambienceSource = noise;
    ambienceDrone = drone;
    ambienceGainNode = masterAmbience;
    isAmbienceRunning = true;
  } catch {
    // If blocked by browser autoplay policy, it will resume on next user gesture
  }
}

/**
 * Smoothly update the ambient volume level (e.g., when user drags slider or toggles mute).
 */
export function updateAmbienceVolume(): void {
  if (!ambienceGainNode || !audioCtx) return;
  const targetGain = getAmbienceEffectiveGain();
  const now = audioCtx.currentTime;
  ambienceGainNode.gain.cancelScheduledValues(now);
  ambienceGainNode.gain.linearRampToValueAtTime(targetGain, now + 0.15);
}

/**
 * Stop and fade out the table ambiance synthesizer.
 */
export function stopTableAmbience(): void {
  if (!ambienceGainNode || !audioCtx) {
    isAmbienceRunning = false;
    return;
  }

  const now = audioCtx.currentTime;
  ambienceGainNode.gain.cancelScheduledValues(now);
  ambienceGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.3);

  setTimeout(() => {
    try {
      ambienceSource?.stop();
      ambienceDrone?.stop();
      ambienceSource?.disconnect();
      ambienceDrone?.disconnect();
      ambienceGainNode?.disconnect();
    } catch {
      // Ignore cleanup error if already stopped
    }
    ambienceSource = null;
    ambienceDrone = null;
    ambienceGainNode = null;
    isAmbienceRunning = false;
  }, 350);
}
