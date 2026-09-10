"use client";

import type { CardInstance, MaskedGameState } from "@dealopoly/game-engine";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";

interface ReactionModalProps {
  pending: {
    type: "reaction_window";
    waitingForPlayerId?: string;
    waitingForPlayerIds?: string[];
    jsnSubResolution?: {
      waitingForPlayerId?: string;
      justSayNoChainCount: number;
      canExtend?: boolean;
      deadline?: number;
    };
    initiatorPlayerId: string;
    targetPlayerId: string;
    justSayNoChainCount: number;
    actionCard: CardInstance;
    canExtend?: boolean;
    deadline?: number;
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

  const isOpen = pending.type === "reaction_window" && isWaiting;

  const hasJSN = you?.hand?.some((c) => c.defId === "action-just-say-no");
  const isInJsnSubChain = pending.jsnSubResolution?.waitingForPlayerId === actualPlayerId;
  const jsnChainCount = isInJsnSubChain
    ? pending.jsnSubResolution!.justSayNoChainCount
    : pending.justSayNoChainCount;
  const canExtendTimer = isInJsnSubChain
    ? pending.jsnSubResolution!.canExtend !== false
    : pending.canExtend !== false;

  const otherPlayerName =
    gameState.players[
      pending.initiatorPlayerId === actualPlayerId ? pending.targetPlayerId : pending.initiatorPlayerId
    ]?.name || "Opponent";

  return (
    <DialogShell isOpen={isOpen} onClose={() => onReaction("pass")} size="md">
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

      <div className="dialog-body" style={{ textAlign: "center", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <Card card={resolveCardDef(pending.actionCard)} size="xs" isInteractive={false} />
        </div>
        <p style={{ margin: 0, color: "var(--on-surface-variant)", fontSize: "0.9rem", lineHeight: 1.5 }}>
          {jsnChainCount > 0
            ? `${otherPlayerName} played a Just Say No against your ${pending.actionCard.name}! Do you want to counter it with another Just Say No?`
            : `${pending.actionCard.name} was played against you. Do you want to block it?`}
        </p>

        {hasJSN ? (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
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
          <div style={{ marginTop: "16px" }}>
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
