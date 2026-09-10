"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/use-settings";
import {
  CASINO_MUSIC_TRACKS,
  type CasinoMusicTrackId,
  type DealopolySettings,
} from "@/lib/settings";
import {
  playCardSlam,
  playCoinChime,
  playToggleClick,
  triggerHaptic,
  updateAmbienceVolume,
} from "@/lib/sound-effects";
import {
  updateCasinoMusicVolume,
  changeCasinoMusicTrack,
} from "@/lib/music-player";

type SettingsTab = "audio" | "gameplay" | "appearance";

interface GameSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameType?: string;
}

const TABLE_THEMES: Array<{
  id: DealopolySettings["tableTheme"];
  name: string;
  colorHex: string;
}> = [
  { id: "dark", name: "Midnight", colorHex: "#182030" },
  { id: "casino", name: "Casino Felt", colorHex: "#0f5132" },
  { id: "navy", name: "Royal Navy", colorHex: "#0d2b45" },
  { id: "arcade", name: "Cyber Arcade", colorHex: "#2b0a3d" },
];

const CARD_BACK_OPTIONS: Array<{
  id: DealopolySettings["cardBackDesign"];
  name: string;
  desc: string;
}> = [
  { id: "classic", name: "Classic Gold", desc: "Original iconic gold patterned back" },
  { id: "gold", name: "Emerald Royale", desc: "Gold foil trim with deep emerald weave" },
  { id: "carbon", name: "Carbon Obsidian", desc: "Stealth matte carbon texture" },
];

export function GameSettingsDialog({
  isOpen,
  onClose,
  gameType = "monodeal",
}: GameSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("audio");
  const { settings, updateSetting } = useSettings();

  if (!isOpen) {
    return null;
  }

  const handleMasterMuteChange = (checked: boolean) => {
    playToggleClick();
    updateSetting("masterMute", checked);
    setTimeout(() => {
      updateCasinoMusicVolume();
      updateAmbienceVolume();
    }, 50);
  };

  const handleSfxChange = (volume: number) => {
    updateSetting("sfxVolume", volume);
  };

  const handleMusicVolumeChange = (volume: number) => {
    updateSetting("musicVolume", volume);
    updateCasinoMusicVolume();
  };

  const handleMusicTrackChange = (trackId: CasinoMusicTrackId) => {
    playToggleClick();
    updateSetting("musicTrack", trackId);
    changeCasinoMusicTrack(trackId);
  };

  const handleAmbienceChange = (volume: number) => {
    updateSetting("ambienceVolume", volume);
    updateAmbienceVolume();
  };

  return (
    <div
      className="join-dialog-overlay"
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 300 }}
      onClick={onClose}
    >
      <div className="dialog-scrim" />
      <div
        className="dialog-panel game-settings-dialog-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        {/* Dialog Header */}
        <div className="dialog-header">
          <div className="u-flex-center-8">
            <span
              className="material-symbols-outlined u-color-primary"
              style={{ fontSize: "24px" }}
            >
              tune
            </span>
            <h2 className="u-text-lg u-m0">Game Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="dialog-close-btn"
          >
            <span className="material-symbols-outlined u-text-20">
              close
            </span>
          </button>
        </div>

        {/* Tabs Segmented Bar */}
        <div
          role="tablist"
          aria-label="Game Settings Sections"
          className="u-flex u-gap-6"
          style={{
            padding: "8px 16px 0",
            borderBottom: "1px solid var(--outline-variant)",
            background: "rgba(0,0,0,0.15)",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            role="tab"
            id="settings-tab-audio"
            aria-selected={activeTab === "audio"}
            aria-controls="settings-tabpanel-audio"
            className="u-flex-center u-gap-6 u-flex-1 u-text-4sm u-fw-700"
            onClick={() => {
              playToggleClick();
              setActiveTab("audio");
            }}
            style={{
              padding: "9px 8px",
              border: "none",
              borderBottom: `2px solid ${activeTab === "audio" ? "var(--primary)" : "transparent"}`,
              background: "transparent",
              color: activeTab === "audio" ? "var(--primary)" : "var(--muted)",
              cursor: "pointer",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <span className="material-symbols-outlined u-text-18">
              volume_up
            </span>
            <span>Audio</span>
          </button>

          <button
            type="button"
            role="tab"
            id="settings-tab-gameplay"
            aria-selected={activeTab === "gameplay"}
            aria-controls="settings-tabpanel-gameplay"
            className="u-flex-center u-gap-6 u-flex-1 u-text-4sm u-fw-700"
            onClick={() => {
              playToggleClick();
              setActiveTab("gameplay");
            }}
            style={{
              padding: "9px 8px",
              border: "none",
              borderBottom: `2px solid ${activeTab === "gameplay" ? "var(--primary)" : "transparent"}`,
              background: "transparent",
              color: activeTab === "gameplay" ? "var(--primary)" : "var(--muted)",
              cursor: "pointer",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <span className="material-symbols-outlined u-text-18">
              sports_esports
            </span>
            <span>Gameplay</span>
          </button>

          <button
            type="button"
            role="tab"
            id="settings-tab-appearance"
            aria-selected={activeTab === "appearance"}
            aria-controls="settings-tabpanel-appearance"
            className="u-flex-center u-gap-6 u-flex-1 u-text-4sm u-fw-700"
            onClick={() => {
              playToggleClick();
              setActiveTab("appearance");
            }}
            style={{
              padding: "9px 8px",
              border: "none",
              borderBottom: `2px solid ${activeTab === "appearance" ? "var(--primary)" : "transparent"}`,
              background: "transparent",
              color: activeTab === "appearance" ? "var(--primary)" : "var(--muted)",
              cursor: "pointer",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <span className="material-symbols-outlined u-text-18">
              palette
            </span>
            <span>Table</span>
          </button>
        </div>

        {/* Dialog Body */}
        <div className="dialog-body game-settings-dialog-body">
          {/* TAB 1: AUDIO & SOUND */}
          <div
            role="tabpanel"
            id="settings-tabpanel-audio"
            aria-labelledby="settings-tab-audio"
            className="game-settings-tab-pane"
            style={{ display: activeTab === "audio" ? "flex" : "none" }}
          >
              {/* Master Mute */}
              <div
                className="u-flex-between"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: settings.masterMute ? "rgba(239, 68, 68, 0.1)" : "var(--surface)",
                  border: `1px solid ${settings.masterMute ? "rgba(239, 68, 68, 0.3)" : "var(--outline-variant)"}`,
                }}
              >
                <div>
                  <b className="u-text-base" style={{ display: "block", color: "var(--text)" }}>
                    Master Audio
                  </b>
                  <span style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                    {settings.masterMute ? "All sounds muted" : "All audio enabled"}
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={!settings.masterMute}
                    onChange={(e) => handleMasterMuteChange(!e.target.checked)}
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              {/* Sound Effects Volume */}
              <div
                className="u-flex-col-8"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  opacity: settings.masterMute ? 0.45 : 1,
                }}
              >
                <div className="u-flex-between">
                  <span className="u-fw-700" style={{ fontSize: "0.84rem", color: "var(--text)" }}>
                    Sound Effects
                  </span>
                  <div className="u-flex-center-8">
                    <button
                      type="button"
                      disabled={settings.masterMute || settings.sfxVolume === 0}
                      onClick={() => {
                        playCardSlam();
                        triggerHaptic("medium");
                      }}
                      className="button button--subtle u-text-sm"
                      style={{ padding: "4px 8px" }}
                    >
                      Test SFX
                    </button>
                    <span className="u-color-primary" style={{ fontSize: "0.8rem", fontFamily: "var(--mono)" }}>
                      {settings.sfxVolume}%
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={settings.masterMute}
                  value={settings.sfxVolume}
                  onChange={(e) => handleSfxChange(Number(e.target.value))}
                  className="settings-range-input"
                />
              </div>

              {/* Casino Background Music */}
              <div
                className="u-flex-col u-gap-10"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  opacity: settings.masterMute ? 0.45 : 1,
                }}
              >
                <div className="u-flex-between">
                  <span className="u-fw-700" style={{ fontSize: "0.84rem", color: "var(--text)" }}>
                    Background Music
                  </span>
                  <span className="u-color-primary" style={{ fontSize: "0.8rem", fontFamily: "var(--mono)" }}>
                    {settings.musicTrack === "off" ? "Off" : `${settings.musicVolume}%`}
                  </span>
                </div>

                <div className="u-flex-col u-gap-6">
                  <span className="u-caption" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Soundtrack Track:
                  </span>
                  <div className="u-grid-2 u-gap-6">
                    {CASINO_MUSIC_TRACKS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={settings.masterMute}
                        onClick={() => handleMusicTrackChange(t.id)}
                        className="u-fw-700"
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: `1px solid ${settings.musicTrack === t.id ? "var(--primary)" : "var(--outline-variant)"}`,
                          background: settings.musicTrack === t.id ? "rgba(0, 85, 164, 0.2)" : "var(--surface-high)",
                          color: settings.musicTrack === t.id ? "var(--primary)" : "var(--text)",
                          fontSize: "0.74rem",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        {t.title}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={settings.masterMute}
                      onClick={() => handleMusicTrackChange("off")}
                      className="u-fw-700"
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: `1px solid ${settings.musicTrack === "off" ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: settings.musicTrack === "off" ? "rgba(239, 68, 68, 0.2)" : "var(--surface-high)",
                        color: settings.musicTrack === "off" ? "#ef4444" : "var(--text)",
                        fontSize: "0.74rem",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      Mute Music
                    </button>
                  </div>
                </div>

                {settings.musicTrack !== "off" && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={settings.masterMute}
                    value={settings.musicVolume}
                    onChange={(e) => handleMusicVolumeChange(Number(e.target.value))}
                    className="settings-range-input"
                    style={{ marginTop: "4px" }}
                  />
                )}
              </div>

              {/* Casino Table Ambience */}
              <div
                className="u-flex-col-8"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  opacity: settings.masterMute ? 0.45 : 1,
                }}
              >
                <div className="u-flex-between">
                  <div>
                    <span className="u-fw-700" style={{ fontSize: "0.84rem", color: "var(--text)", display: "block" }}>
                      Casino Ambience
                    </span>
                    <span className="u-caption">
                      Subtle background card shuffle and casino room murmur
                    </span>
                  </div>
                  <span className="u-color-primary" style={{ fontSize: "0.8rem", fontFamily: "var(--mono)" }}>
                    {settings.ambienceVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={settings.masterMute}
                  value={settings.ambienceVolume}
                  onChange={(e) => handleAmbienceChange(Number(e.target.value))}
                  className="settings-range-input"
                />
              </div>

              {/* Haptic Feedback */}
              <div
                className="u-flex-between"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <div>
                  <b style={{ fontSize: "0.84rem", display: "block", color: "var(--text)" }}>
                    Vibration & Haptics
                  </b>
                  <span className="u-caption">
                    Haptic touch feedback on mobile when slamming cards or clicking buttons
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.hapticFeedback}
                    onChange={(e) => {
                      playToggleClick();
                      if (e.target.checked) triggerHaptic("medium");
                      updateSetting("hapticFeedback", e.target.checked);
                    }}
                  />
                  <span className="settings-slider" />
                </label>
              </div>
          </div>

          {/* TAB 2: GAMEPLAY */}
          <div
            role="tabpanel"
            id="settings-tabpanel-gameplay"
            aria-labelledby="settings-tab-gameplay"
            className="game-settings-tab-pane"
            style={{ display: activeTab === "gameplay" ? "flex" : "none" }}
          >
              {/* Auto-Pass Timer */}
              <div
                className="u-flex-between"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <div style={{ paddingRight: "12px" }}>
                  <b style={{ fontSize: "0.84rem", display: "block", color: "var(--text)" }}>
                    Auto-Pass Turn
                  </b>
                  <span className="u-caption" style={{ lineHeight: 1.35, display: "block" }}>
                    Automatically ends turn 0.5s after using all 3 actions, keeping games fast and fluid
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoPassTimer}
                    onChange={(e) => {
                      playToggleClick();
                      updateSetting("autoPassTimer", e.target.checked);
                    }}
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              {/* Confirm Action Cards */}
              <div
                className="u-flex-between"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <div style={{ paddingRight: "12px" }}>
                  <b style={{ fontSize: "0.84rem", display: "block", color: "var(--text)" }}>
                    Confirm Action Plays
                  </b>
                  <span className="u-caption" style={{ lineHeight: 1.35, display: "block" }}>
                    Show quick verification prompt when playing game-changing cards like Deal Breaker
                  </span>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.confirmPlayAction}
                    onChange={(e) => {
                      playToggleClick();
                      updateSetting("confirmPlayAction", e.target.checked);
                    }}
                  />
                  <span className="settings-slider" />
                </label>
              </div>

              {/* Card Sorting Mode */}
              <div
                className="u-flex-col-8"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <b style={{ fontSize: "0.84rem", color: "var(--text)" }}>Card Sorting Mode</b>
                <div className="u-grid-2 u-gap-6">
                  {(["color", "value", "type", "none"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        playToggleClick();
                        updateSetting("cardSortMode", mode);
                      }}
                      className="u-fw-700"
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: `1px solid ${settings.cardSortMode === mode ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: settings.cardSortMode === mode ? "rgba(0, 85, 164, 0.2)" : "var(--surface-high)",
                        color: settings.cardSortMode === mode ? "var(--primary)" : "var(--text)",
                        fontSize: "0.76rem",
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    >
                      {mode === "none" ? "Hand Order" : `By ${mode}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Speed */}
              <div
                className="u-flex-col-8"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <b style={{ fontSize: "0.84rem", color: "var(--text)" }}>Animation Speed</b>
                <div className="u-grid-3 u-gap-6">
                  {(["cinematic", "snappy", "reduced"] as const).map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        playToggleClick();
                        updateSetting("animationSpeed", speed);
                      }}
                      className="u-fw-700"
                      style={{
                        padding: "8px 6px",
                        borderRadius: "8px",
                        border: `1px solid ${settings.animationSpeed === speed ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: settings.animationSpeed === speed ? "rgba(0, 85, 164, 0.2)" : "var(--surface-high)",
                        color: settings.animationSpeed === speed ? "var(--primary)" : "var(--text)",
                        fontSize: "0.74rem",
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    >
                      {speed === "reduced" ? "Reduced Motion" : speed}
                    </button>
                  ))}
                </div>
              </div>
          </div>

          {/* TAB 3: APPEARANCE & TABLE THEME */}
          <div
            role="tabpanel"
            id="settings-tabpanel-appearance"
            aria-labelledby="settings-tab-appearance"
            className="game-settings-tab-pane"
            style={{ display: activeTab === "appearance" ? "flex" : "none" }}
          >
              {/* Table Theme Selection */}
              <div
                className="u-flex-col-8"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <b style={{ fontSize: "0.84rem", color: "var(--text)" }}>Table Felt Color</b>
                <div className="u-grid-2 u-gap-8">
                  {TABLE_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        playToggleClick();
                        updateSetting("tableTheme", theme.id);
                      }}
                      className="u-text-3sm u-fw-800 u-text-center"
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: `2px solid ${settings.tableTheme === theme.id ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: theme.colorHex,
                        color: "#FFFFFF",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Back Selection */}
              <div
                className="u-flex-col-8"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <b style={{ fontSize: "0.84rem", color: "var(--text)" }}>Card Back Style</b>
                <div className="u-flex-col u-gap-6">
                  {CARD_BACK_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        playToggleClick();
                        updateSetting("cardBackDesign", opt.id);
                      }}
                      className="u-flex-between u-text-3sm u-fw-700"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: `1px solid ${settings.cardBackDesign === opt.id ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: settings.cardBackDesign === opt.id ? "rgba(0, 85, 164, 0.2)" : "var(--surface-high)",
                        color: settings.cardBackDesign === opt.id ? "var(--primary)" : "var(--text)",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div>
                        <span style={{ display: "block" }}>{opt.name}</span>
                        <span className="u-text-xs" style={{ color: "var(--muted)", fontWeight: 500 }}>
                          {opt.desc}
                        </span>
                      </div>
                      {settings.cardBackDesign === opt.id && (
                        <span className="material-symbols-outlined u-text-18">
                          check_circle
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="dialog-footer u-gap-10">
          <Link
            href="/settings"
            onClick={onClose}
            className="button button--secondary u-inline-flex u-flex-1 u-text-4sm u-gap-6"
            style={{
              justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              open_in_new
            </span>
            Full Settings
          </Link>
          <button
            type="button"
            className="button button--primary u-flex-1 u-text-4sm"
            style={{ justifyContent: "center" }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
