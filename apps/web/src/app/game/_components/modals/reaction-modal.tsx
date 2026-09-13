"use client";

import type { CardInstance, MaskedGameState } from "@dealopoly/game-engine";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";

interface ReactionModalProps {
  pending: {
    type: "reaction_window" | "payment";
    waitingForPlayerId?: string;
    waitingForPlayerIds?: string[];
    jsnSubResolution?: {
      waitingForPlayerId?: string;
      justSayNoChainCount: number;
      canExtend?: boolean;
      deadline?: number;
      initiatorPlayerId: string;
      targetPlayerId: string;
      actionCard: CardInstance;
      // Card preview fields
      targetCard?: CardInstance;
      swappedCard?: CardInstance;
      targetPropertySetCards?: CardInstance[];
    };
    initiatorPlayerId?: string;
    targetPlayerId?: string;
    justSayNoChainCount?: number;
    actionCard?: CardInstance;
    canExtend?: boolean;
    deadline?: number;
    // Card preview fields
    targetCard?: CardInstance;
    swappedCard?: CardInstance;
    targetPropertySetCards?: CardInstance[];
  };
  actualPlayerId: string;
  gameState: MaskedGameState;
  you: {
    hand?: CardInstance[];
  } | null;
  reactionRemainingSeconds: number | null;
  onReaction: (action: "just_say_no" | "pass" | "extend_timer", jsnCardId?: string) => void;
}

export function ReactionModal({
  pending,
  actualPlayerId,
  gameState,
  you,
  reactionRemainingSeconds,
  onReaction,
}: ReactionModalProps) {
  const isWaiting =
    pending.waitingForPlayerId === actualPlayerId ||
    pending.waitingForPlayerIds?.includes(actualPlayerId) ||
    pending.jsnSubResolution?.waitingForPlayerId === actualPlayerId;

  const isOpen = isWaiting;

  const hasJSN = you?.hand?.some((c) => c.defId === "action-just-say-no");
  const isInJsnSubChain = pending.jsnSubResolution?.waitingForPlayerId === actualPlayerId;
  const reaction = isInJsnSubChain ? pending.jsnSubResolution : pending;
  const jsnChainCount = reaction!.justSayNoChainCount ?? 0;
  const canExtendTimer = reaction!.canExtend !== false;

  const initiatorPlayerId = reaction!.initiatorPlayerId as string;
  const targetPlayerId = reaction!.targetPlayerId as string;
  const actionCard = reaction!.actionCard as CardInstance;

  // The player viewing this modal is the target (victim). The initiator is the attacker.
  const attackerName = gameState.players[
    initiatorPlayerId === actualPlayerId ? targetPlayerId : initiatorPlayerId
  ]?.name || "Opponent";

  // Card preview data
  const targetCard = reaction!.targetCard;
  const swappedCard = reaction!.swappedCard;
  const targetPropertySetCards = reaction!.targetPropertySetCards;

  const isSlyDeal = actionCard?.defId === "action-sly-deal";
  const isForcedDeal =
    actionCard?.defId === "action-forced-deal" || actionCard?.defId === "action-force-deal";
  const isDealBreaker = actionCard?.defId === "action-deal-breaker";

  return (
    <DialogShell isOpen={isOpen} onClose={() => onReaction("pass")} size="wide">
      <div
        className="dialog-header"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "24px" }}>
            warning
          </span>
          <h2 style={{ color: "#ef4444", fontSize: "1.15rem", margin: 0 }}>
            {jsnChainCount > 0 ? "Action Blocked!" : "Action Targeted You!"}
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              padding: "3px 8px",
              borderRadius: "12px",
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
              timer
            </span>
            {reactionRemainingSeconds !== null ? `${reactionRemainingSeconds}s` : "7s"}
          </span>

          {canExtendTimer && (
            <button
              type="button"
              onClick={() => onReaction("extend_timer")}
              style={{
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                color: "#60a5fa",
                padding: "3px 8px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                transition: "all 0.15s ease",
              }}
              title="Add +5 seconds to decision time"
            >
              +5s
            </button>
          )}
        </div>
      </div>

      <div className="dialog-body" style={{ textAlign: "center", padding: "16px 24px 20px" }}>
        {/* Description text */}
        <p style={{ margin: "0 0 16px", color: "var(--on-surface-variant)", fontSize: "0.9rem", lineHeight: 1.5 }}>
          {jsnChainCount > 0
            ? `${attackerName} played a Just Say No against your ${actionCard.name}! Do you want to counter with another Just Say No?`
            : `${attackerName} played ${actionCard.name} targeting you. Do you want to block it?`}
        </p>

        {/* Card evidence panel */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            alignItems: "flex-start",
            flexWrap: "wrap",
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          {/* Action card used */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                display: "block",
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#f87171",
                letterSpacing: "0.06em",
                marginBottom: "8px",
              }}
            >
              Action Card
            </span>
            <Card card={resolveCardDef(actionCard)} size="xs" isInteractive={false} />
          </div>

          {/* Sly Deal: show the card being stolen */}
          {isSlyDeal && targetCard && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "center",
                  color: "#f87171",
                  fontSize: "1.4rem",
                  fontWeight: 900,
                }}
              >
                →
              </div>
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#f87171",
                    letterSpacing: "0.06em",
                    marginBottom: "8px",
                  }}
                >
                  Card They Want
                </span>
                <Card
                  card={resolveCardDef(targetCard)}
                  size="xs"
                  isInteractive={false}
                  currentColor={targetCard.currentColor}
                />
              </div>
            </>
          )}

          {/* Forced Deal: show card being taken + card being offered */}
          {isForcedDeal && targetCard && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "center",
                  color: "#f87171",
                  fontSize: "1.4rem",
                  fontWeight: 900,
                }}
              >
                →
              </div>
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#f87171",
                    letterSpacing: "0.06em",
                    marginBottom: "8px",
                  }}
                >
                  They Take From You
                </span>
                <Card
                  card={resolveCardDef(targetCard)}
                  size="xs"
                  isInteractive={false}
                  currentColor={targetCard.currentColor}
                />
              </div>

              {swappedCard && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      alignSelf: "center",
                      color: "#34d399",
                      fontSize: "1.4rem",
                      fontWeight: 900,
                    }}
                  >
                    ⇄
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "#34d399",
                        letterSpacing: "0.06em",
                        marginBottom: "8px",
                      }}
                    >
                      They Give You
                    </span>
                    <Card
                      card={resolveCardDef(swappedCard)}
                      size="xs"
                      isInteractive={false}
                      currentColor={swappedCard.currentColor}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Deal Breaker: show the full set being stolen */}
          {isDealBreaker && targetPropertySetCards && targetPropertySetCards.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "center",
                  color: "#f87171",
                  fontSize: "1.4rem",
                  fontWeight: 900,
                }}
              >
                →
              </div>
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#f87171",
                    letterSpacing: "0.06em",
                    marginBottom: "8px",
                  }}
                >
                  Full Set Stolen ({targetPropertySetCards.length} cards)
                </span>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                  {targetPropertySetCards.map((c) => (
                    <Card
                      key={c.instanceId}
                      card={resolveCardDef(c)}
                      size="xs"
                      isInteractive={false}
                      currentColor={c.currentColor}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {hasJSN ? (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              type="button"
              className="button button--primary"
              style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }}
              onClick={() => {
                const jsn = you?.hand?.find((c) => c.defId === "action-just-say-no");
                onReaction("just_say_no", jsn?.instanceId);
              }}
            >
              PLAY JUST SAY NO!
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onReaction("pass")}
            >
              Pass (Accept)
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              className="button button--secondary button--full"
              style={{ fontWeight: 600 }}
              onClick={() => onReaction("pass")}
            >
              Accept Action
            </button>
          </div>
        )}
      </div>
    </DialogShell>
  );
}
