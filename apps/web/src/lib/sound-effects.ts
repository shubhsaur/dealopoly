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
