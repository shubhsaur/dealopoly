"use client";

import type { CardInstance, MaskedGameState, PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";

export interface YourPropertiesModalProps {
  isOpen: boolean;
  you: {
    id?: string;
    name?: string;
    hand?: CardInstance[];
    bankTotal?: number;
    bank?: CardInstance[];
    propertySets: PropertySet[];
  } | null;
  isYourTurn: boolean;
  gameState: MaskedGameState;
  onClose: () => void;
  onOpenBank: (playerId: string) => void;
  onReorganizeTarget: (target: { card: CardInstance; fromSet: PropertySet }) => void;
  onMoveBuildingTarget: (target: { buildingType: "house" | "hotel"; fromSet: PropertySet }) => void;
}

export function YourPropertiesModal({
  isOpen,
  you,
  isYourTurn,
  gameState,
  onClose,
  onOpenBank,
  onReorganizeTarget,
  onMoveBuildingTarget,
}: YourPropertiesModalProps) {
  if (!isOpen || !you) return null;

  const completedSetsCount = you.propertySets.filter((s) => s.isComplete).length;
  const isActionActive = isYourTurn && gameState.turn.phase === "action" && !gameState.pendingResolution;

  return (
    <DialogShell isOpen={isOpen && Boolean(you)} onClose={onClose} size="table" zIndex={300} swipeToClose>
      <div className="dialog-header">
        <div>
          <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px" }}>Your Table &amp; Properties</h2>
          <div className="game-opponent-metrics" style={{ fontSize: "0.8rem" }}>
            <span>{you.hand?.length ?? 0} Cards in Hand</span>
            <span>•</span>
            <span style={{ color: "#66df75" }}>Bank: ${you.bankTotal ?? 0}M</span>
            <span>•</span>
            <span style={{ color: "var(--primary)" }}>★ {completedSetsCount} / 3 Sets Complete</span>
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
            onClick={() => {
              onClose();
              onOpenBank(you.id || "self");
            }}
            role="button"
            tabIndex={0}
            aria-label="View your banked cash cards"
            title="Click to view your bank vault"
          >
            <div className="game-bank-header">
              <span className="game-bank-title">YOUR BANK</span>
              <span className="game-bank-count-pill">{you.bank?.length || 0} cards</span>
            </div>

            <div className="game-bank-balance-display">
              <span className="game-bank-total">${you.bankTotal ?? 0}M</span>
            </div>

            <div className="game-bank-view-btn">
              <span>View vault</span>
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                open_in_new
              </span>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="game-properties-panel" style={{ flex: 1 }}>
            <div className="game-properties-header">
              <div className="game-properties-title-group">
                <span className="game-properties-title-label">YOUR PROPERTIES</span>
                <span className="game-properties-completed-badge">
                  ★ {completedSetsCount} / 3 Sets
                </span>
              </div>
            </div>

            <div className="game-properties-sets-grid opp-sets-grid--dialog">
              {you.propertySets.length === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center", width: "100%" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--outline)", opacity: 0.6 }}>
                    domain_disabled
                  </span>
                  <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "8px 0 0" }}>
                    No property sets laid down yet.
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--outline)", margin: "4px 0 0" }}>
                    Click or drag property cards in your hand to start building full sets!
                  </p>
                </div>
              ) : (
                you.propertySets.map((set) => {
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
                        {set.cards.map((c, idx) => {
                          const isWild = c.type === "property-wild";
                          const canReorganize = isActionActive && isWild;

                          return (
                            <div
                              key={c.instanceId}
                              className="opp-fan-card"
                              style={{
                                top: idx * OFFSET,
                                zIndex: idx,
                              }}
                            >
                              <Card card={resolveCardDef(c)} size="xs" isInteractive={false} currentColor={c.currentColor} />
                              {canReorganize && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                    onReorganizeTarget({ card: c, fromSet: set });
                                  }}
                                  className="game-wild-switch-btn"
                                  style={{
                                    position: "absolute",
                                    bottom: "6px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    zIndex: 20,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
                                  }}
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
                            {isActionActive && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onMoveBuildingTarget({ buildingType: "house", fromSet: set });
                                }}
                                className="game-wild-switch-btn"
                                style={{
                                  fontSize: "0.55rem",
                                  padding: "1px 4px",
                                  marginTop: "2px",
                                  zIndex: 20,
                                }}
                                title="Move House to another full set"
                              >
                                Move
                              </button>
                            )}
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
                            {isActionActive && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onMoveBuildingTarget({ buildingType: "hotel", fromSet: set });
                                }}
                                className="game-wild-switch-btn"
                                style={{
                                  fontSize: "0.55rem",
                                  padding: "1px 4px",
                                  marginTop: "2px",
                                  zIndex: 20,
                                }}
                                title="Move Hotel to another full set"
                              >
                                Move
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
        </div>
      </div>
    </DialogShell>
  );
}
