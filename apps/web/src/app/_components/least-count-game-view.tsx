"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLeastCountClient } from "../../lib/use-least-count-client";
import { StandardCard } from "./standard-card";
import { CardLoader } from "./card-loader";
import { getStoredProfile } from "../../lib/session";
import {
  calculateHandScore,
  validateDiscardCombination,
  type LeastCountCard,
  type MaskedLeastCountPlayer,
} from "@dealopoly/game-engine";

interface LeastCountGameViewProps {
  roomCode?: string;
  isBotMode?: boolean;
  botCount?: number;
  playerName?: string;
  playerId?: string;
}

const OPPONENT_PALETTES = [
  { class: "avatar-theme--purple", color: "#c084fc" },
  { class: "avatar-theme--orange", color: "#fb923c" },
  { class: "avatar-theme--emerald", color: "#34d399" },
  { class: "avatar-theme--amber", color: "#fbbf24" },
];

export const LeastCountGameView: React.FC<LeastCountGameViewProps> = ({
  roomCode,
  isBotMode = true,
  botCount = 2,
  playerName,
  playerId,
}) => {
  const router = useRouter();
  const profile = getStoredProfile();
  const activePlayerId = playerId || profile.id;

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [isDiscardInspectorOpen, setIsDiscardInspectorOpen] = useState(false);
  const [viewingOpponent, setViewingOpponent] = useState<MaskedLeastCountPlayer | null>(null);

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
    if (isBotMode) {
      router.push("/lowdeck");
    } else {
      router.push("/lobby?game=least_count");
    }
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

  const toggleSelectCard = (instanceId: string) => {
    if (!isMyTurn || !isDiscardPhase) return;
    setSelectedCardIds((prev) =>
      prev.includes(instanceId) ? prev.filter((id) => id !== instanceId) : [...prev, instanceId],
    );
  };

  const handleDiscardClick = () => {
    if (discardValidation.valid && selectedCardIds.length > 0) {
      discardCards(selectedCardIds);
      setSelectedCardIds([]);
    }
  };

  const opponents = useMemo(() => {
    if (!gameState) return [];
    return gameState.playerOrder
      .filter((id) => id !== activePlayerId)
      .map((id) => gameState.players[id]!)
      .filter(Boolean);
  }, [gameState, activePlayerId]);

  if (!gameState) {
    return (
      <div className="game-table-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <CardLoader game="lowdeck" size="lg" text="Entering Lowdeck Table..." />
      </div>
    );
  }

  const activePlayer = gameState.players[gameState.activePlayerId];

  return (
    <div className="game-table-shell">
      {/* Texture Noise Overlay */}
      <div className="texture-overlay" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }} />

      {/* 1. Top App Navigation Bar */}
      <header className="game-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/" className="game-topbar-brand" aria-label="Dealopoly" style={{ textDecoration: "none" }}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "24px" }}>
              playing_cards
            </span>
            <span className="game-topbar-logo-text" style={{ fontWeight: 900, fontFamily: "Montserrat, sans-serif", fontSize: "1.2rem", letterSpacing: "-0.03em" }}>
              dealopoly
            </span>
          </Link>

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
          <div className="game-desktop-only" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
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
            {roomCode && (
              <span style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: "var(--muted)", background: "rgba(0,0,0,0.4)", padding: "4px 8px", borderRadius: "6px" }}>
                Room: {roomCode}
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
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              history
            </span>
            <span className="game-desktop-only">Activity</span>
            {unreadActivityCount > 0 && (
              <span className="game-activity-unread-badge">{unreadActivityCount}</span>
            )}
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
      {lastError && (
        <div
          style={{
            position: "absolute",
            top: "64px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            background: "#93000a",
            border: "1px solid #ffb4ab",
            color: "#ffdad6",
            padding: "8px 20px",
            borderRadius: "999px",
            fontSize: "0.82rem",
            fontWeight: 700,
            boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
          }}
        >
          {lastError}
        </div>
      )}

      {/* 3. Main Layout Grid */}
      <div className="game-layout-grid">
        <main className="game-main-arena">
          {/* A. Opponents Strip */}
          <div className="game-opponents-strip">
            {opponents.map((opp, idx) => {
              const palette = OPPONENT_PALETTES[idx % OPPONENT_PALETTES.length]!;
              const isOppActive = gameState.activePlayerId === opp.id;
              const scorePercent = Math.min((opp.score / gameState.maxScore) * 100, 100);

              return (
                <div
                  key={opp.id}
                  className={`game-opponent-seat ${isOppActive ? "game-opponent-seat--active" : ""}`}
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
                      <span style={{ color: opp.isEliminated ? "#ef4444" : (opp.score >= 70 ? "#ef4444" : "#38bdf8"), fontWeight: 800 }}>
                        🏆 {opp.score}/{gameState.maxScore} PTS
                      </span>
                      <span style={{ color: "var(--muted)", fontSize: "0.68rem" }}>
                        {opp.handCount} Cards in Hand
                      </span>
                    </div>

                    {/* Danger Score Bar */}
                    <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", overflow: "hidden", marginTop: "4px" }}>
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

          {/* B. Center Table Arena (Draw & Discard Piles + Action Prompt + Reel) */}
          <div className="game-center-stage">
            <div className="game-piles-wrapper">
              {/* 3D Stacked Draw Pile */}
              <div
                className="game-draw-pile"
                onClick={() => isMyTurn && isDrawPhase && drawCard("deck")}
                title={isMyTurn && isDrawPhase ? "Click to Draw from Deck" : "Draw Pile"}
                style={{ cursor: isMyTurn && isDrawPhase ? "pointer" : "default" }}
              >
                <div className="game-draw-card-layer" />
                <div className="game-draw-card-layer" />
                <div
                  className={`game-draw-card-top ${
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
                className="game-discard-pile"
                onClick={() => {
                  if (isMyTurn && isDrawPhase) {
                    drawCard("discard");
                  } else {
                    setIsDiscardInspectorOpen(true);
                  }
                }}
                title={isMyTurn && isDrawPhase ? "Click to Take Discarded Card" : "Tap to Inspect Discard Pile"}
                style={{ cursor: "pointer" }}
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
                    <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--outline)", opacity: 0.5 }}>
                      layers_clear
                    </span>
                    <span style={{ fontSize: "0.58rem", color: "var(--outline)", fontFamily: "var(--mono)", fontWeight: 700 }}>
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
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
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
                  initial={{ opacity: 0, y: -16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.95 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="game-action-reel-icon-wrap" style={{ background: "rgba(56, 189, 248, 0.2)", borderColor: "#38bdf8" }}>
                    <span className="material-symbols-outlined" style={{ color: "#38bdf8", fontSize: "20px" }}>
                      {liveReelEvent.icon}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                    <span style={{ fontSize: "0.72rem", color: "#38bdf8", fontWeight: 800, letterSpacing: "0.05em" }}>
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

          {/* C. Bottom Player Table Stage (Hand Points & Combinations Dock + Hand) */}
          <div className="game-player-table-stage">
            {/* Player Metrics Row */}
            <div className="game-player-assets-row">
              {/* Hand Score Status Panel */}
              <div
                className="game-bank-panel"
                style={{
                  borderColor: handScore <= gameState.showThreshold ? "rgba(250, 204, 21, 0.6)" : "rgba(56, 189, 248, 0.3)",
                  background: handScore <= gameState.showThreshold ? "rgba(250, 204, 21, 0.08)" : undefined,
                }}
              >
                <div className="game-bank-header">
                  <span className="game-bank-title">YOUR HAND TOTAL</span>
                  <span className="game-bank-count-pill">{handCards.length} cards</span>
                </div>

                <div className="game-bank-balance-display" style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span
                    className="game-bank-total"
                    style={{
                      color: handScore <= gameState.showThreshold ? "#facc15" : handScore <= 15 ? "#4ade80" : "#fb7185",
                    }}
                  >
                    {handScore} PTS
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                    (Match: {localPlayer?.score || 0} pts)
                  </span>
                  {localPlayer?.isEliminated && (
                    <div style={{ marginTop: "6px", background: "#ef4444", color: "white", fontSize: "0.75rem", fontWeight: 900, padding: "2px 8px", borderRadius: "12px", textAlign: "center" }}>
                      ELIMINATED
                    </div>
                  )}
                </div>

                {canDeclareShow ? (
                  <motion.button
                    type="button"
                    onClick={declareShow}
                    whileHover={{ scale: 1.03, filter: "brightness(1.15)" }}
                    whileTap={{ scale: 0.96, y: 4, boxShadow: "0 0px 0 #713f12, 0 4px 8px rgba(202, 138, 4, 0.4)" }}
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      background: "linear-gradient(180deg, #facc15 0%, #a16207 100%)",
                      border: "1.5px solid #fef08a",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontWeight: 900,
                      fontSize: "0.85rem",
                      textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                      padding: "10px 8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "2px",
                      boxShadow: "0 4px 0 #713f12, 0 8px 16px rgba(202, 138, 4, 0.4)",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>campaign</span>
                      DECLARE SHOW
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "#fef08a", fontWeight: 700, textShadow: "none" }}>
                      ({handScore} PTS)
                    </span>
                  </motion.button>
                ) : (
                  <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "4px" }}>
                    SHOW Target: ≤ {gameState.showThreshold} pts
                  </div>
                )}
              </div>

              {/* Combination & Selection Status Panel */}
              <div className="game-properties-panel">
                <div className="game-properties-header">
                  <div className="game-properties-title-group">
                    <span className="game-properties-title-label">
                      DISCARD COMBINATION & TACTICS
                    </span>
                    <span className="game-properties-completed-badge" style={{ color: "#38bdf8" }}>
                      Round {gameState.roundNumber}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "4px 0" }}>
                  {selectedCards.length > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: discardValidation.valid ? "#4ade80" : "#f43f5e" }}>
                          {discardValidation.valid
                            ? `✓ Valid ${selectedCards.length === 1 ? "Single Card" : selectedCards.length === 2 ? `Pair of ${selectedCards[0]?.rank}s` : "3-Card Sequence"} (${selectedCards.reduce((acc, c) => acc + c.points, 0)} pts reduction)`
                            : `✗ ${discardValidation.reason}`}
                        </span>
                      </div>

                      {isMyTurn && isDiscardPhase && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={handleDiscardClick}
                            disabled={!discardValidation.valid}
                            className="button button--primary button--sm"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>input</span>
                            Discard ({selectedCards.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCardIds([])}
                            className="button button--ghost button--sm"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <span style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                        {isMyTurn
                          ? isDiscardPhase
                            ? "Click cards in hand to select a Single Card, Rank Pair (e.g. 7-7), or Suited Run (e.g. 4-5-6 ♥)."
                            : "Draw phase: Choose Draw Deck or Discard Pile above to complete your turn."
                          : "Waiting for opponent's move. Plan your combinations."}
                      </span>

                      {isMyTurn && isDrawPhase && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => drawCard("deck")}
                            className="button button--primary button--sm"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>style</span>
                            Draw Deck
                          </button>
                          <button
                            type="button"
                            onClick={() => drawCard("discard")}
                            className="button button--secondary button--sm"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>input</span>
                            Take Discard
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Player Hand Carousel */}
            <div className="game-hand-fanned-container">
              <div className="game-hand-cards-row">
                {handCards.map((card, idx) => {
                  const isSelected = selectedCardIds.includes(card.instanceId);
                  return (
                    <div 
                      key={card.instanceId} 
                      className={`game-hand-card-wrapper ${isSelected ? "game-hand-card-wrapper--selected" : ""}`}
                      style={{ zIndex: isSelected ? 50 : idx + 10 }}
                    >
                      <StandardCard
                        card={card}
                        isSelected={isSelected}
                        onClick={() => toggleSelectCard(card.instanceId)}
                        size="md"
                        showPointsBadge={true}
                        disabled={!isMyTurn || !isDiscardPhase}
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
              className="game-activity-drawer-panel"
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
                display: "flex",
                flexDirection: "column",
                boxShadow: "-10px 0 30px rgba(0,0,0,0.8)",
              }}
            >
              <div className="game-activity-header" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, color: "#f8fafc" }}>
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

              <div className="game-activity-body" style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {actionLog.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      padding: "12px",
                      display: "flex",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "rgba(56, 189, 248, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "#38bdf8",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                        {log.icon}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#f8fafc" }}>
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

      {/* 5. Discard Pile Inspector Modal */}
      {isDiscardInspectorOpen && (
        <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 300 }}>
          <div className="dialog-scrim" onClick={() => setIsDiscardInspectorOpen(false)} />
          <div className="discard-inspector-modal">
            <div className="discard-inspector-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>
                  layers
                </span>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                  Discard Pile ({gameState.discardPileCount} Cards)
                </h3>
              </div>
              <button
                type="button"
                className="game-round-icon-btn"
                onClick={() => setIsDiscardInspectorOpen(false)}
                title="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  close
                </span>
              </button>
            </div>

            <div className="discard-inspector-grid">
              {gameState.lastDiscardedCards && gameState.lastDiscardedCards.length > 0 ? (
                [...gameState.lastDiscardedCards].reverse().map((c, i) => (
                  <div key={`${c.instanceId}-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <StandardCard card={c} size="xs" showPointsBadge={false} disabled={false} />
                  </div>
                ))
              ) : gameState.discardPileTop ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <StandardCard card={gameState.discardPileTop} size="xs" showPointsBadge={false} disabled={false} />
                </div>
              ) : (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                  Discard pile is empty.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <div className="dialog-content" style={{ padding: "16px 20px 40px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#38bdf8" }}>{viewingOpponent.handCount}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Cards in Hand</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: viewingOpponent.score >= 70 ? "#ef4444" : "#facc15" }}>
                    {viewingOpponent.score}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Penalty / {gameState.maxScore}</div>
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
          <div className="dialog-panel dialog-panel--table" style={{ maxWidth: "680px", width: "95vw" }}>
            <div className="texture-overlay" />
            <div className="sheet-handle" />

            <div className="dialog-header" style={{ flexDirection: "column", alignItems: "center", textAlign: "center", paddingBottom: "10px" }}>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0 0 6px", color: isGameOver ? "#38bdf8" : (gameState.lastShowResult.isSuccessful ? "#facc15" : "#f43f5e") }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto", marginBottom: "24px" }}>
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#f8fafc" }}>
                            {isGameOver && <span style={{ marginRight: "6px", color: "var(--muted)" }}>#{idx + 1}</span>}
                            {p.name} {pid === activePlayerId && "(You)"}
                          </span>
                          {!isGameOver && isRoundWinner && (
                            <span style={{ background: "#22c55e", color: "#052e16", fontSize: "0.68rem", fontWeight: 900, padding: "2px 8px", borderRadius: "999px" }}>
                              👑 ROUND WINNER (+0 PTS)
                            </span>
                          )}
                          {!isGameOver && isCaller && !gameState.lastShowResult?.isSuccessful && (
                            <span style={{ background: "#ef4444", color: "#ffffff", fontSize: "0.68rem", fontWeight: 900, padding: "2px 8px", borderRadius: "999px" }}>
                              ⚠️ COUNTERED (+{gameState.wrongShowPenalty} PTS)
                            </span>
                          )}
                          {isOverallWinner && (
                            <span style={{ background: "#38bdf8", color: "#0f172a", fontSize: "0.68rem", fontWeight: 900, padding: "2px 8px", borderRadius: "999px" }}>
                              🏆 MATCH WINNER
                            </span>
                          )}
                        </div>

                        <div style={{ fontFamily: "var(--mono)", fontWeight: 800, fontSize: "0.85rem", color: (isGameOver && isOverallWinner) ? "#38bdf8" : "#facc15" }}>
                          Total Match: {res?.totalScore ?? p.score} pts
                        </div>
                      </div>

                      {/* Revealed Cards */}
                      {!isGameOver && p.hand && (
                        <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "4px 0" }}>
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
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
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
          <div className="dialog-scrim" />
          <div className="dialog-panel" style={{ maxWidth: "400px", padding: "24px", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 8px" }}>Leave Match?</h3>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 20px" }}>
              Are you sure you want to exit? Your current match progress will be forfeited.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
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
      )}
    </div>
  );
};
