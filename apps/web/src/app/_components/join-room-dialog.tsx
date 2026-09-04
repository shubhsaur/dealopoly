"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { getRecentRooms, type RecentRoom } from "../../lib/session";

type JoinRoomDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onJoin?: (roomCode: string, playerName: string) => void;
};

export function JoinRoomDialog({ isOpen, onClose, onJoin }: JoinRoomDialogProps) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setRecentRooms(getRecentRooms());
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

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
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a room code");
      return;
    }
    if (cleanCode.length < 4) {
      setError("Room code must be at least 4 characters");
      return;
    }

    if (onJoin) {
      onJoin(cleanCode, playerName.trim());
    } else {
      const query = new URLSearchParams();
      query.set("room", cleanCode);
      if (playerName.trim()) {
        query.set("player", playerName.trim());
      }
      router.push(`/lobby?${query.toString()}`);
    }
    onClose();
  };

  const handleSelectRecent = (room: RecentRoom) => {
    setRoomCode(room.code);
    setError(null);
    if (onJoin) {
      onJoin(room.code, playerName.trim());
    } else {
      const query = new URLSearchParams();
      query.set("room", room.code);
      if (room.gameType) {
        query.set("game", room.gameType);
      }
      if (playerName.trim()) {
        query.set("player", playerName.trim());
      }
      router.push(`/lobby?${query.toString()}`);
    }
    onClose();
  };

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="join-dialog-title">
      {/* Backdrop Scrim */}
      <div className="dialog-scrim" onClick={onClose} aria-hidden="true" />

      {/* Dialog Panel (Desktop Modal + Mobile Bottom Sheet) */}
      <div className="dialog-panel">
        <div className="texture-overlay" />

        {/* Mobile Drag Handle */}
        <div className="sheet-handle" />

        {/* Header */}
        <div className="dialog-header">
          <h2 id="join-dialog-title">Join Game Room</h2>
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
          <p className="dialog-instructions">
            Enter the 6-character room code provided by the host to join their game.
          </p>

          {/* Room Code */}
          <div className="dialog-field">
            <label htmlFor="roomCode" className="dialog-label">
              Room Code
            </label>
            <div className="dialog-input-wrapper">
              <span className="material-symbols-outlined dialog-input-icon">
                meeting_room
              </span>
              <input
                ref={inputRef}
                id="roomCode"
                type="text"
                maxLength={8}
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                placeholder="000000"
                className="dialog-input dialog-input--code"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {error && <span className="dialog-error">{error}</span>}
          </div>

          {/* Player Name */}
          <div className="dialog-field">
            <label htmlFor="playerName" className="dialog-label">
              Your Name <span style={{ opacity: 0.6, textTransform: "none", fontWeight: 400 }}>(Optional)</span>
            </label>
            <div className="dialog-input-wrapper">
              <span className="material-symbols-outlined dialog-input-icon">
                person
              </span>
              <input
                id="playerName"
                type="text"
                maxLength={24}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Guest Player"
                className="dialog-input"
                autoComplete="nickname"
              />
            </div>
          </div>

          {/* Recent Rooms */}
          {recentRooms.length > 0 && (
            <div className="recent-rooms-section">
              <span className="dialog-label">Recent</span>
              {recentRooms.map((room) => (
                <button
                  key={room.code}
                  type="button"
                  onClick={() => handleSelectRecent(room)}
                  className="recent-room-item"
                >
                  <div className="recent-room-left">
                    <div className="recent-room-avatar">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                      >
                        {room.gameType === "least_count" ? "casino" : "groups"}
                      </span>
                    </div>
                    <div>
                      <div className="recent-room-name">{room.name}</div>
                      <div className="recent-room-code">Code: {room.code}</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary)" }}>
                    arrow_forward_ios
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Submit Action */}
          <div style={{ paddingTop: "6px" }}>
            <button type="submit" className="button button--primary button--full">
              <span className="material-symbols-outlined" style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}>
                login
              </span>
              Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
