"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CardInstance, MaskedGameState, PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { Card } from "../../../_components/card";
import { resolveCardDef, type TargetingActionState } from "../types";
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
            <div className="sheet-handle" />
            <div className="game-card-action-header">
              <div className="u-flex-center-10" style={{ minWidth: 0 }}>
                <span className="game-card-type-tag">
                  {selectedCard.type === "property" && "🏠 PROPERTY"}
                  {selectedCard.type === "property-wild" && "🌈 WILD PROPERTY"}
                  {selectedCard.type === "money" && "💰 CASH"}
                  {selectedCard.type === "action" && "⚡ ACTION CARD"}
                  {selectedCard.type === "rent" && "💸 RENT"}
                </span>
                <b
                  className="u-nowrap"
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
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
                <Card card={resolveCardDef(selectedCard)} size="md" isInteractive={false} currentColor={selectedCard.currentColor} />
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
                    <div className="u-flex-center-10">
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        domain
                      </span>
                      <div className="u-flex-col">
                        <span>Play to Property Set</span>
                        <span className="u-text-sm" style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
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
                    const primary = selectedCard.primaryColor!;
                    const secondary = selectedCard.secondaryColor!;
                    const primarySet = you?.propertySets.find(
                      (s) => s.color === primary && !s.isComplete,
                    );
                    const secondarySet = you?.propertySets.find(
                      (s) => s.color === secondary && !s.isComplete,
                    );

                    return (
                      <div className="u-flex-col-8">
                        <span className="u-fw-700" style={{ fontSize: "0.75rem", color: "var(--muted)", letterSpacing: "0.04em" }}>
                          SELECT COLOR TO PLAY WILD CARD:
                        </span>
                        <div className="u-grid-2 u-gap-8">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="button button--primary u-flex-col-center"
                            style={{
                              background: COLOR_CONFIG[primary]?.hex || "var(--primary)",
                              color: COLOR_CONFIG[primary]?.textHex || "#FFFFFF",
                              padding: "12px 10px",
                              borderRadius: "10px",
                              justifyContent: "center",
                              gap: "3px",
                              minHeight: "56px",
                            }}
                            onClick={() => onPlayProperty(selectedCard, primary, primarySet?.setId)}
                          >
                            <span className="u-text-5sm u-fw-800" style={{ textTransform: "uppercase" }}>
                              🏠 {primary.replace("-", " ")}
                            </span>
                            <span className="u-text-xs" style={{ opacity: 0.9, fontWeight: 600 }}>
                              {primarySet ? `Add to set (${primarySet.cards.length}/${primarySet.setSize})` : "Start New Set"}
                            </span>
                          </motion.button>

                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="button button--primary u-flex-col-center"
                            style={{
                              background: COLOR_CONFIG[secondary]?.hex || "var(--primary)",
                              color: COLOR_CONFIG[secondary]?.textHex || "#FFFFFF",
                              padding: "12px 10px",
                              borderRadius: "10px",
                              justifyContent: "center",
                              gap: "3px",
                              minHeight: "56px",
                            }}
                            onClick={() => onPlayProperty(selectedCard, secondary, secondarySet?.setId)}
                          >
                            <span className="u-text-5sm u-fw-800" style={{ textTransform: "uppercase" }}>
                              🏠 {secondary.replace("-", " ")}
                            </span>
                            <span className="u-text-xs" style={{ opacity: 0.9, fontWeight: 600 }}>
                              {secondarySet ? `Add to set (${secondarySet.cards.length}/${secondarySet.setSize})` : "Start New Set"}
                            </span>
                          </motion.button>
                        </div>
                      </div>
                    );
                  })()}

                {/* Wild Property Multicolor (10-Color) */}
                {selectedCard.type === "property-wild" &&
                  selectedCard.primaryColor === "all" &&
                  (() => {
                    const allColors: CardColor[] = [
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
                    ];

                    return (
                      <div className="u-flex-col-8">
                        <span className="u-fw-700" style={{ fontSize: "0.75rem", color: "var(--muted)", letterSpacing: "0.04em" }}>
                          SELECT COLOR FOR MULTICOLOR WILD:
                        </span>
                        <div
                          className="u-grid-2 u-gap-8"
                          style={{
                            maxHeight: "220px",
                            overflowY: "auto",
                            paddingRight: "4px",
                          }}
                        >
                          {allColors.map((color) => {
                            const existingSet = you?.propertySets.find(
                              (s) => s.color === color && !s.isComplete,
                            );
                            const cfg = COLOR_CONFIG[color];

                            return (
                              <motion.button
                                key={color}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="button u-flex-col-center u-text-3sm u-fw-800"
                                style={{
                                  backgroundColor: cfg?.hex || "var(--surface-high)",
                                  color: cfg?.textHex || "#FFFFFF",
                                  padding: "9px 8px",
                                  borderRadius: "8px",
                                  justifyContent: "center",
                                  gap: "2px",
                                }}
                                onClick={() => onPlayProperty(selectedCard, color, existingSet?.setId)}
                              >
                                <span style={{ textTransform: "uppercase" }}>
                                  {color.replace("-", " ")}
                                </span>
                                <span style={{ fontSize: "0.66rem", opacity: 0.9, fontWeight: 600 }}>
                                  {existingSet ? `Add (${existingSet.cards.length}/${existingSet.setSize})` : "Start New Set"}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
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
                    <div className="u-flex-center-10">
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        savings
                      </span>
                      <div className="u-flex-col">
                        <span>Deposit ${selectedCard.value}M into Bank</span>
                        <span className="u-text-sm" style={{ color: "rgba(134, 239, 172, 0.8)", fontWeight: 500 }}>
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
                    <div className="u-flex-center-10">
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        fast_forward
                      </span>
                      <div className="u-flex-col">
                        <span>Play Pass Go (+2 Cards)</span>
                        <span className="u-text-sm" style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
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
                    <div className="u-flex-center-10">
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        gavel
                      </span>
                      <div className="u-flex-col">
                        <span>👑 Deal Breaker (Steal Complete Set)</span>
                        <span className="u-text-sm" style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
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
                    <div className="u-flex-center-10">
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        visibility
                      </span>
                      <div className="u-flex-col">
                        <span>🕵️ Sly Deal (Steal 1 Property)</span>
                        <span className="u-text-sm" style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
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
                    <div className="u-flex-center-10">
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        payments
                      </span>
                      <div className="u-flex-col">
                        <span>💵 Debt Collector (Charge $5M)</span>
                        <span className="u-text-sm" style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
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
                    <div className="u-flex-center-10">
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        cake
                      </span>
                      <div className="u-flex-col">
                        <span>🎂 It's My Birthday (Collect $2M from All)</span>
                        <span className="u-text-sm" style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
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
                    <div className="u-flex-center-10">
                      <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                        swap_horiz
                      </span>
                      <div className="u-flex-col">
                        <span>🔄 Forced Deal (Swap Properties)</span>
                        <span className="u-text-sm" style={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
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
                        <div className="u-flex-col-8">
                          <span className="u-fw-700" style={{ fontSize: "0.75rem", color: "var(--muted)", letterSpacing: "0.04em" }}>
                            SELECT COMPLETE SET TO ADD HOUSE:
                          </span>
                          {eligibleSets.map((set) => (
                            <motion.button
                              key={set.setId}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              className="button button--primary button--full u-fw-800"
                              style={{
                                backgroundColor: COLOR_CONFIG[set.color]?.hex || "var(--primary)",
                                color: COLOR_CONFIG[set.color]?.textHex || "#FFFFFF",
                                padding: "12px 14px",
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
                        className="u-text-3sm"
                        style={{
                          padding: "10px 14px",
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          borderRadius: "10px",
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
                        <div className="u-flex-col-8">
                          <span className="u-fw-700" style={{ fontSize: "0.75rem", color: "var(--muted)", letterSpacing: "0.04em" }}>
                            SELECT SET WITH HOUSE TO ADD HOTEL:
                          </span>
                          {eligibleSets.map((set) => (
                            <motion.button
                              key={set.setId}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              className="button button--primary button--full u-fw-800"
                              style={{
                                backgroundColor: COLOR_CONFIG[set.color]?.hex || "var(--primary)",
                                color: COLOR_CONFIG[set.color]?.textHex || "#FFFFFF",
                                padding: "12px 14px",
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
                        className="u-text-3sm"
                        style={{
                          padding: "10px 14px",
                          background: "rgba(245, 158, 11, 0.15)",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          borderRadius: "10px",
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
                          className="u-text-3sm u-color-primary"
                          style={{
                            padding: "10px 14px",
                            background: "rgba(168, 200, 255, 0.1)",
                            border: "1px solid rgba(168, 200, 255, 0.3)",
                            borderRadius: "10px",
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
                          className="u-text-3sm"
                          style={{
                            padding: "10px 14px",
                            background: "rgba(245, 158, 11, 0.15)",
                            border: "1px solid rgba(245, 158, 11, 0.4)",
                            borderRadius: "10px",
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
                      <div className="u-flex-col-8">
                        <span className="u-fw-700 u-color-primary" style={{ fontSize: "0.75rem" }}>
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
                                className="button button--primary button--full u-color-white u-fw-800"
                                style={{
                                  background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                                  padding: "12px 14px",
                                  fontSize: "0.86rem",
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
                                gridTemplateColumns: rCard.secondaryColor ? "repeat(2, minmax(0, 1fr))" : "1fr",
                                gap: "8px",
                              }}
                            >
                              {rCard.primaryColor && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="button button--primary u-color-white u-fw-800 u-text-4sm u-text-center"
                                  style={{
                                    background: COLOR_CONFIG[rCard.primaryColor as CardColor]?.hex || "var(--primary)",
                                    padding: "10px 8px",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: 1.25,
                                    minWidth: 0,
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
                                  className="button button--primary u-color-white u-fw-800 u-text-4sm u-text-center"
                                  style={{
                                    background:
                                      COLOR_CONFIG[rCard.secondaryColor as CardColor]?.hex || "var(--primary)",
                                    padding: "10px 8px",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: 1.25,
                                    minWidth: 0,
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
                          <div className="u-flex-col-8">
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: selectedCard.secondaryColor ? "repeat(2, minmax(0, 1fr))" : "1fr",
                                gap: "8px",
                              }}
                            >
                              {selectedCard.primaryColor && (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  className="button button--primary u-color-white u-fw-800 u-text-center"
                                  style={{
                                    background:
                                      COLOR_CONFIG[selectedCard.primaryColor as CardColor]?.hex || "var(--primary)",
                                    padding: "10px 8px",
                                    fontSize: "0.84rem",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: 1.25,
                                    minWidth: 0,
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
                                  className="button button--primary u-color-white u-fw-800 u-text-center"
                                  style={{
                                    background:
                                      COLOR_CONFIG[selectedCard.secondaryColor as CardColor]?.hex || "var(--primary)",
                                    padding: "10px 8px",
                                    fontSize: "0.84rem",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: 1.25,
                                    minWidth: 0,
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
                                  gridTemplateColumns: selectedCard.secondaryColor ? "repeat(2, minmax(0, 1fr))" : "1fr",
                                  gap: "8px",
                                }}
                              >
                                {selectedCard.primaryColor && (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="button button--primary u-color-white u-flex-col-center u-fw-800 u-text-4sm u-text-center"
                                    style={{
                                      background:
                                        COLOR_CONFIG[selectedCard.primaryColor as CardColor]?.hex || "var(--primary)",
                                      padding: "10px 6px",
                                      whiteSpace: "normal",
                                      wordBreak: "break-word",
                                      lineHeight: 1.25,
                                      minWidth: 0,
                                      justifyContent: "center",
                                      gap: "2px",
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
                                    <span>🔥 2x {selectedCard.primaryColor.toUpperCase()}</span>
                                    <span className="u-fw-700" style={{ fontSize: "0.74rem", opacity: 0.92 }}>
                                      (2 Actions)
                                    </span>
                                  </motion.button>
                                )}
                                {selectedCard.secondaryColor && (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="button button--primary u-color-white u-flex-col-center u-fw-800 u-text-4sm u-text-center"
                                    style={{
                                      background:
                                        COLOR_CONFIG[selectedCard.secondaryColor as CardColor]?.hex || "var(--primary)",
                                      padding: "10px 6px",
                                      whiteSpace: "normal",
                                      wordBreak: "break-word",
                                      lineHeight: 1.25,
                                      minWidth: 0,
                                      justifyContent: "center",
                                      gap: "2px",
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
                                    <span>🔥 2x {selectedCard.secondaryColor.toUpperCase()}</span>
                                    <span className="u-fw-700" style={{ fontSize: "0.74rem", opacity: 0.92 }}>
                                      (2 Actions)
                                    </span>
                                  </motion.button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="u-flex-col-8">
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
                                className="button button--primary button--full u-color-white u-fw-800"
                                style={{
                                  background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                                  padding: "12px",
                                  fontSize: "0.9rem",
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
