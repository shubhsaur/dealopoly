"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CardInstance, MaskedGameState, PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { calculateSetRent } from "@dealopoly/game-engine";
import { Card } from "../../_components/card";
import { resolveCardDef, type TargetingActionState } from "./types";

// ==========================================
// 1. ACTION BOTTOM SHEET
// ==========================================
interface ActionBottomSheetProps {
  selectedCard: CardInstance | null;
  you: {
    id: string;
    hand?: CardInstance[];
    propertySets: PropertySet[];
  } | null;
  gameState: MaskedGameState;
  onClose: () => void;
  onPlayProperty: (card: CardInstance, targetColor?: CardColor, targetSetId?: string) => void;
  onBankCard: (card: CardInstance) => void;
  onPlayAction: (card: CardInstance, targetPlayerId?: string, targetSetId?: string) => void;
  onPlayRent: (
    rentCard: CardInstance,
    chosenColor: CardColor,
    targetPlayerId?: string,
    doubleRentCardInstanceId?: string,
  ) => void;
  onSetTargetingAction: (action: TargetingActionState | null) => void;
  setSelectedWildRentColor: (color: CardColor | null) => void;
}

export function ActionBottomSheet({
  selectedCard,
  you,
  gameState,
  onClose,
  onPlayProperty,
  onBankCard,
  onPlayAction,
  onPlayRent,
  onSetTargetingAction,
  setSelectedWildRentColor,
}: ActionBottomSheetProps) {
  return (
    <AnimatePresence>
      {selectedCard && (
        <motion.div
          className="game-card-action-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="game-card-action-dialog"
            initial={{ scale: 0.88, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 16, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350, mass: 0.7 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="game-card-action-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <span className="game-card-type-tag">
                  {selectedCard.type === "property" && "🏠 PROPERTY"}
                  {selectedCard.type === "property-wild" && "🌈 WILD PROPERTY"}
                  {selectedCard.type === "money" && "💰 CASH"}
                  {selectedCard.type === "action" && "⚡ ACTION CARD"}
                  {selectedCard.type === "rent" && "💸 RENT"}
                </span>
                <b
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedCard.name}
                </b>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="game-icon-btn"
                style={{ width: "32px", height: "32px", flexShrink: 0 }}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="game-card-action-body">
              <div className="game-card-spotlight-wrap">
                <div
                  className="game-card-spotlight-glow"
                  style={{
                    background:
                      COLOR_CONFIG[selectedCard.primaryColor || selectedCard.currentColor || "dark-blue"]?.hex ||
                      "var(--primary)",
                  }}
                />
                <Card card={resolveCardDef(selectedCard)} size="md" isInteractive={false} />
              </div>

              <div className="game-card-action-options">
                {/* Regular Property */}
                {selectedCard.type === "property" && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="game-action-choice-btn game-action-choice-btn--primary"
                    onClick={() => onPlayProperty(selectedCard)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        domain
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>Play to Property Set</span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                          Add to your {selectedCard.primaryColor?.toUpperCase()} sets
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </motion.button>
                )}

                {/* Wild Property Dual Color */}
                {selectedCard.type === "property-wild" &&
                  selectedCard.primaryColor !== "all" &&
                  (() => {
                    const canPrimary = you?.propertySets.some(
                      (s) => s.color === selectedCard.primaryColor && !s.isComplete,
                    );
                    const canSecondary = you?.propertySets.some(
                      (s) => s.color === selectedCard.secondaryColor && !s.isComplete,
                    );

                    if (canPrimary || canSecondary) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                            SELECT SET COLOR TO ATTACH:
                          </span>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: canPrimary && canSecondary ? "1fr 1fr" : "1fr",
                              gap: "8px",
                            }}
                          >
                            {canPrimary && (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="button button--primary"
                                style={{
                                  background: COLOR_CONFIG[selectedCard.primaryColor!]?.hex || "var(--primary)",
                                  color: COLOR_CONFIG[selectedCard.primaryColor!]?.textHex || "#FFFFFF",
                                  padding: "12px 10px",
                                  fontSize: "0.84rem",
                                  fontWeight: 800,
                                }}
                                onClick={() => onPlayProperty(selectedCard, selectedCard.primaryColor)}
                              >
                                🏠 {selectedCard.primaryColor?.toUpperCase()}
                              </motion.button>
                            )}
                            {canSecondary && (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="button button--primary"
                                style={{
                                  background: COLOR_CONFIG[selectedCard.secondaryColor!]?.hex || "var(--primary)",
                                  color: COLOR_CONFIG[selectedCard.secondaryColor!]?.textHex || "#FFFFFF",
                                  padding: "12px 10px",
                                  fontSize: "0.84rem",
                                  fontWeight: 800,
                                }}
                                onClick={() => onPlayProperty(selectedCard, selectedCard.secondaryColor)}
                              >
                                🏠 {selectedCard.secondaryColor?.toUpperCase()}
                              </motion.button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          color: "#fcd34d",
                          lineHeight: 1.35,
                        }}
                      >
                        ⚠️ Wild Property Cards must attach to an existing {selectedCard.primaryColor?.toUpperCase()} or{" "}
                        {selectedCard.secondaryColor?.toUpperCase()} set on your table. You can bank it for cash below.
                      </div>
                    );
                  })()}

                {/* Wild Property Multicolor */}
                {selectedCard.type === "property-wild" &&
                  selectedCard.primaryColor === "all" &&
                  (() => {
                    const eligibleSets = you?.propertySets.filter((s) => !s.isComplete) || [];

                    if (eligibleSets.length > 0) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                            SELECT EXISTING INCOMPLETE SET:
                          </span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {eligibleSets.map((set) => (
                              <motion.button
                                key={set.setId}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="button"
                                style={{
                                  backgroundColor: COLOR_CONFIG[set.color]?.hex || "var(--surface-high)",
                                  color: COLOR_CONFIG[set.color]?.textHex || "#FFFFFF",
                                  padding: "10px 8px",
                                  fontSize: "0.78rem",
                                  fontWeight: 800,
                                  borderRadius: "10px",
                                  textAlign: "center",
                                  textTransform: "uppercase",
                                }}
                                onClick={() => onPlayProperty(selectedCard, set.color, set.setId)}
                              >
                                {set.color.replace("-", " ")} ({set.cards.length}/{set.setSize})
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          color: "#fcd34d",
                          lineHeight: 1.35,
                        }}
                      >
                        ⚠️ Multicolor Wild Card must attach to an existing incomplete property set on your table. You
                        can bank it for cash below.
                      </div>
                    );
                  })()}

                {/* Bank Action */}
                {selectedCard.value > 0 && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="game-action-choice-btn game-action-choice-btn--bank"
                    onClick={() => onBankCard(selectedCard)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        savings
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>Deposit ${selectedCard.value}M into Bank</span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(134, 239, 172, 0.8)", fontWeight: 500 }}>
                          Safe from rent & action steals
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">account_balance</span>
                  </motion.button>
                )}

                {/* Action: Pass Go */}
                {selectedCard.defId === "action-pass-go" && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="game-action-choice-btn game-action-choice-btn--primary"
                    onClick={() => onPlayAction(selectedCard)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        fast_forward
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>Play Pass Go (+2 Cards)</span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                          Instantly draw 2 extra cards into hand
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">add_card</span>
                  </motion.button>
                )}

                {/* Action: Deal Breaker */}
                {selectedCard.defId === "action-deal-breaker" && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="game-action-choice-btn game-action-choice-btn--fire"
                    onClick={() => {
                      const cardToTarget = selectedCard;
                      onClose();
                      onSetTargetingAction({ card: cardToTarget, type: "deal_breaker" });
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        gavel
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>👑 Deal Breaker (Steal Complete Set)</span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                          Steal an entire completed property set from an opponent!
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </motion.button>
                )}

                {/* Action: Sly Deal */}
                {selectedCard.defId === "action-sly-deal" && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="game-action-choice-btn game-action-choice-btn--primary"
                    onClick={() => {
                      const cardToTarget = selectedCard;
                      onClose();
                      onSetTargetingAction({ card: cardToTarget, type: "sly_deal" });
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        visibility
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>🕵️ Sly Deal (Steal 1 Property)</span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                          Steal 1 property card from any incomplete set
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </motion.button>
                )}

                {/* Action: Debt Collector */}
                {selectedCard.defId === "action-debt-collector" && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="game-action-choice-btn game-action-choice-btn--primary"
                    onClick={() => {
                      const cardToTarget = selectedCard;
                      onClose();
                      onSetTargetingAction({ card: cardToTarget, type: "debt_collector" });
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        payments
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>💵 Debt Collector (Charge $5M)</span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                          Target 1 player to pay you $5M in cash or property
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </motion.button>
                )}

                {/* Action: Birthday */}
                {selectedCard.defId === "action-its-my-birthday" && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="game-action-choice-btn game-action-choice-btn--primary"
                    onClick={() => onPlayAction(selectedCard)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        cake
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>🎂 It's My Birthday (Collect $2M from All)</span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                          Every other player pays you $2M gift!
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </motion.button>
                )}

                {/* Action: Forced Deal */}
                {(selectedCard.defId === "action-forced-deal" || selectedCard.defId === "action-force-deal") && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="game-action-choice-btn game-action-choice-btn--primary"
                    onClick={() => {
                      const cardToTarget = selectedCard;
                      onClose();
                      onSetTargetingAction({ card: cardToTarget, type: "forced_deal" });
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        swap_horiz
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>🔄 Forced Deal (Swap Properties)</span>
                        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                          Force-swap 1 of your properties with an opponent's property
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </motion.button>
                )}

                {/* Action: House */}
                {selectedCard.defId === "action-house" &&
                  (() => {
                    const eligibleSets =
                      you?.propertySets.filter(
                        (s) => s.isComplete && !s.hasHouse && s.color !== "railroad" && s.color !== "utility",
                      ) || [];

                    if (eligibleSets.length > 0) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                            SELECT COMPLETE SET TO ADD HOUSE:
                          </span>
                          {eligibleSets.map((set) => (
                            <motion.button
                              key={set.setId}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              className="button button--primary button--full"
                              style={{
                                backgroundColor: COLOR_CONFIG[set.color]?.hex || "var(--primary)",
                                color: COLOR_CONFIG[set.color]?.textHex || "#FFFFFF",
                                padding: "12px 14px",
                                fontWeight: 800,
                                fontSize: "0.86rem",
                              }}
                              onClick={() => onPlayAction(selectedCard, undefined, set.setId)}
                            >
                              🏠 Add House to {set.color.toUpperCase()} (+ $3M Rent)
                            </motion.button>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          color: "#fcd34d",
                          lineHeight: 1.35,
                        }}
                      >
                        ⚠️ You need a complete color set (excluding Railroads & Utilities) to place a House. You can
                        deposit it into your bank for $3M cash.
                      </div>
                    );
                  })()}

                {/* Action: Hotel */}
                {selectedCard.defId === "action-hotel" &&
                  (() => {
                    const eligibleSets =
                      you?.propertySets.filter((s) => s.isComplete && s.hasHouse && !s.hasHotel) || [];

                    if (eligibleSets.length > 0) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.04em" }}>
                            SELECT SET WITH HOUSE TO ADD HOTEL:
                          </span>
                          {eligibleSets.map((set) => (
                            <motion.button
                              key={set.setId}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              className="button button--primary button--full"
                              style={{
                                backgroundColor: COLOR_CONFIG[set.color]?.hex || "var(--primary)",
                                color: COLOR_CONFIG[set.color]?.textHex || "#FFFFFF",
                                padding: "12px 14px",
                                fontWeight: 800,
                                fontSize: "0.86rem",
                              }}
                              onClick={() => onPlayAction(selectedCard, undefined, set.setId)}
                            >
                              🏨 Add Hotel to {set.color.toUpperCase()} (+ $4M Rent)
                            </motion.button>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          color: "#fcd34d",
                          lineHeight: 1.35,
                        }}
                      >
                        ⚠️ You need a complete property set with an existing House 🏠 to place a Hotel. You can
                        deposit it into your bank for $4M cash.
                      </div>
                    );
                  })()}

                {/* Action: Double The Rent */}
                {selectedCard.defId === "action-double-the-rent" &&
                  (() => {
                    const rentCardsInHand = you?.hand?.filter((c) => c.type === "rent") || [];
                    const canDouble = gameState.turn.actionsRemaining >= 2;

                    if (rentCardsInHand.length === 0) {
                      return (
                        <div
                          style={{
                            padding: "10px 14px",
                            background: "rgba(168, 200, 255, 0.1)",
                            border: "1px solid rgba(168, 200, 255, 0.3)",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            color: "var(--primary)",
                            lineHeight: 1.35,
                          }}
                        >
                          ℹ️ Double The Rent must be played together with a Rent card. You currently have no Rent cards
                          in hand. You can bank it for $1M.
                        </div>
                      );
                    }

                    if (!canDouble) {
                      return (
                        <div
                          style={{
                            padding: "10px 14px",
                            background: "rgba(245, 158, 11, 0.15)",
                            border: "1px solid rgba(245, 158, 11, 0.4)",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            color: "#fcd34d",
                            lineHeight: 1.35,
                          }}
                        >
                          ⚠️ Playing Double The Rent requires 2 actions. You only have {gameState.turn.actionsRemaining}{" "}
                          action left this turn.
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>
                          🔥 CHOOSE A RENT CARD TO DOUBLE (2 ACTIONS):
                        </span>
                        {rentCardsInHand.map((rCard) => {
                          if (rCard.primaryColor === "all") {
                            return (
                              <motion.button
                                key={rCard.instanceId}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="button button--primary button--full"
                                style={{
                                  background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                                  color: "#FFFFFF",
                                  padding: "12px 14px",
                                  fontSize: "0.86rem",
                                  fontWeight: 800,
                                }}
                                onClick={() => {
                                  const doubleCardId = selectedCard.instanceId;
                                  onClose();
                                  setSelectedWildRentColor(null);
                                  onSetTargetingAction({
                                    card: rCard,
                                    type: "wild_rent",
                                    doubleRentCardId: doubleCardId,
                                  });
                                }}
                              >
                                🔥 2x Wild Rent (Target 1 Opponent)
                              </motion.button>
                            );
                          }

                          return (
                            <div
                              key={rCard.instanceId}
                              style={{
                                display: "grid",
                                gridTemplateColumns: rCard.secondaryColor ? "1fr 1fr" : "1fr",
                                gap: "8px",
                              }}
                            >
                              {rCard.primaryColor && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="button button--primary"
                                  style={{
                                    background: COLOR_CONFIG[rCard.primaryColor as CardColor]?.hex || "var(--primary)",
                                    color: "#FFFFFF",
                                    padding: "12px 8px",
                                    fontSize: "0.82rem",
                                    fontWeight: 800,
                                  }}
                                  onClick={() =>
                                    onPlayRent(
                                      rCard,
                                      rCard.primaryColor as CardColor,
                                      undefined,
                                      selectedCard.instanceId,
                                    )
                                  }
                                >
                                  🔥 2x {rCard.primaryColor.toUpperCase()}
                                </motion.button>
                              )}
                              {rCard.secondaryColor && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="button button--primary"
                                  style={{
                                    background:
                                      COLOR_CONFIG[rCard.secondaryColor as CardColor]?.hex || "var(--primary)",
                                    color: "#FFFFFF",
                                    padding: "12px 8px",
                                    fontSize: "0.82rem",
                                    fontWeight: 800,
                                  }}
                                  onClick={() =>
                                    onPlayRent(
                                      rCard,
                                      rCard.secondaryColor as CardColor,
                                      undefined,
                                      selectedCard.instanceId,
                                    )
                                  }
                                >
                                  🔥 2x {rCard.secondaryColor.toUpperCase()}
                                </motion.button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                {/* Rent Card */}
                {selectedCard.type === "rent" &&
                  (() => {
                    const doubleRentInHand = you?.hand?.find((c) => c.defId === "action-double-the-rent");
                    const canDouble = !!doubleRentInHand && gameState.turn.actionsRemaining >= 2;

                    return (
                      <>
                        {selectedCard.primaryColor !== "all" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: selectedCard.secondaryColor ? "1fr 1fr" : "1fr",
                                gap: "8px",
                              }}
                            >
                              {selectedCard.primaryColor && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="button button--primary"
                                  style={{
                                    background:
                                      COLOR_CONFIG[selectedCard.primaryColor as CardColor]?.hex || "var(--primary)",
                                    color: "#FFFFFF",
                                    padding: "12px 8px",
                                    fontSize: "0.84rem",
                                    fontWeight: 800,
                                  }}
                                  onClick={() => onPlayRent(selectedCard, selectedCard.primaryColor as CardColor)}
                                >
                                  💸 Rent: {selectedCard.primaryColor.toUpperCase()}
                                </motion.button>
                              )}
                              {selectedCard.secondaryColor && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="button button--primary"
                                  style={{
                                    background:
                                      COLOR_CONFIG[selectedCard.secondaryColor as CardColor]?.hex || "var(--primary)",
                                    color: "#FFFFFF",
                                    padding: "12px 8px",
                                    fontSize: "0.84rem",
                                    fontWeight: 800,
                                  }}
                                  onClick={() => onPlayRent(selectedCard, selectedCard.secondaryColor as CardColor)}
                                >
                                  💸 Rent: {selectedCard.secondaryColor.toUpperCase()}
                                </motion.button>
                              )}
                            </div>

                            {canDouble && doubleRentInHand && (
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: selectedCard.secondaryColor ? "1fr 1fr" : "1fr",
                                  gap: "8px",
                                }}
                              >
                                {selectedCard.primaryColor && (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="button button--primary"
                                    style={{
                                      background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                                      color: "#FFFFFF",
                                      padding: "12px 8px",
                                      fontSize: "0.82rem",
                                      fontWeight: 800,
                                    }}
                                    onClick={() =>
                                      onPlayRent(
                                        selectedCard,
                                        selectedCard.primaryColor as CardColor,
                                        undefined,
                                        doubleRentInHand.instanceId,
                                      )
                                    }
                                  >
                                    🔥 2x {selectedCard.primaryColor.toUpperCase()} (2 Actions)
                                  </motion.button>
                                )}
                                {selectedCard.secondaryColor && (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="button button--primary"
                                    style={{
                                      background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                                      color: "#FFFFFF",
                                      padding: "12px 8px",
                                      fontSize: "0.82rem",
                                      fontWeight: 800,
                                    }}
                                    onClick={() =>
                                      onPlayRent(
                                        selectedCard,
                                        selectedCard.secondaryColor as CardColor,
                                        undefined,
                                        doubleRentInHand.instanceId,
                                      )
                                    }
                                  >
                                    🔥 2x {selectedCard.secondaryColor.toUpperCase()} (2 Actions)
                                  </motion.button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              className="button button--primary button--full"
                              style={{ padding: "12px", fontSize: "0.9rem" }}
                              onClick={() => {
                                const cardToTarget = selectedCard;
                                setSelectedWildRentColor(null);
                                onClose();
                                onSetTargetingAction({ card: cardToTarget, type: "wild_rent" });
                              }}
                            >
                              🎯 Charge Wild Rent (1 Opponent)
                            </motion.button>
                            {canDouble && doubleRentInHand && (
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="button button--primary button--full"
                                style={{
                                  background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                                  color: "#FFFFFF",
                                  padding: "12px",
                                  fontSize: "0.9rem",
                                  fontWeight: 800,
                                }}
                                onClick={() => {
                                  const cardToTarget = selectedCard;
                                  const doubleCardId = doubleRentInHand.instanceId;
                                  setSelectedWildRentColor(null);
                                  onClose();
                                  onSetTargetingAction({
                                    card: cardToTarget,
                                    type: "wild_rent",
                                    doubleRentCardId: doubleCardId,
                                  });
                                }}
                              >
                                🔥 2x Wild Rent (1 Opponent) (2 Actions)
                              </motion.button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==========================================
// 2. TARGETING MODAL
// ==========================================
interface OpponentTargetData {
  id: string;
  name: string;
  isBot?: boolean;
  bankTotal: number;
  propertySets: PropertySet[];
}

interface TargetingModalProps {
  targetingAction: TargetingActionState | null;
  you: {
    id: string;
    hand?: CardInstance[];
    propertySets: PropertySet[];
  } | null;
  opponents: OpponentTargetData[];
  gameState: MaskedGameState;
  selectedWildRentColor: CardColor | null;
  setSelectedWildRentColor: (color: CardColor | null) => void;
  selectedForcedDealOfferedId: string | null;
  setSelectedForcedDealOfferedId: (id: string | null) => void;
  setTargetingAction: (action: TargetingActionState | null) => void;
  onPlayAction: (
    card: CardInstance,
    targetPlayerId?: string,
    targetSetId?: string,
    targetCardInstanceId?: string,
    offeredCardInstanceId?: string,
  ) => void;
  onPlayRent: (
    rentCard: CardInstance,
    chosenColor: CardColor,
    targetPlayerId?: string,
    doubleRentCardInstanceId?: string,
  ) => void;
}

export function TargetingModal({
  targetingAction,
  you,
  opponents,
  gameState,
  selectedWildRentColor,
  setSelectedWildRentColor,
  selectedForcedDealOfferedId,
  setSelectedForcedDealOfferedId,
  setTargetingAction,
  onPlayAction,
  onPlayRent,
}: TargetingModalProps) {
  if (!targetingAction) {
    return null;
  }

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true">
      <div
        className="dialog-scrim"
        onClick={() => {
          setTargetingAction(null);
          setSelectedWildRentColor(null);
        }}
      />
      <div className="dialog-panel dialog-panel--wide">
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div>
            <h2 style={{ fontSize: "1.15rem", margin: 0, color: "var(--primary)" }}>
              {targetingAction.type === "deal_breaker"
                ? "Deal Breaker: Steal a Full Property Set"
                : targetingAction.type === "sly_deal"
                ? "Sly Deal: Steal 1 Property Card"
                : targetingAction.type === "forced_deal"
                ? "Forced Deal: Swap Properties with Opponent"
                : targetingAction.type === "debt_collector"
                ? "Debt Collector: Demand $5M from Opponent"
                : "Wild Rent: Charge 1 Opponent Rent"}
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>
              Target an opponent below to execute this action
            </div>
          </div>
          <button
            type="button"
            className="dialog-close-btn"
            onClick={() => {
              setTargetingAction(null);
              setSelectedWildRentColor(null);
            }}
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              close
            </span>
          </button>
        </div>

        <div className="dialog-body">
          {/* Wild Rent Dedicated Flow */}
          {targetingAction.type === "wild_rent" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <p style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--primary)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                  1. SELECT YOUR PROPERTY COLOR:
                </p>
                {!you?.propertySets || you.propertySets.length === 0 ? (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid #ef4444",
                      borderRadius: "8px",
                      color: "#fca5a5",
                      fontSize: "0.8rem",
                    }}
                  >
                    ⚠️ You do not own any property sets on the table. You need at least 1 property card to collect rent.
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {you.propertySets.map((set) => {
                      const rentAmount = calculateSetRent(set);
                      const effectiveColor = selectedWildRentColor || you.propertySets[0]?.color;
                      const isSelected = effectiveColor === set.color;
                      const colorHex = COLOR_CONFIG[set.color]?.hex || "#0055a4";

                      return (
                        <button
                          key={set.setId}
                          type="button"
                          onClick={() => setSelectedWildRentColor(set.color)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background: isSelected ? colorHex : "var(--surface)",
                            color: isSelected ? "#FFFFFF" : "var(--text)",
                            border: `2px solid ${isSelected ? "#FFFFFF" : colorHex}`,
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "2px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <b style={{ fontSize: "0.76rem", textTransform: "uppercase" }}>{set.color}</b>
                          <span style={{ fontSize: "0.68rem", opacity: 0.9 }}>
                            {set.cards.length}/{set.setSize} cards • <b>${rentAmount}M Rent</b>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {you && you.propertySets && you.propertySets.length > 0 && (() => {
                const doubleRentInHand = you?.hand?.find((c) => c.defId === "action-double-the-rent");
                const canDoubleWild = !!doubleRentInHand && gameState.turn.actionsRemaining >= 2;
                const isDoubled = !!targetingAction.doubleRentCardId;

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {canDoubleWild && doubleRentInHand && (
                      <div
                        style={{
                          padding: "8px 12px",
                          background: isDoubled ? "rgba(245, 158, 11, 0.18)" : "rgba(255, 255, 255, 0.05)",
                          border: isDoubled ? "1px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "0.76rem", color: isDoubled ? "#fcd34d" : "var(--text)", fontWeight: 700, display: "block" }}>
                            🔥 Double The Rent (✖️2)
                          </span>
                          <small style={{ fontSize: "0.66rem", color: "var(--muted)" }}>
                            Uses 2 actions (Wild Rent + Double Rent)
                          </small>
                        </div>
                        <button
                          type="button"
                          className={`button ${isDoubled ? "button--primary" : "button--secondary"}`}
                          style={{
                            padding: "4px 12px",
                            fontSize: "0.72rem",
                            background: isDoubled ? "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" : undefined,
                          }}
                          onClick={() => {
                            setTargetingAction({
                              ...targetingAction,
                              doubleRentCardId: isDoubled ? undefined : doubleRentInHand.instanceId,
                            });
                          }}
                        >
                          {isDoubled ? "✓ Activated" : "+ Add Double"}
                        </button>
                      </div>
                    )}

                    <div>
                      <p style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--primary)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                        2. SELECT OPPONENT TO CHARGE:
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {opponents.map((opp) => {
                          const chosenColor = selectedWildRentColor || you.propertySets[0]?.color || "dark-blue";
                          const currentSet = you.propertySets.find((s) => s.color === chosenColor) || you.propertySets[0]!;
                          const rentVal = calculateSetRent(currentSet, isDoubled);

                          return (
                            <div
                              key={opp.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 14px",
                                background: "var(--surface)",
                                borderRadius: "8px",
                                border: "1px solid var(--outline-variant)",
                              }}
                            >
                              <div>
                                <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                                <div style={{ fontSize: "0.7rem", color: "var(--outline)" }}>
                                  Bank: ${opp.bankTotal}M
                                </div>
                              </div>

                              <button
                                type="button"
                                className="button button--primary"
                                style={{
                                  padding: "6px 14px",
                                  fontSize: "0.76rem",
                                  background: isDoubled ? "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" : undefined,
                                  fontWeight: 800,
                                }}
                                onClick={() => onPlayRent(targetingAction.card, chosenColor, opp.id, targetingAction.doubleRentCardId)}
                              >
                                Charge ${rentVal}M Rent {isDoubled && "🔥"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : targetingAction.type === "forced_deal" ? (
            /* Forced Deal Flow */
            (() => {
              const yourIncompleteCards: Array<{ card: CardInstance; set: PropertySet }> = [];
              you?.propertySets
                .filter((s) => !s.isComplete)
                .forEach((s) => {
                  s.cards.forEach((c) => {
                    yourIncompleteCards.push({ card: c, set: s });
                  });
                  if (s.houseCard) yourIncompleteCards.push({ card: s.houseCard, set: s });
                  if (s.hotelCard) yourIncompleteCards.push({ card: s.hotelCard, set: s });
                });

              const effectiveOfferedCardId =
                selectedForcedDealOfferedId || yourIncompleteCards[0]?.card.instanceId || null;

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <p style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--primary)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                      1. SELECT YOUR PROPERTY CARD TO GIVE:
                    </p>

                    {yourIncompleteCards.length === 0 ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid #ef4444",
                          borderRadius: "8px",
                          color: "#fca5a5",
                          fontSize: "0.78rem",
                        }}
                      >
                        ⚠️ You do not have any property cards in incomplete sets to trade. You need at least 1 property card to play Forced Deal.
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {yourIncompleteCards.map(({ card, set }) => {
                          const isSelected = effectiveOfferedCardId === card.instanceId;
                          const colorHex = COLOR_CONFIG[set.color as CardColor]?.hex || "#0055a4";

                          return (
                            <button
                              key={card.instanceId}
                              type="button"
                              onClick={() => setSelectedForcedDealOfferedId(card.instanceId)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                background: isSelected ? colorHex : "var(--surface)",
                                color: isSelected ? "#FFFFFF" : "var(--text)",
                                border: `2px solid ${isSelected ? "#FFFFFF" : colorHex}`,
                                boxShadow: isSelected ? `0 0 10px ${colorHex}` : "none",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: "2px",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <b style={{ fontSize: "0.76rem" }}>{card.name}</b>
                              <span style={{ fontSize: "0.68rem", opacity: 0.9, textTransform: "uppercase" }}>
                                {set.color} • ${card.value}M
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {yourIncompleteCards.length > 0 && (
                    <div>
                      <p style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--primary)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                        2. SELECT OPPONENT & PROPERTY CARD TO STEAL:
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {opponents.map((opp) => {
                          const oppIncompleteCards: Array<{ card: CardInstance; set: PropertySet }> = [];
                          opp.propertySets
                            .filter((s) => !s.isComplete)
                            .forEach((s) => {
                              s.cards.forEach((c) => {
                                oppIncompleteCards.push({ card: c, set: s });
                              });
                              if (s.houseCard) oppIncompleteCards.push({ card: s.houseCard, set: s });
                              if (s.hotelCard) oppIncompleteCards.push({ card: s.hotelCard, set: s });
                            });

                          return (
                            <div
                              key={opp.id}
                              style={{
                                padding: "10px 12px",
                                background: "var(--surface)",
                                borderRadius: "10px",
                                border: "1px solid var(--outline-variant)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                                <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                                  {oppIncompleteCards.length} tradeable card(s)
                                </span>
                              </div>

                              {oppIncompleteCards.length === 0 ? (
                                <span style={{ fontSize: "0.72rem", color: "var(--outline)", fontStyle: "italic" }}>
                                  No incomplete property cards available to swap.
                                </span>
                              ) : (
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                  {oppIncompleteCards.map(({ card, set }) => {
                                    const colorHex = COLOR_CONFIG[set.color as CardColor]?.hex || "#0055a4";

                                    return (
                                      <button
                                        key={card.instanceId}
                                        type="button"
                                        className="button button--primary"
                                        style={{
                                          backgroundColor: colorHex,
                                          color: COLOR_CONFIG[set.color as CardColor]?.textHex || "#FFFFFF",
                                          padding: "6px 10px",
                                          fontSize: "0.75rem",
                                          fontWeight: 700,
                                          borderRadius: "7px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                        }}
                                        disabled={!effectiveOfferedCardId}
                                        onClick={() => {
                                          if (effectiveOfferedCardId) {
                                            onPlayAction(
                                              targetingAction.card,
                                              opp.id,
                                              undefined,
                                              card.instanceId,
                                              effectiveOfferedCardId,
                                            );
                                          }
                                        }}
                                      >
                                        <span>Swap for {card.name}</span>
                                        <span style={{ fontSize: "0.68rem", opacity: 0.9 }}>(${card.value}M)</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : targetingAction.type === "sly_deal" ? (
            /* Sly Deal Flow */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {opponents.map((opp) => {
                const oppIncompleteCards: Array<{ card: CardInstance; set: PropertySet }> = [];
                opp.propertySets
                  .filter((s) => !s.isComplete)
                  .forEach((s) => {
                    s.cards.forEach((c) => {
                      oppIncompleteCards.push({ card: c, set: s });
                    });
                    if (s.houseCard) oppIncompleteCards.push({ card: s.houseCard, set: s });
                    if (s.hotelCard) oppIncompleteCards.push({ card: s.hotelCard, set: s });
                  });

                return (
                  <div key={opp.id} style={{ padding: "12px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--outline-variant)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                        {oppIncompleteCards.length} stealable card(s)
                      </span>
                    </div>

                    {oppIncompleteCards.length === 0 ? (
                      <span style={{ fontSize: "0.72rem", color: "var(--outline)", fontStyle: "italic" }}>
                        No single property cards available to steal (opponent has no incomplete sets).
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {oppIncompleteCards.map(({ card, set }) => {
                          const colorHex = COLOR_CONFIG[set.color as CardColor]?.hex || "#0055a4";

                          return (
                            <button
                              key={card.instanceId}
                              type="button"
                              className="button button--primary"
                              style={{
                                backgroundColor: colorHex,
                                color: COLOR_CONFIG[set.color as CardColor]?.textHex || "#FFFFFF",
                                padding: "6px 12px",
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                borderRadius: "8px",
                              }}
                              onClick={() => onPlayAction(targetingAction.card, opp.id, undefined, card.instanceId)}
                            >
                              Steal {card.name} ({set.color.toUpperCase()})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : targetingAction.type === "deal_breaker" ? (
            /* Deal Breaker Flow */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {opponents.map((opp) => {
                const oppCompleteSets = opp.propertySets.filter((s) => s.isComplete);

                return (
                  <div key={opp.id} style={{ padding: "12px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--outline-variant)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                        {oppCompleteSets.length} complete set(s)
                      </span>
                    </div>

                    {oppCompleteSets.length === 0 ? (
                      <span style={{ fontSize: "0.72rem", color: "var(--outline)", fontStyle: "italic" }}>
                        No complete property sets to steal.
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {oppCompleteSets.map((s) => {
                          const colorHex = COLOR_CONFIG[s.color as CardColor]?.hex || "#0055a4";

                          return (
                            <button
                              key={s.setId}
                              type="button"
                              className="button button--primary"
                              style={{
                                backgroundColor: colorHex,
                                color: COLOR_CONFIG[s.color as CardColor]?.textHex || "#FFFFFF",
                                padding: "8px 14px",
                                fontSize: "0.78rem",
                                fontWeight: 800,
                                borderRadius: "8px",
                                boxShadow: "0 0 10px rgba(16, 185, 129, 0.4)",
                              }}
                              onClick={() => onPlayAction(targetingAction.card, opp.id, s.setId)}
                            >
                              👑 Steal FULL {s.color.toUpperCase()} SET ({s.cards.length} cards)
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Debt Collector Flow */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {opponents.map((opp) => (
                <div key={opp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--outline-variant)" }}>
                  <div>
                    <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                    <div style={{ fontSize: "0.72rem", color: "var(--outline)" }}>
                      Bank: ${opp.bankTotal}M • Assets: ${opp.propertySets.reduce((sum, s) => sum + s.cards.reduce((cSum, c) => cSum + c.value, 0), 0)}M
                    </div>
                  </div>
                  <button
                    type="button"
                    className="button button--primary"
                    style={{ padding: "6px 14px", fontSize: "0.76rem" }}
                    onClick={() => onPlayAction(targetingAction.card, opp.id)}
                  >
                    Charge $5M
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button
            type="button"
            className="button button--secondary button--full"
            onClick={() => {
              setTargetingAction(null);
              setSelectedWildRentColor(null);
            }}
          >
            Cancel Action
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. REORGANIZE WILDCARD MODAL
// ==========================================
interface ReorganizeWildModalProps {
  reorganizeTarget: {
    card: CardInstance;
    fromSet: PropertySet;
  } | null;
  you: {
    propertySets: PropertySet[];
  } | null;
  onClose: () => void;
  onReorganize: (cardInstanceId: string, fromSetId: string, newColor: CardColor) => void;
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
    <div
      className="join-dialog-overlay"
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 250 }}
      onClick={onClose}
    >
      <div className="dialog-scrim" />
      <div className="dialog-panel" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
        <div className="texture-overlay" />
        <div className="sheet-handle" />

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
                const isCurrent = color === (card.currentColor || reorganizeTarget.fromSet.color);
                const colorHex = COLOR_CONFIG[color]?.hex || "#0055a4";
                const existingSet = you?.propertySets.find((s) => s.color === color && !s.isComplete);

                return (
                  <button
                    key={color}
                    type="button"
                    disabled={hasBuildingBlock || isCurrent}
                    onClick={() => {
                      onReorganize(card.instanceId, reorganizeTarget.fromSet.setId, color);
                      onClose();
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: isCurrent ? "rgba(255,255,255,0.06)" : "var(--surface)",
                      border: `2px solid ${isCurrent ? colorHex : "var(--outline-variant)"}`,
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
                      {isCurrent && (
                        <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--muted)" }}>
                          Current
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--muted)", textAlign: "left" }}>
                      {existingSet
                        ? `Join existing (${existingSet.cards.length}/${existingSet.setSize})`
                        : `Start new set (0/${COLOR_CONFIG[color]?.setSize || 3})`}
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
      </div>
    </div>
  );
}

// ==========================================
// 4. MOVE BUILDING MODAL (HOUSE / HOTEL)
// ==========================================
interface MoveBuildingModalProps {
  moveBuildingTarget: {
    buildingType: "house" | "hotel";
    fromSet: PropertySet;
  } | null;
  you: {
    propertySets: PropertySet[];
  } | null;
  onClose: () => void;
  onMoveBuilding: (buildingType: "house" | "hotel", fromSetId: string, toSetId: string) => void;
}

export function MoveBuildingModal({
  moveBuildingTarget,
  you,
  onClose,
  onMoveBuilding,
}: MoveBuildingModalProps) {
  if (!moveBuildingTarget) {
    return null;
  }

  const eligibleSets = (you?.propertySets || []).filter((s) => {
    if (s.setId === moveBuildingTarget.fromSet.setId) return false;
    if (!s.isComplete) return false;
    if (s.color === "railroad" || s.color === "utility") return false;
    if (moveBuildingTarget.buildingType === "house") {
      return !s.hasHouse;
    } else {
      return s.hasHouse && !s.hasHotel;
    }
  });

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 210 }}>
      <div className="dialog-scrim" onClick={onClose} />
      <div className="dialog-panel" style={{ maxWidth: "500px" }}>
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#38bdf8", fontSize: "24px" }}>
              {moveBuildingTarget.buildingType === "house" ? "home" : "apartment"}
            </span>
            <div>
              <h2 style={{ color: "#f8fafc", fontSize: "1.15rem", margin: 0, fontWeight: 800 }}>
                Move {moveBuildingTarget.buildingType === "house" ? "House" : "Hotel"} (Free Action)
              </h2>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                Moving from {moveBuildingTarget.fromSet.color.toUpperCase()} complete set
              </span>
            </div>
          </div>
        </div>

        <div className="dialog-body" style={{ padding: "16px 20px" }}>
          <p style={{ margin: "0 0 14px", color: "var(--on-surface-variant)", fontSize: "0.88rem", lineHeight: 1.4 }}>
            Select another completed property set to move your {moveBuildingTarget.buildingType} to:
          </p>

          {eligibleSets.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.04)",
                borderRadius: "10px",
                border: "1px dashed rgba(255, 255, 255, 0.15)",
              }}
            >
              <p style={{ color: "var(--outline)", fontSize: "0.85rem", margin: 0 }}>
                {moveBuildingTarget.buildingType === "house"
                  ? "No other complete sets without a House available."
                  : "No other complete sets with a House (and without a Hotel) available."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
              {eligibleSets.map((destSet) => {
                const colorHex = COLOR_CONFIG[destSet.color]?.hex || "#38bdf8";
                return (
                  <button
                    key={destSet.setId}
                    type="button"
                    onClick={() => {
                      onMoveBuilding(moveBuildingTarget.buildingType, moveBuildingTarget.fromSet.setId, destSet.setId);
                      onClose();
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "var(--surface)",
                      border: `2px solid ${colorHex}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          backgroundColor: colorHex,
                          display: "inline-block",
                        }}
                      />
                      <div style={{ textAlign: "left" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            textTransform: "uppercase",
                            color: "#FFFFFF",
                            display: "block",
                          }}
                        >
                          {destSet.color} Set
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                          {destSet.cards.length}/{destSet.setSize} cards • {destSet.hasHouse ? "Has House" : "No House"}
                        </span>
                      </div>
                    </div>
                    <span className="button button--primary" style={{ padding: "6px 14px", fontSize: "0.8rem", pointerEvents: "none" }}>
                      Move Here ➔
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="dialog-footer" style={{ padding: "12px 20px" }}>
          <button
            type="button"
            className="button button--secondary button--full"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
