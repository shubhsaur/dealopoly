"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDragScroll } from "../../lib/use-interactions";
import { OPPONENT_PALETTES } from "../../lib/constants";
import { ErrorBar, GameTableShell } from "./dialog-shell";
import { useLeastCountClient } from "../../lib/use-least-count-client";
import { useRealisticProgress } from "../../lib/use-realistic-progress";
import { StandardCard } from "./standard-card";
import { CardBack } from "./cards/card-back";
import { CardLoader } from "./card-loader";
import { getStoredProfile } from "../../lib/session";

interface FlyingCardItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  rotate: number;
  card?: LeastCountCard;
}
import {
  calculateHandScore,
  validateDiscardCombination,
  type LeastCountCard,
  type MaskedLeastCountPlayer,
} from "@dealopoly/game-engine";
import {
  playCardSwoosh,
  playCardSlam,
  playVictoryFanfare,
  playYourTurnSound,
  triggerHaptic,
  startTableAmbience,
  stopTableAmbience,
} from "../../lib/sound-effects";
import { startCasinoMusic, stopCasinoMusic } from "../../lib/music-player";
import { useSettings } from "../../lib/use-settings";
import { QuickReactionDock, ReactionBurstsOverlay, EmojiRainOverlay, type EmojiBurst } from "./emoji-reactions";
import { GameSettingsDialog } from "./game-settings-dialog";

interface LeastCountGameViewProps {
  roomCode?: string;
  isBotMode?: boolean;
  botCount?: number;
  playerName?: string;
  playerId?: string;
  isHost?: boolean;
}

export const LeastCountGameView: React.FC<LeastCountGameViewProps> = ({
  roomCode,
  isBotMode = true,
  botCount = 2,
  playerName,
  playerId,
  isHost = false,
}) => {
  const router = useRouter();
  const { settings } = useSettings();
  const profile = getStoredProfile();
  const activePlayerId = playerId || profile.id;

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [viewingOpponent, setViewingOpponent] = useState<MaskedLeastCountPlayer | null>(null);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [reactionBursts, setReactionBursts] = useState<EmojiBurst[]>([]);
  const [rainEmoji, setRainEmoji] = useState<string | null>(null);

  const handleReact = (emoji: string) => {
    const burstId = `burst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setReactionBursts((prev) => [
      ...prev.slice(-8),
      {
        id: burstId,
        emoji,
        senderName: "You",
        isSelf: true,
      },
    ]);
  };

  const handleDismissBurst = (id: string) => {
    setReactionBursts((prev) => prev.filter((b) => b.id !== id));
  };

  const handleCopyCode = () => {
    if (!roomCode || isBotMode || roomCode === "solo") return;
    navigator.clipboard?.writeText(roomCode);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  const {
    gameState,
    discardCards,
    drawCard,
    declareShow,
    startNextRound,
    resetGame,
    lastError,
    actionLog,
    liveReelEvent,
  } = useLeastCountClient({
    roomCode,
    playerId: activePlayerId,
    isLocalMode: isBotMode,
    botCount,
    playerName,
  });

  // Track unread activity
  useEffect(() => {
    if (!isActivityDrawerOpen && actionLog.length > 0) {
      setUnreadActivityCount((prev) => prev + 1);
    }
  }, [actionLog.length, isActivityDrawerOpen]);

  const handleOpenActivity = () => {
    setIsActivityDrawerOpen(true);
    setUnreadActivityCount(0);
  };

  const handleLeave = () => {
    router.push("/lowdeck");
  };

  const localPlayer = gameState?.players[activePlayerId];
  const isMyTurn = gameState?.activePlayerId === activePlayerId;
  const isDiscardPhase = gameState?.turnPhase === "discard";
  const isDrawPhase = gameState?.turnPhase === "draw";
  const isRoundEnd = gameState?.status === "round_end";
  const isGameOver = gameState?.status === "completed";

  const handCards = useMemo(() => localPlayer?.hand || [], [localPlayer?.hand]);

  const handScore = useMemo(() => {
    return calculateHandScore(handCards);
  }, [handCards]);

  const selectedCards = useMemo(() => {
    return handCards.filter((c) => selectedCardIds.includes(c.instanceId));
  }, [handCards, selectedCardIds]);

  const discardValidation = useMemo(() => {
    return validateDiscardCombination(selectedCards);
  }, [selectedCards]);

  const canDeclareShow = isMyTurn && isDrawPhase && gameState && handScore <= gameState.showThreshold;

  useEffect(() => {
    if (!isMyTurn || !isDiscardPhase) {
      setSelectedCardIds([]);
    }
  }, [isMyTurn, isDiscardPhase]);

  // Casino Music & Table Ambiance life-cycle
  useEffect(() => {
    startTableAmbience();
    startCasinoMusic();
    return () => {
      stopTableAmbience();
      stopCasinoMusic();
    };
  }, []);

  // "Your Turn" notification chime and haptic pulse
  const prevIsMyTurnRef = React.useRef(isMyTurn);
  useEffect(() => {
    if (!prevIsMyTurnRef.current && isMyTurn && gameState?.status === "in_progress") {
      playYourTurnSound();
      triggerHaptic("medium");
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn, gameState?.status]);

  const handContainerRef = React.useRef<HTMLDivElement>(null);
  const { onPointerDown, onPointerMove, onPointerUp, hasDraggedRef } = useDragScroll(handContainerRef);

  // Card Draw Flight Animation State & Piles Refs
  const [flyingCards, setFlyingCards] = useState<FlyingCardItem[]>([]);
  const drawPileRef = React.useRef<HTMLDivElement>(null);
  const discardPileRef = React.useRef<HTMLDivElement>(null);
  const isAnimatingDrawRef = React.useRef<boolean>(false);

  const triggerDrawAnimation = (source: "deck" | "discard", card?: LeastCountCard) => {
    const sourceRef = source === "discard" ? discardPileRef : drawPileRef;
    if (!sourceRef.current || !handContainerRef.current) return;
    if (isAnimatingDrawRef.current) return;

    isAnimatingDrawRef.current = true;
    playCardSwoosh();
    triggerHaptic("light");

    const sourceRect = sourceRef.current.getBoundingClientRect();
    const handRect = handContainerRef.current.getBoundingClientRect();

    const startX = sourceRect.left + (sourceRect.width - 84) / 2;
    const startY = sourceRect.top + (sourceRect.height - 122) / 2;

    const targetCenterX = handRect.left + handRect.width / 2 - 42;
    const targetCenterY = handRect.top + 16;

    const now = Date.now();
    const newCard: FlyingCardItem = {
      id: `fly-${now}-${Math.random().toString(36).slice(2, 7)}`,
      startX,
      startY,
      endX: targetCenterX,
      endY: targetCenterY,
      delay: 0,
      rotate: (Math.random() - 0.5) * 12,
      card,
    };

    setFlyingCards([newCard]);

    // Fail-safe cleanup to guarantee ref and state reset even if animation callbacks drop
    const isCinematic = settings.animationSpeed === "cinematic";
    const totalDuration = isCinematic ? 1200 : 700;
    setTimeout(() => {
      isAnimatingDrawRef.current = false;
      setFlyingCards([]);
    }, totalDuration);
  };

  const toggleSelectCard = (instanceId: string) => {
    if (hasDraggedRef.current) return;
    if (!isMyTurn || !isDiscardPhase) return;
    triggerHaptic("light");
    setSelectedCardIds((prev) =>
      prev.includes(instanceId) ? prev.filter((id) => id !== instanceId) : [...prev, instanceId],
    );
  };

  const handleDiscardClick = () => {
    if (discardValidation.valid && selectedCardIds.length > 0) {
      playCardSlam();
      triggerHaptic("medium");
      discardCards(selectedCardIds);
      setSelectedCardIds([]);
    }
  };

  const handleDrawCard = (source: "deck" | "discard") => {
    if (isAnimatingDrawRef.current) return;
    const cardToDraw = source === "discard" ? (gameState?.discardPileTop ?? undefined) : undefined;
    triggerDrawAnimation(source, cardToDraw);
    drawCard(source);
  };

  const handleDeclareShow = () => {
    playVictoryFanfare();
    triggerHaptic("success");
    declareShow();
  };

  const opponents = useMemo(() => {
    if (!gameState) return [];
    return gameState.playerOrder
      .filter((id) => id !== activePlayerId)
      .map((id) => gameState.players[id]!)
      .filter(Boolean);
  }, [gameState, activePlayerId]);

  const standings = useMemo(() => {
    if (!gameState) return [];
    return gameState.playerOrder
      .map((id) => gameState.players[id])
      .filter((p): p is MaskedLeastCountPlayer => Boolean(p))
      .sort((a, b) => a.score - b.score);
  }, [gameState]);

  const isGameReady = Boolean(gameState);
  const { progress, isComplete, isFinished } = useRealisticProgress({
    isReady: isGameReady,
    initialProgress: 20,
    completionDelayMs: 300,
  });

  const getLowdeckLoaderText = () => {
    if (isComplete) return "Table Ready!";
    if (progress > 55) return "Dealing Cards...";
    return "Entering Lowdeck Table...";
  };

  if (!gameState || !isFinished) {
    return (
      <CardLoader
        fullScreen
        game="lowdeck"
        size="lg"
        text={getLowdeckLoaderText()}
        progress={progress}
        isComplete={isComplete}
      />
    );
  }

  const activePlayer = gameState.players[gameState.activePlayerId];

  return (
    <GameTableShell tableTheme={settings.tableTheme} animationSpeed={settings.animationSpeed}>

      {/* 1. Top App Navigation Bar */}
      <header className="game-topbar">
        <div className="u-flex-center u-gap-12">
          <button
            type="button"
            onClick={() => setIsExitDialogOpen(true)}
            className="game-topbar-brand u-inline-flex u-gap-8"
            aria-label="Dealopoly"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "24px" }}>
              playing_cards
            </span>
            <span className="game-topbar-logo-text u-fw-900" style={{ fontFamily: "Montserrat, sans-serif", fontSize: "1.2rem", letterSpacing: "-0.03em" }}>
              dealopoly
            </span>
          </button>

          {/* Turn Indicator Pill */}
          <div className={`game-turn-pill ${isMyTurn ? "game-turn-pill--active" : ""}`}>
            <span className="game-turn-pill-dot" />
            <span className="game-turn-pill-text">
              {isMyTurn
                ? `Your Turn (${isDiscardPhase ? "Discard Phase" : "Draw Phase"})`
                : `${activePlayer?.name || "Opponent"}'s Turn`}
            </span>
          </div>

          {/* Match Status Pill */}
          <div className="game-desktop-only u-flex-center-8">
            <div
              className="u-inline-flex u-gap-6"
              style={{
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: "0.74rem",
                fontFamily: "var(--mono)",
                color: "#e2e8f0",
              }}
            >
              <span className="badge-dot" style={{ background: "#38bdf8" }} />
              Round {gameState.roundNumber} • SHOW ≤ {gameState.showThreshold} PTS • MAX {gameState.maxScore} PTS
            </div>
          </div>
        </div>

        {/* Center Table Code Badge */}
        <div className="game-topbar-center">
          <div
            className="game-table-code-badge"
            onClick={handleCopyCode}
            title={
              !isBotMode && roomCode && roomCode !== "solo"
                ? hasCopiedCode
                  ? "Copied Table Code!"
                  : "Click to copy Table Code"
                : undefined
            }
            style={{ cursor: !isBotMode && roomCode && roomCode !== "solo" ? "pointer" : "default" }}
          >
            <span className="material-symbols-outlined u-color-primary" style={{ fontSize: "15px" }}>
              meeting_room
            </span>
            <span className="game-table-code-label">TABLE</span>
            <span className="game-table-code-val">
              {!isBotMode && roomCode && roomCode !== "solo" ? `#${roomCode}` : "SOLO"}
            </span>
            {!isBotMode && roomCode && roomCode !== "solo" && (
              <span
                className="material-symbols-outlined game-table-code-copy-icon u-text-14"
                style={{ color: hasCopiedCode ? "var(--green)" : "var(--outline)" }}
              >
                {hasCopiedCode ? "check" : "content_copy"}
              </span>
            )}
          </div>
        </div>

        {/* Topbar Right Controls */}
        <div className="game-topbar-actions">
          {/* Activity Log Button with Unread Badge */}
          <button
            type="button"
            className="game-activity-toggle-btn"
            onClick={handleOpenActivity}
            title="Open Match Activity Log"
          >
            <span className="material-symbols-outlined u-text-16">
              history
            </span>
            <span className="game-desktop-only">Activity</span>
            {unreadActivityCount > 0 && (
              <span className="game-activity-unread-badge">{unreadActivityCount}</span>
            )}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="game-icon-btn"
            title="Game Settings"
            aria-label="Game Settings"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "19px" }}>
              settings
            </span>
          </button>

          {/* Leave Game Button */}
          <button
            type="button"
            className="game-topbar-leave-btn"
            title="Leave Match"
            onClick={() => setIsExitDialogOpen(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
              exit_to_app
            </span>
            <span className="game-desktop-only">Leave Game</span>
          </button>
        </div>
      </header>

      {/* 2. Floating Error Bar */}
      <ErrorBar error={lastError} />

      {/* 3. Main Layout Grid */}
      <div className="game-layout-grid">
        <main className="game-main-arena">
          {/* A. Opponents Strip (Positioned at Table Edges) */}
          <div className="game-opponents-strip">
            {opponents.map((opp, idx) => {
              const palette = OPPONENT_PALETTES[idx % OPPONENT_PALETTES.length]!;
              const isOppActive = gameState.activePlayerId === opp.id;
              const scorePercent = Math.min((opp.score / gameState.maxScore) * 100, 100);
              const seatPosition =
                idx === 0
                  ? "top-left"
                  : idx === 1
                    ? "top-right"
                    : idx === 2
                      ? "left"
                      : "right";

              return (
                <div
                  key={opp.id}
                  className={`game-opponent-seat game-opponent-seat--${seatPosition} ${isOppActive ? "game-opponent-seat--active" : ""}`}
                  onClick={() => setViewingOpponent(opp)}
                  title={`Click to view ${opp.name}'s stats`}
                  style={{ cursor: "pointer" }}
                >
                  <div className={`game-opponent-avatar-wrap ${palette.class}`}>
                    <span>{opp.name[0]?.toUpperCase()}</span>
                    <span className="game-opponent-hand-badge">🃏 {opp.handCount}</span>
                  </div>

                  <div className="game-opponent-info">
                    <div className="game-opponent-name-row">
                      <span className="game-opponent-name">
                        {opp.name} {opp.isBot && "(Bot)"}
                      </span>
                      {opp.isEliminated ? (
                        <span className="game-opponent-turn-tag" style={{ background: "#ef4444", color: "white" }}>ELIMINATED</span>
                      ) : isOppActive ? (
                        <span className="game-opponent-turn-tag">THINKING...</span>
                      ) : null}
                    </div>

                    <div className="game-opponent-metrics">
                      <span className="u-fw-800" style={{ color: opp.isEliminated ? "#ef4444" : (opp.score >= 70 ? "#ef4444" : "#38bdf8") }}>
                        🏆 {opp.score}/{gameState.maxScore} PTS
                      </span>
                      <span className="u-label-muted-sm">
                        {opp.handCount} Cards in Hand
                      </span>
                    </div>

                    {/* Danger Score Bar */}
                    <div className="u-w-full u-overflow-hidden" style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", marginTop: "4px" }}>
                      <div
                        style={{
                          width: `${scorePercent}%`,
                          height: "100%",
                          background: opp.score >= 70 ? "#ef4444" : "#38bdf8",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* B. Top Section: Your Hand Total & Discard Combination/Tactics */}
          <div className="game-player-assets-row">
            {/* Hand Score Status Panel (Revamped Lowdeck Hand Total Card) */}
            <div
              className={`lowdeck-hand-total-card ${handScore <= gameState.showThreshold ? "lowdeck-hand-total-card--ready" : ""}`}
            >
              {/* Card Header: Title & Cards Count Pill */}
              <div className="lowdeck-hand-total-header">
                <div className="lowdeck-hand-total-title-group">
                  <span className="material-symbols-outlined lowdeck-hand-total-icon">
                    style
                  </span>
                  <span className="lowdeck-hand-total-title">HAND TOTAL</span>
                </div>
                <span className="lowdeck-hand-count-pill">
                  {handCards.length} {handCards.length === 1 ? "card" : "cards"}
                </span>
              </div>

              {/* Card Body: Main Points Display & Match Score */}
              <div className="lowdeck-hand-total-body">
                <div className="lowdeck-hand-score-wrap">
                  <span
                    className="lowdeck-hand-score-val"
                    style={{
                      color: handScore <= gameState.showThreshold ? "#facc15" : handScore <= 15 ? "#4ade80" : "#fb7185",
                    }}
                  >
                    {handScore}
                  </span>
                  <span className="lowdeck-hand-score-unit">PTS</span>
                </div>

                <div className="lowdeck-hand-match-score">
                  <span className="lowdeck-hand-match-label">Match Penalty</span>
                  <span className="lowdeck-hand-match-val">{localPlayer?.score || 0}/{gameState.maxScore}</span>
                </div>
              </div>

              {/* Card Footer: SHOW Target Badge */}
              <div className="lowdeck-hand-total-footer">
                {localPlayer?.isEliminated ? (
                  <div className="lowdeck-hand-target-badge lowdeck-hand-target-badge--eliminated">
                    ELIMINATED
                  </div>
                ) : handScore <= gameState.showThreshold ? (
                  <div className="lowdeck-hand-target-badge lowdeck-hand-target-badge--ready">
                    <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>stars</span>
                    <span>READY TO SHOW (≤ {gameState.showThreshold})</span>
                  </div>
                ) : (
                  <div className="lowdeck-hand-target-badge">
                    <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>flag</span>
                    <span>SHOW Target: ≤ {gameState.showThreshold} pts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Match Standings & Survival Panel */}
            <div className="lowdeck-standings-card">
              <div className="lowdeck-standings-header">
                <div className="lowdeck-standings-title-group">
                  <span className="material-symbols-outlined lowdeck-standings-icon">
                    leaderboard
                  </span>
                  <span className="lowdeck-standings-title">MATCH STANDINGS</span>
                </div>
                <span className="lowdeck-standings-round-pill">
                  Round {gameState.roundNumber} • Max {gameState.maxScore} PTS
                </span>
              </div>

              <div className="lowdeck-standings-list">
                {standings.map((player, idx) => {
                  const isYou = player.id === activePlayerId;
                  const isDanger = player.score >= 70 && !player.isEliminated;
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                  const scorePercent = Math.min((player.score / gameState.maxScore) * 100, 100);

                  return (
                    <div
                      key={player.id}
                      className={`lowdeck-standings-row ${isYou ? "lowdeck-standings-row--you" : ""} ${player.isEliminated ? "lowdeck-standings-row--eliminated" : ""}`}
                    >
                      <div className="lowdeck-standings-player-info">
                        <span className="lowdeck-standings-rank">{medal}</span>
                        <span className="lowdeck-standings-name">
                          {player.name} {isYou ? "(You)" : player.isBot ? "(Bot)" : ""}
                        </span>
                        {player.isEliminated ? (
                          <span className="lowdeck-standings-tag lowdeck-standings-tag--out">OUT</span>
                        ) : isDanger ? (
                          <span className="lowdeck-standings-tag lowdeck-standings-tag--danger">DANGER</span>
                        ) : null}
                      </div>

                      <div className="lowdeck-standings-score-group">
                        <span
                          className="lowdeck-standings-score"
                          style={{
                            color: player.isEliminated ? "#ef4444" : isDanger ? "#f87171" : idx === 0 ? "#4ade80" : "#cbd5e1",
                          }}
                        >
                          {player.score} <span className="lowdeck-standings-pts">PTS</span>
                        </span>
                        <div className="lowdeck-standings-bar-track">
                          <div
                            className="lowdeck-standings-bar-fill"
                            style={{
                              width: `${scorePercent}%`,
                              background: player.isEliminated ? "#ef4444" : isDanger ? "#ef4444" : "#38bdf8",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* B. Center Table Arena (Draw & Discard Piles + Action Prompt + Reel) */}
          <div className="game-center-stage">
            <div className="game-piles-wrapper">
              {/* 3D Stacked Draw Pile */}
              <div
                ref={drawPileRef}
                className="game-draw-pile"
                onClick={() => isMyTurn && isDrawPhase && handleDrawCard("deck")}
                title={isMyTurn && isDrawPhase ? "Click to Draw from Deck" : "Draw Pile"}
                style={{ cursor: isMyTurn && isDrawPhase ? "pointer" : "default" }}
              >
                <div className="game-draw-card-layer" />
                <div className="game-draw-card-layer" />
                <div
                  className={`game-draw-card-top game-draw-card-top--${settings.cardBackDesign} ${
                    isMyTurn && isDrawPhase ? "game-draw-pile-pulse" : ""
                  }`}
                >
                  <span className="game-draw-title">
                    DEALOPOLY
                  </span>
                  <span className="game-draw-count-badge">{gameState.drawPileCount}</span>
                  <span className="game-draw-subtitle">
                    {isMyTurn && isDrawPhase ? "TAP TO DRAW" : "CARDS"}
                  </span>
                </div>
              </div>

              {/* 3D Discard Pile with 3D Embossed Top Card */}
              <div
                ref={discardPileRef}
                className="game-discard-pile"
                onClick={() => {
                  if (isMyTurn && isDrawPhase) {
                    handleDrawCard("discard");
                  }
                }}
                title={isMyTurn && isDrawPhase ? "Click to Take Discarded Card" : "Discard Pile"}
                style={{ cursor: isMyTurn && isDrawPhase ? "pointer" : "default" }}
              >
                {gameState.discardPileTop ? (
                  <div className="game-discard-stack-wrapper">
                    {/* Layer 1 (bottom card) */}
                    {gameState.discardPileCount >= 3 && (
                      <div className="game-discard-layer game-discard-layer--bottom" />
                    )}
                    {/* Layer 2 (middle card) */}
                    {gameState.discardPileCount >= 2 && (
                      <div className="game-discard-layer game-discard-layer--middle" />
                    )}
                    {/* Top Card rendered as authentic 3D embossed StandardCard */}
                    <div className="game-discard-top-card">
                      <StandardCard
                        card={gameState.discardPileTop}
                        size="xs"
                        showPointsBadge={false}
                        disabled={false}
                      />
                    </div>
                    {/* Discard count badge */}
                    <div className="game-discard-count-badge">
                      <span>{gameState.discardPileCount}</span>
                    </div>
                  </div>
                ) : (
                  <div className="game-discard-empty">
                    <span className="material-symbols-outlined u-text-22" style={{ color: "var(--outline)", opacity: 0.5 }}>
                      layers_clear
                    </span>
                    <span className="u-fw-700" style={{ fontSize: "0.58rem", color: "var(--outline)", fontFamily: "var(--mono)" }}>
                      DISCARD PILE
                    </span>
                    <span style={{ fontSize: "0.52rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                      (0 Cards)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Prompt Banner */}
            <div className="game-action-prompt-banner">
              <span className="material-symbols-outlined u-text-18">
                {isMyTurn ? "play_circle" : "hourglass_top"}
              </span>
              <span>
                {isMyTurn
                  ? isDrawPhase
                    ? canDeclareShow
                      ? "⭐ Your Hand Count is ≤ 7! You can declare SHOW or Draw a card."
                      : "🎴 Your Turn: Draw 1 card from the Draw Deck or Take the Discarded Card 🎴"
                    : "✨ Your Turn: Select 1–3 cards to discard (Rank pair or Same-suit sequence) ✨"
                  : `${activePlayer?.name || "Opponent"} is thinking...`}
              </span>
            </div>

          </div>

          {/* Live Animated Action Reel Toast */}
          <div className="game-action-reel-toast-container">
            <AnimatePresence>
              {liveReelEvent && (
                <motion.div
                  key={`${liveReelEvent.title}-${liveReelEvent.description}`}
                  className="game-action-reel"
                  initial={{ opacity: 0, y: -48 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.35, ease: "easeOut" },
                  }}
                  transition={{
                    type: "spring",
                    damping: 24,
                    stiffness: 240,
                    mass: 0.7,
                  }}
                >
                  <div className="game-action-reel-icon-wrap" style={{ background: "rgba(56, 189, 248, 0.2)", borderColor: "#38bdf8" }}>
                    <span className="material-symbols-outlined u-text-20" style={{ color: "#38bdf8" }}>
                      {liveReelEvent.icon}
                    </span>
                  </div>
                  <div className="u-flex-col" style={{ gap: "2px", minWidth: 0 }}>
                    <span className="u-fw-800" style={{ fontSize: "0.72rem", color: "#38bdf8", letterSpacing: "0.05em" }}>
                      {liveReelEvent.title}
                    </span>
                    <span className="game-action-reel-text">
                      {liveReelEvent.description}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* C. Bottom Player Table Stage (Action HUD Controls Bar + Hand) */}
          <div className="game-player-table-stage">
            {/* Action HUD Controls Bar: Buttons directly above hand cards */}
            <div className="game-hud-controls-bar">
              {/* Left: Turn / Phase Status Badge */}
              <div className="game-energy-indicator">
                {isMyTurn ? (
                  isDiscardPhase ? (
                    <>
                      <span className="game-turn-pill-dot" style={{ background: "#38bdf8" }} />
                      <span style={{ color: "#38bdf8", fontWeight: 800 }}>DISCARD PHASE:</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text)", fontWeight: 600 }}>
                        {selectedCards.length > 0
                          ? `${selectedCards.length} card${selectedCards.length > 1 ? "s" : ""} selected`
                          : "Select cards to drop"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="game-turn-pill-dot" style={{ background: "#4ade80" }} />
                      <span style={{ color: "#4ade80", fontWeight: 800 }}>DRAW PHASE:</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text)", fontWeight: 600 }}>
                        Pick from deck or discard
                      </span>
                    </>
                  )
                ) : (
                  <span className="game-hand-waiting-badge">
                    <span className="game-hand-waiting-pulse" />
                    Waiting for {activePlayer?.name || "opponent"}...
                  </span>
                )}
              </div>

              {/* Right: Game Action Buttons */}
              <div className="lowdeck-hud-actions-group">
                {/* 1. DECLARE SHOW Button */}
                {canDeclareShow && (
                  <motion.button
                    type="button"
                    onClick={handleDeclareShow}
                    whileHover={{ scale: 1.04, filter: "brightness(1.15)" }}
                    whileTap={{ scale: 0.96, y: 2 }}
                    className="lowdeck-hud-btn lowdeck-hud-btn--show"
                    title={`Declare Show with ${handScore} points!`}
                  >
                    <span className="material-symbols-outlined u-text-18">campaign</span>
                    <span>DECLARE SHOW</span>
                    <span className="lowdeck-hud-btn-tag">({handScore} PTS)</span>
                  </motion.button>
                )}

                {/* 2. DRAW PHASE BUTTONS */}
                {isMyTurn && isDrawPhase && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDrawCard("deck")}
                      className="lowdeck-hud-btn lowdeck-hud-btn--draw"
                      title="Draw a mystery card from the Draw Deck"
                    >
                      <span className="material-symbols-outlined u-text-18">style</span>
                      <span>Draw Deck</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => gameState.discardPileTop && handleDrawCard("discard")}
                      disabled={!gameState.discardPileTop}
                      className="lowdeck-hud-btn lowdeck-hud-btn--discard"
                      title={
                        gameState.discardPileTop
                          ? `Take ${gameState.discardPileTop.rank} of ${gameState.discardPileTop.suit} from Discard`
                          : "Discard Pile is empty"
                      }
                    >
                      <span className="material-symbols-outlined u-text-18">input</span>
                      <span>Take Discard</span>
                      {gameState.discardPileTop && (
                        <span className="lowdeck-hud-btn-tag">
                          {gameState.discardPileTop.rank}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* 3. DISCARD PHASE BUTTONS */}
                {isMyTurn && isDiscardPhase && (
                  <>
                    {selectedCards.length > 0 && (
                      <div
                        className={`lowdeck-hud-validation-chip ${
                          discardValidation.valid
                            ? "lowdeck-hud-validation-chip--valid"
                            : "lowdeck-hud-validation-chip--invalid"
                        }`}
                        title={discardValidation.valid ? "Valid combination" : discardValidation.reason}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                          {discardValidation.valid ? "check_circle" : "error"}
                        </span>
                        <span className="lowdeck-hud-validation-text">
                          {discardValidation.valid
                            ? `${selectedCards.length === 1 ? "Single" : selectedCards.length === 2 ? `Pair of ${selectedCards[0]?.rank}s` : `${selectedCards.length}-Card Run`} (−${selectedCards.reduce((acc, c) => acc + c.points, 0)} pts)`
                            : discardValidation.reason || "Invalid"}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleDiscardClick}
                      disabled={!discardValidation.valid || selectedCards.length === 0}
                      className={`lowdeck-hud-btn ${
                        selectedCards.length > 0
                          ? "lowdeck-hud-btn--discard-active"
                          : "lowdeck-hud-btn--discard-idle"
                      }`}
                      title={
                        discardValidation.valid
                          ? `Discard ${selectedCards.length} selected card${selectedCards.length > 1 ? "s" : ""}`
                          : selectedCards.length > 0
                          ? discardValidation.reason || "Invalid combination to discard"
                          : "Select a valid card combination to discard"
                      }
                    >
                      <span className="material-symbols-outlined u-text-18">delete_sweep</span>
                      <span>Discard</span>
                      {selectedCards.length > 0 && (
                        <span className="lowdeck-hud-btn-tag">({selectedCards.length})</span>
                      )}
                    </button>

                    {selectedCards.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCardIds([])}
                        className="lowdeck-hud-btn lowdeck-hud-btn--ghost"
                        title="Clear selected cards"
                      >
                        <span className="material-symbols-outlined u-text-16">clear</span>
                        <span>Clear</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Player Hand Carousel */}
            <div
              ref={handContainerRef}
              className={`game-hand-fanned-container ${!isMyTurn ? "game-hand-fanned-container--disabled" : ""}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div className="game-hand-cards-row">
                {handCards.map((card, idx) => {
                  const isSelected = selectedCardIds.includes(card.instanceId);
                  const isCardDisabled = !isMyTurn || !isDiscardPhase;
                  return (
                    <div 
                      key={card.instanceId} 
                      className={`game-hand-card-wrapper ${isSelected ? "game-hand-card-wrapper--selected" : ""} ${
                        !isCardDisabled ? "game-hand-card-wrapper--interactive" : "game-hand-card-wrapper--disabled"
                      }`}
                      style={{ zIndex: isSelected ? 50 : idx + 10 }}
                      onClick={() => {
                        if (hasDraggedRef.current) return;
                        if (!isCardDisabled) {
                          toggleSelectCard(card.instanceId);
                        }
                      }}
                    >
                      <StandardCard
                        card={card}
                        isSelected={isSelected}
                        size="md"
                        showPointsBadge={true}
                        disabled={isCardDisabled}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 4. Activity Log Drawer (Right Side) */}
      <AnimatePresence>
        {isActivityDrawerOpen && (
          <div className="game-activity-drawer-backdrop" onClick={() => setIsActivityDrawerOpen(false)} style={{ zIndex: 300 }}>
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="game-activity-drawer-panel u-flex-col"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "360px",
                maxWidth: "100vw",
                background: "rgba(11, 17, 32, 0.98)",
                borderLeft: "1px solid rgba(56, 189, 248, 0.2)",
                boxShadow: "-10px 0 30px rgba(0,0,0,0.8)",
              }}
            >
              <div className="game-activity-header u-flex-between" style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="u-flex-center-8 u-fw-800" style={{ color: "#f8fafc" }}>
                  <span className="material-symbols-outlined" style={{ color: "#38bdf8" }}>history</span>
                  Match Activity Log
                </div>
                <button
                  type="button"
                  onClick={() => setIsActivityDrawerOpen(false)}
                  className="button button--icon button--sm"
                  aria-label="Close activity log"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="game-activity-body u-flex-1 u-flex-col u-gap-10" style={{ overflowY: "auto", padding: "16px" }}>
                {actionLog.map((log) => (
                  <div
                    key={log.id}
                    className="u-flex u-gap-10"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                  >
                    <div
                      className="u-flex-center"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "rgba(56, 189, 248, 0.15)",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "#38bdf8",
                      }}
                    >
                      <span className="material-symbols-outlined u-text-18">
                        {log.icon}
                      </span>
                    </div>

                    <div className="u-flex-1" style={{ minWidth: 0 }}>
                      <div className="u-flex-between" style={{ marginBottom: "2px" }}>
                        <span className="u-fw-800" style={{ fontSize: "0.8rem", color: "#f8fafc" }}>
                          {log.title}
                        </span>
                        <span style={{ fontSize: "0.65rem", fontFamily: "var(--mono)", color: "var(--muted)" }}>
                          {log.timestamp}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--muted)", lineHeight: 1.4 }}>
                        {log.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Opponent Inspection Modal */}
      {viewingOpponent && (
        <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 300 }}>
          <div className="dialog-scrim" onClick={() => setViewingOpponent(null)} />
          <div className="dialog-panel dialog-panel--table">
            <div className="texture-overlay" />
            <div className="sheet-handle" />

            <div className="dialog-header">
              <div>
                <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px" }}>{viewingOpponent.name}&apos;s Stats {viewingOpponent.isBot && "(Bot)"}</h2>
                <div className="game-opponent-metrics" style={{ fontSize: "0.8rem" }}>
                  <span>{viewingOpponent.handCount} Cards in Hand (Hidden)</span>
                  <span>•</span>
                  <span style={{ color: viewingOpponent.score >= 70 ? "#ef4444" : "#38bdf8" }}>Penalty: {viewingOpponent.score}/{gameState.maxScore} PTS</span>
                </div>
              </div>
              <button
                type="button"
                className="dialog-close-btn"
                onClick={() => setViewingOpponent(null)}
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined u-text-20">close</span>
              </button>
            </div>

            <div className="dialog-content" style={{ padding: "16px 20px 40px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div className="u-text-center" style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px" }}>
                  <div className="u-fw-900" style={{ fontSize: "1.8rem", color: "#38bdf8" }}>{viewingOpponent.handCount}</div>
                  <div className="u-text-4sm" style={{ color: "var(--muted)" }}>Cards in Hand</div>
                </div>
                <div className="u-text-center" style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px" }}>
                  <div className="u-fw-900" style={{ fontSize: "1.8rem", color: viewingOpponent.score >= 70 ? "#ef4444" : "#facc15" }}>
                    {viewingOpponent.score}
                  </div>
                  <div className="u-text-4sm" style={{ color: "var(--muted)" }}>Penalty / {gameState.maxScore}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Round End & Showdown Results Modal */}
      {(isRoundEnd || isGameOver) && gameState.lastShowResult && (
        <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 300 }}>
          <div className="dialog-scrim" />
          <div className="dialog-panel dialog-panel--table">
            <div className="texture-overlay" />
            <div className="sheet-handle" />

            <div className="dialog-header u-text-center" style={{ flexDirection: "column", alignItems: "center", paddingBottom: "10px" }}>
              <h2 className="u-fw-900 u-text-xl" style={{ margin: "0 0 6px", color: isGameOver ? "#38bdf8" : (gameState.lastShowResult.isSuccessful ? "#facc15" : "#f43f5e") }}>
                {isGameOver ? "🏆 MATCH COMPLETE!" : (gameState.lastShowResult.isSuccessful ? "🎉 SUCCESSFUL SHOW!" : "💥 WRONG SHOW COUNTERED!")}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
                {isGameOver
                  ? `Match ended! ${gameState.players[gameState.winnerId!]?.name || "A player"} wins the game with the lowest penalty!`
                  : (gameState.lastShowResult.isSuccessful
                    ? `${gameState.players[gameState.lastShowResult.callerPlayerId]?.name} had the lowest hand count (${gameState.lastShowResult.callerScore} pts) and scored 0 penalty!`
                    : `${gameState.players[gameState.lastShowResult.callerPlayerId]?.name} called SHOW with ${gameState.lastShowResult.callerScore} pts, but was beaten by ${
                        gameState.players[gameState.lastShowResult.winnerPlayerId]?.name
                      } (${gameState.lastShowResult.lowestScore} pts)! +${gameState.wrongShowPenalty} penalty applied!`)
                }
              </p>
            </div>

            <div className="dialog-content" style={{ padding: "16px 20px 24px" }}>
              {/* Showdown Hand Reveal of All Players */}
              <div className="u-flex-col u-gap-12" style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "24px" }}>
                {(isGameOver ? [...gameState.playerOrder].sort((a,b) => gameState.players[a]!.score - gameState.players[b]!.score) : gameState.playerOrder).map((pid, idx) => {
                  const p = gameState.players[pid];
                  if (!p) return null;
                  const res = gameState.lastShowResult?.playerScores[pid];
                  const isRoundWinner = pid === gameState.lastShowResult?.winnerPlayerId;
                  const isCaller = pid === gameState.lastShowResult?.callerPlayerId;
                  const isOverallWinner = isGameOver && pid === gameState.winnerId;

                  return (
                    <div
                      key={pid}
                      style={{
                        background: (isGameOver ? isOverallWinner : isRoundWinner) ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.04)",
                        border: (isGameOver ? isOverallWinner : isRoundWinner) ? "1.5px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "14px",
                        padding: "12px 16px",
                      }}
                    >
                      <div className="u-flex-between" style={{ marginBottom: "8px" }}>
                        <div className="u-flex-center-8">
                          <span className="u-fw-800" style={{ fontSize: "0.95rem", color: "#f8fafc" }}>
                            {isGameOver && <span style={{ marginRight: "6px", color: "var(--muted)" }}>#{idx + 1}</span>}
                            {p.name} {pid === activePlayerId && "(You)"}
                          </span>
                          {!isGameOver && isRoundWinner && (
                            <span className="u-text-xs u-fw-900" style={{ background: "#22c55e", color: "#052e16", padding: "2px 8px", borderRadius: "999px" }}>
                              👑 ROUND WINNER (+0 PTS)
                            </span>
                          )}
                          {!isGameOver && isCaller && !gameState.lastShowResult?.isSuccessful && (
                            <span className="u-text-xs u-fw-900" style={{ background: "#ef4444", color: "#ffffff", padding: "2px 8px", borderRadius: "999px" }}>
                              ⚠️ COUNTERED (+{gameState.wrongShowPenalty} PTS)
                            </span>
                          )}
                          {isOverallWinner && (
                            <span className="u-text-xs u-fw-900" style={{ background: "#38bdf8", color: "#0f172a", padding: "2px 8px", borderRadius: "999px" }}>
                              🏆 MATCH WINNER
                            </span>
                          )}
                        </div>

                        <div className="u-fw-800" style={{ fontFamily: "var(--mono)", fontSize: "0.85rem", color: (isGameOver && isOverallWinner) ? "#38bdf8" : "#facc15" }}>
                          Total Match: {res?.totalScore ?? p.score} pts
                        </div>
                      </div>

                      {/* Revealed Cards */}
                      {!isGameOver && p.hand && (
                        <div className="u-flex u-gap-8" style={{ overflowX: "auto", padding: "4px 0" }}>
                          {p.hand.map((card) => (
                            <StandardCard key={card.instanceId} card={card} size="sm" showPointsBadge={true} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="u-flex u-gap-12" style={{ justifyContent: "center" }}>
                {isGameOver ? (
                  <button
                    type="button"
                    onClick={resetGame}
                    className="button button--primary"
                    style={{ padding: "12px 28px" }}
                  >
                    🏆 Play Again
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startNextRound}
                    className="button button--primary"
                    style={{ padding: "12px 28px" }}
                  >
                    Start Round {gameState.roundNumber + 1} ➔
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLeave}
                  className="button button--secondary"
                  style={{ padding: "12px 20px" }}
                >
                  Exit to Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Exit Confirmation Dialog */}
      {isExitDialogOpen && (
        <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 300 }}>
          <div className="dialog-scrim" onClick={() => setIsExitDialogOpen(false)} />
          <div className="dialog-panel dialog-panel--sm u-text-center">
            <div className="texture-overlay" />
            <div className="sheet-handle" />
            <div className="dialog-body" style={{ padding: "24px 20px" }}>
              <div className="u-flex" style={{ justifyContent: "center", marginBottom: "4px" }}>
                <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "32px" }}>
                  logout
                </span>
              </div>
              <h3 className="u-fw-800" style={{ fontSize: "1.2rem", margin: "0 0 8px" }}>Leave Match?</h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 20px", lineHeight: 1.5 }}>
                {isBotMode
                  ? "Are you sure you want to leave? Your match progress will be lost and you will return to the Lowdeck page."
                  : isHost
                  ? "Are you sure you want to leave? Because you are the Host, this will instantly end the game for everyone."
                  : "Are you sure you want to leave? A bot will take over your seat for the remainder of the game."}
              </p>
              <div className="u-flex u-gap-10" style={{ justifyContent: "center" }}>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setIsExitDialogOpen(false)}
                >
                  Stay
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleLeave}
                  style={{ background: "#f43f5e", borderColor: "#e11d48" }}
                >
                  Confirm Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Game Settings Dialog (Desktop Modal + Mobile Sheet) */}
      <GameSettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gameType="least_count"
      />

      {/* In-Game Emoji Reactions & Floating Bursts */}
      <QuickReactionDock onReact={handleReact} onRain={setRainEmoji} />
      <ReactionBurstsOverlay
        bursts={reactionBursts}
        onBurstComplete={handleDismissBurst}
      />
      <EmojiRainOverlay emoji={rainEmoji} onAnimationEnd={() => setRainEmoji(null)} />

      {/* Flying Drawn Card Flight Animation Overlay */}
      <AnimatePresence>
        {flyingCards.map((item) => {
          const isReduced = settings.animationSpeed === "reduced";
          const isCinematic = settings.animationSpeed === "cinematic";
          const duration = isReduced ? 0.12 : isCinematic ? 0.95 : 0.45;
          const ease = isReduced
            ? "linear"
            : isCinematic
              ? ([0.22, 1, 0.36, 1] as const)
              : ([0.16, 1, 0.3, 1] as const);

          return (
            <motion.div
              key={item.id}
              className="game-flying-draw-card"
              initial={{
                left: item.startX,
                top: item.startY,
                scale: isReduced ? 1 : 0.82,
                rotate: isReduced ? 0 : -12,
                opacity: 0,
              }}
              animate={{
                left: isReduced
                  ? [item.startX, item.endX]
                  : [
                      item.startX,
                      item.startX + (item.endX - item.startX) * 0.35,
                      item.endX,
                    ],
                top: isReduced
                  ? [item.startY, item.endY]
                  : [item.startY, item.startY - 75, item.endY],
                scale: isReduced ? [1, 1] : [0.82, 1.18, 1.0],
                rotate: isReduced ? [0, 0] : [-12, 6, item.rotate],
                opacity: [0, 1, 1, 0.95],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration,
                delay: isReduced ? 0 : item.delay,
                ease,
              }}
              onAnimationComplete={() => {
                setFlyingCards((prev) => {
                  const remaining = prev.filter((c) => c.id !== item.id);
                  if (remaining.length === 0) {
                    isAnimatingDrawRef.current = false;
                  }
                  return remaining;
                });
              }}
            >
              <div className="game-flying-card-inner">
                {item.card ? (
                  <StandardCard
                    card={item.card}
                    size="sm"
                    showPointsBadge={false}
                    disabled={false}
                  />
                ) : (
                  <CardBack
                    size="sm"
                    isInteractive={false}
                    variant={settings.cardBackDesign}
                  />
                )}
                <div className="game-flying-card-sheen" />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </GameTableShell>
  );
};
