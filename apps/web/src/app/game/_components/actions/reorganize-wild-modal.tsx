"use client";

import type { CardInstance, PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";
interface ReorganizeWildModalProps {
  reorganizeTarget: {
    card: CardInstance;
    fromSet: PropertySet;
  } | null;
  you: {
    propertySets: PropertySet[];
  } | null;
  onClose: () => void;
  onReorganize: (cardInstanceId: string, fromSetId: string, newColor: CardColor, toSetId?: string) => void;
}

export function ReorganizeWildModal({
  reorganizeTarget,
  you,
  onClose,
  onReorganize,
}: ReorganizeWildModalProps) {
  if (!reorganizeTarget) {
    return null;
  }

  const card = reorganizeTarget.card;
  const availableColors: CardColor[] =
    card.primaryColor === "all"
      ? [
          "brown",
          "dark-blue",
          "green",
          "light-blue",
          "orange",
          "pink",
          "railroad",
          "red",
          "utility",
          "yellow",
        ]
      : ([card.primaryColor, card.secondaryColor].filter(Boolean) as CardColor[]);

  const hasBuildingBlock =
    (reorganizeTarget.fromSet.hasHouse || reorganizeTarget.fromSet.hasHotel) &&
    reorganizeTarget.fromSet.cards.length - 1 < reorganizeTarget.fromSet.setSize;

  return (
    <DialogShell
      isOpen={Boolean(reorganizeTarget)}
      onClose={onClose}
      size="sm"
      zIndex={250}
    >
        <div className="dialog-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "24px" }}>
              sync_alt
            </span>
            <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Rearrange Property Wild Card</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="dialog-close-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              close
            </span>
          </button>
        </div>

        <div className="dialog-body" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Card card={resolveCardDef(card)} size="xs" isInteractive={false} currentColor={card.currentColor} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(102, 223, 117, 0.12)",
              border: "1px solid rgba(102, 223, 117, 0.3)",
              color: "var(--green)",
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              bolt
            </span>
            <span>FREE ACTION • 0 Action Energy consumed</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--muted)" }}>
            <span>Currently in set:</span>
            <span
              style={{
                fontWeight: 800,
                color: COLOR_CONFIG[reorganizeTarget.fromSet.color]?.hex || "var(--primary)",
                textTransform: "uppercase",
              }}
            >
              {reorganizeTarget.fromSet.color} ({reorganizeTarget.fromSet.cards.length}/{reorganizeTarget.fromSet.setSize} cards)
            </span>
          </div>

          {hasBuildingBlock && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                fontSize: "0.78rem",
                lineHeight: 1.4,
              }}
            >
              ⚠️ Cannot move this wildcard: this set has a House/Hotel attached which strictly requires a completed set.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)" }}>
              SELECT NEW COLOR FOR THIS WILDCARD:
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {availableColors.map((color) => {
                const otherIncompleteSets =
                  you?.propertySets.filter(
                    (s) => s.color === color && s.setId !== reorganizeTarget.fromSet.setId && !s.isComplete,
                  ) || [];
                // Target the incomplete set with the highest card count (closest to complete)
                const targetIncompleteSet = otherIncompleteSets.slice().sort((a, b) => b.cards.length - a.cards.length)[0];

                const isSameColorAsCurrentSet = color === reorganizeTarget.fromSet.color;
                // Only mark as disabled/current if it's the current set's color AND there is no other incomplete set of this color to move into
                const isCurrent = isSameColorAsCurrentSet && !targetIncompleteSet;
                const colorHex = COLOR_CONFIG[color]?.hex || "#0055a4";

                let statusSubtitle = "";
                if (isCurrent) {
                  statusSubtitle = `Current set (${reorganizeTarget.fromSet.cards.length}/${reorganizeTarget.fromSet.setSize})`;
                } else if (targetIncompleteSet) {
                  statusSubtitle = isSameColorAsCurrentSet
                    ? `Merge with existing (${targetIncompleteSet.cards.length}/${targetIncompleteSet.setSize})`
                    : `Join existing (${targetIncompleteSet.cards.length}/${targetIncompleteSet.setSize})`;
                } else {
                  statusSubtitle = `Start new set (0/${COLOR_CONFIG[color]?.setSize || 3})`;
                }

                return (
                  <button
                    key={color}
                    type="button"
                    disabled={hasBuildingBlock || isCurrent}
                    onClick={() => {
                      onReorganize(card.instanceId, reorganizeTarget.fromSet.setId, color, targetIncompleteSet?.setId);
                      onClose();
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: isCurrent ? "rgba(255,255,255,0.06)" : "var(--surface)",
                      border: `2px solid ${
                        isCurrent
                          ? colorHex
                          : isSameColorAsCurrentSet && targetIncompleteSet
                          ? "rgba(102, 223, 117, 0.4)"
                          : "var(--outline-variant)"
                      }`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "4px",
                      cursor: hasBuildingBlock || isCurrent ? "not-allowed" : "pointer",
                      opacity: hasBuildingBlock ? 0.4 : isCurrent ? 0.6 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: colorHex,
                          display: "inline-block",
                        }}
                      />
                      <span style={{ fontWeight: 800, fontSize: "0.82rem", textTransform: "uppercase", color: "#FFFFFF" }}>
                        {color}
                      </span>
                      {isCurrent ? (
                        <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--muted)" }}>
                          Current
                        </span>
                      ) : isSameColorAsCurrentSet && targetIncompleteSet ? (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: "var(--green)",
                            backgroundColor: "rgba(102, 223, 117, 0.15)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          Merge
                        </span>
                      ) : null}
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--muted)", textAlign: "left" }}>
                      {statusSubtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button
            type="button"
            className="button button--secondary button--full"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
    </DialogShell>
  );
}
