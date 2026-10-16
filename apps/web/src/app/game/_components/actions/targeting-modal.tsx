"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [selectedForcedDealTarget, setSelectedForcedDealTarget] = useState<{
    opponentId: string;
    cardInstanceId: string;
  } | null>(null);

  useEffect(() => {
    if (!targetingAction || targetingAction.type !== "forced_deal") {
      setSelectedForcedDealTarget(null);
    }
  }, [targetingAction]);

  const yourIncompleteCards = useMemo(() => {
    if (!you || targetingAction?.type !== "forced_deal") return [];
    const list: Array<{ card: CardInstance; set: PropertySet }> = [];
    you.propertySets
      .filter((s) => !s.isComplete)
      .forEach((s) => {
        s.cards.forEach((c) => {
          list.push({ card: c, set: s });
        });
        if (s.houseCard) list.push({ card: s.houseCard, set: s });
        if (s.hotelCard) list.push({ card: s.hotelCard, set: s });
      });
    return list;
  }, [you, targetingAction?.type]);

  const effectiveOfferedCardId =
    selectedForcedDealOfferedId || yourIncompleteCards[0]?.card.instanceId || null;

  const targetOpponent = useMemo(() => {
    if (!selectedForcedDealTarget) return null;
    return opponents.find((opp) => opp.id === selectedForcedDealTarget.opponentId) || null;
  }, [opponents, selectedForcedDealTarget]);

  const targetCardItem = useMemo(() => {
    if (!targetOpponent || !selectedForcedDealTarget) return null;
    for (const s of targetOpponent.propertySets) {
      if (s.isComplete) continue;
      const foundCard = s.cards.find((c) => c.instanceId === selectedForcedDealTarget.cardInstanceId);
      if (foundCard) return { card: foundCard, set: s };
      if (s.houseCard?.instanceId === selectedForcedDealTarget.cardInstanceId) {
        return { card: s.houseCard, set: s };
      }
      if (s.hotelCard?.instanceId === selectedForcedDealTarget.cardInstanceId) {
        return { card: s.hotelCard, set: s };
      }
    }
    return null;
  }, [targetOpponent, selectedForcedDealTarget]);

  const offeredItem = useMemo(() => {
    if (!effectiveOfferedCardId) return null;
    return yourIncompleteCards.find((item) => item.card.instanceId === effectiveOfferedCardId) || null;
  }, [yourIncompleteCards, effectiveOfferedCardId]);

  const canConfirmForcedDeal = Boolean(
    effectiveOfferedCardId &&
    selectedForcedDealTarget?.opponentId &&
    selectedForcedDealTarget?.cardInstanceId &&
    targetCardItem &&
    offeredItem
  );

  const handleClose = () => {
    setTargetingAction(null);
    setSelectedWildRentColor(null);
    setSelectedForcedDealTarget(null);
  };

  const handleConfirmForcedDeal = () => {
    if (!canConfirmForcedDeal || !targetingAction || !selectedForcedDealTarget || !effectiveOfferedCardId) {
      return;
    }
    onPlayAction(
      targetingAction.card,
      selectedForcedDealTarget.opponentId,
      undefined,
      selectedForcedDealTarget.cardInstanceId,
      effectiveOfferedCardId,
    );
    setSelectedForcedDealTarget(null);
  };

  if (!targetingAction) {
    return null;
  }

  return (
    <DialogShell
      isOpen={Boolean(targetingAction)}
      onClose={handleClose}
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
            onClick={handleClose}
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
                  <div className="targeting-card-grid">
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
                                    <span style={{ color: "#66df75" }}>Bank: ${opp.bankTotal}M</span> • Assets: ${payableCards.reduce(
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
                                <div className="targeting-card-grid">
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
            (
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
                              position: "relative",
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
                                  const isTargetSelected =
                                    selectedForcedDealTarget?.opponentId === opp.id &&
                                    selectedForcedDealTarget?.cardInstanceId === card.instanceId;

                                  return (
                                    <button
                                      key={card.instanceId}
                                      type="button"
                                      disabled={!effectiveOfferedCardId}
                                      onClick={() => {
                                        if (isTargetSelected) {
                                          setSelectedForcedDealTarget(null);
                                        } else {
                                          setSelectedForcedDealTarget({
                                            opponentId: opp.id,
                                            cardInstanceId: card.instanceId,
                                          });
                                        }
                                      }}
                                      style={{
                                        position: "relative",
                                        padding: "4px",
                                        borderRadius: "10px",
                                        background: isTargetSelected ? colorHex : "var(--surface)",
                                        color: COLOR_CONFIG[set.color as CardColor]?.textHex || "#FFFFFF",
                                        border: `2px solid ${isTargetSelected ? "#FFFFFF" : colorHex}`,
                                        boxShadow: isTargetSelected ? `0 0 12px ${colorHex}, 0 0 4px #FFFFFF` : "none",
                                        transform: isTargetSelected ? "scale(1.04)" : "scale(1)",
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
                                      {isTargetSelected && (
                                        <span
                                          style={{
                                            position: "absolute",
                                            top: "3px",
                                            right: "3px",
                                            width: "18px",
                                            height: "18px",
                                            borderRadius: "50%",
                                            background: "#f59e0b",
                                            border: "2px solid #fff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                                            zIndex: 3,
                                          }}
                                        >
                                          <span
                                            className="material-symbols-outlined"
                                            style={{ fontSize: "12px", fontWeight: 900, color: "#fff" }}
                                          >
                                            check
                                          </span>
                                        </span>
                                      )}
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

                {/* Exchange Preview & Confirm Callout */}
                {yourIncompleteCards.length > 0 && (
                  <div
                    style={{
                      marginTop: "4px",
                      padding: "12px",
                      background: canConfirmForcedDeal
                        ? "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(234, 88, 12, 0.08) 100%)"
                        : "rgba(255, 255, 255, 0.03)",
                      border: `1.5px solid ${canConfirmForcedDeal ? "rgba(245, 158, 11, 0.45)" : "var(--outline-variant)"}`,
                      borderRadius: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      boxShadow: canConfirmForcedDeal ? "0 4px 16px rgba(245, 158, 11, 0.12)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontSize: "0.76rem",
                          fontWeight: 800,
                          color: canConfirmForcedDeal ? "#f59e0b" : "var(--muted)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                          swap_horiz
                        </span>
                        Exchange Preview
                      </span>
                      {targetOpponent && (
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                          With: <b style={{ color: "var(--text)" }}>{targetOpponent.name}</b>
                        </span>
                      )}
                    </div>

                    {canConfirmForcedDeal && offeredItem && targetCardItem && targetOpponent ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto 1fr",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {/* You Give */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            background: "var(--surface)",
                            borderRadius: "8px",
                            border: `1px solid ${COLOR_CONFIG[offeredItem.set.color as CardColor]?.hex || "var(--outline)"}`,
                            minWidth: 0,
                          }}
                        >
                          <div style={{ flexShrink: 0, width: "30px" }}>
                            <Card
                              card={resolveCardDef(offeredItem.card)}
                              size="xs"
                              isInteractive={false}
                              currentColor={offeredItem.card.currentColor}
                            />
                          </div>
                          <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "0.62rem", color: "#f87171", fontWeight: 800, textTransform: "uppercase" }}>
                              You Give
                            </span>
                            <span style={{ fontSize: "0.74rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {offeredItem.card.name}
                            </span>
                            <span style={{ fontSize: "0.64rem", color: "var(--muted)" }}>
                              {offeredItem.set.color.toUpperCase()} (${offeredItem.card.value}M)
                            </span>
                          </div>
                        </div>

                        {/* Exchange Icon */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "rgba(245, 158, 11, 0.2)",
                            border: "1px solid #f59e0b",
                            color: "#f59e0b",
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            sync_alt
                          </span>
                        </div>

                        {/* You Receive */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            background: "var(--surface)",
                            borderRadius: "8px",
                            border: `1px solid ${COLOR_CONFIG[targetCardItem.set.color as CardColor]?.hex || "var(--outline)"}`,
                            minWidth: 0,
                          }}
                        >
                          <div style={{ flexShrink: 0, width: "30px" }}>
                            <Card
                              card={resolveCardDef(targetCardItem.card)}
                              size="xs"
                              isInteractive={false}
                              currentColor={targetCardItem.card.currentColor}
                            />
                          </div>
                          <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "0.62rem", color: "#4ade80", fontWeight: 800, textTransform: "uppercase" }}>
                              You Receive
                            </span>
                            <span style={{ fontSize: "0.74rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {targetCardItem.card.name}
                            </span>
                            <span style={{ fontSize: "0.64rem", color: "var(--muted)" }}>
                              {targetCardItem.set.color.toUpperCase()} (${targetCardItem.card.value}M)
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "8px 10px",
                          background: "rgba(0, 0, 0, 0.2)",
                          borderRadius: "8px",
                          fontSize: "0.74rem",
                          color: "var(--muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>
                          info
                        </span>
                        <span>
                          {!effectiveOfferedCardId
                            ? "Select your property card to give above."
                            : !selectedForcedDealTarget
                            ? "Select an opponent's property card above to steal."
                            : "Select valid cards to complete the swap."}
                        </span>
                      </div>
                    )}

                    {/* Prominent Confirm Button in the Forced Deal panel */}
                    <button
                      type="button"
                      className="button button--primary"
                      disabled={!canConfirmForcedDeal}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        borderRadius: "8px",
                        background: canConfirmForcedDeal
                          ? "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)"
                          : undefined,
                        boxShadow: canConfirmForcedDeal ? "0 4px 14px rgba(245, 158, 11, 0.35)" : "none",
                        cursor: canConfirmForcedDeal ? "pointer" : "not-allowed",
                        opacity: canConfirmForcedDeal ? 1 : 0.5,
                        transition: "all 0.15s ease",
                      }}
                      onClick={handleConfirmForcedDeal}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "19px" }}>
                        swap_horiz
                      </span>
                      <span>{canConfirmForcedDeal ? "Confirm Exchange of Cards" : "Select Cards to Swap"}</span>
                    </button>
                  </div>
                )}
              </div>
            )
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
                          <span style={{ color: "#66df75" }}>Bank: ${opp.bankTotal}M</span> • Assets: ${payableCards.reduce(
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
                      <div className="targeting-card-grid">
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
          {targetingAction.type === "forced_deal" ? (
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button
                type="button"
                className="button button--secondary"
                style={{ flex: "1 1 35%" }}
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button--primary"
                disabled={!canConfirmForcedDeal}
                style={{
                  flex: "1 1 65%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: canConfirmForcedDeal
                    ? "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)"
                    : undefined,
                  boxShadow: canConfirmForcedDeal ? "0 0 14px rgba(245, 158, 11, 0.4)" : "none",
                  fontWeight: 800,
                  fontSize: "0.84rem",
                  cursor: canConfirmForcedDeal ? "pointer" : "not-allowed",
                  opacity: canConfirmForcedDeal ? 1 : 0.5,
                  transition: "all 0.15s ease",
                }}
                onClick={handleConfirmForcedDeal}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  check_circle
                </span>
                <span>Confirm Exchange</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="button button--secondary button--full"
              onClick={handleClose}
            >
              Cancel Action
            </button>
          )}
        </div>
    </DialogShell>
  );
}
