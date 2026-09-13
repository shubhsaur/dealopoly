"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createRoomApi } from "../../lib/api";
import { getStoredProfile, saveRoomSession } from "../../lib/session";
import { getStoredSettings } from "../../lib/settings";
import { DialogShell } from "./dialog-shell";

type RoomVisibility = "public" | "private";
type GameType = "monodeal" | "least_count";

export interface CreateRoomDialogProps {
  game?: GameType;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomDialog({ game, isOpen, onClose }: CreateRoomDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const getInitialGame = (): GameType =>
    game ||
    (typeof window !== "undefined" && getStoredSettings().defaultGame === "lowdeck"
      ? "least_count"
      : "monodeal");

  const [selectedGame, setSelectedGame] = useState<GameType>(getInitialGame);
  const [visibility, setVisibility] = useState<RoomVisibility>("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (game) {
        setSelectedGame(game);
      } else {
        const preferred =
          getStoredSettings().defaultGame === "lowdeck" ? "least_count" : "monodeal";
        setSelectedGame(preferred);
      }
      setError(null);
    }
  }, [isOpen, game]);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const profile = getStoredProfile();
      const playerName = session?.user?.name || profile.name || "Host";
      const userId = session?.user?.id;

      const res = await createRoomApi({
        hostName: playerName,
        botCount: 0,
        userId,
        gameType: selectedGame,
        isPrivate: visibility === "private",
      });

      saveRoomSession(res.roomCode, res.hostPlayerId, res.sessionToken);
      router.push(`/lobby?room=${res.roomCode}&game=${selectedGame}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const options: { value: RoomVisibility; icon: string; title: string; description: string }[] = [
    {
      value: "public",
      icon: "🌐",
      title: "Public Room",
      description: "Visible in public lobby list. Anyone can discover & join.",
    },
    {
      value: "private",
      icon: "🔒",
      title: "Private Room",
      description: "Hidden from list. Friends join using room code or link.",
    },
  ];

  const isLowdeck = selectedGame === "least_count";

  return (
    <DialogShell isOpen={isOpen} onClose={onClose} size="sm">
      <div className="dialog-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "24px", color: isLowdeck ? "#f59e0b" : "var(--primary)" }}
          >
            add_circle
          </span>
          <h2 id="create-room-dialog-title" style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
            CREATE ROOM
          </h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="dialog-close-btn">
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            close
          </span>
        </button>
      </div>

      <div className="dialog-body">
        {/* Game Selection */}
        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--muted)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Choose Game
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setSelectedGame("monodeal")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "12px",
                border: `1.5px solid ${selectedGame === "monodeal" ? "var(--primary)" : "rgba(255, 255, 255, 0.08)"}`,
                background:
                  selectedGame === "monodeal" ? "rgba(102, 223, 117, 0.12)" : "rgba(15, 23, 42, 0.5)",
                color: selectedGame === "monodeal" ? "#ffffff" : "#94a3b8",
                fontWeight: selectedGame === "monodeal" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🎩</span>
              <span>Monodeal</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGame("least_count")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "12px",
                border: `1.5px solid ${selectedGame === "least_count" ? "#f59e0b" : "rgba(255, 255, 255, 0.08)"}`,
                background:
                  selectedGame === "least_count" ? "rgba(245, 158, 11, 0.14)" : "rgba(15, 23, 42, 0.5)",
                color: selectedGame === "least_count" ? "#fde047" : "#94a3b8",
                fontWeight: selectedGame === "least_count" ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>👑</span>
              <span>Lowdeck</span>
            </button>
          </div>
        </div>

        {/* Room Visibility Options */}
        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--muted)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Room Visibility
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {options.map((option) => {
              const isSelected = visibility === option.value;
              const activeColor = isLowdeck ? "#f59e0b" : "var(--primary)";
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: `1px solid ${isSelected ? activeColor : "rgba(255, 255, 255, 0.08)"}`,
                    background: isSelected
                      ? isLowdeck
                        ? "rgba(245, 158, 11, 0.1)"
                        : "rgba(102, 223, 117, 0.09)"
                      : "rgba(15, 23, 42, 0.5)",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "inherit",
                    transition: "all 0.18s ease",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>{option.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: isSelected ? "#fff" : "inherit" }}>
                      {option.title}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "2px" }}>
                      {option.description}
                    </div>
                  </div>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: "20px",
                      color: isSelected ? activeColor : "var(--muted)",
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    {isSelected ? "radio_button_checked" : "radio_button_unchecked"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "14px",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              fontSize: "0.84rem",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: "22px" }}>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className={`button button--full ${isLowdeck ? "button--gold-accent" : "button--primary"}`}
            style={{
              padding: "13px",
              fontSize: "1rem",
              fontWeight: 700,
              ...(isLowdeck
                ? {
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "#000",
                    border: "none",
                  }
                : {}),
              ...(loading ? { opacity: 0.6, cursor: "not-allowed" } : {}),
            }}
          >
            {loading ? "Creating Room..." : `Create ${isLowdeck ? "Lowdeck" : "Monodeal"} Room`}
          </button>
        </div>
      </div>
    </DialogShell>
  );
}
