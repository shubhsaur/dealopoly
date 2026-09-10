"use client";

import React, { useState, useEffect, useRef } from "react";
import type { CardInstance, GameEvent } from "@dealopoly/game-engine";
import { getGameLabel } from "../../../lib/constants";
import { Card } from "../../_components/card";
import { resolveCardDef } from "./types";

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
          <div className="u-flex-center-8">
            <span className="material-symbols-outlined u-text-20 u-color-primary">
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
            <span className="material-symbols-outlined u-text-18">
              close
            </span>
          </button>
        </div>

        <ul className="game-activity-list">
          {history.length === 0 ? (
            <li className="u-text-center u-text-3sm" style={{ color: "var(--outline)", padding: "30px 10px" }}>
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
                  <div className="u-flex-1">
                    <span style={{ color: "var(--text)" }}>{evt.message}</span>
                    <div className="u-text-xs" style={{ color: "var(--outline)", marginTop: "2px", fontFamily: "var(--mono)" }}>
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
  onOpenSettings?: () => void;
}

export function MobileMenuDrawer({
  isOpen,
  playerName,
  isLocal,
  roomCode,
  isConnected,
  onClose,
  onOpenExitDialog,
  onOpenSettings,
}: MobileMenuDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="game-activity-sheet" onClick={onClose}>
      <div className="game-activity-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="game-activity-header" style={{ justifyContent: "space-between" }}>
          <div className="u-flex-center-8">
            <span className="material-symbols-outlined u-text-20 u-color-primary">
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

        <div className="u-flex-col u-gap-12 u-p-16 u-flex-1">
          <div
            className="u-flex-center-10 u-p-12"
            style={{ background: "var(--surface-high)", borderRadius: "10px", border: "1px solid var(--outline-variant)" }}
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
              }}
              className="u-fw-800 u-text-base u-color-white"
            >
              {playerName?.[0]?.toUpperCase() || "P"}
            </div>
            <div>
              <b className="u-text-5sm u-color-white" style={{ color: "var(--text)", display: "block" }}>{playerName || "Player"}</b>
              <span className="u-text-2xs" style={{ color: "var(--outline)" }}>
                {isLocal ? "🤖 Solo Offline Match" : `Room ${roomCode}`}
              </span>
            </div>
          </div>

          <div
            className="u-flex-col u-gap-6 u-p-12"
            style={{ background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--outline-variant)" }}
          >
            <span className="u-text-sm" style={{ color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Current Match
            </span>
            <span className="u-text-4sm u-fw-700" style={{ color: "var(--text)" }}>
              {isLocal ? "🤖 Offline Bot Match" : `Multiplayer Room: ${roomCode}`}
            </span>
            <span className="u-text-2sm" style={{ color: isConnected ? "var(--green)" : "#f59e0b" }}>
              ● {isConnected ? "Connected & Active" : "Reconnecting..."}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
            className="button button--secondary button--full u-flex-center-10 u-text-4sm"
            style={{ justifyContent: "flex-start" }}
          >
            <span className="material-symbols-outlined u-text-18">
              settings
            </span>
            Game Settings
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenExitDialog();
            }}
            className="button button--secondary button--full u-flex-center-10 u-text-4sm"
            style={{ justifyContent: "flex-start", color: "#ef4444" }}
          >
            <span className="material-symbols-outlined u-text-18">
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
  gameType?: string;
  onClose: () => void;
  onConfirmExit: () => void;
}

export function ExitDialog({
  isOpen,
  isBotMode,
  isHost,
  gameType,
  onClose,
  onConfirmExit,
}: ExitDialogProps) {
  if (!isOpen) {
    return null;
  }

  const gameLabel = getGameLabel(gameType);

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 300 }}>
      <div className="dialog-scrim" onClick={onClose} />
      <div className="dialog-panel dialog-panel--sm">
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div className="u-flex-center-8">
            <span className="material-symbols-outlined u-color-error">
              logout
            </span>
            <h2 className="u-text-lg u-m0">Leave Game?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="dialog-close-btn"
          >
            <span className="material-symbols-outlined u-text-20">
              close
            </span>
          </button>
        </div>

        <div className="dialog-body u-p-20">
          <p className="u-m0" style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
            {isBotMode
              ? `Are you sure you want to leave? Your match progress will be lost and you will return to the ${gameLabel} page.`
              : isHost
              ? "Are you sure you want to leave? Because you are the Host, this will instantly end the game for everyone."
              : "Are you sure you want to leave? A bot will take over your seat for the remainder of the game."}
          </p>
        </div>

        <div className="dialog-footer" style={{ gap: "10px" }}>
          <button
            type="button"
            className="button button--secondary u-flex-1"
            style={{ justifyContent: "center" }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button--primary u-flex-1"
            style={{ justifyContent: "center", backgroundColor: "#ef4444", color: "#fff", border: "none" }}
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

// ==========================================
// 4. HOST DISCONNECTED MODAL
// ==========================================
interface HostDisconnectedModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onDismiss: () => void;
}

export function HostDisconnectedModal({
  isOpen,
  secondsRemaining,
  onDismiss,
}: HostDisconnectedModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 310 }}>
      <div className="dialog-scrim" onClick={onDismiss} />
      <div className="dialog-panel dialog-panel--sm" style={{ border: "1px solid rgba(239, 68, 68, 0.4)" }}>
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div className="u-flex-center-8">
            <span className="material-symbols-outlined u-color-error">
              warning
            </span>
            <h2 className="u-text-lg u-m0" style={{ color: "#ef4444" }}>Host Disconnected</h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close dialog"
            className="dialog-close-btn"
          >
            <span className="material-symbols-outlined u-text-20">
              close
            </span>
          </button>
        </div>

        <div className="dialog-body u-p-20 u-flex-col-16">
          <p className="u-m0" style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
            The host has gone offline. If they do not return, this game room will automatically close for everyone.
          </p>
          <div
            className="u-flex-between u-p-12"
            style={{ background: "rgba(239, 68, 68, 0.08)", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)" }}
          >
            <span className="u-text-5sm u-fw-700" style={{ color: "var(--text)", fontWeight: 600 }}>
              Room closing in:
            </span>
            <span
              className="u-fw-800"
              style={{ fontSize: "1.25rem", color: "#ef4444", fontVariantNumeric: "tabular-nums" }}
            >
              {secondsRemaining >= 60
                ? `${Math.floor(secondsRemaining / 60)}:${(secondsRemaining % 60).toString().padStart(2, "0")}`
                : `${secondsRemaining}s`}
            </span>
          </div>
          <p className="u-m0 u-text-2sm" style={{ color: "var(--muted)" }}>
            You can dismiss this popup to view the board. The remaining time will remain visible in the top navbar.
          </p>
        </div>

        <div className="dialog-footer">
          <button
            type="button"
            className="button button--secondary button--full"
            style={{ justifyContent: "center" }}
            onClick={onDismiss}
          >
            Dismiss (View Board)
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. ROOM DESTROYED / GAME CLOSED MODAL
// ==========================================
interface RoomDestroyedModalProps {
  isOpen: boolean;
  message: string | null;
  gameType?: string;
  onExit: () => void;
}

export function RoomDestroyedModal({
  isOpen,
  message,
  gameType,
  onExit,
}: RoomDestroyedModalProps) {
  const [countdown, setCountdown] = useState(8);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    if (!isOpen) {
      setCountdown(8);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const gameLabel = getGameLabel(gameType);

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 350 }}>
      <div className="dialog-scrim" />
      <div className="dialog-panel dialog-panel--sm" style={{ border: "1px solid rgba(239, 68, 68, 0.4)" }}>
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div className="u-flex-center-8">
            <span className="material-symbols-outlined u-color-error">
              cancel
            </span>
            <h2 className="u-text-lg u-m0" style={{ color: "#ef4444" }}>Game Ended</h2>
          </div>
        </div>

        <div className="dialog-body u-p-20 u-flex-col-16">
          <p className="u-m0 u-fw-700" style={{ fontSize: "0.95rem", color: "var(--text)", lineHeight: 1.5, fontWeight: 600 }}>
            {message || "The game was ended."}
          </p>
          <div
            className="u-flex-between u-p-12"
            style={{ background: "rgba(239, 68, 68, 0.08)", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)" }}
          >
            <span className="u-text-4sm u-label-muted">
              Returning to {gameLabel} in:
            </span>
            <span
              className="u-fw-800"
              style={{ fontSize: "1.1rem", color: "#ef4444", fontVariantNumeric: "tabular-nums" }}
            >
              {countdown}s
            </span>
          </div>
        </div>

        <div className="dialog-footer">
          <button
            type="button"
            className="button button--primary button--full"
            style={{ justifyContent: "center", backgroundColor: "var(--primary)", color: "#fff", border: "none" }}
            onClick={onExit}
          >
            Return to {gameLabel} Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeviceTransferredModal — shown when the game session was moved to another device
// ---------------------------------------------------------------------------

export interface DeviceTransferredModalProps {
  isOpen: boolean;
  onExit: () => void;
}

export function DeviceTransferredModal({ isOpen, onExit }: DeviceTransferredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 350 }}>
      <div className="dialog-scrim" />
      <div className="dialog-panel dialog-panel--sm" style={{ border: "1px solid rgba(56, 189, 248, 0.4)" }}>
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div className="u-flex-center-8">
            <span className="material-symbols-outlined" style={{ color: "#38bdf8", fontSize: "24px" }}>
              devices
            </span>
            <h2 className="u-text-lg u-m0" style={{ color: "#38bdf8" }}>Game Transferred</h2>
          </div>
        </div>

        <div className="dialog-body u-p-20">
          <p className="u-m0" style={{ fontSize: "0.95rem", color: "var(--text)", lineHeight: 1.5 }}>
            Your game session was moved to another device. This connection has been disconnected.
          </p>
        </div>

        <div className="dialog-footer">
          <button
            type="button"
            className="button button--primary button--full"
            style={{ justifyContent: "center", backgroundColor: "#38bdf8", color: "#0c4a6e", border: "none" }}
            onClick={onExit}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export interface ConfirmActionModalProps {
  isOpen: boolean;
  cardName: string;
  cardDescription?: string;
  card?: CardInstance;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionModal({
  isOpen,
  cardName,
  cardDescription,
  card,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 350 }}>
      <div className="dialog-scrim" onClick={onCancel} />
      <div className="dialog-panel dialog-panel--sm" style={{ border: "1px solid rgba(0, 85, 164, 0.4)" }}>
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div className="u-flex-center-8">
            <span className="material-symbols-outlined u-color-primary u-text-22">
              help
            </span>
            <h2 className="u-text-lg u-m0">Confirm Action Play</h2>
          </div>
        </div>

        <div className="dialog-body u-p-20 u-flex-col-12">
          {card && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Card card={resolveCardDef(card)} size="xs" isInteractive={false} currentColor={card.currentColor} />
            </div>
          )}
          <p className="u-m0" style={{ fontSize: "0.95rem", color: "var(--text)", lineHeight: 1.5 }}>
            Are you sure you want to play <strong>{cardName}</strong>?
          </p>
          {cardDescription && (
            <div
              className="u-text-4sm"
              style={{
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.04)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--muted)",
                lineHeight: 1.4,
              }}
            >
              {cardDescription}
            </div>
          )}
        </div>

        <div className="dialog-footer u-flex u-gap-10">
          <button
            type="button"
            className="button button--ghost u-flex-1"
            style={{ justifyContent: "center" }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button--primary u-flex-1"
            style={{ justifyContent: "center" }}
            onClick={onConfirm}
          >
            Confirm & Play
          </button>
        </div>
      </div>
    </div>
  );
}
