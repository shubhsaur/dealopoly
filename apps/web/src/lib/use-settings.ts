"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DealopolySettings,
  DEFAULT_SETTINGS,
  getStoredSettings,
  saveSettings,
  updateStoredSettings,
  resetStoredSettings,
  SETTINGS_CHANGE_EVENT,
  STORAGE_KEY_SETTINGS,
} from "./settings";

export function useSettings() {
  const [settings, setSettings] = useState<DealopolySettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial client hydration from storage
    const current = getStoredSettings();
    setSettings(current);
    setIsLoaded(true);

    // Reactive listener for in-page updates
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<DealopolySettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };

    // Reactive listener for cross-tab updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_SETTINGS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener(SETTINGS_CHANGE_EVENT, handleCustomChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateSetting = useCallback(
    <K extends keyof DealopolySettings>(key: K, value: DealopolySettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  const updateMultipleSettings = useCallback(
    (partial: Partial<DealopolySettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  const resetSettings = useCallback(() => {
    const reset = resetStoredSettings();
    setSettings(reset);
  }, []);

  return {
    settings,
    isLoaded,
    updateSetting,
    updateSettings: updateMultipleSettings,
    resetSettings,
  };
}
