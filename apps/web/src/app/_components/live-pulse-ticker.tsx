"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ServerStats } from "../../lib/api";

interface LivePulseTickerProps {
  stats: ServerStats | null;
  onOpenJoinModal?: () => void;
}

export function LivePulseTicker({ stats, onOpenJoinModal }: LivePulseTickerProps) {
  const router = useRouter();
  const [quickCode, setQuickCode] = useState("");

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = quickCode.trim().toUpperCase();
    if (!cleanCode) return;
    router.push(`/game?room=${encodeURIComponent(cleanCode)}`);
  };

  const onlineCount = stats?.onlinePlayers ?? 1;
  const activeRoomsCount = stats?.activeRooms ?? 0;
  const totalGamesCount = stats?.totalGames ?? 420;

  return (
    <div className="live-pulse-ribbon-wrap shell">
      <div className="live-pulse-ribbon">
        {/* Metrics Row */}
        <div className="live-pulse-metrics-row">
          {/* Metric 1: Online Status */}
          <div className="live-pulse-metric">
            <div className="live-pulse-icon-box live-pulse-icon-box--green">
              <span className="live-pulse-dot" />
              <span
                className="material-symbols-outlined live-pulse-icon"
                style={{ color: "#10b981", fontSize: "19px" }}
              >
                sensors
              </span>
            </div>
            <div className="live-pulse-data">
              <span className="live-pulse-val">{onlineCount} Online</span>
              <span className="live-pulse-sub">Zero-lag WebSockets</span>
            </div>
          </div>

          {/* Metric 2: Active Matches */}
          <div className="live-pulse-metric">
            <div className="live-pulse-icon-box live-pulse-icon-box--blue">
              <span
                className="material-symbols-outlined live-pulse-icon"
                style={{ color: "#38bdf8", fontSize: "19px" }}
              >
                table_restaurant
              </span>
            </div>
            <div className="live-pulse-data">
              <span className="live-pulse-val">{activeRoomsCount} Tables</span>
              <span className="live-pulse-sub">Public & Private matches</span>
            </div>
          </div>

          {/* Metric 3: Pacing */}
          <div className="live-pulse-metric">
            <div className="live-pulse-icon-box live-pulse-icon-box--amber">
              <span
                className="material-symbols-outlined live-pulse-icon"
                style={{ color: "#facc15", fontSize: "19px" }}
              >
                timer
              </span>
            </div>
            <div className="live-pulse-data">
              <span className="live-pulse-val">10–15 Min</span>
              <span className="live-pulse-sub">Fast & ruthless pacing</span>
            </div>
          </div>
        </div>

        {/* Quick Room Code Input Form */}
        <form onSubmit={handleQuickJoin} className="live-pulse-quick-join">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px", color: "var(--muted)" }}
          >
            pin
          </span>
          <input
            type="text"
            maxLength={8}
            placeholder="Room Code..."
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
            className="live-pulse-input"
            aria-label="Enter room code to join instantly"
          />
          <button
            type="submit"
            className="live-pulse-submit-btn"
            title="Join room instantly"
          >
            <span>Join</span>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              arrow_forward
            </span>
          </button>
        </form>

        {/* Quick Links */}
        <div className="live-pulse-links">
          <Link
            href="/lobbies"
            className="live-pulse-link-btn"
            title="View all open lobbies"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              meeting_room
            </span>
            <span>All Lobbies</span>
          </Link>
          <Link
            href="/leaderboard"
            className="live-pulse-link-btn"
            title="View player leaderboards"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              leaderboard
            </span>
            <span>Ranks</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
