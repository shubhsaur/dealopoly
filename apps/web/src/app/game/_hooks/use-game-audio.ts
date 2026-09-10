"use client";

import { useEffect } from "react";
import {
  startTableAmbience,
  updateAmbienceVolume,
  stopTableAmbience,
} from "../../../lib/sound-effects";
import type { CasinoMusicTrackId } from "../../../lib/settings";
import {
  startCasinoMusic,
  stopCasinoMusic,
  updateCasinoMusicVolume,
  changeCasinoMusicTrack,
} from "../../../lib/music-player";

interface GameAudioSettings {
  masterMute: boolean;
  ambienceVolume: number;
  musicVolume: number;
  musicTrack: CasinoMusicTrackId;
}

/**
 * Manages the table ambience and casino music lifecycle:
 * starts/stops on mount/unmount, syncs volume & track from settings.
 */
export function useGameAudio(settings: GameAudioSettings) {
  // Table Ambiance life-cycle (casino room presence synthesizer)
  useEffect(() => {
    startTableAmbience();
    return () => {
      stopTableAmbience();
    };
  }, []);

  // Update table ambiance volume when settings change
  useEffect(() => {
    updateAmbienceVolume();
  }, [settings.masterMute, settings.ambienceVolume]);

  // Casino Background Music life-cycle
  useEffect(() => {
    startCasinoMusic();
    return () => {
      stopCasinoMusic();
    };
  }, []);

  // Synchronize background music volume and track changes
  useEffect(() => {
    updateCasinoMusicVolume();
  }, [settings.masterMute, settings.musicVolume, settings.musicTrack]);

  useEffect(() => {
    changeCasinoMusicTrack(settings.musicTrack);
  }, [settings.musicTrack]);
}
