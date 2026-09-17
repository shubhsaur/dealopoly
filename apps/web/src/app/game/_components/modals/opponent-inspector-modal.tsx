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

      <div className="dialog-body" style={{ flex: "1 1 auto", height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div
          className="game-player-assets-row game-player-assets-row--dialog game-player-assets-row--col"
          style={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            height: "100%",
            minHeight: 0,
            width: "100%",
            gap: "10px",
            alignItems: "stretch",
          }}
        >
          {/* Bank Panel */}
          <div
            className="game-bank-panel game-bank-panel--dialog"
            onClick={() => opp && onOpenBank(opp.id)}
            role="button"
            tabIndex={0}
            aria-label={`View ${opp?.name}'s banked cash cards`}
            title={`Click to view ${opp?.name}'s bank vault`}
            style={{
              width: "100%",
              minWidth: "100%",
              maxWidth: "100%",
              height: "auto",
              minHeight: "48px",
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              borderRadius: "12px",
              gap: "12px",
            }}
          >
            <div className="game-bank-header" style={{ borderBottom: "none", paddingBottom: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="game-bank-title">BANK</span>
              <span className="game-bank-count-pill">{opp?.bank.length} cards</span>
            </div>

            <div className="game-bank-balance-display" style={{ padding: 0 }}>
              <span className="game-bank-total" style={{ fontSize: "1.3rem" }}>${opp?.bankTotal}M</span>
            </div>

            <div className="game-bank-view-btn">
              <span>View cards</span>
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                open_in_new
              </span>
            </div>
          </div>

          {/* Properties Panel */}
          <div
            className="game-properties-panel game-properties-panel--dialog"
            style={{
              flex: "1 1 auto",
              width: "100%",
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="game-properties-header">
              <div className="game-properties-title-group">
                <span className="game-properties-title-label">PROPERTIES</span>
                <span className="game-properties-completed-badge">
                  ★ {opp?.propertySets.filter((s) => s.isComplete).length} / 3 Sets
                </span>
              </div>
            </div>

            <div
              className="game-properties-sets-grid opp-sets-grid--dialog"
              style={{
                flex: "1 1 auto",
                height: "100%",
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {opp && opp.propertySets.length === 0 ? (
                <div className="opp-sets-grid-empty" style={{ padding: "28px 16px", textAlign: "center", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--outline)", opacity: 0.6 }}>
                    domain_disabled
                  </span>
                  <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "8px 0 0" }}>
                    No property sets laid down yet.
                  </p>
                </div>
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
