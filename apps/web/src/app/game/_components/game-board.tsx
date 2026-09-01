"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { MaskedGameState, PropertySet, CardInstance } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { Card, CardBack } from "../../_components/card";
import { resolveCardDef, OPPONENT_PALETTES, type FlyingCardItem } from "./types";

// ==========================================
// 1. GAME TOPBAR / HEADER
// ==========================================
interface GameHeaderProps {
  isYourTurn: boolean;
  gameState: MaskedGameState;
  activePlayer?: { name: string };
  isConnected: boolean;
  isLocal: boolean;
  unreadActivityCount: number;
  onOpenActivityDrawer: () => void;
  onOpenExitDialog: () => void;
}

export function GameHeader({
  isYourTurn,
  gameState,
  activePlayer,
  isConnected,
  isLocal,
  unreadActivityCount,
  onOpenActivityDrawer,
  onOpenExitDialog,
}: GameHeaderProps) {
  return (
    <header className="game-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link href="/" className="game-topbar-brand" aria-label="Dealopoly" style={{ textDecoration: "none" }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "24px" }}>
            playing_cards
          </span>
          <span className="game-topbar-logo-text">dealopoly</span>
        </Link>

        {/* Turn & Action Pill */}
        <div className="game-turn-pill">
          <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
            timer
          </span>
          <span>
            {isYourTurn ? `${gameState.turn.actionsRemaining}/3 Actions` : `${activePlayer?.name}'s Turn`}
          </span>
        </div>
      </div>

      {/* Top bar actions */}
      <div className="game-topbar-actions">
        {/* Match Status Pill */}
        <div
          className="hero-badge game-desktop-only"
          style={{
            padding: "4px 10px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <span className="badge-dot" style={{ background: isConnected ? "#10b981" : "#f59e0b" }} />
          <span className="badge-text" style={{ fontSize: "0.72rem" }}>
            {isLocal ? "🤖 Solo Match" : isConnected ? "Live Room" : "Connecting..."}
          </span>
        </div>

        {/* Activity Drawer Toggle */}
        <button
          type="button"
          className="game-activity-toggle-btn"
          onClick={onOpenActivityDrawer}
          title="Match Activity"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            feed
          </span>
          <span className="game-desktop-only">Activity</span>
          {unreadActivityCount > 0 && (
            <span className="game-activity-unread-badge">{unreadActivityCount}</span>
          )}
        </button>

        {/* Red Leave Game Button */}
        <button
          type="button"
          className="game-topbar-leave-btn"
          title="Leave Match"
          onClick={onOpenExitDialog}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
            exit_to_app
          </span>
          <span className="game-desktop-only">Leave Game</span>
        </button>
      </div>
    </header>
  );
}

// ==========================================
// 2. CENTER STAGE (DECK, DISCARD, REEL)
// ==========================================
interface CenterStageProps {
  drawPileRef: React.RefObject<HTMLDivElement | null>;
  isYourTurn: boolean;
  gameState: MaskedGameState;
  activePlayer?: { name: string };
  reactionRemainingSeconds: number | null;
  liveReelEvent: {
    id: string;
    icon: string;
    title: string;
    description: string;
  } | null;
  flyingCards: FlyingCardItem[];
  setFlyingCards: React.Dispatch<React.SetStateAction<FlyingCardItem[]>>;
  isAnimatingDrawRef: React.MutableRefObject<boolean>;
  onDraw: () => void;
  onOpenDiscardInspector: () => void;
}

export function CenterStage({
  drawPileRef,
  isYourTurn,
  gameState,
  activePlayer,
  reactionRemainingSeconds,
  liveReelEvent,
  flyingCards,
  setFlyingCards,
  isAnimatingDrawRef,
  onDraw,
  onOpenDiscardInspector,
}: CenterStageProps) {
  const isDrawClickable = isYourTurn && gameState.turn.phase === "draw" && !gameState.pendingResolution;

  return (
    <>
      <div className="game-center-stage">
        <div className="game-piles-wrapper">
          {/* 3D Stacked Draw Pile */}
          <div
            ref={drawPileRef}
            className="game-draw-pile"
            onClick={onDraw}
            title={isDrawClickable ? "Click to Draw 2 Cards" : "Draw Pile"}
          >
            <div className="game-draw-card-layer" />
            <div className="game-draw-card-layer" />
            <div className={`game-draw-card-top ${isDrawClickable ? "game-draw-pile-pulse" : ""}`}>
              <span className="game-draw-title">DEAL</span>
              <span className="game-draw-count-badge">{gameState.deckCount}</span>
              <span className="game-draw-subtitle">
                {isDrawClickable ? "TAP TO DRAW" : "CARDS"}
              </span>
            </div>
          </div>

          {/* Discard Pile with stacked authentic cards */}
          <div
            className="game-discard-pile"
            onClick={onOpenDiscardInspector}
            title="Tap to Inspect Discard Pile"
          >
            {gameState.discardPileTop ? (
              <div className="game-discard-stack-wrapper">
                {(gameState.discardPile?.length ?? 1) >= 3 && (
                  <div className="game-discard-layer game-discard-layer--bottom" />
                )}
                {(gameState.discardPile?.length ?? 1) >= 2 && (
                  <div className="game-discard-layer game-discard-layer--middle" />
                )}
                <div className="game-discard-top-card">
                  <Card card={resolveCardDef(gameState.discardPileTop)} size="xs" isInteractive={false} />
                </div>
                <div className="game-discard-count-badge">
                  <span>{gameState.discardPile?.length || 1}</span>
                </div>
              </div>
            ) : (
              <div className="game-discard-empty">
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--outline)", opacity: 0.5 }}>
                  layers_clear
                </span>
                <span style={{ fontSize: "0.58rem", color: "var(--outline)", fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: "0.04em" }}>
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
            {gameState.pendingResolution ? "hourglass_top" : isYourTurn ? "play_circle" : "hourglass_top"}
          </span>
          <span>
            {gameState.pendingResolution
              ? gameState.pendingResolution.type === "payment"
                ? `⏳ Waiting for ${gameState.players[gameState.pendingResolution.debtorPlayerId]?.name || "player"} to pay $${gameState.pendingResolution.amountDue}M rent...`
                : gameState.pendingResolution.type === "reaction_window"
                ? `⏳ Waiting for ${gameState.players[gameState.pendingResolution.waitingForPlayerId]?.name || "player"} to respond${reactionRemainingSeconds !== null ? ` (${reactionRemainingSeconds}s)` : ""}...`
                : `⏳ Waiting for ${gameState.players[gameState.pendingResolution.playerId]?.name || "player"} to discard cards...`
              : isYourTurn
              ? gameState.turn.phase === "draw"
                ? "✨ Your Turn: Draw 2 cards to begin ✨"
                : gameState.turn.actionsRemaining === 0
                ? "⚡ All 3 actions played! Ending turn..."
                : `⚡ Your Turn: ${gameState.turn.actionsRemaining} action${gameState.turn.actionsRemaining === 1 ? "" : "s"} left`
              : `${activePlayer?.name} is playing their turn...`}
          </span>
        </div>

        {/* Live Animated Action Reel */}
        {liveReelEvent && (
          <div className="game-action-reel">
            <div className="game-action-reel-icon-wrap">
              <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "20px" }}>
                {liveReelEvent.icon}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
              <span style={{ fontSize: "0.72rem", color: "#66df75", fontWeight: 800, letterSpacing: "0.05em" }}>
                {liveReelEvent.title}
              </span>
              <span className="game-action-reel-text">{liveReelEvent.description}</span>
            </div>
          </div>
        )}
      </div>

      {/* Flying Drawn Cards Overlay */}
      <AnimatePresence>
        {flyingCards.map((item) => (
          <motion.div
            key={item.id}
            className="game-flying-draw-card"
            initial={{
              left: item.startX,
              top: item.startY,
              scale: 0.82,
              rotate: -12,
              opacity: 0,
            }}
            animate={{
              left: [item.startX, item.startX + (item.endX - item.startX) * 0.35, item.endX],
              top: [item.startY, item.startY - 75, item.endY],
              scale: [0.82, 1.18, 1.0],
              rotate: [-12, 6, item.rotate],
              opacity: [0, 1, 1, 0.95],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: 0.72,
              delay: item.delay,
              ease: [0.22, 1, 0.36, 1],
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
              <CardBack size="sm" isInteractive={false} />
              <div className="game-flying-card-sheen" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}

// ==========================================
// 3. OPPONENTS STRIP
// ==========================================
interface OpponentSeatData {
  id: string;
  name: string;
  isBot?: boolean;
  handCount: number;
  bankTotal: number;
  propertySets: PropertySet[];
}

interface OpponentsStripProps {
  opponents: OpponentSeatData[];
  gameState: MaskedGameState;
  roomInfo?: {
    seats?: Array<{
      playerId: string;
      isConnected?: boolean;
    }>;
  } | null;
  onSelectOpponent: (opponentId: string) => void;
}

export function OpponentsStrip({
  opponents,
  gameState,
  roomInfo,
  onSelectOpponent,
}: OpponentsStripProps) {
  return (
    <div className="game-opponents-strip">
      {opponents.map((opp, oppIdx) => {
        const palette = OPPONENT_PALETTES[oppIdx % OPPONENT_PALETTES.length] || OPPONENT_PALETTES[0]!;
        const isOppActive = gameState.turn.activePlayerId === opp.id;
        const completedCount = opp.propertySets.filter((s) => s.isComplete).length;
        const oppSeat = roomInfo?.seats?.find((s) => s.playerId === opp.id);
        const isOffline = !opp.isBot && oppSeat && oppSeat.isConnected === false;

        return (
          <div
            key={opp.id}
            className={`game-opponent-seat ${isOppActive ? "game-opponent-seat--active" : ""} ${isOffline ? "game-opponent-seat--offline" : ""}`}
            onClick={() => onSelectOpponent(opp.id)}
            title={`View ${opp.name}'s Table`}
          >
            <div className={`game-opponent-avatar-wrap ${palette.class}`}>
              <span>{opp.name[0]?.toUpperCase()}</span>
              <span className="game-opponent-hand-badge">🃏 {opp.handCount}</span>
              {isOffline && (
                <div
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    background: "#ef4444",
                    borderRadius: "50%",
                    width: 12,
                    height: 12,
                    border: "2px solid var(--surface)",
                  }}
                  title="Offline"
                />
              )}
            </div>

            <div className="game-opponent-info">
              <div className="game-opponent-name-row">
                <span className="game-opponent-name">
                  {opp.name} {opp.isBot && "(Bot)"}
                  {isOffline && (
                    <span style={{ color: "#ef4444", fontSize: "0.7rem", marginLeft: "6px", fontWeight: "bold" }}>
                      OFFLINE
                    </span>
                  )}
                </span>
                {isOppActive && !isOffline && (
                  <span className="game-opponent-turn-tag">THINKING...</span>
                )}
              </div>

              <div className="game-opponent-metrics">
                <span className="game-opponent-bank-val">${opp.bankTotal}M</span>
                <span style={{ color: "var(--primary)" }}>★ {completedCount}/3 Sets</span>
              </div>

              <div className="game-opponent-sets-preview">
                {opp.propertySets.map((s) => {
                  const colorHex = COLOR_CONFIG[s.color]?.hex || "#0055a4";
                  return (
                    <div
                      key={s.setId}
                      className={`game-opponent-set-chip ${s.isComplete ? "game-opponent-set-chip--complete" : ""}`}
                      style={{ backgroundColor: colorHex }}
                      title={`${s.color.toUpperCase()} (${s.cards.length}/${s.setSize})${s.isComplete ? " [Complete!]" : ""}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 4. PROPERTY FIELD & PLAYER BANK
// ==========================================
interface PropertyFieldProps {
  you: {
    propertySets: PropertySet[];
  } | null;
  isYourTurn: boolean;
  gameState: MaskedGameState;
  onReorganizeTarget: (target: { card: CardInstance; fromSet: PropertySet }) => void;
  onMoveBuildingTarget: (target: { buildingType: "house" | "hotel"; fromSet: PropertySet }) => void;
}

export function PropertyField({
  you,
  isYourTurn,
  gameState,
  onReorganizeTarget,
  onMoveBuildingTarget,
}: PropertyFieldProps) {
  const isActionActive = isYourTurn && gameState.turn.phase === "action" && !gameState.pendingResolution;
  const completedSetsCount = you?.propertySets.filter((s) => s.isComplete).length || 0;

  return (
    <div className="game-properties-panel">
      <div className="game-properties-header">
        <div className="game-properties-title-group">
          <span className="game-properties-title-label">YOUR PROPERTIES</span>
          <span className="game-properties-completed-badge">
            ★ {completedSetsCount} / 3 Sets
          </span>
        </div>
      </div>

      <div className="game-properties-sets-grid">
        {!you?.propertySets || you.propertySets.length === 0 ? (
          <span style={{ fontSize: "0.7rem", color: "var(--outline)", padding: "4px 0" }}>
            No property sets laid down yet. Click a property card in hand to start a set.
          </span>
        ) : (
          you.propertySets.map((set) => {
            const colorHex = COLOR_CONFIG[set.color]?.hex || "#0055a4";

            return (
              <div
                key={set.setId}
                className={`game-property-set-box ${set.isComplete ? "game-property-set-box--complete" : ""}`}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `2px solid ${colorHex}`,
                    paddingBottom: "2px",
                  }}
                >
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: colorHex, textTransform: "uppercase" }}>
                    {set.color}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", fontWeight: 700 }}>
                    {set.cards.length}/{set.setSize} {set.isComplete && "★"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "0.64rem", color: "var(--muted)" }}>
                  {set.cards.map((c) => {
                    const isWild = c.type === "property-wild";
                    const canReorganize = isActionActive && isWild;

                    return (
                      <div
                        key={c.instanceId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: canReorganize ? "85px" : "120px",
                            color: isWild ? "var(--primary)" : "inherit",
                            fontWeight: isWild ? 700 : 400,
                          }}
                        >
                          • {c.name}
                        </span>
                        {canReorganize && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReorganizeTarget({ card: c, fromSet: set });
                            }}
                            className="game-wild-switch-btn"
                            title="Switch Wildcard Color (Free Action)"
                          >
                            <span>🔄</span>
                            <span>Move</span>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {set.hasHouse && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        gap: "4px",
                      }}
                    >
                      <span style={{ color: "#66df75", fontWeight: 700 }}>🏠 House (+$3M)</span>
                      {isActionActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveBuildingTarget({ buildingType: "house", fromSet: set });
                          }}
                          className="game-wild-switch-btn"
                          title="Move House to another completed set (Free Action)"
                          style={{ padding: "2px 6px", fontSize: "0.68rem" }}
                        >
                          <span>🔄</span>
                          <span>Move</span>
                        </button>
                      )}
                    </div>
                  )}

                  {set.hasHotel && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        gap: "4px",
                      }}
                    >
                      <span style={{ color: "#ffb77d", fontWeight: 700 }}>🏨 Hotel (+$4M)</span>
                      {isActionActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveBuildingTarget({ buildingType: "hotel", fromSet: set });
                          }}
                          className="game-wild-switch-btn"
                          title="Move Hotel to another completed set (Free Action)"
                          style={{ padding: "2px 6px", fontSize: "0.68rem" }}
                        >
                          <span>🔄</span>
                          <span>Move</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface PlayerBankProps {
  bankCount: number;
  bankTotal: number;
  onOpenVault: () => void;
}

export function PlayerBank({ bankCount, bankTotal, onOpenVault }: PlayerBankProps) {
  return (
    <div
      className="game-bank-panel"
      onClick={onOpenVault}
      role="button"
      tabIndex={0}
      aria-label="View banked cash cards"
      title="Click to view bank vault"
    >
      <div className="game-bank-header">
        <span className="game-bank-title">YOUR BANK</span>
        <span className="game-bank-count-pill">{bankCount} cards</span>
      </div>

      <div className="game-bank-balance-display">
        <span className="game-bank-total">${bankTotal}M</span>
      </div>

      <div className="game-bank-view-btn">
        <span>View cards</span>
        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
          open_in_new
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 5. PLAYER HAND TRAY & HUD
// ==========================================
interface PlayerHandProps {
  handContainerRef: React.RefObject<HTMLDivElement | null>;
  you: {
    hand?: CardInstance[];
  } | null;
  isYourTurn: boolean;
  gameState: MaskedGameState;
  selectedCard: CardInstance | null;
  setSelectedCard: React.Dispatch<React.SetStateAction<CardInstance | null>>;
  onEndTurn: () => void;
}

export function PlayerHand({
  handContainerRef,
  you,
  isYourTurn,
  gameState,
  selectedCard,
  setSelectedCard,
  onEndTurn,
}: PlayerHandProps) {
  const isHandInteractive = isYourTurn && gameState.turn.phase === "action" && !gameState.pendingResolution;

  return (
    <>
      <div className="game-hud-controls-bar">
        <div className="game-energy-indicator">
          <span>ACTION ENERGY:</span>
          <div className="game-energy-pips">
            {[1, 2, 3].map((pipNum) => {
              const isPipActive = isYourTurn && gameState.turn.actionsRemaining >= pipNum;
              return (
                <div
                  key={pipNum}
                  className={`game-energy-pip ${isPipActive ? "game-energy-pip--active" : "game-energy-pip--spent"}`}
                  title={isPipActive ? `Action ${pipNum} Available` : `Action ${pipNum} Spent`}
                />
              );
            })}
          </div>
          <span style={{ fontSize: "0.75rem", color: isYourTurn ? "var(--text)" : "var(--muted)" }}>
            ({isYourTurn ? `${gameState.turn.actionsRemaining} left` : "Waiting for turn"})
          </span>
        </div>

        {isYourTurn && gameState.turn.phase === "action" && !gameState.pendingResolution && (
          <button
            type="button"
            onClick={onEndTurn}
            className={`game-end-turn-btn ${gameState.turn.actionsRemaining === 0 ? "game-end-turn-btn--pulse" : ""}`}
          >
            <span>{gameState.turn.actionsRemaining === 0 ? "Ending Turn..." : "End Turn"}</span>
            <span style={{ fontSize: "0.85em" }}>➔</span>
          </button>
        )}
      </div>

      <div ref={handContainerRef} className="game-hand-fanned-container">
        <div className="game-hand-cards-row">
          {you?.hand?.map((card, idx) => {
            const isSelected = selectedCard?.instanceId === card.instanceId;

            return (
              <div
                key={card.instanceId}
                className={`game-hand-card-wrapper ${isSelected ? "game-hand-card-wrapper--selected" : ""}`}
                style={{ zIndex: isSelected ? 50 : idx + 10 }}
                onClick={() => {
                  if (isHandInteractive) {
                    setSelectedCard(isSelected ? null : card);
                  }
                }}
              >
                <Card card={resolveCardDef(card)} size="sm" isInteractive={isHandInteractive} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
