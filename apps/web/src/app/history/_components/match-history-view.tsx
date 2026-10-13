"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "../../_components/back-button";

export interface PastGameItem {
  id: string;
  gameType: string;
  seed: number;
  status: string;
  turnCount: number;
  startedAt: string;
  completedAt: string | null;
  winnerId: string | null;
  winnerName: string | null;
  roomCode: string;
  playerCount: number;
  isVictory: boolean;
}

export interface MatchHistoryViewProps {
  games: PastGameItem[];
  dbError?: string | null;
  userId: string;
}

interface GameEventItem {
  id: number;
  sequenceNum: number;
  eventType: string;
  playerId?: string;
  playerName?: string;
  message: string;
  occurredAt: string;
}

export function MatchHistoryView({ games, dbError }: MatchHistoryViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "victories" | "defeats" | "in_progress">("all");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [gameEvents, setGameEvents] = useState<GameEventItem[]>([]);
  const [selectedGameMeta, setSelectedGameMeta] = useState<PastGameItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Auto-sync guest sessions from localStorage if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("dealopoly_room_sessions");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const sessionList: Array<{ playerId: string; token: string }> = [];

      for (const val of Object.values(parsed)) {
        if (!val) continue;
        const arr = Array.isArray(val) ? val : [val];
        for (const item of arr) {
          if (item?.playerId && item?.token) {
            sessionList.push({ playerId: item.playerId, token: item.token });
          }
        }
      }

      if (sessionList.length > 0) {
        fetch("/api/history/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessions: sessionList }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.linkedCount > 0) {
              setSyncMessage(`Linked ${data.linkedCount} recent match${data.linkedCount > 1 ? "es" : ""} to your account!`);
              router.refresh();
            }
          })
          .catch(() => {
            // Silently ignore background sync errors
          });
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, [router]);

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const raw = localStorage.getItem("dealopoly_room_sessions");
      if (!raw) {
        setSyncMessage("No local guest matches found on this browser.");
        setIsSyncing(false);
        return;
      }
      const parsed = JSON.parse(raw);
      const sessionList: Array<{ playerId: string; token: string }> = [];
      for (const val of Object.values(parsed)) {
        if (!val) continue;
        const arr = Array.isArray(val) ? val : [val];
        for (const item of arr) {
          if (item?.playerId && item?.token) {
            sessionList.push({ playerId: item.playerId, token: item.token });
          }
        }
      }

      const res = await fetch("/api/history/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions: sessionList }),
      });
      const data = await res.json();
      if (data?.linkedCount > 0) {
        setSyncMessage(`Successfully linked ${data.linkedCount} match${data.linkedCount > 1 ? "es" : ""}!`);
        router.refresh();
      } else {
        setSyncMessage("All local sessions are already up-to-date.");
      }
    } catch {
      setSyncMessage("Sync completed. No new matches found.");
    } finally {
      setIsSyncing(false);
    }
  }, [router]);

  const handleOpenLog = useCallback(async (game: PastGameItem) => {
    setSelectedGameId(game.id);
    setSelectedGameMeta(game);
    setEventsLoading(true);
    setEventsError(null);
    setGameEvents([]);

    try {
      const res = await fetch(`/api/history/${game.id}`);
      if (!res.ok) {
        throw new Error("Failed to load match events");
      }
      const data = await res.json();
      setGameEvents(data.events || []);
    } catch (err: unknown) {
      setEventsError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const handleCloseLog = useCallback(() => {
    setSelectedGameId(null);
    setSelectedGameMeta(null);
    setGameEvents([]);
    setEventsError(null);
  }, []);

  const handleCopyRoomCode = useCallback((code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  }, []);

  const victoriesCount = useMemo(
    () => games.filter((g) => g.status === "completed" && g.isVictory).length,
    [games]
  );
  const defeatsCount = useMemo(
    () => games.filter((g) => g.status === "completed" && !g.isVictory).length,
    [games]
  );
  const inProgressCount = useMemo(
    () => games.filter((g) => g.status !== "completed").length,
    [games]
  );

  const filteredGames = useMemo(() => {
    if (filter === "victories") return games.filter((g) => g.status === "completed" && g.isVictory);
    if (filter === "defeats") return games.filter((g) => g.status === "completed" && !g.isVictory);
    if (filter === "in_progress") return games.filter((g) => g.status !== "completed");
    return games;
  }, [games, filter]);

  const winRate = useMemo(() => {
    const total = victoriesCount + defeatsCount;
    return total > 0 ? Math.round((victoriesCount / total) * 100) : 0;
  }, [victoriesCount, defeatsCount]);

  return (
    <main style={{ flex: 1, padding: "48px 16px" }}>
      <div className="shell" style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Navigation & Title */}
        <div style={{ marginBottom: "28px" }}>
          <BackButton fallbackUrl="/profile" label="Back to Profile" variant="subtle" style={{ marginBottom: "12px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontFamily: "var(--display)", fontSize: "2rem", fontWeight: 800, margin: "0 0 6px" }}>
                Match History
              </h1>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", margin: 0 }}>
                Your complete match records, outcomes, and move logs across Dealopoly rooms.
              </p>
            </div>

            {games.length > 0 && (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    background: "rgba(102, 223, 117, 0.15)",
                    color: "var(--green)",
                    border: "1px solid rgba(102, 223, 117, 0.3)",
                  }}
                >
                  🏆 {victoriesCount} Wins
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    background: "rgba(255, 125, 125, 0.15)",
                    color: "var(--coral)",
                    border: "1px solid rgba(255, 125, 125, 0.3)",
                  }}
                >
                  ⚔️ {defeatsCount} Losses
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    background: "rgba(168, 200, 255, 0.15)",
                    color: "var(--primary)",
                    border: "1px solid rgba(168, 200, 255, 0.3)",
                  }}
                >
                  📊 {winRate}% Win Rate
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Database Warning Notice */}
        {dbError && (
          <div
            style={{
              padding: "14px 18px",
              marginBottom: "20px",
              borderRadius: "12px",
              background: "rgba(255, 183, 125, 0.12)",
              border: "1px solid rgba(255, 183, 125, 0.35)",
              color: "var(--tertiary)",
              fontSize: "0.86rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                warning
              </span>
              <span>{dbError}</span>
            </div>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="button button--ghost"
              style={{ padding: "4px 12px", fontSize: "0.78rem" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Sync notification */}
        {syncMessage && (
          <div
            style={{
              padding: "12px 18px",
              marginBottom: "20px",
              borderRadius: "12px",
              background: "rgba(102, 223, 117, 0.12)",
              border: "1px solid rgba(102, 223, 117, 0.3)",
              color: "var(--green)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{syncMessage}</span>
            <button
              type="button"
              onClick={() => setSyncMessage(null)}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Controls Bar: Filters & Sync */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`button ${filter === "all" ? "button--primary" : "button--ghost"}`}
              style={{ padding: "6px 14px", fontSize: "0.82rem" }}
            >
              All Matches ({games.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("victories")}
              className={`button ${filter === "victories" ? "button--primary" : "button--ghost"}`}
              style={{ padding: "6px 14px", fontSize: "0.82rem" }}
            >
              🏆 Victories ({victoriesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("defeats")}
              className={`button ${filter === "defeats" ? "button--primary" : "button--ghost"}`}
              style={{ padding: "6px 14px", fontSize: "0.82rem" }}
            >
              ⚔️ Defeats ({defeatsCount})
            </button>
            {inProgressCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("in_progress")}
                className={`button ${filter === "in_progress" ? "button--primary" : "button--ghost"}`}
                style={{ padding: "6px 14px", fontSize: "0.82rem" }}
              >
                ⏳ Other ({inProgressCount})
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="button button--ghost"
              style={{ padding: "6px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
              title="Sync any guest matches played in this browser to your account"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                sync
              </span>
              <span>{isSyncing ? "Syncing…" : "Sync Browser Games"}</span>
            </button>
            <Link
              href="/lobby"
              className="button button--primary"
              style={{ padding: "6px 14px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                add
              </span>
              <span>New Match</span>
            </Link>
          </div>
        </div>

        {/* Empty State */}
        {filteredGames.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: "48px 24px",
              borderRadius: "20px",
              textAlign: "center",
              background: "var(--surface)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--subtle)", marginBottom: "12px" }}>
              sports_esports
            </span>
            <h3 style={{ margin: "0 0 8px" }}>
              {filter === "all"
                ? "No Matches Recorded For Your Account"
                : `No ${filter === "victories" ? "Victories" : filter === "defeats" ? "Defeats" : "Matches"} Found`}
            </h3>
            <p style={{ color: "var(--muted)", maxWidth: "440px", margin: "0 auto 20px", fontSize: "0.88rem" }}>
              Matches played in multiplayer rooms or practice matches with bots created in the lobby are permanently logged to your history.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/lobby" className="button button--primary">
                Create a Room →
              </Link>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="button button--secondary"
              >
                Sync Previous Games
              </button>
            </div>
          </div>
        ) : (
          /* Match List */
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {filteredGames.map((match) => {
              const isCompleted = match.status === "completed";
              const isAbandoned = match.status === "abandoned";
              const isVictory = match.isVictory;
              const isMonodeal = match.gameType === "monodeal";

              const dateStr = new Date(match.startedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={match.id}
                  className="glass-panel"
                  style={{
                    padding: "18px 22px",
                    borderRadius: "16px",
                    background: "var(--surface)",
                    border: isCompleted && isVictory ? "1px solid rgba(102, 223, 117, 0.35)" : "1px solid var(--outline-variant)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    transition: "border-color 0.2s ease, transform 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {/* Status Icon */}
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: isCompleted
                          ? (isVictory ? "rgba(102, 223, 117, 0.2)" : "rgba(255, 125, 125, 0.15)")
                          : (isAbandoned ? "rgba(156, 163, 175, 0.15)" : "rgba(168, 200, 255, 0.15)"),
                        color: isCompleted
                          ? (isVictory ? "var(--green)" : "var(--coral)")
                          : (isAbandoned ? "var(--subtle)" : "var(--primary)"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                        {isCompleted ? (isVictory ? "emoji_events" : "military_tech") : (isAbandoned ? "cancel" : "pending")}
                      </span>
                    </div>

                    {/* Meta Details */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          Room #{match.roomCode}
                        </span>

                        {/* Game Type Badge */}
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "0.68rem",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: isMonodeal ? "rgba(59, 130, 246, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: isMonodeal ? "var(--primary)" : "#f59e0b",
                            border: `1px solid ${isMonodeal ? "rgba(59, 130, 246, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                            fontWeight: 700,
                          }}
                        >
                          {isMonodeal ? "🃏 Monodeal" : "🎯 Lowdeck"}
                        </span>

                        {/* Outcome Badge */}
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "0.68rem",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: isCompleted
                              ? (isVictory ? "rgba(102, 223, 117, 0.2)" : "rgba(255, 125, 125, 0.2)")
                              : (isAbandoned ? "rgba(156, 163, 175, 0.2)" : "rgba(255, 183, 125, 0.2)"),
                            color: isCompleted
                              ? (isVictory ? "var(--green)" : "var(--coral)")
                              : (isAbandoned ? "var(--subtle)" : "var(--tertiary)"),
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                          }}
                        >
                          {isCompleted
                            ? (isVictory ? "VICTORY" : "DEFEAT")
                            : (isAbandoned ? "ABANDONED" : "IN PROGRESS")}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.78rem", color: "var(--muted)", fontFamily: "var(--mono)", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{match.turnCount} turns</span>
                        <span>•</span>
                        <span>{match.playerCount} players</span>
                        {match.winnerName && (
                          <>
                            <span>•</span>
                            <span style={{ color: isVictory ? "var(--green)" : "var(--text)" }}>
                              Winner: {match.winnerName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Seed */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.76rem", color: "var(--subtle)", fontFamily: "var(--mono)" }}>
                      Seed: {match.seed}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyRoomCode(match.roomCode)}
                      className="button button--ghost"
                      style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                      title="Copy room code"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                        {copiedCode === match.roomCode ? "check" : "content_copy"}
                      </span>
                    </button>

                    {!isCompleted && !isAbandoned && (
                      <Link
                        href={`/lobby?room=${match.roomCode}`}
                        className="button button--primary"
                        style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                      >
                        Rejoin Match →
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenLog(match)}
                      className="button button--secondary"
                      style={{ padding: "5px 12px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                        list_alt
                      </span>
                      <span>Move Log</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Move Log Modal Drawer */}
        {selectedGameId && selectedGameMeta && (
          <div
            className="join-dialog-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-log-dialog-title"
          >
            <div className="dialog-scrim" onClick={handleCloseLog} aria-hidden="true" />
            <div className="dialog-panel dialog-panel--md" style={{ maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
              <div className="dialog-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "var(--primary)" }}>
                    feed
                  </span>
                  <div>
                    <h2 id="move-log-dialog-title" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>
                      Match Activity Log
                    </h2>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                      Room #{selectedGameMeta.roomCode} • {selectedGameMeta.gameType === "monodeal" ? "Dealopoly" : "Lowdeck"} • {selectedGameMeta.turnCount} turns
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseLog}
                  aria-label="Close dialog"
                  className="dialog-close-btn"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    close
                  </span>
                </button>
              </div>

              <div className="dialog-body" style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                {eventsLoading && (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: "0.88rem" }}>
                    <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite", fontSize: "28px", display: "block", margin: "0 auto 8px" }}>
                      progress_activity
                    </span>
                    Loading match events...
                  </div>
                )}

                {eventsError && (
                  <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255, 125, 125, 0.12)", color: "var(--coral)", fontSize: "0.85rem", textAlign: "center" }}>
                    {eventsError}
                  </div>
                )}

                {!eventsLoading && !eventsError && gameEvents.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                    No recorded event sequence found for this match.
                  </div>
                )}

                {!eventsLoading && !eventsError && gameEvents.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {gameEvents.map((evt) => {
                      let bulletColor = "var(--primary)";
                      if (evt.eventType === "game_won") bulletColor = "#ffd700";
                      else if (evt.eventType === "rent_charged" || evt.eventType === "card_banked") bulletColor = "#66df75";
                      else if (evt.eventType === "action_played") bulletColor = "#ffb77d";
                      else if (evt.eventType === "cards_drawn") bulletColor = "#a8c8ff";

                      const timeStr = evt.occurredAt
                        ? new Date(evt.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                        : "";

                      return (
                        <li
                          key={evt.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: bulletColor,
                              marginTop: "6px",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.86rem", color: "var(--text)", lineHeight: 1.4 }}>
                              {evt.message}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--mono)", marginTop: "2px" }}>
                              Step #{evt.sequenceNum} {timeStr ? `• ${timeStr}` : ""}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
