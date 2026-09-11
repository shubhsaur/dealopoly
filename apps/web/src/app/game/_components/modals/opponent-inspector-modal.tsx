"use client";

import type { CardInstance, PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";

export interface OpponentData {
  id: string;
  name: string;
  handCount: number;
  bankTotal: number;
  bank: CardInstance[];
  propertySets: PropertySet[];
}

interface OpponentInspectorModalProps {
  viewingOpponentId: string | null;
  opponents: OpponentData[];
  onClose: () => void;
  onOpenBank: (playerId: string) => void;
}

export function OpponentInspectorModal({
  viewingOpponentId,
  opponents,
  onClose,
  onOpenBank,
}: OpponentInspectorModalProps) {
  const opp = viewingOpponentId ? opponents.find((o) => o.id === viewingOpponentId) : null;

  return (
    <DialogShell isOpen={Boolean(viewingOpponentId && opp)} onClose={onClose} size="table" zIndex={300} swipeToClose>
      <div className="dialog-header">
        <div>
          <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px" }}>{opp?.name}&apos;s Table</h2>
          <div className="game-opponent-metrics" style={{ fontSize: "0.8rem" }}>
            <span>{opp?.handCount} Cards in Hand (Hidden)</span>
            <span>•</span>
            <span style={{ color: "#66df75" }}>Bank: ${opp?.bankTotal}M</span>
          </div>
        </div>
        <button
          type="button"
          className="dialog-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            close
          </span>
        </button>
      </div>

      <div className="dialog-body">
        <div className="game-player-assets-row" style={{ minHeight: "auto", alignItems: "flex-start" }}>
          {/* Bank Panel */}
          <div
            className="game-bank-panel"
            onClick={() => opp && onOpenBank(opp.id)}
            role="button"
            tabIndex={0}
            aria-label={`View ${opp?.name}'s banked cash cards`}
            title={`Click to view ${opp?.name}'s bank vault`}
          >
            <div className="game-bank-header">
              <span className="game-bank-title">BANK</span>
              <span className="game-bank-count-pill">{opp?.bank.length} cards</span>
            </div>

            <div className="game-bank-balance-display">
              <span className="game-bank-total">${opp?.bankTotal}M</span>
            </div>

            <div className="game-bank-view-btn">
              <span>View cards</span>
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                open_in_new
              </span>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="game-properties-panel">
            <div className="game-properties-header">
              <div className="game-properties-title-group">
                <span className="game-properties-title-label">PROPERTIES</span>
                <span className="game-properties-completed-badge">
                  ★ {opp?.propertySets.filter((s) => s.isComplete).length} / 3 Sets
                </span>
              </div>
            </div>

            <div className="game-properties-sets-grid opp-sets-grid--dialog">
              {opp && opp.propertySets.length === 0 ? (
                <span style={{ fontSize: "0.7rem", color: "var(--outline)", padding: "4px 0" }}>
                  No property sets laid down yet.
                </span>
              ) : (
                opp?.propertySets.map((set) => {
                  const colorHex = COLOR_CONFIG[set.color as CardColor]?.hex || "#0055A4";
                  const totalCardCount = set.cards.length + (set.hasHouse ? 1 : 0) + (set.hasHotel ? 1 : 0);
                  const CARD_H = 170;
                  const OFFSET = 28;
                  const stackH = CARD_H + (totalCardCount - 1) * OFFSET;

                  return (
                    <div
                      key={set.setId}
                      className={`opp-property-set-stack ${set.isComplete ? "opp-property-set-stack--complete" : ""}`}
                      style={{
                        borderColor: colorHex,
                        minHeight: stackH + 24,
                      }}
                    >
                      <div className="opp-property-set-label" style={{ color: colorHex }}>
                        <span style={{ textTransform: "uppercase", fontWeight: 800, fontSize: "0.62rem" }}>
                          {set.color}
                        </span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", opacity: 0.8 }}>
                          {set.cards.length}/{set.setSize}
                          {set.isComplete && " ★"}
                        </span>
                      </div>

                      <div className="opp-property-set-fan" style={{ height: stackH }}>
                        {set.cards.map((c, idx) => (
                          <div
                            key={c.instanceId}
                            className="opp-fan-card"
                            style={{
                              top: idx * OFFSET,
                              zIndex: idx,
                            }}
                          >
                            <Card card={resolveCardDef(c)} size="xs" isInteractive={false} currentColor={c.currentColor} />
                          </div>
                        ))}
                        {set.hasHouse && (
                          <div
                            className="opp-fan-card opp-fan-upgrade"
                            style={{
                              top: set.cards.length * OFFSET,
                              zIndex: set.cards.length,
                              background: "#16a34a",
                              borderColor: "#4ade80",
                            }}
                          >
                            <span style={{ fontSize: "1.1rem" }}>🏠</span>
                            <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#86efac", marginTop: "2px" }}>
                              +$3M
                            </span>
                          </div>
                        )}
                        {set.hasHotel && (
                          <div
                            className="opp-fan-card opp-fan-upgrade"
                            style={{
                              top: (set.cards.length + (set.hasHouse ? 1 : 0)) * OFFSET,
                              zIndex: set.cards.length + (set.hasHouse ? 1 : 0),
                              background: "#b45309",
                              borderColor: "#fbbf24",
                            }}
                          >
                            <span style={{ fontSize: "1.1rem" }}>🏨</span>
                            <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#fde68a", marginTop: "2px" }}>
                              +$4M
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogShell>
  );
}
