"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface VoiceControlsProps {
  isJoined: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isPttActive: boolean;
  isSpeaking: boolean;
  audioLevel?: number;
  permissionState: "prompt" | "granted" | "denied";
  connectionStatus: "idle" | "connecting" | "connected" | "error";
  errorMessage?: string | null;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onPttStart?: () => void;
  onPttEnd?: () => void;
  pttKey?: string;
  isPttMode?: boolean;
  placement?: "top" | "bottom";
}

export function VoiceControlsDock({
  isJoined,
  isMuted,
  isDeafened,
  isPttActive,
  isSpeaking,
  audioLevel = 0,
  permissionState,
  connectionStatus,
  errorMessage,
  onJoin,
  onLeave,
  onToggleMute,
  onToggleDeafen,
  onPttStart,
  onPttEnd,
  pttKey = "KeyV",
  isPttMode = false,
  placement = "top",
}: VoiceControlsProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Friendly key label (e.g. "KeyV" -> "V", "Space" -> "Space")
  const pttKeyLabel = pttKey.replace(/^Key/, "").toUpperCase();

  // Close panel on outside click
  useEffect(() => {
    if (!isPanelOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isPanelOpen]);

  // When leaving voice, close the panel
  useEffect(() => {
    if (!isJoined) {
      setIsPanelOpen(false);
    }
  }, [isJoined]);

  // Main mic button click handler
  const handleMainMicClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isJoined) {
        onJoin();
      } else {
        onToggleMute();
      }
    },
    [isJoined, onJoin, onToggleMute]
  );

  const micTransmitting = isPttMode ? isPttActive && !isDeafened : !isMuted && !isDeafened;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. DISCONNECTED STATE: Sleek circular button matching .chat-toggle-btn
  // ──────────────────────────────────────────────────────────────────────────
  if (!isJoined) {
    return (
      <div ref={containerRef} className="voice-dock-container relative">
        <button
          type="button"
          onClick={handleMainMicClick}
          disabled={connectionStatus === "connecting"}
          aria-label={
            permissionState === "denied"
              ? "Microphone blocked in browser permissions"
              : connectionStatus === "connecting"
                ? "Connecting to Voice Chat..."
                : "Join Voice Chat"
          }
          title={
            permissionState === "denied"
              ? "Microphone blocked in browser permissions"
              : connectionStatus === "connecting"
                ? "Connecting..."
                : "Join Voice Chat"
          }
          className={`voice-toggle-btn ${
            permissionState === "denied"
              ? "voice-toggle-btn--muted"
              : connectionStatus === "connecting"
                ? "voice-toggle-btn--connecting"
                : ""
          }`}
        >
          {connectionStatus === "connecting" ? (
            <span
              className="material-symbols-outlined animate-spin"
              style={{ fontSize: "18px", color: "#fbbf24" }}
            >
              progress_activity
            </span>
          ) : permissionState === "denied" ? (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", color: "#f87171" }}
            >
              mic_off
            </span>
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px" }}
            >
              mic
            </span>
          )}

          {/* Status dot */}
          <span
            className={`voice-status-dot ${
              permissionState === "denied"
                ? "voice-status-dot--blocked"
                : connectionStatus === "connecting"
                  ? "voice-status-dot--connecting"
                  : "voice-status-dot--ready"
            }`}
          />
        </button>

        {/* Transient error tooltip if mic was blocked */}
        {errorMessage && (
          <div
            className={`voice-tooltip-error absolute ${
              placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
            } right-0 bg-slate-950/95 border border-rose-500/50 text-rose-300 text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50`}
          >
            {errorMessage}
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CONNECTED STATE: Responsive glass dock + Floating expandable panel
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="voice-dock-container relative">
      <div
        className={`voice-dock-pill ${
          isSpeaking ? "voice-dock-pill--speaking" : ""
        }`}
      >
        {/* Main Mic Button: One tap toggles Mute/Unmute */}
        <button
          type="button"
          onClick={handleMainMicClick}
          onPointerDown={isPttMode ? onPttStart : undefined}
          onPointerUp={isPttMode ? onPttEnd : undefined}
          title={
            isPttMode
              ? `Push-to-Talk (${pttKeyLabel}): Hold to talk, or click to toggle mute`
              : isMuted
                ? "Unmute Microphone"
                : "Mute Microphone"
          }
          aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          className={`voice-pill-btn voice-pill-btn--mic ${
            !micTransmitting || isMuted
              ? "voice-pill-btn--muted"
              : isSpeaking
                ? "voice-pill-btn--speaking"
                : "voice-pill-btn--active"
          }`}
        >
          {isDeafened ? (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "17px", color: "#fbbf24" }}
            >
              headset_off
            </span>
          ) : !micTransmitting || isMuted ? (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "17px", color: "#f87171" }}
            >
              mic_off
            </span>
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "17px", color: "#10b981" }}
            >
              mic
            </span>
          )}

          {/* Pulse ring when speaking */}
          {isSpeaking && <span className="voice-speaking-pulse" />}
        </button>

        {/* Quick Deafen Button (Desktop/Tablet) */}
        <button
          type="button"
          onClick={onToggleDeafen}
          title={isDeafened ? "Undeafen Audio" : "Deafen Audio"}
          aria-label={isDeafened ? "Undeafen Audio" : "Deafen Audio"}
          className={`voice-pill-btn voice-pill-btn--desktop ${
            isDeafened ? "voice-pill-btn--deafened" : ""
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "16px",
              color: isDeafened ? "#fbbf24" : "rgba(255,255,255,0.7)",
            }}
          >
            {isDeafened ? "headset_off" : "headset"}
          </span>
        </button>

        {/* Voice Panel Menu Button */}
        <button
          type="button"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          title={isPanelOpen ? "Close Voice Controls" : "Voice Options & Audio"}
          aria-label="Toggle Voice Panel"
          className={`voice-pill-btn ${isPanelOpen ? "voice-pill-btn--open" : ""}`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "16px" }}
          >
            {isPanelOpen ? "close" : "tune"}
          </span>
        </button>

        {/* Quick Disconnect Button (Desktop/Tablet) */}
        <button
          type="button"
          onClick={onLeave}
          title="Disconnect from Voice"
          aria-label="Disconnect Voice"
          className="voice-pill-btn voice-pill-btn--leave voice-pill-btn--desktop"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "15px" }}
          >
            call_end
          </span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. EXPANDABLE VOICE PANEL (Mobile-friendly Sheet / Floating Card)      */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: placement === "top" ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: placement === "top" ? 8 : -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`voice-panel ${
              placement === "top" ? "voice-panel--top" : "voice-panel--bottom"
            }`}
          >
            {/* Header */}
            <div className="voice-panel-header">
              <div className="voice-panel-title">
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "17px",
                    color: isMuted ? "#f87171" : "#10b981",
                  }}
                >
                  {isMuted ? "mic_off" : "volume_up"}
                </span>
                <span>Voice Chat</span>
                <span
                  className={`voice-panel-badge ${
                    isDeafened
                      ? "voice-panel-badge--deafened"
                      : isMuted
                        ? "voice-panel-badge--muted"
                        : "voice-panel-badge--active"
                  }`}
                >
                  {isDeafened ? "DEAFENED" : isMuted ? "MUTED" : "CONNECTED"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="voice-panel-close"
                aria-label="Close Voice Panel"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  close
                </span>
              </button>
            </div>

            {/* Panel Body */}
            <div className="voice-panel-body">
              {/* Dynamic Wave Spectrum Visualizer */}
              <div className="voice-wave-container">
                {[0.4, 0.7, 1.0, 0.85, 0.6, 0.9, 0.5].map((scaleMultiplier, i) => {
                  const dynamicHeight = isMuted || isDeafened
                    ? 4
                    : isSpeaking
                      ? Math.max(6, Math.min(22, (audioLevel * 30 + 6) * scaleMultiplier))
                      : 4;
                  return (
                    <div
                      key={i}
                      className={`voice-wave-bar ${
                        isSpeaking
                          ? "voice-wave-bar--active"
                          : isMuted
                            ? "voice-wave-bar--muted"
                            : ""
                      }`}
                      style={{ height: `${dynamicHeight}px` }}
                    />
                  );
                })}
              </div>

              <div className="voice-status-caption">
                {isDeafened
                  ? "Audio deafened · Muting table sound"
                  : isMuted
                    ? "Microphone is muted"
                    : isSpeaking
                      ? "Transmitting audio..."
                      : isPttMode
                        ? `Push-to-Talk (${pttKeyLabel})`
                        : "Open Mic (Voice Active)"}
              </div>

              {/* Push-to-Talk Touch Button (Perfect for Mobile Touch!) */}
              {isPttMode && (
                <button
                  type="button"
                  onPointerDown={onPttStart}
                  onPointerUp={onPttEnd}
                  className={`voice-ptt-touch-btn ${isPttActive ? "active" : ""}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    {isPttActive ? "mic" : "touch_app"}
                  </span>
                  <span>{isPttActive ? "TRANSMITTING..." : "HOLD TO TALK"}</span>
                </button>
              )}

              {/* Big Touch-Friendly Action Buttons */}
              <div className="voice-action-group">
                {/* Mute Toggle Button */}
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={`voice-action-btn ${isMuted ? "voice-action-btn--muted" : ""}`}
                >
                  <div className="voice-action-label">
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "18px",
                        color: isMuted ? "#f87171" : "#10b981",
                      }}
                    >
                      {isMuted ? "mic_off" : "mic"}
                    </span>
                    <span>{isMuted ? "Unmute Microphone" : "Mute Microphone"}</span>
                  </div>
                  <span className="voice-action-state">
                    {isMuted ? "MUTED" : "LIVE"}
                  </span>
                </button>

                {/* Deafen Toggle Button */}
                <button
                  type="button"
                  onClick={onToggleDeafen}
                  className={`voice-action-btn ${
                    isDeafened ? "voice-action-btn--deafened" : ""
                  }`}
                >
                  <div className="voice-action-label">
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "18px",
                        color: isDeafened ? "#fbbf24" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {isDeafened ? "headset_off" : "headset"}
                    </span>
                    <span>{isDeafened ? "Undeafen Audio" : "Deafen Audio"}</span>
                  </div>
                  <span className="voice-action-state">
                    {isDeafened ? "DEAF" : "HEAR"}
                  </span>
                </button>
              </div>

              {/* Disconnect Voice Button */}
              <button
                type="button"
                onClick={onLeave}
                className="voice-action-btn voice-action-btn--leave"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "17px" }}
                >
                  call_end
                </span>
                <span>Disconnect Voice</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Avatar Voice Speaking Glow Ring and Mute Pill
 * Renders an animated pulse ring when player is speaking, or a muted indicator when muted.
 */
export function AvatarVoiceRing({
  isSpeaking,
  isMuted,
  isDeafened,
  children,
  className = "",
}: {
  isSpeaking?: boolean;
  isMuted?: boolean;
  isDeafened?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Speaking Ripple Pulse */}
      {isSpeaking && (
        <>
          <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
          <span className="absolute -inset-1 rounded-full border-2 border-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.8)] pointer-events-none" />
        </>
      )}

      {children}

      {/* Muted / Deafened Badge */}
      {isDeafened ? (
        <span
          className="game-opponent-muted-badge"
          style={{ borderColor: "rgba(245, 158, 11, 0.8)" }}
          title="Deafened"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "10px", color: "#fbbf24" }}
          >
            headset_off
          </span>
        </span>
      ) : isMuted ? (
        <span className="game-opponent-muted-badge" title="Muted">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "10px", color: "#f87171" }}
          >
            mic_off
          </span>
        </span>
      ) : null}
    </div>
  );
}
