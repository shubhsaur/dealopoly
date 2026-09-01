"use client";

import type { GameEvent } from "@dealopoly/game-engine";

// ==========================================
// 1. ACTIVITY HISTORY DRAWER
// ==========================================
interface ActivityDrawerProps {
  isOpen: boolean;
  history: GameEvent[];
  onClose: () => void;
}

export function ActivityDrawer({ isOpen, history, onClose }: ActivityDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="game-activity-drawer-backdrop" onClick={onClose}>
      <aside className="game-activity-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="game-activity-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>
              feed
            </span>
            <span>Match Activity</span>
          </div>
          <button
            type="button"
            className="game-icon-btn"
            onClick={onClose}
            title="Close Drawer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              close
            </span>
          </button>
        </div>

        <ul className="game-activity-list">
          {history.length === 0 ? (
            <li style={{ color: "var(--outline)", fontSize: "0.78rem", textAlign: "center", padding: "30px 10px" }}>
              Game started. Turn events will appear here in real-time.
            </li>
          ) : (
            [...history].reverse().map((evt) => {
              let bulletColor = "var(--primary)";
              if (evt.type === "game_won") bulletColor = "#ffd700";
              else if (evt.type === "rent_charged" || evt.type === "card_banked") bulletColor = "#66df75";
              else if (evt.type === "action_played") bulletColor = "#ffb77d";
              else if (evt.type === "cards_drawn") bulletColor = "#a8c8ff";

              return (
                <li key={evt.id} className="game-activity-item">
                  <span className="game-activity-bullet" style={{ backgroundColor: bulletColor }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: "var(--text)" }}>{evt.message}</span>
                    <div style={{ fontSize: "0.68rem", color: "var(--outline)", marginTop: "2px", fontFamily: "var(--mono)" }}>
                      {new Date(evt.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </aside>
    </div>
  );
}

// ==========================================
// 2. MOBILE MENU DRAWER
// ==========================================
interface MobileMenuDrawerProps {
  isOpen: boolean;
  playerName?: string;
  isLocal: boolean;
  roomCode?: string;
  isConnected: boolean;
  onClose: () => void;
  onOpenExitDialog: () => void;
}

export function MobileMenuDrawer({
  isOpen,
  playerName,
  isLocal,
  roomCode,
  isConnected,
  onClose,
  onOpenExitDialog,
}: MobileMenuDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="game-activity-sheet" onClick={onClose}>
      <div className="game-activity-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="game-activity-header" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>
              menu
            </span>
            <span>Game Menu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="game-icon-btn"
            style={{ width: "28px", height: "28px" }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
          <div
            style={{
              padding: "12px",
              background: "var(--surface-high)",
              borderRadius: "10px",
              border: "1px solid var(--outline-variant)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--primary-deep)",
                border: "1.5px solid var(--primary)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: "0.9rem",
                color: "#FFFFFF",
              }}
            >
              {playerName?.[0]?.toUpperCase() || "P"}
            </div>
            <div>
              <b style={{ fontSize: "0.85rem", color: "var(--text)", display: "block" }}>{playerName || "Player"}</b>
              <span style={{ fontSize: "0.7rem", color: "var(--outline)" }}>
                {isLocal ? "🤖 Solo Offline Match" : `Room ${roomCode}`}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              background: "var(--surface)",
              borderRadius: "10px",
              border: "1px solid var(--outline-variant)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Current Match
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>
              {isLocal ? "🤖 Offline Bot Match" : `Multiplayer Room: ${roomCode}`}
            </span>
            <span style={{ fontSize: "0.75rem", color: isConnected ? "var(--green)" : "#f59e0b" }}>
              ● {isConnected ? "Connected & Active" : "Reconnecting..."}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenExitDialog();
            }}
            className="button button--secondary button--full"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "10px",
              fontSize: "0.82rem",
              color: "#ef4444",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              exit_to_app
            </span>
            Leave Game
          </button>

          <button
            type="button"
            className="button button--primary button--full"
            style={{ marginTop: "auto" }}
            onClick={onClose}
          >
            Return to Match
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. EXIT GAME CONFIRMATION DIALOG
// ==========================================
interface ExitDialogProps {
  isOpen: boolean;
  isBotMode: boolean;
  isHost: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export function ExitDialog({
  isOpen,
  isBotMode,
  isHost,
  onClose,
  onConfirmExit,
}: ExitDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 300 }}>
      <div className="dialog-scrim" onClick={onClose} />
      <div className="dialog-panel" style={{ maxWidth: "420px" }}>
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "24px" }}>
              logout
            </span>
            <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Leave Game?</h2>
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

        <div className="dialog-body" style={{ padding: "20px" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
            {isBotMode
              ? "Are you sure you want to leave? Your match progress will be lost and you will return to the home page."
              : isHost
              ? "Are you sure you want to leave? Because you are the Host, this will instantly end the game for everyone."
              : "Are you sure you want to leave? A bot will take over your seat for the remainder of the game."}
          </p>
        </div>

        <div className="dialog-footer" style={{ gap: "10px" }}>
          <button
            type="button"
            className="button button--secondary"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button--primary"
            style={{ flex: 1, justifyContent: "center", backgroundColor: "#ef4444", color: "#fff", border: "none" }}
            onClick={() => {
              onClose();
              onConfirmExit();
            }}
          >
            Confirm Leave
          </button>
        </div>
      </div>
    </div>
  );
}
