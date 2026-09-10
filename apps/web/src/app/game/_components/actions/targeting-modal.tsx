"use client";

import type { CardInstance, MaskedGameState, PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { calculateSetRent } from "@dealopoly/game-engine";
import { Card } from "../../../_components/card";
import { resolveCardDef, type TargetingActionState } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";
interface OpponentTargetData {
  id: string;
  name: string;
  isBot?: boolean;
  bankTotal: number;
  bank: CardInstance[];
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
    <DialogShell
      isOpen={Boolean(targetingAction)}
      onClose={() => {
        setTargetingAction(null);
        setSelectedWildRentColor(null);
      }}
      size="wide"
    >
        <div className="dialog-header">
          <div>
            <h2 className="u-text-lg u-m0 u-color-primary">
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
            <span className="material-symbols-outlined u-text-20">
              close
            </span>
          </button>
        </div>

        <div className="dialog-body">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <Card card={resolveCardDef(targetingAction.card)} size="xs" isInteractive={false} />
          </div>
          {/* Wild Rent Dedicated Flow */}
          {targetingAction.type === "wild_rent" ? (
            <div className="u-flex-col-14">
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
                  <div className="u-flex u-gap-8" style={{ flexWrap: "wrap" }}>
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
                            background: isSelected
                              ? "rgba(255, 255, 255, 0.9)"
                              : "var(--surface)",
                            backdropFilter: isSelected ? "blur(12px)" : undefined,
                            WebkitBackdropFilter: isSelected ? "blur(12px)" : undefined,
                            color: isSelected ? "#1a1a1a" : "var(--text)",
                            border: `2px solid ${isSelected ? colorHex : colorHex}`,
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "2px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <b style={{ fontSize: "0.76rem", textTransform: "uppercase" }}>{set.color}</b>
                          <span className="u-text-xs" style={{ opacity: 0.9 }}>
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
                  <div className="u-flex-col u-gap-12">
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
                          className={`button ${isDoubled ? "button--primary" : "button--secondary"} u-text-sm`}
                          style={{
                            padding: "4px 12px",
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
                      <div className="u-flex-col u-gap-10">
                        {opponents.map((opp) => {
                          const chosenColor = selectedWildRentColor || you.propertySets[0]?.color || "dark-blue";
                          const currentSet = you.propertySets.find((s) => s.color === chosenColor) || you.propertySets[0]!;
                          const rentVal = calculateSetRent(currentSet, isDoubled);

                          const payableCards = [
                            ...(opp.bank || []).map((c) => ({
                              ...c,
                              source: "bank" as const,
                              color: undefined as CardColor | undefined,
                              isHouse: false,
                              isHotel: false,
                            })),
                            ...(opp.propertySets.flatMap((s) => {
                              const items = s.cards.map((c) => ({
                                ...c,
                                source: "property" as const,
                                color: s.color as CardColor,
                                isHouse: false,
                                isHotel: false,
                              }));
                              if (s.houseCard) {
                                items.push({
                                  ...s.houseCard,
                                  source: "property" as const,
                                  color: s.color as CardColor,
                                  isHouse: true,
                                  isHotel: false,
                                });
                              }
                              if (s.hotelCard) {
                                items.push({
                                  ...s.hotelCard,
                                  source: "property" as const,
                                  color: s.color as CardColor,
                                  isHouse: false,
                                  isHotel: true,
                                });
                              }
                              return items;
                            }) || []),
                          ].filter((c) => c.value > 0);

                          return (
                            <div
                              key={opp.id}
                              className="u-flex-col u-gap-10 u-p-12"
                              style={{
                                background: "var(--surface)",
                                borderRadius: "10px",
                                border: "1px solid var(--outline-variant)",
                              }}
                            >
                              <div className="u-flex-between">
                                <div>
                                  <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                                  <div className="u-text-sm" style={{ color: "var(--outline)" }}>
                                    Bank: ${opp.bankTotal}M • Assets: ${payableCards.reduce(
                                      (sum, c) => sum + c.value,
                                      0
                                    )}M
                                  </div>
                                  {payableCards.length > 0 && (
                                    <div style={{ marginTop: "4px", fontSize: "0.66rem", color: "var(--muted)" }}>
                                      {payableCards.length} payable card(s)
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="button button--primary u-fw-800"
                                  style={{
                                    padding: "6px 14px",
                                    fontSize: "0.76rem",
                                    background: isDoubled ? "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" : undefined,
                                  }}
                                  onClick={() => onPlayRent(targetingAction.card, chosenColor, opp.id, targetingAction.doubleRentCardId)}
                                >
                                  Charge ${rentVal}M Rent {isDoubled && "🔥"}
                                </button>
                              </div>

                              {payableCards.length > 0 ? (
                                <div className="u-flex u-gap-8" style={{ flexWrap: "wrap", justifyContent: "center" }}>
                                  {payableCards.map((card) => {
                                    const cardDef = resolveCardDef(card);

                                    return (
                                      <button
                                        key={card.instanceId}
                                        type="button"
                                        className="dialog-card-item"
                                        style={{
                                          background: "var(--surface)",
                                          border: "1px solid var(--outline)",
                                        }}
                                        onClick={() => onPlayRent(targetingAction.card, chosenColor, opp.id, targetingAction.doubleRentCardId)}
                                      >
                                        <Card card={cardDef} size="xs" isInteractive={false} currentColor={card.currentColor} />
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontStyle: "italic" }}>
                                  No payable cards
                                </span>
                              )}
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
                <div className="u-flex-col-14">
                  <div>
                    <p style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--primary)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                      1. SELECT YOUR PROPERTY CARD TO GIVE:
                    </p>

                    {yourIncompleteCards.length === 0 ? (
                      <div
                        className="u-text-3sm"
                        style={{
                          padding: "10px 12px",
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid #ef4444",
                          borderRadius: "8px",
                          color: "#fca5a5",
                        }}
                      >
                        ⚠️ You do not have any property cards in incomplete sets to trade. You need at least 1 property card to play Forced Deal.
                      </div>
                    ) : (
                      <div className="u-grid-3 u-gap-8">
                        {yourIncompleteCards.map(({ card, set }) => {
                          const isSelected = effectiveOfferedCardId === card.instanceId;
                          const colorHex = COLOR_CONFIG[set.color as CardColor]?.hex || "#0055a4";
                          const cardDef = resolveCardDef(card);

                          return (
                            <button
                              key={card.instanceId}
                              type="button"
                              onClick={() => setSelectedForcedDealOfferedId(card.instanceId)}
                              className={`dialog-card-item ${isSelected ? "dialog-card-item--selected" : ""}`}
                              style={{
                                background: isSelected ? colorHex : "var(--surface)",
                                color: isSelected ? "#FFFFFF" : "var(--text)",
                                border: `2px solid ${isSelected ? "#FFFFFF" : colorHex}`,
                                boxShadow: isSelected ? `0 0 10px ${colorHex}` : "none",
                              }}
                            >
                              <Card card={cardDef} size="xs" isInteractive={false} currentColor={card.currentColor} />
                              {isSelected && (
                                <span style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: colorHex, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "11px", fontWeight: 900, color: "#fff" }}>check</span>
                                </span>
                              )}
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

                      <div className="u-flex-col-8">
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
                              <div className="u-flex-between" style={{ marginBottom: "6px" }}>
                                <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                                <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                                  {oppIncompleteCards.length} tradeable card(s)
                                </span>
                              </div>

                              {oppIncompleteCards.length === 0 ? (
                                <span className="u-text-sm" style={{ color: "var(--outline)", fontStyle: "italic" }}>
                                  No incomplete property cards available to swap.
                                </span>
                              ) : (
                                <div className="u-grid-3 u-gap-8">
                                  {oppIncompleteCards.map(({ card, set }) => {
                                    const colorHex = COLOR_CONFIG[set.color as CardColor]?.hex || "#0055a4";
                                    const cardDef = resolveCardDef(card);

                                    return (
                                      <button
                                        key={card.instanceId}
                                        type="button"
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
                                        style={{
                                          padding: "4px",
                                          borderRadius: "10px",
                                          background: colorHex,
                                          color: COLOR_CONFIG[set.color as CardColor]?.textHex || "#FFFFFF",
                                          border: "2px solid transparent",
                                          cursor: !effectiveOfferedCardId ? "not-allowed" : "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          opacity: !effectiveOfferedCardId ? 0.5 : 1,
                                          transition: "all 0.15s ease",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <Card card={cardDef} size="xs" isInteractive={false} currentColor={card.currentColor} />
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
            <div className="u-flex-col u-gap-10">
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
                  <div key={opp.id} className="u-p-12" style={{ background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--outline-variant)" }}>
                    <div className="u-flex-between u-mb-8">
                      <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                        {oppIncompleteCards.length} stealable card(s)
                      </span>
                    </div>

                    {oppIncompleteCards.length === 0 ? (
                      <span className="u-text-sm" style={{ color: "var(--outline)", fontStyle: "italic" }}>
                        No single property cards available to steal (opponent has no incomplete sets).
                      </span>
                    ) : (
                      <div className="u-grid-3 u-gap-8">
                        {oppIncompleteCards.map(({ card, set }) => {
                          const colorHex = COLOR_CONFIG[set.color as CardColor]?.hex || "#0055a4";
                          const cardDef = resolveCardDef(card);

                          return (
                            <button
                              key={card.instanceId}
                              type="button"
                              style={{
                                padding: "4px",
                                borderRadius: "10px",
                                backgroundColor: colorHex,
                                color: COLOR_CONFIG[set.color as CardColor]?.textHex || "#FFFFFF",
                                border: "2px solid transparent",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                                overflow: "hidden",
                              }}
                              onClick={() => onPlayAction(targetingAction.card, opp.id, undefined, card.instanceId)}
                            >
                              <Card card={cardDef} size="xs" isInteractive={false} currentColor={card.currentColor} />
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
            <div className="u-flex-col u-gap-10">
              {opponents.map((opp) => {
                const oppCompleteSets = opp.propertySets.filter((s) => s.isComplete);

                return (
                  <div key={opp.id} className="u-p-12" style={{ background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--outline-variant)" }}>
                    <div className="u-flex-between u-mb-8">
                      <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                        {oppCompleteSets.length} complete set(s)
                      </span>
                    </div>

                    {oppCompleteSets.length === 0 ? (
                      <span className="u-text-sm" style={{ color: "var(--outline)", fontStyle: "italic" }}>
                        No complete property sets to steal.
                      </span>
                    ) : (
                      <div className="u-flex-col-8">
                        {oppCompleteSets.map((s) => {
                          const colorHex = COLOR_CONFIG[s.color as CardColor]?.hex || "#0055a4";

                          return (
                            <button
                              key={s.setId}
                              type="button"
                              style={{
                                padding: "10px",
                                borderRadius: "10px",
                                background: "var(--surface)",
                                border: `2px solid ${colorHex}`,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                transition: "all 0.15s ease",
                              }}
                              onClick={() => onPlayAction(targetingAction.card, opp.id, s.setId)}
                            >
                              <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                                {s.cards.slice(0, 4).map((c) => (
                                  <div key={c.instanceId} className="u-pointer-none" style={{ fontSize: "clamp(2.5px, 0.9vw, 4.5px)" }}>
                                    <Card card={resolveCardDef(c)} size="xs" isInteractive={false} currentColor={c.currentColor} />
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span className="u-text-3sm u-fw-800" style={{ textTransform: "uppercase", color: colorHex }}>
                                  👑 Steal FULL {s.color.toUpperCase()} SET
                                </span>
                                <span className="u-text-xs" style={{ color: "var(--muted)" }}>
                                  {s.cards.length} cards • ${s.cards.reduce((sum, c) => sum + c.value, 0)}M total
                                </span>
                              </div>
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
            <div className="u-flex-col u-gap-10">
              {opponents.map((opp) => {
                const payableCards = [
                  ...(opp.bank || []).map((c) => ({
                    ...c,
                    source: "bank" as const,
                    color: undefined as CardColor | undefined,
                    isHouse: false,
                    isHotel: false,
                  })),
                  ...(opp.propertySets.flatMap((s) => {
                    const items = s.cards.map((c) => ({
                      ...c,
                      source: "property" as const,
                      color: s.color as CardColor,
                      isHouse: false,
                      isHotel: false,
                    }));
                    if (s.houseCard) {
                      items.push({
                        ...s.houseCard,
                        source: "property" as const,
                        color: s.color as CardColor,
                        isHouse: true,
                        isHotel: false,
                      });
                    }
                    if (s.hotelCard) {
                      items.push({
                        ...s.hotelCard,
                        source: "property" as const,
                        color: s.color as CardColor,
                        isHouse: false,
                        isHotel: true,
                      });
                    }
                    return items;
                  }) || []),
                ].filter((c) => c.value > 0);

                return (
                  <div
                    key={opp.id}
                    className="u-flex-col u-gap-10 u-p-12"
                    style={{
                      background: "var(--surface)",
                      borderRadius: "10px",
                      border: "1px solid var(--outline-variant)",
                    }}
                  >
                    <div className="u-flex-between">
                      <div>
                        <b>{opp.name} {opp.isBot && "(Bot)"}</b>
                        <div className="u-text-sm" style={{ color: "var(--outline)" }}>
                          Bank: ${opp.bankTotal}M • Assets: ${payableCards.reduce(
                            (sum, c) => sum + c.value,
                            0
                          )}M
                        </div>
                        {payableCards.length > 0 && (
                          <div style={{ marginTop: "4px", fontSize: "0.66rem", color: "var(--muted)" }}>
                            {payableCards.length} payable card(s)
                          </div>
                        )}
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

                    {payableCards.length > 0 ? (
                      <div className="u-flex u-gap-8" style={{ flexWrap: "wrap", justifyContent: "center" }}>
                        {payableCards.map((card) => {
                          const cardDef = resolveCardDef(card);

                          return (
                            <button
                              key={card.instanceId}
                              type="button"
                              className="dialog-card-item"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--outline)",
                              }}
                              onClick={() => onPlayAction(targetingAction.card, opp.id, undefined, card.instanceId)}
                            >
                              <Card card={cardDef} size="xs" isInteractive={false} currentColor={card.currentColor} />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontStyle: "italic" }}>
                        No payable cards
                      </span>
                    )}
                  </div>
                );
              })}
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
    </DialogShell>
  );
}
