"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MarketingNav } from "../_components/marketing-nav";
import { BackButton } from "../_components/back-button";
import { CardBack } from "../_components/card";
import { useSettings } from "@/lib/use-settings";
import { DealopolySettings } from "@/lib/settings";
import {
  playCardSwoosh,
  playCardSlam,
  playCoinChime,
  playVictoryFanfare,
  playToggleClick,
  playYourTurnSound,
  playTimerWarningSound,
  triggerHaptic,
  startTableAmbience,
  updateAmbienceVolume,
  stopTableAmbience,
} from "@/lib/sound-effects";

type TabId = "profile" | "gameplay" | "audio" | "themes" | "privacy" | "system";

const AVATAR_OPTIONS: Array<{
  id: DealopolySettings["avatarId"];
  title: string;
  subtitle: string;
  icon: string;
  gradientClass: string;
}> = [
  {
    id: "default",
    title: "Dealmaker",
    subtitle: "Classic Player",
    icon: "person",
    gradientClass: "settings-avatar-preview--default",
  },
  {
    id: "tycoon",
    title: "Tycoon",
    subtitle: "Real Estate Mogul",
    icon: "workspace_premium",
    gradientClass: "settings-avatar-preview--tycoon",
  },
  {
    id: "banker",
    title: "High Banker",
    subtitle: "Vault Master",
    icon: "account_balance",
    gradientClass: "settings-avatar-preview--banker",
  },
  {
    id: "shark",
    title: "Deal Shark",
    subtitle: "Aggressive Negotiator",
    icon: "diamond",
    gradientClass: "settings-avatar-preview--shark",
  },
  {
    id: "shuffler",
    title: "Master Shuffler",
    subtitle: "Card Virtuoso",
    icon: "style",
    gradientClass: "settings-avatar-preview--shuffler",
  },
];

const TABLE_FELT_OPTIONS: Array<{
  id: DealopolySettings["tableTheme"];
  name: string;
  desc: string;
  colorHex: string;
  feltClass: string;
}> = [
  {
    id: "dark",
    name: "Midnight Charcoal",
    desc: "Stealth dark room aesthetic",
    colorHex: "#1b242e",
    feltClass: "settings-felt--dark",
  },
  {
    id: "casino",
    name: "Casino Emerald",
    desc: "Traditional green felt luxury",
    colorHex: "#0f5132",
    feltClass: "settings-felt--casino",
  },
  {
    id: "navy",
    name: "Royal Sapphire",
    desc: "Deep tournament blue velvet",
    colorHex: "#143564",
    feltClass: "settings-felt--navy",
  },
  {
    id: "arcade",
    name: "Arcade Cyber Violet",
    desc: "High-voltage neon gaming table",
    colorHex: "#3b1464",
    feltClass: "settings-felt--arcade",
  },
];

const CARDBACK_OPTIONS: Array<{
  id: DealopolySettings["cardBackDesign"];
  title: string;
  desc: string;
  accent: string;
}> = [
  {
    id: "classic",
    title: "Classic Navy & Gold",
    desc: "Official Dealopoly emblem with ornate gold trim",
    accent: "#d4af37",
  },
  {
    id: "gold",
    title: "24K Gold Foil",
    desc: "Radiant metallic specular sheen with golden luster",
    accent: "#ffd700",
  },
  {
    id: "carbon",
    title: "Cyber Stealth Carbon",
    desc: "Obsidian woven texture with electric neon borders",
    accent: "#00f0ff",
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { settings, isLoaded, updateSetting, updateSettings, resetSettings } =
    useSettings();

  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [soundTestIndex, setSoundTestIndex] = useState(0);
  const [cachedSessionCount, setCachedSessionCount] = useState(0);
  const [recentRoomsCount, setRecentRoomsCount] = useState(0);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [isAuditioningAmbience, setIsAuditioningAmbience] = useState(false);

  useEffect(() => {
    return () => {
      stopTableAmbience();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "audio" && isAuditioningAmbience) {
      stopTableAmbience();
      setIsAuditioningAmbience(false);
    }
  }, [activeTab, isAuditioningAmbience]);

  // Sync DB profile name with settings when session loads
  useEffect(() => {
    if (session?.user?.name && isLoaded && !localStorage.getItem("dealopoly_settings")) {
      updateSetting("playerName", session.user.name);
      updateSetting(
        "customTag",
        `@${session.user.name.toLowerCase().replace(/[^a-z0-9_]/g, "")}`
      );
    }
  }, [session, isLoaded, updateSetting]);

  // Read cache counts
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawSessions = localStorage.getItem("dealopoly_room_sessions");
      if (rawSessions) {
        const parsed = JSON.parse(rawSessions);
        setCachedSessionCount(Object.keys(parsed).length);
      }
      const rawRooms = localStorage.getItem("dealopoly_recent_rooms");
      if (rawRooms) {
        const parsed = JSON.parse(rawRooms);
        setRecentRoomsCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Cycle sound effects on test button
  const handleTestSound = () => {
    const soundFunctions = [
      () => {
        playCardSwoosh();
        showToast("Airy Card Swoosh played 🎴");
      },
      () => {
        playCardSlam();
        showToast("Table Felt Slam played 💥");
      },
      () => {
        playCoinChime();
        showToast("Metallic Coin Chime played 🪙");
      },
      () => {
        playVictoryFanfare();
        showToast("Victory Fanfare played 🎺");
      },
    ];

    const fn = soundFunctions[soundTestIndex % soundFunctions.length];
    if (fn) {
      fn();
    }
    setSoundTestIndex((prev) => prev + 1);
  };

  const handleCardClick = () => {
    playCardSwoosh();
    showToast(`Inspecting ${settings.cardBackDesign} card back ✨`);
  };

  // Local profile form state
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editCustomTag, setEditCustomTag] = useState("");
  const [tagCheckStatus, setTagCheckStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [tagErrorMsg, setTagErrorMsg] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Initialize edit fields when settings are loaded
  useEffect(() => {
    if (isLoaded) {
      setEditPlayerName(settings.playerName || "");
      setEditCustomTag(settings.customTag || "");
    }
  }, [isLoaded, settings.playerName, settings.customTag]);

  // Debounced tag availability check
  useEffect(() => {
    const trimmed = editCustomTag.trim();
    if (!trimmed) {
      setTagCheckStatus("idle");
      setTagErrorMsg(null);
      return;
    }

    const formattedTag =
      trimmed.startsWith("@") || trimmed.includes("#")
        ? trimmed
        : `@${trimmed}`;

    // If it matches currently saved tag, it's valid
    if (
      formattedTag.toLowerCase() === (settings.customTag || "").toLowerCase()
    ) {
      setTagCheckStatus("idle");
      setTagErrorMsg(null);
      return;
    }

    // Basic format check
    if (formattedTag.length < 3) {
      setTagCheckStatus("invalid");
      setTagErrorMsg("Tag must be at least 3 characters");
      return;
    }

    setTagCheckStatus("checking");
    setTagErrorMsg(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/user/profile?tag=${encodeURIComponent(formattedTag)}`
        );
        if (!res.ok) {
          setTagCheckStatus("idle");
          return;
        }
        const data = await res.json();
        if (data.available) {
          setTagCheckStatus("available");
          setTagErrorMsg(null);
        } else {
          setTagCheckStatus("taken");
          setTagErrorMsg("This tag has already been taken");
        }
      } catch (err) {
        console.error("Failed to check tag availability", err);
        setTagCheckStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [editCustomTag, settings.customTag]);

  const hasProfileChanges =
    editPlayerName.trim() !== (settings.playerName || "").trim() ||
    editCustomTag.trim() !== (settings.customTag || "").trim();

  const isSaveDisabled =
    !hasProfileChanges ||
    !editPlayerName.trim() ||
    !editCustomTag.trim() ||
    tagCheckStatus === "checking" ||
    tagCheckStatus === "taken" ||
    tagCheckStatus === "invalid" ||
    isSavingDb;

  const handleSaveProfile = async () => {
    if (isSaveDisabled) return;

    const trimmedName = editPlayerName.trim();
    let formattedTag = editCustomTag.trim();
    if (!formattedTag.startsWith("@") && !formattedTag.includes("#")) {
      formattedTag = `@${formattedTag}`;
    }

    setIsSavingDb(true);
    try {
      if (session?.user?.id) {
        const res = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, customTag: formattedTag }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 409) {
            setTagCheckStatus("taken");
            setTagErrorMsg(errData.error || "This tag has already been taken");
            showToast(errData.error || "This tag has already been taken ⚠️");
            return;
          }
          throw new Error(errData.error || "Failed to save profile");
        }
      }

      updateSettings({
        playerName: trimmedName,
        customTag: formattedTag,
      });

      setTagCheckStatus("idle");
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
      playToggleClick();
      showToast("Profile updated successfully! ✨");
    } catch (err: unknown) {
      console.error("Failed to save profile", err);
      const msg =
        err instanceof Error ? err.message : "Failed to update profile";
      showToast(`${msg} ⚠️`);
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("dealopoly_room_sessions");
        localStorage.removeItem("dealopoly_recent_rooms");
        setCachedSessionCount(0);
        setRecentRoomsCount(0);
        playToggleClick();
        showToast("Room session cache cleared 🧹");
      } catch {
        // Ignore quota error
      }
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all game settings and visual themes to factory defaults?")) {
      resetSettings();
      playToggleClick();
      showToast("All settings restored to factory defaults ↺");
    }
  };

  const activeAvatarObj =
    AVATAR_OPTIONS.find((a) => a.id === settings.avatarId) ?? AVATAR_OPTIONS[0]!;

  return (
    <div
      className="marketing-page"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <MarketingNav activeTab="settings" />

      <main className="settings-page-main">
        <div className="settings-shell">
          <BackButton
            fallbackUrl="/"
            label="Back"
            variant="subtle"
            style={{ marginBottom: "8px" }}
          />

          {/* Header */}
          <div className="settings-header">
            <div className="settings-header-titles">
              <h1>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "32px", color: "var(--primary, #38bdf8)" }}
                >
                  tune
                </span>
                Game Settings & Preferences
              </h1>
              <p>
                Personalize your player identity, tabletop felt ambiance, audio
                synthesizer, card back artwork, and gameplay mechanics.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                className="settings-btn-secondary"
                onClick={handleResetDefaults}
                title="Reset all settings to defaults"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  restart_alt
                </span>
                Reset Defaults
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* LIVE REAL-TIME PREVIEW STAGE                                 */}
          {/* ============================================================ */}
          <div
            className={`settings-preview-stage settings-felt--${settings.tableTheme}`}
          >
            <div className="settings-preview-content">
              {/* Left: Player Persona Preview */}
              <div className="settings-preview-identity">
                <div
                  className={`settings-avatar-preview ${activeAvatarObj.gradientClass}`}
                  title="Your Table Avatar"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "36px", fontVariationSettings: "'FILL' 1" }}
                  >
                    {activeAvatarObj.icon}
                  </span>
                </div>

                <div className="settings-preview-name-box">
                  <h3>
                    {settings.playerName || "Player"}
                    {isSavingDb && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--muted)",
                          fontWeight: 400,
                        }}
                      >
                        (saving...)
                      </span>
                    )}
                  </h3>
                  <div className="settings-preview-tag">
                    {settings.customTag || "@player"}
                  </div>
                  <div className="settings-preview-persona">
                    {activeAvatarObj.title} • {activeAvatarObj.subtitle}
                  </div>
                </div>
              </div>

              {/* Right: Interactive 3D Card Back Showcase */}
              <div
                className="settings-preview-card-showcase"
                onClick={handleCardClick}
                title="Click to flip and test card sounds"
              >
                <div className="settings-preview-card-stage">
                  <CardBack
                    size="md"
                    variant={settings.cardBackDesign}
                    isInteractive
                  />
                </div>
                <div className="settings-card-label">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "14px" }}
                  >
                    touch_app
                  </span>
                  Tap to Inspect Sound
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="settings-preview-bar">
              <div className="settings-preview-chips">
                <span className="settings-chip">
                  <span className="material-symbols-outlined settings-chip-icon">
                    palette
                  </span>
                  Felt: {settings.tableTheme.toUpperCase()}
                </span>
                <span className="settings-chip">
                  <span className="material-symbols-outlined settings-chip-icon">
                    style
                  </span>
                  Card: {settings.cardBackDesign.toUpperCase()}
                </span>
                <span className="settings-chip">
                  <span className="material-symbols-outlined settings-chip-icon">
                    smart_toy
                  </span>
                  Bot: {settings.defaultBotDifficulty.toUpperCase()}
                </span>
                <span className="settings-chip">
                  <span
                    className="material-symbols-outlined settings-chip-icon"
                    style={{
                      color: settings.masterMute ? "var(--error, #ef4444)" : "var(--green, #10b981)",
                    }}
                  >
                    {settings.masterMute ? "volume_off" : "volume_up"}
                  </span>
                  {settings.masterMute
                    ? "Muted"
                    : `SFX ${settings.sfxVolume}%`}
                </span>
              </div>

              <button
                type="button"
                className="settings-btn-secondary"
                onClick={handleTestSound}
                style={{ background: "rgba(255, 255, 255, 0.1)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px", color: "var(--primary)" }}
                >
                  music_note
                </span>
                Test Audio FX
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CATEGORY NAVIGATION TABS                                     */}
          {/* ============================================================ */}
          <nav className="settings-nav-tabs" aria-label="Settings categories">
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => {
                playToggleClick();
                setActiveTab("profile");
              }}
            >
              <span className="material-symbols-outlined">person</span>
              Profile
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "gameplay" ? "active" : ""}`}
              onClick={() => {
                playToggleClick();
                setActiveTab("gameplay");
              }}
            >
              <span className="material-symbols-outlined">sports_esports</span>
              Gameplay
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "audio" ? "active" : ""}`}
              onClick={() => {
                playToggleClick();
                setActiveTab("audio");
              }}
            >
              <span className="material-symbols-outlined">volume_up</span>
              Audio
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "themes" ? "active" : ""}`}
              onClick={() => {
                playToggleClick();
                setActiveTab("themes");
              }}
            >
              <span className="material-symbols-outlined">palette</span>
              Themes
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
              onClick={() => {
                playToggleClick();
                setActiveTab("privacy");
              }}
            >
              <span className="material-symbols-outlined">shield</span>
              Privacy
            </button>

            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "system" ? "active" : ""}`}
              onClick={() => {
                playToggleClick();
                setActiveTab("system");
              }}
            >
              <span className="material-symbols-outlined">tune</span>
              System
            </button>
          </nav>

          {/* ============================================================ */}
          {/* TAB 1: PROFILE & IDENTITY                                    */}
          {/* ============================================================ */}
          {activeTab === "profile" && (
            <div className="settings-panel">
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <div>
                    <h2>Player Identity</h2>
                    <p>
                      Your in-game identity displayed to other players and saved in
                      match history.
                    </p>
                  </div>
                </div>

                <div className="settings-rows">
                  {/* Name Input */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Display Name</div>
                      <div className="settings-row-desc">
                        Your public handle across tables, rooms, and leaderboards.
                      </div>
                    </div>
                    <input
                      type="text"
                      className="settings-input"
                      value={editPlayerName}
                      maxLength={24}
                      placeholder="Enter player name"
                      onChange={(e) => {
                        setEditPlayerName(e.target.value);
                      }}
                    />
                  </div>

                  {/* Custom Tag */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Custom Tag</div>
                      <div className="settings-row-desc">
                        Unique tag or handle shown below your name (e.g. @pro_dealer).
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                      <div style={{ position: "relative", display: "inline-block", width: "100%", maxWidth: "260px" }}>
                        <input
                          type="text"
                          className={`settings-input ${
                            tagCheckStatus === "taken" || tagCheckStatus === "invalid"
                              ? "settings-input--error"
                              : ""
                          }`}
                          style={{ width: "100%", paddingRight: "36px" }}
                          value={editCustomTag}
                          maxLength={24}
                          placeholder="@handle"
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val && !val.startsWith("@") && !val.includes("#")) {
                              val = `@${val}`;
                            }
                            setEditCustomTag(val);
                          }}
                        />
                        {tagCheckStatus === "checking" && (
                          <span
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              fontSize: "0.75rem",
                              color: "var(--muted)",
                            }}
                          >
                            checking...
                          </span>
                        )}
                        {tagCheckStatus === "available" && (
                          <span
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              fontSize: "1.1rem",
                              color: "#10b981",
                            }}
                            className="material-symbols-outlined"
                          >
                            check_circle
                          </span>
                        )}
                        {tagCheckStatus === "taken" && (
                          <span
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              fontSize: "1.1rem",
                              color: "#ef4444",
                            }}
                            className="material-symbols-outlined"
                          >
                            cancel
                          </span>
                        )}
                      </div>
                      {tagErrorMsg && (
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                            error
                          </span>
                          <span>{tagErrorMsg}</span>
                        </div>
                      )}
                      {tagCheckStatus === "available" && (
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "#10b981",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                            check
                          </span>
                          <span>Tag is available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Profile Button */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: "12px",
                      paddingTop: "12px",
                      paddingBottom: "16px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    {hasProfileChanges && !isSaveDisabled && (
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        Unsaved changes
                      </span>
                    )}
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={handleSaveProfile}
                      disabled={isSaveDisabled}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 22px",
                        fontSize: "0.88rem",
                        cursor: isSaveDisabled ? "not-allowed" : "pointer",
                        opacity: isSaveDisabled ? 0.5 : 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                        {isSavingDb ? "hourglass_empty" : profileSaveSuccess ? "check" : "save"}
                      </span>
                      <span>
                        {isSavingDb
                          ? "Saving..."
                          : profileSaveSuccess
                            ? "Saved!"
                            : "Save Profile"}
                      </span>
                    </button>
                  </div>

                  {/* Avatar Selector */}
                  <div style={{ marginTop: "12px" }}>
                    <div className="settings-row-title" style={{ marginBottom: "8px" }}>
                      Choose Avatar Persona
                    </div>
                    <div className="settings-avatar-grid">
                      {AVATAR_OPTIONS.map((opt) => {
                        const isSelected = settings.avatarId === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={`settings-avatar-card ${
                              isSelected ? "active" : ""
                            }`}
                            onClick={() => {
                              playToggleClick();
                              updateSetting("avatarId", opt.id);
                              showToast(`Avatar set to ${opt.title} 🎭`);
                            }}
                          >
                            <div
                              className={`settings-avatar-card-icon ${opt.gradientClass}`}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: "24px",
                                  fontVariationSettings: "'FILL' 1",
                                }}
                              >
                                {opt.icon}
                              </span>
                            </div>
                            <div className="settings-avatar-card-title">
                              {opt.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Sync Card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">cloud_sync</span>
                  </div>
                  <div>
                    <h2>Cloud Account & Synchronization</h2>
                    <p>
                      Keep your win stats, custom styles, and match history
                      synchronized across all your devices.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  {session?.user ? (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text)",
                          fontSize: "0.92rem",
                        }}
                      >
                        Signed in as {session.user.name || session.user.email}
                      </div>
                      <div
                        style={{
                          color: "var(--muted)",
                          fontSize: "0.82rem",
                          marginTop: "2px",
                        }}
                      >
                        Connected to Neon Postgres Database • Realtime Match Sync
                        Active
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text)",
                          fontSize: "0.92rem",
                        }}
                      >
                        Guest Player Mode
                      </div>
                      <div
                        style={{
                          color: "var(--muted)",
                          fontSize: "0.82rem",
                          marginTop: "2px",
                        }}
                      >
                        Your settings are saved on this device. Sign in to sync with
                        online multiplayer lobbies.
                      </div>
                    </div>
                  )}

                  {!session?.user ? (
                    <Link
                      href="/login"
                      className="button button--primary"
                      style={{ padding: "8px 18px", fontSize: "0.85rem" }}
                    >
                      Sign In to Sync
                    </Link>
                  ) : (
                    <Link
                      href="/profile"
                      className="settings-btn-secondary"
                      style={{ textDecoration: "none" }}
                    >
                      View Profile Stats →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: GAMEPLAY & TABLE                                      */}
          {/* ============================================================ */}
          {activeTab === "gameplay" && (
            <div className="settings-panel">
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">stadia_controller</span>
                  </div>
                  <div>
                    <h2>Tabletop & Match Defaults</h2>
                    <p>
                      Fine-tune card handling, bot challenges, and prompt confirmations.
                    </p>
                  </div>
                </div>

                <div className="settings-rows">
                  {/* Default Game Mode */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Default Game Mode</div>
                      <div className="settings-row-desc">
                        Preferred game when creating rooms or playing bots.
                      </div>
                    </div>
                    <div className="settings-segmented">
                      <button
                        type="button"
                        className={`settings-segmented-btn ${
                          settings.defaultGame === "monodeal" ? "active" : ""
                        }`}
                        onClick={() => {
                          playToggleClick();
                          updateSetting("defaultGame", "monodeal");
                        }}
                      >
                        Monodeal (110)
                      </button>
                      <button
                        type="button"
                        className={`settings-segmented-btn ${
                          settings.defaultGame === "lowdeck" ? "active" : ""
                        }`}
                        onClick={() => {
                          playToggleClick();
                          updateSetting("defaultGame", "lowdeck");
                        }}
                      >
                        Lowdeck (52)
                      </button>
                    </div>
                  </div>

                  {/* Bot Difficulty */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Solo Bot Difficulty</div>
                      <div className="settings-row-desc">
                        Intelligence rating for AI opponents in offline practice rooms.
                      </div>
                    </div>
                    <div className="settings-segmented">
                      {(["easy", "medium", "hard", "expert"] as const).map(
                        (diff) => (
                          <button
                            key={diff}
                            type="button"
                            className={`settings-segmented-btn ${
                              settings.defaultBotDifficulty === diff ? "active" : ""
                            }`}
                            onClick={() => {
                              playToggleClick();
                              updateSetting("defaultBotDifficulty", diff);
                              showToast(`Bot difficulty set to ${diff.toUpperCase()} 🤖`);
                            }}
                          >
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Card Sort Mode */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Hand Auto-Sorting</div>
                      <div className="settings-row-desc">
                        Automatically re-order hand cards when dealt or drawn.
                      </div>
                    </div>
                    <div className="settings-segmented">
                      {(
                        [
                          { key: "color", label: "By Color" },
                          { key: "value", label: "By Value" },
                          { key: "type", label: "By Type" },
                          { key: "none", label: "Manual" },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className={`settings-segmented-btn ${
                            settings.cardSortMode === item.key ? "active" : ""
                          }`}
                          onClick={() => {
                            playToggleClick();
                            updateSetting("cardSortMode", item.key);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Confirm Play Action */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">
                        Confirm Action Card Plays
                      </div>
                      <div className="settings-row-desc">
                        Prompt before executing game-changing actions like Deal
                        Breakers, Debt Collectors, or Just Say No.
                      </div>
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

                  {/* Auto Pass Timer */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Auto-Pass on 0 Plays</div>
                      <div className="settings-row-desc">
                        Instantly end turn when no more action cards can be legally
                        played.
                      </div>
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
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: AUDIO & FEEDBACK                                      */}
          {/* ============================================================ */}
          {activeTab === "audio" && (
            <div className="settings-panel">
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">graphic_eq</span>
                  </div>
                  <div>
                    <h2>Zero-Asset Audio Synthesizer</h2>
                    <p>
                      Realistic felt slaps, card swooshes, and coin chimes rendered
                      natively via Web Audio API.
                    </p>
                  </div>
                </div>

                <div className="settings-rows">
                  {/* Master Mute */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Master Mute</div>
                      <div className="settings-row-desc">
                        Immediately silence all game sound effects and ambient
                        audio.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={settings.masterMute}
                        onChange={(e) => {
                          playToggleClick();
                          updateSetting("masterMute", e.target.checked);
                          updateAmbienceVolume();
                          showToast(
                            e.target.checked ? "Audio Muted 🔇" : "Audio Unmuted 🔊"
                          );
                        }}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  {/* SFX Volume */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Sound Effects (SFX)</div>
                      <div className="settings-row-desc">
                        Volume of card dealing, playing cards, and rent collection.
                      </div>
                    </div>
                    <div className="settings-range-wrap">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        disabled={settings.masterMute}
                        value={settings.sfxVolume}
                        className="settings-range-input"
                        onChange={(e) => {
                          updateSetting("sfxVolume", Number(e.target.value));
                        }}
                      />
                      <span className="settings-range-badge">
                        {settings.sfxVolume}%
                      </span>
                    </div>
                  </div>

                  {/* Ambience Volume */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Table Ambiance</div>
                      <div className="settings-row-desc">
                        Warm low-frequency casino felt hum and acoustic room presence.
                      </div>
                    </div>
                    <div className="settings-range-wrap">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        disabled={settings.masterMute}
                        value={settings.ambienceVolume}
                        className="settings-range-input"
                        onChange={(e) => {
                          updateSetting("ambienceVolume", Number(e.target.value));
                          updateAmbienceVolume();
                        }}
                      />
                      <span className="settings-range-badge">
                        {settings.ambienceVolume}%
                      </span>
                    </div>
                  </div>

                  {/* Turn Notification Chime */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">"Your Turn" Alert</div>
                      <div className="settings-row-desc">
                        Play a friendly chime when an opponent passes or a bot finishes their turn.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={settings.turnAlertSound}
                        onChange={(e) => {
                          playToggleClick();
                          updateSetting("turnAlertSound", e.target.checked);
                        }}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  {/* Reaction Window & Urgency Warning */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Reaction & Urgency Alert</div>
                      <div className="settings-row-desc">
                        Auditory cues when targeted by action cards or when the turn timer is low.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={settings.timerWarningSound}
                        onChange={(e) => {
                          playToggleClick();
                          updateSetting("timerWarningSound", e.target.checked);
                        }}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  {/* Interface Click Sounds */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Interface Click Sounds</div>
                      <div className="settings-row-desc">
                        Tactile acoustic clicks when tapping switches, drawer handles, and action buttons.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={settings.uiSounds}
                        onChange={(e) => {
                          playToggleClick();
                          updateSetting("uiSounds", e.target.checked);
                        }}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  {/* Haptic Feedback */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Haptic Vibration</div>
                      <div className="settings-row-desc">
                        Gentle tactile feedback when dragging or snapping cards on
                        mobile devices.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={settings.hapticFeedback}
                        onChange={(e) => {
                          playToggleClick();
                          updateSetting("hapticFeedback", e.target.checked);
                          if (e.target.checked) {
                            triggerHaptic("medium");
                          }
                        }}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  {/* Sound FX Preview Suite */}
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "16px",
                      borderRadius: "14px",
                      background: "rgba(0, 0, 0, 0.25)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        color: "#fff",
                        marginBottom: "10px",
                      }}
                    >
                      Sound FX Audition Studio
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => {
                          playCardSwoosh();
                          showToast("Played Card Swoosh");
                        }}
                      >
                        🎴 Deal Swoosh
                      </button>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => {
                          playCardSlam();
                          showToast("Played Felt Slam");
                        }}
                      >
                        💥 Felt Slam
                      </button>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => {
                          playCoinChime();
                          showToast("Played Coin Chime");
                        }}
                      >
                        🪙 Coin Chime
                      </button>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => {
                          playVictoryFanfare();
                          showToast("Played Victory Fanfare");
                        }}
                      >
                        🎺 Victory Fanfare
                      </button>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => {
                          playYourTurnSound();
                          showToast("Played 'Your Turn' Chime 🔔");
                        }}
                      >
                        🔔 Your Turn Chime
                      </button>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => {
                          playTimerWarningSound();
                          showToast("Played Urgency Ping ⏱️");
                        }}
                      >
                        ⏱️ Urgency Ping
                      </button>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        onClick={() => {
                          triggerHaptic("medium");
                          showToast("Triggered Haptic Pulse 📳");
                        }}
                      >
                        📳 Test Haptics
                      </button>
                      <button
                        type="button"
                        className="settings-btn-secondary"
                        style={
                          isAuditioningAmbience
                            ? { background: "var(--primary)", color: "#fff" }
                            : {}
                        }
                        onClick={() => {
                          if (isAuditioningAmbience) {
                            stopTableAmbience();
                            setIsAuditioningAmbience(false);
                            showToast("Stopped Table Ambiance");
                          } else {
                            startTableAmbience();
                            setIsAuditioningAmbience(true);
                            showToast("Playing Warm Table Ambiance 🎧");
                          }
                        }}
                      >
                        {isAuditioningAmbience
                          ? "⏹️ Stop Ambiance"
                          : "🎧 Test Table Ambiance"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: THEMES & VISUALS                                      */}
          {/* ============================================================ */}
          {activeTab === "themes" && (
            <div className="settings-panel">
              {/* Tabletop Felt Theme */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">table_restaurant</span>
                  </div>
                  <div>
                    <h2>Tabletop Felt Ambiance</h2>
                    <p>
                      Customize the color, texture, and mood of your game table felt.
                    </p>
                  </div>
                </div>

                <div className="settings-theme-grid">
                  {TABLE_FELT_OPTIONS.map((felt) => {
                    const isSelected = settings.tableTheme === felt.id;
                    return (
                      <div
                        key={felt.id}
                        className={`settings-theme-card ${
                          isSelected ? "active" : ""
                        }`}
                        onClick={() => {
                          playToggleClick();
                          updateSetting("tableTheme", felt.id);
                          showToast(`Table felt set to ${felt.name} 🎨`);
                        }}
                      >
                        <div
                          className={`settings-theme-swatch ${felt.feltClass}`}
                        />
                        <div className="settings-theme-card-info">
                          <div className="settings-theme-card-title">
                            {felt.name}
                          </div>
                          {isSelected && (
                            <span
                              className="material-symbols-outlined"
                              style={{
                                color: "var(--green)",
                                fontSize: "18px",
                              }}
                            >
                              check_circle
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.76rem",
                            color: "var(--muted)",
                          }}
                        >
                          {felt.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Back Artwork */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">style</span>
                  </div>
                  <div>
                    <h2>Card Back Designs</h2>
                    <p>
                      Select the luxury sleeve design that appears on deck piles and
                      opponent hands.
                    </p>
                  </div>
                </div>

                <div className="settings-theme-grid">
                  {CARDBACK_OPTIONS.map((cb) => {
                    const isSelected = settings.cardBackDesign === cb.id;
                    return (
                      <div
                        key={cb.id}
                        className={`settings-theme-card ${
                          isSelected ? "active" : ""
                        }`}
                        onClick={() => {
                          playCardSwoosh();
                          updateSetting("cardBackDesign", cb.id);
                          showToast(`Card back set to ${cb.title} 🎴`);
                        }}
                      >
                        <div
                          style={{
                            height: "90px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(0, 0, 0, 0.4)",
                            borderRadius: "8px",
                          }}
                        >
                          <CardBack size="xs" variant={cb.id} />
                        </div>
                        <div className="settings-theme-card-info">
                          <div
                            className="settings-theme-card-title"
                            style={{ color: cb.accent }}
                          >
                            {cb.title}
                          </div>
                          {isSelected && (
                            <span
                              className="material-symbols-outlined"
                              style={{
                                color: "var(--green)",
                                fontSize: "18px",
                              }}
                            >
                              check_circle
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.76rem",
                            color: "var(--muted)",
                          }}
                        >
                          {cb.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Animation Speed */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">speed</span>
                  </div>
                  <div>
                    <h2>Animation & Motion</h2>
                    <p>
                      Control the velocity and pacing of cards dealing and moving
                      across the board.
                    </p>
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-info">
                    <div className="settings-row-title">Animation Velocity</div>
                    <div className="settings-row-desc">
                      Choose between cinematic 3D easing or rapid competitive snappy
                      play.
                    </div>
                  </div>
                  <div className="settings-segmented">
                    {(
                      [
                        { key: "cinematic", label: "Cinematic" },
                        { key: "snappy", label: "Snappy" },
                        { key: "reduced", label: "Reduced Motion" },
                      ] as const
                    ).map((spd) => (
                      <button
                        key={spd.key}
                        type="button"
                        className={`settings-segmented-btn ${
                          settings.animationSpeed === spd.key ? "active" : ""
                        }`}
                        onClick={() => {
                          playToggleClick();
                          updateSetting("animationSpeed", spd.key);
                          showToast(`Animation speed set to ${spd.label}`);
                        }}
                      >
                        {spd.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: MULTIPLAYER & PRIVACY                                 */}
          {/* ============================================================ */}
          {activeTab === "privacy" && (
            <div className="settings-panel">
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                  <div>
                    <h2>Multiplayer & Table Privacy</h2>
                    <p>
                      Manage room accessibility, spectators, and in-game player
                      interactions.
                    </p>
                  </div>
                </div>

                <div className="settings-rows">
                  {/* Default Private Rooms */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">
                        Private Rooms by Default
                      </div>
                      <div className="settings-row-desc">
                        Require an invite code to join newly created rooms instead of
                        listing them in public match lobbies.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={settings.defaultRoomPrivate}
                        onChange={(e) => {
                          playToggleClick();
                          updateSetting("defaultRoomPrivate", e.target.checked);
                        }}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  {/* Allow Spectators */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Allow Spectators</div>
                      <div className="settings-row-desc">
                        Permit observers to watch your active tabletop matches
                        without taking a player seat.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={settings.allowSpectators}
                        onChange={(e) => {
                          playToggleClick();
                          updateSetting("allowSpectators", e.target.checked);
                        }}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  {/* In-Game Reactions */}
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">
                        In-Game Emoji Reactions
                      </div>
                      <div className="settings-row-desc">
                        Show animated emoji burst reactions and quick chats during
                        live gameplay.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={settings.showReactions}
                        onChange={(e) => {
                          playToggleClick();
                          updateSetting("showReactions", e.target.checked);
                        }}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: SYSTEM, STORAGE & DIAGNOSTICS                         */}
          {/* ============================================================ */}
          {activeTab === "system" && (
            <div className="settings-panel">
              {/* Storage Diagnostic Card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">database</span>
                  </div>
                  <div>
                    <h2>Local Storage & Session Cache</h2>
                    <p>
                      Inspect and clean offline room tokens, join histories, and
                      persisted match caches.
                    </p>
                  </div>
                </div>

                <div className="settings-rows">
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">
                        Active Room Tokens
                      </div>
                      <div className="settings-row-desc">
                        Reconnection tokens that let you re-enter live rooms.
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="settings-range-badge">
                        {cachedSessionCount} Saved
                      </span>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Recent Rooms History</div>
                      <div className="settings-row-desc">
                        Quick-rejoin history entries saved in your lobby drawer.
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="settings-range-badge">
                        {recentRoomsCount} Rooms
                      </span>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">
                        Clear Reconnection Cache
                      </div>
                      <div className="settings-row-desc">
                        Erase stored room reconnection tokens and recent room
                        shortcuts without resetting preferences.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="settings-btn-secondary"
                      onClick={handleClearCache}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "16px" }}
                      >
                        delete_outline
                      </span>
                      Clear Cache
                    </button>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title" style={{ color: "var(--error)" }}>
                        Factory Reset Settings
                      </div>
                      <div className="settings-row-desc">
                        Restore all visual themes, audio sliders, and table options
                        back to initial values.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="settings-btn-danger"
                      onClick={handleResetDefaults}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "16px" }}
                      >
                        warning
                      </span>
                      Factory Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Engine Status Card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-header-icon">
                    <span className="material-symbols-outlined">memory</span>
                  </div>
                  <div>
                    <h2>Dealopoly Engine Diagnostics</h2>
                    <p>
                      Runtime and real-time connectivity health.
                    </p>
                  </div>
                </div>

                <div className="settings-rows">
                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Web Client Version</div>
                      <div className="settings-row-desc">
                        Dealopoly Next.js App Router release build
                      </div>
                    </div>
                    <span className="settings-range-badge">v0.1.0-alpha</span>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-info">
                      <div className="settings-row-title">Game Server Gateway</div>
                      <div className="settings-row-desc">
                        Real-time WebSocket protocol for state distribution
                      </div>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.8rem",
                        color: "var(--green)",
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--green)",
                        }}
                      />
                      Active Gateway
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <div className="settings-toast">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                check_circle
              </span>
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
