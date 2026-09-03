"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getStoredProfile, saveProfileName } from "../../lib/session";

type PlayBotsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultGame?: "monodeal" | "least_count";
};

type BotDifficulty = "easy" | "medium" | "hard" | "expert";

const BOT_NAMES = ["Bot Atlas", "Bot Nova", "Bot Orion", "Bot Luna"];

const DIFFICULTIES: {
  id: BotDifficulty;
  label: string;
  badge: string;
  badgeColor: string;
  icon: string;
  desc: string;
}[] = [
  {
    id: "easy",
    label: "Easy",
    badge: "CASUAL",
    badgeColor: "#66df75",
    icon: "sentiment_satisfied",
    desc: "Relaxed AI, great for beginners & practice",
  },
  {
    id: "medium",
    label: "Medium",
    badge: "BALANCED",
    badgeColor: "#ffd700",
    icon: "smart_toy",
    desc: "Tactical gameplay & standard strategy",
  },
  {
    id: "hard",
    label: "Hard",
    badge: "CHALLENGING",
    badgeColor: "#ff7d7d",
    icon: "bolt",
    desc: "Aggressive, fast-paced turns",
  },
  {
    id: "expert",
    label: "Expert",
    badge: "LOOKAHEAD",
    badgeColor: "#c084fc",
    icon: "psychology",
    desc: "Plans ahead and punishes mistakes",
  },
];

export function PlayBotsDialog({ isOpen, onClose, defaultGame = "monodeal" }: PlayBotsDialogProps) {
  const router = useRouter();
  const [gameType, setGameType] = useState<"monodeal" | "least_count">(defaultGame);
  const [playerName, setPlayerName] = useState("");
  const [botCount, setBotCount] = useState<number>(2);
  const [difficulty, setDifficulty] = useState<BotDifficulty>("medium");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setGameType(defaultGame);
      const profile = getStoredProfile();
      setPlayerName(profile.name || "Guest Player");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, defaultGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalName = playerName.trim() || "Guest Player";
    saveProfileName(finalName);

    const query = new URLSearchParams();
    query.set("mode", "bot");
    query.set("game", gameType);
    query.set("bots", botCount.toString());
    query.set("difficulty", difficulty);
    query.set("player", finalName);

    router.push(`/game?${query.toString()}`);
    onClose();
  };

  const totalPlayers = botCount + 1;
  const activeBots = BOT_NAMES.slice(0, botCount);

  return (
    <div
      className="join-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bot-dialog-title"
    >
      {/* Backdrop Scrim */}
      <div className="dialog-scrim" onClick={onClose} aria-hidden="true" />

      {/* Dialog Panel */}
      <div className="dialog-panel" style={{ maxWidth: "480px" }}>
        <div className="texture-overlay" />

        {/* Mobile Drag Handle */}
        <div className="sheet-handle" />

        {/* Header */}
        <div className="dialog-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "24px", color: "var(--primary)" }}
            >
              smart_toy
            </span>
            <h2 id="bot-dialog-title">Play with Bots</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="dialog-close-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              close
            </span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="dialog-body">
          {/* Game Selection */}
          <div className="dialog-field">
            <label className="dialog-label">Choose Game</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setGameType("monodeal")}
                className={`bot-count-btn ${gameType === "monodeal" ? "bot-count-btn--active" : ""}`}
                style={{ padding: "8px 12px", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <span>🃏</span> Monodeal
              </button>
              <button
                type="button"
                onClick={() => setGameType("least_count")}
                className={`bot-count-btn ${gameType === "least_count" ? "bot-count-btn--active" : ""}`}
                style={{ padding: "8px 12px", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <span>🎯</span> Least Count
              </button>
            </div>
          </div>

          {/* 1. Display Name of the Current Player */}
          <div className="dialog-field">
            <label htmlFor="botPlayerName" className="dialog-label">
              Your Display Name
            </label>
            <div className="dialog-input-wrapper">
              <span className="material-symbols-outlined dialog-input-icon">person</span>
              <input
                ref={inputRef}
                id="botPlayerName"
                type="text"
                maxLength={24}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="dialog-input"
                autoComplete="nickname"
                required
              />
            </div>
          </div>

          {/* 2. Number of Bots (1 to 4) */}
          <div className="dialog-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="dialog-label">Opponents</label>
              <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontFamily: "var(--mono)", fontWeight: 700 }}>
                {totalPlayers} Players Table (You + {botCount} {botCount === 1 ? "Bot" : "Bots"})
              </span>
            </div>

            <div className="bot-count-selector">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setBotCount(count)}
                  className={`bot-count-btn ${botCount === count ? "bot-count-btn--active" : ""}`}
                >
                  <span className="bot-count-number">{count}</span>
                  <span className="bot-count-label">{count === 1 ? "1 Bot (1v1)" : `${count} Bots`}</span>
                </button>
              ))}
            </div>

            {/* Table Lineup Preview */}
            <div className="bot-lineup-preview">
              <div className="bot-lineup-chip bot-lineup-chip--player">
                <span className="avatar avatar--you" style={{ width: "20px", height: "20px", fontSize: "0.6rem" }}>
                  {(playerName.trim()[0] || "Y").toUpperCase()}
                </span>
                <span>{playerName.trim() || "You"} (You)</span>
              </div>
              {activeBots.map((bot) => (
                <div key={bot} className="bot-lineup-chip">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#a8c8ff" }}>
                    smart_toy
                  </span>
                  <span>{bot}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Difficulty Selection (Easy, Medium, Hard) */}
          <div className="dialog-field">
            <label className="dialog-label">AI Difficulty</label>
            <div className="bot-difficulty-grid">
              {DIFFICULTIES.map((d) => {
                const isSelected = difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={`bot-difficulty-card ${isSelected ? "bot-difficulty-card--selected" : ""}`}
                  >
                    <div className="bot-diff-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px", color: d.badgeColor }}>
                          {d.icon}
                        </span>
                        <strong style={{ color: isSelected ? "#FFFFFF" : "var(--text)" }}>{d.label}</strong>
                      </div>
                      <span className="bot-diff-badge" style={{ color: d.badgeColor, borderColor: d.badgeColor }}>
                        {d.badge}
                      </span>
                    </div>
                    <p className="bot-diff-desc">{d.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ paddingTop: "8px" }}>
            <button type="submit" className="button button--primary button--full">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
              >
                play_arrow
              </span>
              Start Match ({totalPlayers} Players)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
