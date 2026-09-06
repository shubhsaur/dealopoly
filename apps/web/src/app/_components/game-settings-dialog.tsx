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
        className="dialog-panel"
        style={{ maxWidth: "520px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        {/* Dialog Header */}
        <div className="dialog-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--primary)", fontSize: "24px" }}
            >
              tune
            </span>
            <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Game Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="dialog-close-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              close
            </span>
          </button>
        </div>

        {/* Tabs Segmented Bar */}
        <div
          style={{
            display: "flex",
            padding: "8px 16px 0",
            borderBottom: "1px solid var(--outline-variant)",
            gap: "6px",
            background: "rgba(0,0,0,0.15)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              playToggleClick();
              setActiveTab("audio");
            }}
            style={{
              flex: 1,
              padding: "9px 8px",
              border: "none",
              borderBottom: `2px solid ${activeTab === "audio" ? "var(--primary)" : "transparent"}`,
              background: "transparent",
              color: activeTab === "audio" ? "var(--primary)" : "var(--muted)",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              volume_up
            </span>
            <span>Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playToggleClick();
              setActiveTab("gameplay");
            }}
            style={{
              flex: 1,
              padding: "9px 8px",
              border: "none",
              borderBottom: `2px solid ${activeTab === "gameplay" ? "var(--primary)" : "transparent"}`,
              background: "transparent",
              color: activeTab === "gameplay" ? "var(--primary)" : "var(--muted)",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              sports_esports
            </span>
            <span>Gameplay</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playToggleClick();
              setActiveTab("appearance");
            }}
            style={{
              flex: 1,
              padding: "9px 8px",
              border: "none",
              borderBottom: `2px solid ${activeTab === "appearance" ? "var(--primary)" : "transparent"}`,
              background: "transparent",
              color: activeTab === "appearance" ? "var(--primary)" : "var(--muted)",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              palette
            </span>
            <span>Table</span>
          </button>
        </div>

        {/* Dialog Body */}
        <div
          className="dialog-body"
          style={{
            padding: "16px 20px",
            overflowY: "auto",
            maxHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* TAB 1: AUDIO & SOUND */}
          {activeTab === "audio" && (
            <>
              {/* Master Mute */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: settings.masterMute ? "rgba(239, 68, 68, 0.1)" : "var(--surface)",
                  border: `1px solid ${settings.masterMute ? "rgba(239, 68, 68, 0.3)" : "var(--outline-variant)"}`,
                }}
              >
                <div>
                  <b style={{ fontSize: "0.88rem", display: "block", color: "var(--text)" }}>
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  opacity: settings.masterMute ? 0.45 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text)" }}>
                    Sound Effects
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      disabled={settings.masterMute || settings.sfxVolume === 0}
                      onClick={() => {
                        playCardSlam();
                        triggerHaptic("medium");
                      }}
                      className="button button--subtle"
                      style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                    >
                      Test SFX
                    </button>
                    <span style={{ fontSize: "0.8rem", fontFamily: "var(--mono)", color: "var(--primary)" }}>
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  opacity: settings.masterMute ? 0.45 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text)" }}>
                    Background Music
                  </span>
                  <span style={{ fontSize: "0.8rem", fontFamily: "var(--mono)", color: "var(--primary)" }}>
                    {settings.musicTrack === "off" ? "Off" : `${settings.musicVolume}%`}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Soundtrack Track:
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {CASINO_MUSIC_TRACKS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={settings.masterMute}
                        onClick={() => handleMusicTrackChange(t.id)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: `1px solid ${settings.musicTrack === t.id ? "var(--primary)" : "var(--outline-variant)"}`,
                          background: settings.musicTrack === t.id ? "rgba(0, 85, 164, 0.2)" : "var(--surface-high)",
                          color: settings.musicTrack === t.id ? "var(--primary)" : "var(--text)",
                          fontSize: "0.74rem",
                          fontWeight: 700,
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
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: `1px solid ${settings.musicTrack === "off" ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: settings.musicTrack === "off" ? "rgba(239, 68, 68, 0.2)" : "var(--surface-high)",
                        color: settings.musicTrack === "off" ? "#ef4444" : "var(--text)",
                        fontSize: "0.74rem",
                        fontWeight: 700,
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  opacity: settings.masterMute ? 0.45 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text)", display: "block" }}>
                      Casino Ambience
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                      Subtle background card shuffle and casino room murmur
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8rem", fontFamily: "var(--mono)", color: "var(--primary)" }}>
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
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
            </>
          )}

          {/* TAB 2: GAMEPLAY */}
          {activeTab === "gameplay" && (
            <>
              {/* Auto-Pass Timer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.35, display: "block" }}>
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.35, display: "block" }}>
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <b style={{ fontSize: "0.84rem", color: "var(--text)" }}>Card Sorting Mode</b>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {(["color", "value", "type", "none"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        playToggleClick();
                        updateSetting("cardSortMode", mode);
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: `1px solid ${settings.cardSortMode === mode ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: settings.cardSortMode === mode ? "rgba(0, 85, 164, 0.2)" : "var(--surface-high)",
                        color: settings.cardSortMode === mode ? "var(--primary)" : "var(--text)",
                        fontSize: "0.76rem",
                        fontWeight: 700,
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <b style={{ fontSize: "0.84rem", color: "var(--text)" }}>Animation Speed</b>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  {(["cinematic", "snappy", "reduced"] as const).map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        playToggleClick();
                        updateSetting("animationSpeed", speed);
                      }}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "8px",
                        border: `1px solid ${settings.animationSpeed === speed ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: settings.animationSpeed === speed ? "rgba(0, 85, 164, 0.2)" : "var(--surface-high)",
                        color: settings.animationSpeed === speed ? "var(--primary)" : "var(--text)",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    >
                      {speed === "reduced" ? "Reduced Motion" : speed}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 3: APPEARANCE & TABLE THEME */}
          {activeTab === "appearance" && (
            <>
              {/* Table Theme Selection */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <b style={{ fontSize: "0.84rem", color: "var(--text)" }}>Table Felt Color</b>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {TABLE_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        playToggleClick();
                        updateSetting("tableTheme", theme.id);
                      }}
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: `2px solid ${settings.tableTheme === theme.id ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: theme.colorHex,
                        color: "#FFFFFF",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        textAlign: "center",
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <b style={{ fontSize: "0.84rem", color: "var(--text)" }}>Card Back Style</b>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {CARD_BACK_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        playToggleClick();
                        updateSetting("cardBackDesign", opt.id);
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: `1px solid ${settings.cardBackDesign === opt.id ? "var(--primary)" : "var(--outline-variant)"}`,
                        background: settings.cardBackDesign === opt.id ? "rgba(0, 85, 164, 0.2)" : "var(--surface-high)",
                        color: settings.cardBackDesign === opt.id ? "var(--primary)" : "var(--text)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <span style={{ display: "block" }}>{opt.name}</span>
                        <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 500 }}>
                          {opt.desc}
                        </span>
                      </div>
                      {settings.cardBackDesign === opt.id && (
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                          check_circle
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="dialog-footer" style={{ gap: "10px" }}>
          <Link
            href="/settings"
            onClick={onClose}
            className="button button--secondary"
            style={{
              flex: 1,
              justifyContent: "center",
              fontSize: "0.82rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              open_in_new
            </span>
            Full Settings
          </Link>
          <button
            type="button"
            className="button button--primary"
            style={{ flex: 1, justifyContent: "center", fontSize: "0.82rem" }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
