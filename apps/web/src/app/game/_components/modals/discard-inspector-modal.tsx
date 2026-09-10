"use client";

import type { CardInstance } from "@dealopoly/game-engine";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";

interface DiscardInspectorModalProps {
  isOpen: boolean;
  discardPile?: CardInstance[];
  discardPileTop?: CardInstance | null;
  onClose: () => void;
}

export function DiscardInspectorModal({
  isOpen,
  discardPile,
  discardPileTop,
  onClose,
}: DiscardInspectorModalProps) {
  const cardCount = discardPile?.length || (discardPileTop ? 1 : 0);

  return (
    <DialogShell isOpen={isOpen} onClose={onClose} size="sm">
      <div className="discard-inspector-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>
            layers
          </span>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
            Discard Pile ({cardCount})
          </h3>
        </div>
        <button
          type="button"
          className="game-round-icon-btn"
          onClick={onClose}
          title="Close"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            close
          </span>
        </button>
      </div>

      <div className="discard-inspector-grid">
        {discardPile && discardPile.length > 0 ? (
          [...discardPile].reverse().map((c, i) => (
            <div key={`${c.instanceId}-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <Card card={resolveCardDef(c)} size="xs" isInteractive={false} currentColor={c.currentColor} />
              <span style={{ fontSize: "0.64rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                {i === 0 ? "Top Card" : `#${discardPile.length - i}`}
              </span>
            </div>
          ))
        ) : discardPileTop ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <Card card={resolveCardDef(discardPileTop)} size="xs" isInteractive={false} />
            <span style={{ fontSize: "0.64rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
              Top Card
            </span>
          </div>
        ) : (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--muted)", padding: "24px 0" }}>
            Discard pile is currently empty.
          </p>
        )}
      </div>
    </DialogShell>
  );
}
