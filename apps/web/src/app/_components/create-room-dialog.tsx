"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createRoomApi } from "../../lib/api";
import { getStoredProfile, saveRoomSession } from "../../lib/session";
import { getGameLabel } from "../../lib/constants";
import { DialogShell } from "./dialog-shell";

type RoomVisibility = "public" | "private";

interface CreateRoomDialogProps {
  game: "monodeal" | "least_count";
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomDialog({ game, isOpen, onClose }: CreateRoomDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [visibility, setVisibility] = useState<RoomVisibility>("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameLabel = getGameLabel(game);
  const gameTitle = game === "least_count" ? "LOWDECK" : game.toUpperCase();

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
        gameType: game,
        isPrivate: visibility === "private",
      });

      saveRoomSession(res.roomCode, res.hostPlayerId, res.sessionToken);
      router.push(`/lobby?room=${res.roomCode}&game=${game}`);
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
      title: "Public",
      description: "Anyone can find & join",
    },
    {
      value: "private",
      icon: "🔒",
      title: "Private",
      description: "Invite friends with code",
    },
  ];

  return (
    <DialogShell isOpen={isOpen} onClose={onClose} size="sm">
      <div className="dialog-header">
        <h2 id="create-room-dialog-title">CREATE {gameTitle}</h2>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="dialog-close-btn">
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            close
          </span>
        </button>
      </div>

      <div className="dialog-body">
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setVisibility(option.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                border: `1px solid ${visibility === option.value ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                background: visibility === option.value ? "rgba(102, 223, 117, 0.08)" : "rgba(15, 23, 42, 0.4)",
                cursor: "pointer",
                textAlign: "left",
                color: "inherit",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{option.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{option.title}</div>
                <div style={{ fontSize: "0.84rem", color: "var(--muted)" }}>{option.description}</div>
              </div>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "20px",
                  color: visibility === option.value ? "var(--primary)" : "var(--muted)",
                  fontVariationSettings: "'FILL' 1",
                }}
              >
                {visibility === option.value ? "radio_button_checked" : "radio_button_unchecked"}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              marginTop: "12px",
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

        <div style={{ marginTop: "20px" }}>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="button button--primary button--full"
            style={loading ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </DialogShell>
  );
}
