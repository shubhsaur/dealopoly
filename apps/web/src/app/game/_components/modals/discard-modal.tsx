"use client";

import type { CardInstance } from "@dealopoly/game-engine";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { triggerHaptic } from "../../../../lib/sound-effects";
import { DialogShell } from "../../../_components/dialog-shell";

interface DiscardModalProps {
  pending: {
    type: "discard";
    playerId: string;
    requiredDiscardCount: number;
  };
  actualPlayerId: string;
  you: {
    hand?: CardInstance[];
  } | null;
  discardSelectedIds: string[];
  setDiscardSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmitDiscard: () => void;
  onClose?: () => void;
}

export function DiscardModal({
  pending,
  actualPlayerId,
  you,
  discardSelectedIds,
  setDiscardSelectedIds,
  onSubmitDiscard,
  onClose,
}: DiscardModalProps) {
  const isOpen = pending.type === "discard" && pending.playerId === actualPlayerId;
  const isCountMatched = discardSelectedIds.length === pending.requiredDiscardCount;

  return (
    <DialogShell isOpen={isOpen} onClose={onClose ?? (() => {})} size="wide">
      <div className="dialog-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "24px" }}>
            delete_sweep
          </span>
          <h2 style={{ color: "#ef4444", fontSize: "1.15rem", margin: 0 }}>Hand Limit Exceeded</h2>
        </div>
        {onClose && (
          <button
            type="button"
            className="dialog-close-btn"
            onClick={onClose}
            aria-label="Close discard dialog"
            title="Cancel and resume turn"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <div className="dialog-body">
        <p style={{ margin: 0, fontSize: "0.88rem" }}>
          You have {you?.hand?.length} cards. Please select <b>{pending.requiredDiscardCount}</b> card(s) to discard:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {you?.hand?.map((card) => {
            const isSelected = discardSelectedIds.includes(card.instanceId);
            const cardDef = resolveCardDef(card);

            return (
              <button
                key={card.instanceId}
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setDiscardSelectedIds((prev) =>
                    isSelected ? prev.filter((id) => id !== card.instanceId) : [...prev, card.instanceId],
                  );
                }}
                style={{
                  padding: "4px",
                  borderRadius: "10px",
                  background: isSelected ? "#ef4444" : "var(--surface)",
                  color: isSelected ? "#ffffff" : "inherit",
                  border: `1.5px solid ${isSelected ? "#ef4444" : "var(--outline)"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ pointerEvents: "none", zoom: 0.5, transformOrigin: "top left" }}>
                  <Card card={cardDef} size="xs" isInteractive={false} currentColor={card.currentColor} />
                </div>
                {isSelected && (
                  <span style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "11px", fontWeight: 900, color: "#ffffff" }}>
                      check
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dialog-footer" style={{ display: "flex", gap: "10px" }}>
        {onClose && (
          <button
            type="button"
            className="button button--secondary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="button button--primary"
          style={{ flex: onClose ? 2 : 1 }}
          disabled={!isCountMatched}
          onClick={onSubmitDiscard}
        >
          Discard {discardSelectedIds.length}/{pending.requiredDiscardCount} Cards
        </button>
      </div>
    </DialogShell>
  );
}
