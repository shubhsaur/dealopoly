/**
 * Casino Background Music Player Engine
 *
 * Streams and loops authentic lounge jazz & casino soundtracks located in
 * /audio/music/ with smooth fading, volume scaling, and autoplay policy handling.
 */

import {
  getStoredSettings,
  CASINO_MUSIC_TRACKS,
  type CasinoMusicTrackId,
  type CasinoTrackInfo,
} from "./settings";

let audioElement: HTMLAudioElement | null = null;
let currentTrackId: CasinoMusicTrackId | null = null;
let fadeInterval: NodeJS.Timeout | null = null;
let autoplayUnlocked = false;
let pendingPlayRequest = false;

function getTrackFilePath(track: CasinoTrackInfo): string {
  return `/audio/music/${track.filename}`;
}

function resolveTrack(trackId: CasinoMusicTrackId): CasinoTrackInfo | null {
  if (trackId === "off" || CASINO_MUSIC_TRACKS.length === 0) return null;

  const fallback = CASINO_MUSIC_TRACKS[0] ?? null;
  if (trackId === "random") {
    const randomIndex = Math.floor(Math.random() * CASINO_MUSIC_TRACKS.length);
    return CASINO_MUSIC_TRACKS[randomIndex] ?? fallback;
  }

  return CASINO_MUSIC_TRACKS.find((t) => t.id === trackId) ?? fallback;
}

function calculateTargetVolume(): number {
  const settings = getStoredSettings();
  if (settings.masterMute || settings.musicTrack === "off") {
    return 0;
  }
  const volPercent = settings.musicVolume ?? 50;
  // Scaled max volume (0.50) so background music sits pleasantly beneath SFX and voices
  return Math.max(0, Math.min(1, (volPercent / 100) * 0.5));
}

function unlockAutoplay(): void {
  if (autoplayUnlocked || typeof window === "undefined") return;

  const onUserGesture = () => {
    autoplayUnlocked = true;
    window.removeEventListener("pointerdown", onUserGesture);
    window.removeEventListener("keydown", onUserGesture);

    if (pendingPlayRequest && audioElement) {
      audioElement.play().catch(() => {
        // Suppress gesture unlock errors
      });
      pendingPlayRequest = false;
    }
  };

  window.addEventListener("pointerdown", onUserGesture, { once: true });
  window.addEventListener("keydown", onUserGesture, { once: true });
}

function clearFader(): void {
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
}

function fadeIn(audio: HTMLAudioElement, targetVolume: number, durationMs = 800): void {
  clearFader();
  if (targetVolume <= 0) {
    audio.volume = 0;
    return;
  }

  const steps = 16;
  const stepTime = durationMs / steps;
  const volumeStep = targetVolume / steps;
  let currentStep = 0;

  audio.volume = 0;
  fadeInterval = setInterval(() => {
    currentStep++;
    const newVol = Math.min(targetVolume, volumeStep * currentStep);
    audio.volume = newVol;

    if (currentStep >= steps) {
      clearFader();
      audio.volume = targetVolume;
    }
  }, stepTime);
}

function fadeOutAndStop(audio: HTMLAudioElement, durationMs = 400, onComplete?: () => void): void {
  clearFader();
  const startVolume = audio.volume;
  if (startVolume <= 0) {
    audio.pause();
    onComplete?.();
    return;
  }

  const steps = 10;
  const stepTime = durationMs / steps;
  const volumeStep = startVolume / steps;
  let currentStep = 0;

  fadeInterval = setInterval(() => {
    currentStep++;
    const newVol = Math.max(0, startVolume - volumeStep * currentStep);
    audio.volume = newVol;

    if (currentStep >= steps || newVol <= 0) {
      clearFader();
      audio.pause();
      audio.volume = 0;
      onComplete?.();
    }
  }, stepTime);
}

/**
 * Start playing the preferred casino music soundtrack.
 */
export function startCasinoMusic(preferredTrack?: CasinoMusicTrackId): void {
  if (typeof window === "undefined") return;

  const settings = getStoredSettings();
  const trackChoice = preferredTrack || settings.musicTrack;

  if (trackChoice === "off") {
    stopCasinoMusic();
    return;
  }

  const resolved = resolveTrack(trackChoice);
  if (!resolved) {
    stopCasinoMusic();
    return;
  }

  const targetVol = calculateTargetVolume();

  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = "auto";
  }

  const isChangingTrack = currentTrackId !== trackChoice || !audioElement.src;

  if (isChangingTrack) {
    currentTrackId = trackChoice;
    audioElement.src = getTrackFilePath(resolved);
    audioElement.loop = trackChoice !== "random";

    if (trackChoice === "random") {
      audioElement.onended = () => {
        // Pick next random track seamlessly
        const next = resolveTrack("random");
        if (next && audioElement) {
          audioElement.src = getTrackFilePath(next);
          audioElement.play().catch(() => {});
        }
      };
    } else {
      audioElement.onended = null;
    }
  }

  const playPromise = audioElement.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        autoplayUnlocked = true;
        pendingPlayRequest = false;
        fadeIn(audioElement!, targetVol);
      })
      .catch((err) => {
        // Autoplay policy prevented immediate playback until user interaction
        if (err.name === "NotAllowedError") {
          pendingPlayRequest = true;
          unlockAutoplay();
        }
      });
  }
}

/**
 * Stop casino music with a gentle fade-out.
 */
export function stopCasinoMusic(): void {
  if (!audioElement) return;
  fadeOutAndStop(audioElement, 400, () => {
    currentTrackId = null;
  });
}

/**
 * Update the volume smoothly in real time when slider moves or mute changes.
 */
export function updateCasinoMusicVolume(): void {
  if (!audioElement) return;
  const target = calculateTargetVolume();
  clearFader();
  audioElement.volume = target;

  const settings = getStoredSettings();
  if (settings.musicTrack === "off" || target <= 0) {
    if (!audioElement.paused) {
      audioElement.pause();
    }
  } else if (audioElement.paused && target > 0) {
    audioElement.play().catch(() => {});
  }
}

/**
 * Switch soundtrack immediately or smoothly.
 */
export function changeCasinoMusicTrack(trackId: CasinoMusicTrackId): void {
  if (trackId === "off") {
    stopCasinoMusic();
    return;
  }
  startCasinoMusic(trackId);
}

/**
 * Check if music is currently active.
 */
export function isCasinoMusicPlaying(): boolean {
  return Boolean(audioElement && !audioElement.paused && audioElement.volume > 0);
}

/**
 * Get the currently loaded track ID.
 */
export function getCurrentCasinoTrackId(): CasinoMusicTrackId | null {
  return currentTrackId;
}
