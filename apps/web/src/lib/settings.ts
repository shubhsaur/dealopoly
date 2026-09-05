import { getStoredProfile, saveProfileName } from "./session";

export interface DealopolySettings {
  // 1. Profile & Identity
  playerName: string;
  customTag: string;
  avatarId: "default" | "tycoon" | "banker" | "shark" | "shuffler";

  // 2. Gameplay & Table
  defaultGame: "monodeal" | "lowdeck";
  defaultBotDifficulty: "easy" | "medium" | "hard" | "expert";
  cardSortMode: "color" | "value" | "type" | "none";
  confirmPlayAction: boolean;
  autoPassTimer: boolean;

  // 3. Audio & Haptics
  masterMute: boolean;
  sfxVolume: number; // 0 - 100
  ambienceVolume: number; // 0 - 100
  turnAlertSound: boolean;
  timerWarningSound: boolean;
  uiSounds: boolean;
  hapticFeedback: boolean;

  // 4. Themes & Visuals
  tableTheme: "dark" | "casino" | "navy" | "arcade";
  cardBackDesign: "classic" | "gold" | "carbon";
  animationSpeed: "cinematic" | "snappy" | "reduced";

  // 5. Multiplayer & Privacy
  defaultRoomPrivate: boolean;
  allowSpectators: boolean;
  showReactions: boolean;
}

export const DEFAULT_SETTINGS: DealopolySettings = {
  playerName: "Player",
  customTag: "@player",
  avatarId: "default",

  defaultGame: "monodeal",
  defaultBotDifficulty: "medium",
  cardSortMode: "color",
  confirmPlayAction: true,
  autoPassTimer: false,

  masterMute: false,
  sfxVolume: 80,
  ambienceVolume: 40,
  turnAlertSound: true,
  timerWarningSound: true,
  uiSounds: true,
  hapticFeedback: true,

  tableTheme: "dark",
  cardBackDesign: "classic",
  animationSpeed: "snappy",

  defaultRoomPrivate: false,
  allowSpectators: true,
  showReactions: true,
};

export const STORAGE_KEY_SETTINGS = "dealopoly_settings";
export const SETTINGS_CHANGE_EVENT = "dealopoly:settings-updated";

/**
 * Retrieve saved settings from localStorage, merging with defaults.
 */
export function getStoredSettings(): DealopolySettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const existingProfile = getStoredProfile();

    if (raw) {
      const parsed = JSON.parse(raw);
      const defaultGame =
        parsed.defaultGame === "lowdeck" ? "lowdeck" : "monodeal";
      return {
        ...DEFAULT_SETTINGS,
        playerName: existingProfile.name || parsed.playerName || DEFAULT_SETTINGS.playerName,
        ...parsed,
        defaultGame,
      };
    }

    // Initialize with existing profile name if available
    return {
      ...DEFAULT_SETTINGS,
      playerName: existingProfile.name || DEFAULT_SETTINGS.playerName,
      customTag: `@${existingProfile.name.toLowerCase().replace(/[^a-z0-9_]/g, "")}`,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to localStorage and notify all subscribers.
 */
export function saveSettings(settings: DealopolySettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));

    // Keep session profile name in sync with settings
    if (settings.playerName) {
      saveProfileName(settings.playerName);
    }

    // Dispatch event for reactive in-page updates
    window.dispatchEvent(
      new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings })
    );
  } catch {
    // Ignore quota errors
  }
}

/**
 * Update a subset of settings fields.
 */
export function updateStoredSettings(
  partial: Partial<DealopolySettings>
): DealopolySettings {
  const current = getStoredSettings();
  const updated = { ...current, ...partial };
  saveSettings(updated);
  return updated;
}

/**
 * Reset all settings to factory defaults.
 */
export function resetStoredSettings(): DealopolySettings {
  const profile = getStoredProfile();
  const reset: DealopolySettings = {
    ...DEFAULT_SETTINGS,
    playerName: profile.name || DEFAULT_SETTINGS.playerName,
    customTag: `@${profile.name.toLowerCase().replace(/[^a-z0-9_]/g, "")}`,
  };
  saveSettings(reset);
  return reset;
}
