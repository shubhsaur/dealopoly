"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "../_components/app-shell";
import { CardLoader } from "../_components/card-loader";
import {
  getStoredProfile,
  saveRoomSession,
  getRoomSession,
  saveRecentRoom,
} from "../../lib/session";
import { BOT_DIFFICULTIES, DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from "@dealopoly/shared";
import { createRoomApi, joinRoomApi } from "../../lib/api";
import { useGameSocket } from "../../lib/use-game-socket";
import { useRealisticProgress } from "../../lib/use-realistic-progress";

import { BackButton } from "../_components/back-button";
import { getStoredSettings } from "../../lib/settings";
import { HostDisconnectedModal, RoomDestroyedModal } from "../game/_components/game-drawers";

export default function LobbyPage(props: {
  searchParams?: Promise<{ room?: string; player?: string; code?: string; game?: string }>;
}) {
  const searchParams = props.searchParams ? use(props.searchParams) : undefined;
  const router = useRouter();
  const { data: session, status } = useSession();

  const urlRoomCode = searchParams?.room || searchParams?.code;
  const urlPlayerName = searchParams?.player;
  const preferredGame = getStoredSettings().defaultGame === "lowdeck" ? "least_count" : "monodeal";
  const urlGame = searchParams?.game || preferredGame;

  const [roomCode, setRoomCode] = useState<string>(urlRoomCode || "");
  const [playerId, setPlayerId] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyCodeFeedback, setCopyCodeFeedback] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [isPromptingName, setIsPromptingName] = useState(false);
  const [invitePlayerName, setInvitePlayerName] = useState("");
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(
    getStoredSettings().defaultBotDifficulty || DEFAULT_BOT_DIFFICULTY
  );
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLaunchingGame, setIsLaunchingGame] = useState(false);

  const isJoining = Boolean(urlRoomCode);
  const [loaderStep, setLoaderStep] = useState<"init" | "socket">(isJoining ? "socket" : "init");

  // Prevent double-initialization in React Strict Mode
  const initAttempted = useRef(false);

  const currentGameType = urlGame;
  const landingPath =
    currentGameType === "least_count" || currentGameType === "lowdeck" ? "/lowdeck" : "/monodeal";
  const gameLabel =
    currentGameType === "least_count" || currentGameType === "lowdeck" ? "Lowdeck" : "Monodeal";

  const handleConfirmLeave = () => {
    setShowLeaveDialog(false);
    leaveRoom();
    const destination = (roomInfo?.gameType || urlGame) === "least_count" || (roomInfo?.gameType || urlGame) === "lowdeck" ? "/lowdeck" : "/monodeal";
    setTimeout(() => {
      router.push(destination);
    }, 50);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showLeaveDialog) {
        setShowLeaveDialog(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLeaveDialog]);

  const doInitRoom = async (forcedPlayerName?: string) => {
    const profile = getStoredProfile();
    const playerName = forcedPlayerName || urlPlayerName || session?.user?.name || profile.name;
    const userId = session?.user?.id;

    if (urlRoomCode) {
      setLoaderStep("socket");
      const existingSession = getRoomSession(urlRoomCode);
      if (existingSession) {
        setRoomCode(urlRoomCode);
        setPlayerId(existingSession.playerId);
        setSessionToken(existingSession.token);
      } else {
        try {
          const joinRes = await joinRoomApi({
            roomCode: urlRoomCode,
            playerName,
            userId,
          });
          saveRoomSession(urlRoomCode, joinRes.playerId, joinRes.sessionToken);
          setRoomCode(joinRes.roomCode);
          setPlayerId(joinRes.playerId);
          setSessionToken(joinRes.sessionToken);
        } catch (err: unknown) {
          setInitError(err instanceof Error ? err.message : "Failed to join room");
        }
      }
    } else {
      setLoaderStep("init");
      try {
        const userSettings = getStoredSettings();
        const createRes = await createRoomApi({
          hostName: playerName,
          botCount: 0,
          userId,
          gameType: urlGame,
          isPrivate: userSettings.defaultRoomPrivate,
          allowSpectators: userSettings.allowSpectators,
        });
        saveRoomSession(createRes.roomCode, createRes.hostPlayerId, createRes.sessionToken);
        setRoomCode(createRes.roomCode);
        setPlayerId(createRes.hostPlayerId);
        setSessionToken(createRes.sessionToken);
        setLoaderStep("socket");
        router.replace(`/lobby?room=${createRes.roomCode}&game=${urlGame}`);
      } catch (err: unknown) {
        setInitError(err instanceof Error ? err.message : "Failed to create room");
      }
    }
  };

  // Initialize room session
  useEffect(() => {
    if (status === "loading") return;
    if (initAttempted.current) return;
    initAttempted.current = true;

    if (urlRoomCode && !getRoomSession(urlRoomCode) && !urlPlayerName) {
      const profile = getStoredProfile();
      setInvitePlayerName(session?.user?.name || profile.name || "");
      setIsPromptingName(true);
      return;
    }

    doInitRoom();
  }, [urlRoomCode, urlPlayerName, session, status, router]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [isHostWarningDismissed, setIsHostWarningDismissed] = useState(false);

  const { isConnected, roomInfo, lastError, roomDestroyedMessage, addBot, removePlayer, startGame, leaveRoom } =
    useGameSocket({
      roomCode,
      playerId,
      sessionToken,
      onGameStarted: () => {
        setIsLaunchingGame(true);
        setTimeout(() => {
          router.push(`/game?room=${roomCode}&player=${playerId}&game=${roomInfo?.gameType || urlGame}&isHost=${isHost}`);
        }, 350);
      },
    });

  const isLobbyReady = Boolean(isConnected && roomCode && !initError);

  const { progress, isComplete, isFinished } = useRealisticProgress({
    isReady: isLobbyReady,
    initialProgress: isJoining ? 24 : 16,
    completionDelayMs: 320,
  });

  const getLoaderText = () => {
    if (isLaunchingGame) return "Dealing Hands...";
    if (isComplete) return "Lobby Ready!";
    if (isJoining) {
      return "Connecting to Lobby...";
    }
    return loaderStep === "socket" ? "Connecting to Lobby..." : "Creating Lobby...";
  };

  useEffect(() => {
    if (roomInfo && roomCode) {
      const hostSeat = roomInfo.seats.find((s) => s.playerId === roomInfo.hostPlayerId);
      const hostName = hostSeat?.name || "Host";
      const gameLabel = (roomInfo.gameType || urlGame) === "least_count" ? "Least Count" : "Monodeal";
      saveRecentRoom({
        code: roomCode,
        name: `${hostName}'s ${gameLabel} Room`,
        gameType: roomInfo.gameType || urlGame,
      });
    }
  }, [roomInfo, roomCode, urlGame]);

  const handleCopyInvite = () => {
    if (typeof window !== "undefined") {
      const inviteUrl = `${window.location.origin}/lobby?room=${roomCode}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (!roomCode || typeof window === "undefined") return;
    navigator.clipboard.writeText(roomCode);
    setCopyCodeFeedback(true);
    setTimeout(() => setCopyCodeFeedback(false), 2000);
  };

  const isHost = roomInfo?.hostPlayerId === playerId;
  const hostSecondsRemaining = roomInfo?.hostDisconnectedUntil
    ? Math.max(0, Math.ceil((roomInfo.hostDisconnectedUntil - now) / 1000))
    : 0;
  const isClientLobbyEnded = Boolean(!isHost && roomInfo?.hostDisconnectedUntil && now >= roomInfo.hostDisconnectedUntil);
  const seats = roomInfo?.seats || [];
  const maxSeats = roomInfo?.maxSeats || 5;
  const emptySeatCount = Math.max(0, maxSeats - seats.length);

  if (isPromptingName) {
    return (
      <AppShell active="lobby">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "60vh", gap: "24px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Joining Room {urlRoomCode}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px" }}>
            <div>
              <label style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)", display: "block", marginBottom: "6px" }}>
                Your Display Name
              </label>
              <input
                type="text"
                value={invitePlayerName}
                onChange={(e) => setInvitePlayerName(e.target.value)}
                className="dialog-input"
                placeholder="Guest Player"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsPromptingName(false);
                    doInitRoom(invitePlayerName.trim() || "Guest");
                  }
                }}
              />
            </div>
            <button
              className="button button--primary button--full"
              onClick={() => {
                setIsPromptingName(false);
                doInitRoom(invitePlayerName.trim() || "Guest");
              }}
            >
              Join Game
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isLaunchingGame) {
    return (
      <CardLoader
        fullScreen
        game={urlGame === "least_count" ? "lowdeck" : urlGame === "monodeal" ? "monodeal" : "arcade"}
        size="lg"
        text="Dealing Hands..."
        progress={100}
        isComplete={true}
      />
    );
  }

  if (!isFinished && !initError) {
    return (
      <CardLoader
        fullScreen
        game={urlGame === "least_count" ? "lowdeck" : urlGame === "monodeal" ? "monodeal" : "arcade"}
        size="lg"
        text={getLoaderText()}
        progress={progress}
        isComplete={isComplete}
      />
    );
  }

  return (
    <AppShell active="lobby">
      <header className="app-header">
        <div>
          <p className="breadcrumb">
            ARCADE / {urlGame === "least_count" ? "LEAST COUNT" : "MONODEAL"} /{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <b
                onClick={roomCode ? handleCopyCode : undefined}
                style={{ cursor: roomCode ? "pointer" : "default" }}
                title={roomCode ? "Click to copy room code" : undefined}
              >
                {roomCode || "CREATING..."}
              </b>
              {roomCode && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title={copyCodeFeedback ? "Copied code!" : "Copy room code"}
                  aria-label="Copy room code"
                  style={{
                    background: "none",
                    border: "none",
                    padding: "2px",
                    cursor: "pointer",
                    color: copyCodeFeedback ? "#10b981" : "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    opacity: 0.8,
                    borderRadius: "4px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                    {copyCodeFeedback ? "check" : "content_copy"}
                  </span>
                </button>
              )}
            </span>
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1>{urlGame === "least_count" ? "🎯 Least Count Lobby" : "🃏 Monodeal Lobby"}</h1>
          </div>
        </div>
        <div className="header-actions">
          <div
            className={`hero-badge ${isConnected ? "hero-badge--online" : ""}`}
            style={{ padding: "6px 12px", borderRadius: "999px" }}
          >
            <span
              className="badge-dot"
              style={{ background: isConnected ? "#10b981" : "#f59e0b" }}
            />
            <span className="badge-text">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      {initError && (
        <div style={{ padding: "clamp(16px, 4vw, 32px)", textAlign: "center" }}>
          {initError.includes("not found") || initError.includes("already started") ? (
            <div style={{ background: "var(--surface)", padding: "32px 24px", borderRadius: "16px", border: "1px solid var(--outline-variant)", maxWidth: "400px", margin: "40px auto" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--error)", marginBottom: "16px" }}>
                sentiment_dissatisfied
              </span>
              <h2 style={{ margin: "0 0 12px 0", fontSize: "1.2rem", fontWeight: "bold" }}>Room Not Available</h2>
              <p style={{ margin: "0 0 24px 0", color: "var(--on-surface-variant)", lineHeight: 1.5, fontSize: "0.95rem" }}>
                {initError.includes("not found") ? "This room has been closed by the host or is no longer available." : "This game has already started and cannot accept new players."}
              </p>
              <button onClick={() => router.push("/")} className="button button--primary" style={{ width: "100%" }}>
                Return to Home
              </button>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", color: "#fca5a5" }}>
              {initError}
            </div>
          )}
        </div>
      )}

      {lastError && (
        <div
          style={{
            margin: "16px clamp(16px, 4vw, 32px)",
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            color: "#fca5a5",
          }}
        >
          {lastError}
        </div>
      )}

      <main className="lobby-layout">
        <section className="lobby-main">
          <div style={{ marginBottom: "12px" }}>
            <BackButton
              fallbackUrl={landingPath}
              label={`Back to ${gameLabel}`}
              variant="subtle"
              onClick={() => setShowLeaveDialog(true)}
            />
          </div>
          <div className="room-intro">
            <div>
              <h2>Waiting for players to join...</h2>
              <p>Share the room code or invite link with friends to start.</p>
            </div>
            <span className="waiting-pill">
              <i /> {seats.length} / {maxSeats} Players
            </span>
          </div>

          {hostSecondsRemaining > 0 && !isHost && (
            <div
              style={{
                margin: "12px 0 16px",
                padding: "12px 16px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#fca5a5",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#ef4444" }}>
                  warning
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                  Host is offline. Lobby will close in:
                </span>
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                {hostSecondsRemaining >= 60
                  ? `${Math.floor(hostSecondsRemaining / 60)}:${(hostSecondsRemaining % 60).toString().padStart(2, "0")}`
                  : `${hostSecondsRemaining}s`}
              </span>
            </div>
          )}

          <div className="player-grid">
            {seats.map((seat) => {
              const isYou = seat.playerId === playerId;
              const isSeatHost = seat.playerId === roomInfo?.hostPlayerId;
              const isOffline = !seat.isBot && seat.isConnected === false;
              const deadline = seat.disconnectDeadline ?? (isSeatHost ? roomInfo?.hostDisconnectedUntil : undefined);
              let countdownStr = "";
              if (isOffline && deadline) {
                const diffSec = Math.max(0, Math.ceil((deadline - now) / 1000));
                const mins = Math.floor(diffSec / 60);
                const secs = diffSec % 60;
                countdownStr = `${mins}:${secs.toString().padStart(2, "0")}`;
              }

              return (
                <article
                  className={`player-seat ${isYou ? "player-seat--you" : ""} ${isOffline ? "player-seat--offline" : ""}`}
                  key={seat.playerId}
                >
                  <span className={`avatar ${isYou ? "avatar--you" : seat.isBot ? "avatar--pink" : "avatar--blue"}`} style={{ position: "relative" }}>
                    {seat.name[0]?.toUpperCase() || "P"}
                    {isOffline && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          right: "-2px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: "#ef4444",
                          border: "2px solid var(--surface)",
                        }}
                      />
                    )}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                      <small style={{ color: isSeatHost ? "var(--primary)" : undefined }}>
                        {isSeatHost ? "HOST" : seat.isBot ? "BOT" : "PLAYER"}
                      </small>
                      {isOffline && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "999px",
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          OFFLINE {countdownStr ? `(${countdownStr})` : ""}
                        </span>
                      )}
                    </div>
                    <h3>{seat.name} {isYou && "(You)"}</h3>
                    <p>
                      {seat.isBot && seat.difficulty
                        ? `${seat.difficulty} · Ready to deal`
                        : seat.isConnected
                          ? "Ready to deal"
                          : countdownStr
                          ? `Reconnecting (${countdownStr})...`
                          : "Reconnecting..."}
                    </p>
                  </div>
                  {isHost && !isYou && (
                    <button
                      type="button"
                      onClick={() => removePlayer(seat.playerId)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--outline)",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                      title="Kick player"
                    >
                      ✕
                    </button>
                  )}
                </article>
              );
            })}

            {isHost && seats.length < maxSeats && (
              <button
                className="player-seat player-seat--add"
                type="button"
                onClick={() => addBot(botDifficulty)}
              >
                <span>＋</span>
                <b>Add bot</b>
                <small>{botDifficulty} difficulty</small>
              </button>
            )}

            {Array.from({ length: Math.max(0, emptySeatCount - (isHost ? 1 : 0)) }).map((_, idx) => (
              <article className="player-seat player-seat--empty" key={`empty-${idx}`}>
                <span>＋</span>
                <p>Open Seat</p>
                <small>Waiting to join</small>
              </article>
            ))}
          </div>

          <section className="game-settings">
            <div className="panel-title">
              <div>
                <p className="eyebrow">TABLE SETTINGS</p>
                <h2>Rules & Timer</h2>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <h3>Standard Dealopoly Rules</h3>
                <p>First player to complete 3 full property sets of different colors wins.</p>
              </div>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>Active</span>
            </div>
            <div className="setting-row">
              <div>
                <h3>Bot Difficulty</h3>
                <p>Applies to the next bot you add. Each bot can have its own level.</p>
              </div>
              <label>
                <select
                  value={botDifficulty}
                  onChange={(event) => setBotDifficulty(event.target.value as BotDifficulty)}
                  disabled={!isHost}
                  aria-label="Bot difficulty"
                >
                  {BOT_DIFFICULTIES.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="setting-row">
              <div>
                <h3>Turn Limit</h3>
                <p>3 actions per turn (Draw 2 at start, max 7 cards in hand at end).</p>
              </div>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>Standard</span>
            </div>
            <div className="setting-row">
              <div>
                <h3>Room Privacy</h3>
                <p>
                  {roomInfo?.isPrivate ?? getStoredSettings().defaultRoomPrivate
                    ? "Private match — requires invite code or link to enter."
                    : "Public match — accessible from the multiplayer directory."}
                </p>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: (roomInfo?.isPrivate ?? getStoredSettings().defaultRoomPrivate) ? "#fbbf24" : "var(--primary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {(roomInfo?.isPrivate ?? getStoredSettings().defaultRoomPrivate) ? "lock" : "public"}
                </span>
                {(roomInfo?.isPrivate ?? getStoredSettings().defaultRoomPrivate) ? "Invite Only" : "Public"}
              </span>
            </div>
            <div className="setting-row">
              <div>
                <h3>Spectator Access</h3>
                <p>
                  {roomInfo?.allowSpectators ?? getStoredSettings().allowSpectators
                    ? "Observers can watch active matches live."
                    : "Spectators are disabled for this match."}
                </p>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: (roomInfo?.allowSpectators ?? getStoredSettings().allowSpectators) ? "#38bdf8" : "var(--muted)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  {(roomInfo?.allowSpectators ?? getStoredSettings().allowSpectators) ? "visibility" : "visibility_off"}
                </span>
                {(roomInfo?.allowSpectators ?? getStoredSettings().allowSpectators) ? "Enabled" : "Disabled"}
              </span>
            </div>
          </section>
        </section>

        <aside className="lobby-side">
          <section className="room-code">
            <p className="eyebrow">ROOM CODE</p>
            <div className="room-code-display">
              <strong
                onClick={roomCode ? handleCopyCode : undefined}
                title={roomCode ? "Click to copy code" : undefined}
                style={{ cursor: roomCode ? "pointer" : "default" }}
              >
                {roomCode || "------"}
              </strong>
              <button
                type="button"
                className={`room-code-copy-btn ${copyCodeFeedback ? "room-code-copy-btn--copied" : ""}`}
                onClick={handleCopyCode}
                title={copyCodeFeedback ? "Copied code!" : "Copy room code"}
                aria-label="Copy room code"
                disabled={!roomCode}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {copyCodeFeedback ? "check" : "content_copy"}
                </span>
                {copyCodeFeedback && <span className="copy-tooltip">Copied!</span>}
              </button>
            </div>
            <button type="button" onClick={handleCopyInvite} className="room-invite-btn">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "middle", marginRight: "6px" }}>
                {copyFeedback ? "check" : "link"}
              </span>
              <span>{copyFeedback ? "Copied Link!" : "Copy Invite Link"}</span>
            </button>
            <p>Anyone with this code or link can join your game.</p>
          </section>

          <section className="lobby-log">
            <p className="eyebrow">ROOM INFO</p>
            <div>
              <span className="log-dot" />
              <p>
                <b>Room {roomCode} created</b>
                <small>{seats.length} player(s) present</small>
              </p>
            </div>
          </section>

          {isHost ? (
            <button
              className="button button--primary button--full"
              type="button"
              onClick={startGame}
              disabled={seats.length < 2}
              style={{
                opacity: seats.length < 2 ? 0.5 : 1,
                cursor: seats.length < 2 ? "not-allowed" : "pointer",
              }}
            >
              Start game <span>→</span>
            </button>
          ) : (
            <div style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "12px" }}>
              Waiting for host to start the game...
            </div>
          )}

          <button
            className="button button--full"
            type="button"
            style={{
              marginTop: "8px",
              background: "transparent",
              border: "1px solid var(--outline)",
              color: "var(--on-surface-variant)",
            }}
            onClick={() => setShowLeaveDialog(true)}
          >
            Leave room
          </button>

          {seats.length < 2 && (
            <p className="start-hint">Add at least one more player or bot to begin.</p>
          )}
        </aside>
      </main>

      {showLeaveDialog && (
        <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 300 }}>
          <div className="dialog-scrim" onClick={() => setShowLeaveDialog(false)} />
          <div className="dialog-panel" style={{ maxWidth: "420px" }}>
            <div className="texture-overlay" />
            <div className="sheet-handle" />

            <div className="dialog-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "24px" }}>
                  logout
                </span>
                <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Leave Room?</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaveDialog(false)}
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
                {isHost
                  ? "Are you sure you want to leave? Because you are the Host, this will end the room lobby for all players."
                  : "Are you sure you want to leave the room and return to the main menu?"}
              </p>
            </div>

            <div className="dialog-footer" style={{ gap: "10px" }}>
              <button
                type="button"
                className="button button--secondary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setShowLeaveDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button--primary"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                }}
                onClick={handleConfirmLeave}
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host Disconnected Warning Modal in Lobby (shown 30s before close) */}
      <HostDisconnectedModal
        isOpen={!isHost && hostSecondsRemaining > 0 && hostSecondsRemaining <= 30 && !isHostWarningDismissed}
        secondsRemaining={hostSecondsRemaining}
        onDismiss={() => setIsHostWarningDismissed(true)}
      />

      {/* Lobby Ended / Room Destroyed Modal */}
      <RoomDestroyedModal
        isOpen={Boolean(roomDestroyedMessage || isClientLobbyEnded)}
        message={roomDestroyedMessage || "The game was abandoned due to host inactivity."}
        gameType={urlGame}
        onExit={() => router.push(landingPath)}
      />
    </AppShell>
  );
}
