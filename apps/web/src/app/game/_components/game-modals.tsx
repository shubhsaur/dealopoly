"use client";

import type { CardInstance, MaskedGameState, PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { Card } from "../../_components/card";
import { resolveCardDef, type StolenAlertState } from "./types";
import { triggerHaptic } from "../../../lib/sound-effects";

// ==========================================
// 1. REACTION MODAL (JUST SAY NO + TIMER + EXTENSION)
// ==========================================
interface ReactionModalProps {
  pending: {
    type: "reaction_window";
    waitingForPlayerId?: string;
    waitingForPlayerIds?: string[];
    jsnSubResolution?: {
      waitingForPlayerId?: string;
      justSayNoChainCount: number;
      canExtend?: boolean;
      deadline?: number;
    };
    initiatorPlayerId: string;
    targetPlayerId: string;
    justSayNoChainCount: number;
    actionCard: CardInstance;
    canExtend?: boolean;
    deadline?: number;
  };
  actualPlayerId: string;
  gameState: MaskedGameState;
  you: {
    hand?: CardInstance[];
  } | null;
  reactionRemainingSeconds: number | null;
  onReaction: (action: "just_say_no" | "pass" | "extend_timer", jsnCardId?: string) => void;
}

export function ReactionModal({
  pending,
  actualPlayerId,
  gameState,
  you,
  reactionRemainingSeconds,
  onReaction,
}: ReactionModalProps) {
  // Check if this player should see the reaction modal
  const isWaiting =
    pending.waitingForPlayerId === actualPlayerId ||
    pending.waitingForPlayerIds?.includes(actualPlayerId) ||
    pending.jsnSubResolution?.waitingForPlayerId === actualPlayerId;

  if (pending.type !== "reaction_window" || !isWaiting) {
    return null;
  }

  const hasJSN = you?.hand?.some((c) => c.defId === "action-just-say-no");
  // Determine if player is in a JSN sub-resolution counter-chain
  const isInJsnSubChain = pending.jsnSubResolution?.waitingForPlayerId === actualPlayerId;
  const jsnChainCount = isInJsnSubChain
    ? pending.jsnSubResolution!.justSayNoChainCount
    : pending.justSayNoChainCount;
  const canExtendTimer = isInJsnSubChain
    ? pending.jsnSubResolution!.canExtend !== false
    : pending.canExtend !== false;

  const otherPlayerName =
    gameState.players[
      pending.initiatorPlayerId === actualPlayerId ? pending.targetPlayerId : pending.initiatorPlayerId
    ]?.name || "Opponent";

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog-scrim" />
      <div className="dialog-panel dialog-panel--md">
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div
          className="dialog-header"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "24px" }}>
              warning
            </span>
            <h2 style={{ color: "#ef4444", fontSize: "1.15rem", margin: 0 }}>
              {jsnChainCount > 0 ? "Action Blocked!" : "Action Targeted You!"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                padding: "3px 8px",
                borderRadius: "12px",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                timer
              </span>
              {reactionRemainingSeconds !== null ? `${reactionRemainingSeconds}s` : "7s"}
            </span>

            {canExtendTimer && (
              <button
                type="button"
                onClick={() => onReaction("extend_timer")}
                style={{
                  background: "rgba(59, 130, 246, 0.2)",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  color: "#60a5fa",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  transition: "all 0.15s ease",
                }}
                title="Add +5 seconds to decision time"
              >
                +5s
              </button>
            )}
          </div>
        </div>

        <div className="dialog-body" style={{ textAlign: "center", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <Card card={resolveCardDef(pending.actionCard)} size="xs" isInteractive={false} />
          </div>
          <p style={{ margin: 0, color: "var(--on-surface-variant)", fontSize: "0.9rem", lineHeight: 1.5 }}>
            {jsnChainCount > 0
              ? `${otherPlayerName} played a Just Say No against your ${pending.actionCard.name}! Do you want to counter it with another Just Say No?`
              : `${pending.actionCard.name} was played against you. Do you want to block it?`}
          </p>

          {hasJSN ? (
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
              <button
                type="button"
                className="button button--primary"
                style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }}
                onClick={() => {
                  const jsn = you?.hand?.find((c) => c.defId === "action-just-say-no");
                  onReaction("just_say_no", jsn?.instanceId);
                }}
              >
                PLAY JUST SAY NO!
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => onReaction("pass")}
              >
                Pass (Accept)
              </button>
            </div>
          ) : (
            <div style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="button button--secondary button--full"
                style={{ fontWeight: 600 }}
                onClick={() => onReaction("pass")}
              >
                Accept Action
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. PAYMENT RESOLUTION MODAL
// ==========================================
interface PaymentModalProps {
  pending: {
    type: "payment";
    debtorPlayerId: string;
    debtorPlayerIds?: string[];
    paidDebtorIds?: string[];
    jsnSubResolution?: {
      waitingForPlayerId?: string;
      justSayNoChainCount: number;
      canExtend?: boolean;
      deadline?: number;
    };
    creditorPlayerId: string;
    amountDue: number;
    reason: string;
    actionCard?: CardInstance;
  };
  actualPlayerId: string;
  gameState: MaskedGameState;
  you: {
    id: string;
    hand?: CardInstance[];
    bank: CardInstance[];
    propertySets: PropertySet[];
  } | null;
  paymentSelectedIds: string[];
  setPaymentSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmitPayment: (justSayNoCardInstanceId?: string) => void;
}

export function PaymentModal({
  pending,
  actualPlayerId,
  gameState,
  you,
  paymentSelectedIds,
  setPaymentSelectedIds,
  onSubmitPayment,
}: PaymentModalProps) {
  // Show when this player is an unpaid debtor (concurrent payment allows any order).
  const paidIds = pending.paidDebtorIds || [];
  const allDebtorIds = pending.debtorPlayerIds || [];
  const isDebtor =
    (allDebtorIds.includes(actualPlayerId) || pending.debtorPlayerId === actualPlayerId) &&
    !paidIds.includes(actualPlayerId);

  if (pending.type !== "payment" || !isDebtor) {
    return null;
  }

  const payableCards = [
    ...(you?.bank || []).map((c) => ({
      ...c,
      source: "bank" as const,
      color: undefined as CardColor | undefined,
      isHouse: false,
      isHotel: false,
    })),
    ...(you?.propertySets.flatMap((s) => {
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

  const totalTableValue = payableCards.reduce((sum, c) => sum + c.value, 0);
  const selectedCards = payableCards.filter((c) => paymentSelectedIds.includes(c.instanceId));
  const totalSelected = selectedCards.reduce((sum, c) => sum + c.value, 0);
  const remainingDue = Math.max(0, pending.amountDue - totalSelected);
  const isGoalReached = totalSelected >= pending.amountDue;
  const isInsufficientTotal = totalTableValue < pending.amountDue;
  const isAllSelected = selectedCards.length === payableCards.length;
  const canSubmit = isGoalReached || (isInsufficientTotal && isAllSelected);
  const creditorName = gameState.players[pending.creditorPlayerId]?.name || "Opponent";
  const jsnCard = you?.hand?.find((c) => c.defId === "action-just-say-no");

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog-scrim" />
      <div className="dialog-panel dialog-panel--wide">
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="material-symbols-outlined" style={{ color: "#f59e0b", fontSize: "24px" }}>
              payments
            </span>
            <div>
              <h2 style={{ color: "#f59e0b", fontSize: "1.15rem", margin: 0 }}>Payment Required</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.74rem", margin: "2px 0 0" }}>
                Settle debt owed to {creditorName}
              </p>
            </div>
          </div>
        </div>

        <div className="dialog-body" style={{ gap: "14px" }}>
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {pending.actionCard && (
              <div style={{ flexShrink: 0, fontSize: "clamp(3.5px, 1.1vw, 6px)" }}>
                <Card card={resolveCardDef(pending.actionCard)} size="xs" isInteractive={false} />
              </div>
            )}
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text)" }}>
              {pending.reason} — Total Owed: <b style={{ color: "#f59e0b" }}>${pending.amountDue}M</b>
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              background: "var(--surface-lowest)",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid rgba(66, 71, 81, 0.4)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.66rem", color: "var(--muted)", textTransform: "uppercase", fontFamily: "var(--mono)", fontWeight: 700, display: "block" }}>
                Total Due
              </span>
              <strong style={{ fontSize: "1.1rem", color: "#f59e0b", fontFamily: "var(--display)" }}>
                ${pending.amountDue}M
              </strong>
            </div>

            <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255, 255, 255, 0.1)", borderRight: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <span style={{ fontSize: "0.66rem", color: "var(--muted)", textTransform: "uppercase", fontFamily: "var(--mono)", fontWeight: 700, display: "block" }}>
                Selected
              </span>
              <strong style={{ fontSize: "1.1rem", color: isGoalReached ? "#66df75" : "var(--primary)", fontFamily: "var(--display)" }}>
                ${totalSelected}M
              </strong>
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.66rem", color: "var(--muted)", textTransform: "uppercase", fontFamily: "var(--mono)", fontWeight: 700, display: "block" }}>
                Remaining
              </span>
              <strong style={{ fontSize: "1.1rem", color: remainingDue === 0 ? "#66df75" : "#ff7d7d", fontFamily: "var(--display)" }}>
                {remainingDue === 0 ? "$0M ✓" : `$${remainingDue}M`}
              </strong>
            </div>
          </div>

          {isGoalReached ? (
            <div style={{ padding: "8px 12px", background: "rgba(102, 223, 117, 0.15)", border: "1px solid #66df75", borderRadius: "8px", color: "#86efac", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                check_circle
              </span>
              <span>
                <b>Debt Covered (${totalSelected}M of ${pending.amountDue}M)</b> — Remaining cards locked to prevent overpayment.
              </span>
            </div>
          ) : isInsufficientTotal ? (
            <div style={{ padding: "8px 12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", color: "#fca5a5", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                info
              </span>
              <span>
                Total assets (${totalTableValue}M) are less than debt. You must surrender all {payableCards.length} cards.
              </span>
            </div>
          ) : (
            <div style={{ padding: "8px 12px", background: "rgba(168, 200, 255, 0.08)", border: "1px solid rgba(168, 200, 255, 0.2)", borderRadius: "8px", color: "#a8c8ff", fontSize: "0.78rem" }}>
              Select cards totaling at least <b>${remainingDue}M</b> more to pay the debt.
            </div>
          )}

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", fontFamily: "var(--mono)", fontWeight: 700 }}>
                Available Table Cards ({payableCards.length})
              </span>
              {isInsufficientTotal && !isAllSelected && (
                <button
                  type="button"
                  onClick={() => setPaymentSelectedIds(payableCards.map((c) => c.instanceId))}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Select All Assets
                </button>
              )}
            </div>

            {payableCards.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "0.82rem" }}>
                You have no cards or cash on your table to pay this debt.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {payableCards.map((card) => {
                  const isSelected = paymentSelectedIds.includes(card.instanceId);
                  const isDisabled = !isSelected && isGoalReached;
                  const cardDef = resolveCardDef(card);

                  return (
                    <button
                      key={card.instanceId}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        triggerHaptic("light");
                        setPaymentSelectedIds((prev) =>
                          isSelected ? prev.filter((id) => id !== card.instanceId) : [...prev, card.instanceId],
                        );
                      }}
                      style={{
                        padding: "4px 4px 6px",
                        borderRadius: "10px",
                        background: isSelected
                          ? "var(--primary)"
                          : isDisabled
                          ? "rgba(255, 255, 255, 0.03)"
                          : "var(--surface)",
                        border: `1.5px solid ${isSelected ? "var(--primary)" : isDisabled ? "rgba(255, 255, 255, 0.06)" : "var(--outline)"}`,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? 0.45 : 1,
                        display: "flex",
                        flexDirection: "column",
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
                      <span
                        style={{
                          fontSize: "clamp(0.55rem, 1.5vw, 0.7rem)",
                          fontWeight: 600,
                          color: isSelected ? "var(--on-primary)" : "var(--text)",
                          lineHeight: 1.2,
                          marginTop: "3px",
                          textAlign: "center",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                          padding: "0 2px",
                        }}
                      >
                        {cardDef.name}
                      </span>
                      <span
                        style={{
                          fontSize: "clamp(0.5rem, 1.3vw, 0.65rem)",
                          fontWeight: 700,
                          color: isSelected ? "var(--on-primary)" : "#f59e0b",
                          lineHeight: 1.1,
                          fontFamily: "var(--mono)",
                        }}
                      >
                        ${cardDef.value}M
                      </span>
                      {isSelected && (
                        <span style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "11px", fontWeight: 900, color: "var(--on-primary)" }}>
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
        </div>

        <div className="dialog-footer" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {jsnCard && (
            <button
              type="button"
              className="button button--secondary button--full"
              onClick={() => {
                triggerHaptic("medium");
                onSubmitPayment(jsnCard.instanceId);
              }}
              style={{
                borderColor: "#60a5fa",
                color: "#93c5fd",
                background: "rgba(37, 99, 235, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: 700,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#60a5fa" }}>
                shield
              </span>
              Play Just Say No (Refuse Payment)
            </button>
          )}
          <button
            type="button"
            className="button button--primary button--full"
            disabled={!canSubmit}
            onClick={() => {
              if (canSubmit) triggerHaptic("medium");
              onSubmitPayment();
            }}
            style={{
              opacity: !canSubmit ? 0.5 : 1,
              cursor: !canSubmit ? "not-allowed" : "pointer",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              {canSubmit ? "check_circle" : "lock"}
            </span>
            {canSubmit ? `Submit Payment ($${totalSelected}M)` : `Select $${remainingDue}M more to submit`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. DISCARD MODAL
// ==========================================
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
  if (pending.type !== "discard" || pending.playerId !== actualPlayerId) {
    return null;
  }

  const isCountMatched = discardSelectedIds.length === pending.requiredDiscardCount;

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog-scrim" onClick={onClose} />
      <div className="dialog-panel dialog-panel--wide">
        <div className="texture-overlay" />
        <div className="sheet-handle" />

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
      </div>
    </div>
  );
}

// ==========================================
// 4. BANK VAULT MODAL
// ==========================================
interface BankVaultModalProps {
  viewingBankPlayerId: string | null;
  actualPlayerId: string;
  you: {
    id: string;
    name: string;
    bank: CardInstance[];
    bankTotal: number;
  } | null;
  gameState: MaskedGameState;
  onClose: () => void;
}

export function BankVaultModal({
  viewingBankPlayerId,
  actualPlayerId,
  you,
  gameState,
  onClose,
}: BankVaultModalProps) {
  if (!viewingBankPlayerId) {
    return null;
  }

  const bankPlayer =
    viewingBankPlayerId === "self" || viewingBankPlayerId === you?.id || viewingBankPlayerId === actualPlayerId
      ? you
      : gameState.players[viewingBankPlayerId] ||
        Object.values(gameState.players).find((p) => p.id === viewingBankPlayerId);

  if (!bankPlayer) return null;

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 400 }}>
      <div className="dialog-scrim" onClick={onClose} />
      <div className="game-bank-modal-container">
        <div className="sheet-handle" />
        <div className="game-bank-modal-header">
          <div className="game-bank-modal-title-group">
            <div className="game-bank-modal-icon-badge">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                account_balance
              </span>
            </div>
            <div>
              <h3 className="game-bank-modal-title">
                {bankPlayer.id === you?.id ? "Your Bank Vault" : `${bankPlayer.name}'s Bank Vault`}
              </h3>
              <p className="game-bank-modal-sub">
                Total Assets: <strong>${bankPlayer.bankTotal}M</strong> ({bankPlayer.bank.length} cards banked)
              </p>
            </div>
          </div>
          <button
            type="button"
            className="game-round-icon-btn"
            onClick={onClose}
            title="Close Vault"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              close
            </span>
          </button>
        </div>

        <div className="game-bank-modal-body">
          {bankPlayer.bank.length === 0 ? (
            <div className="game-bank-modal-empty">
              <span className="material-symbols-outlined" style={{ fontSize: "44px", opacity: 0.4 }}>
                savings
              </span>
              <p>Vault is completely empty</p>
              <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                Bank money cards on your turn to protect your assets and pay rents!
              </span>
            </div>
          ) : (
            <div className="game-bank-modal-grid">
              {bankPlayer.bank.map((c: CardInstance, i: number) => (
                <div key={`${c.instanceId}-${i}`} className="game-bank-modal-card-item">
                  <Card card={resolveCardDef(c)} size="sm" isInteractive={false} currentColor={c.currentColor} />
                  <span className="game-bank-modal-card-val">${c.value}M Cash</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. STEAL NOTIFICATION MODAL (VICTIM ALERT)
// ==========================================
interface StealNotificationModalProps {
  stolenAlert: StolenAlertState | null;
  onDismiss: () => void;
}

export function StealNotificationModal({ stolenAlert, onDismiss }: StealNotificationModalProps) {
  if (!stolenAlert) {
    return null;
  }

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 220 }}>
      <div className="dialog-scrim" onClick={onDismiss} />
      <div
        className="dialog-panel dialog-panel--wide"
        style={{ border: "2px solid #ef4444", boxShadow: "0 0 30px rgba(239, 68, 68, 0.45)" }}
      >
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div
          className="dialog-header"
          style={{ borderBottom: "1px solid rgba(239, 68, 68, 0.2)", paddingBottom: "12px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "28px" }}>
              {stolenAlert.type === "deal_breaker"
                ? "gavel"
                : stolenAlert.type === "sly_deal"
                ? "visibility"
                : "swap_horiz"}
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#ef4444",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  Action Played on You
                </span>
              </div>
              <h2 style={{ color: "#f87171", fontSize: "1.2rem", margin: "4px 0 0", fontWeight: 800 }}>
                {stolenAlert.type === "deal_breaker"
                  ? "⚡ Complete Property Set Stolen!"
                  : stolenAlert.type === "sly_deal"
                  ? "🕵️ Property Card Stolen!"
                  : "🔄 Forced Deal Property Swap!"}
              </h2>
            </div>
          </div>
        </div>

        <div className="dialog-body" style={{ textAlign: "center", padding: "16px 20px" }}>
          <p style={{ margin: "0 0 16px", color: "var(--on-surface-variant)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            <strong style={{ color: "#FFFFFF" }}>{stolenAlert.attackerName}</strong> played{" "}
            <strong style={{ color: "#ef4444" }}>{stolenAlert.actionName}</strong> targeting your properties!
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              background: "rgba(0, 0, 0, 0.3)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {stolenAlert.actionCard && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  borderBottom: "1px dashed rgba(255, 255, 255, 0.12)",
                  paddingBottom: "14px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Action Card Used:
                  </span>
                  <div style={{ display: "inline-block", transform: "scale(0.85)", transformOrigin: "top center" }}>
                    <Card card={resolveCardDef(stolenAlert.actionCard)} size="sm" isInteractive={false} />
                  </div>
                </div>
              </div>
            )}

            <div>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#f87171",
                  textTransform: "uppercase",
                  fontWeight: 800,
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                {stolenAlert.type === "deal_breaker"
                  ? `Cards Stolen From You (${stolenAlert.stolenCards.length}):`
                  : stolenAlert.type === "sly_deal"
                  ? "Card Stolen From You:"
                  : "Card Taken From You:"}
              </span>

              {stolenAlert.stolenCards.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {stolenAlert.stolenCards.map((c) => (
                    <div key={c.instanceId} style={{ transform: "scale(0.85)", transformOrigin: "center" }}>
                      <Card card={resolveCardDef(c)} size="sm" isInteractive={false} currentColor={c.currentColor} />
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>Property cards transferred.</p>
              )}
            </div>

            {stolenAlert.swappedCard && (
              <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.12)", paddingTop: "14px" }}>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "#34d399",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  Card Given to You in Return:
                </span>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ transform: "scale(0.85)", transformOrigin: "center" }}>
                    <Card card={resolveCardDef(stolenAlert.swappedCard)} size="sm" isInteractive={false} currentColor={stolenAlert.swappedCard?.currentColor} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dialog-footer" style={{ justifyContent: "center", padding: "16px 20px" }}>
          <button
            type="button"
            className="button button--primary"
            style={{ width: "100%", maxWidth: "240px", background: "#ef4444", borderColor: "#dc2626" }}
            onClick={onDismiss}
          >
            Understood / Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. DISCARD INSPECTOR MODAL
// ==========================================
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
  if (!isOpen) {
    return null;
  }

  const cardCount = discardPile?.length || (discardPileTop ? 1 : 0);

  return (
    <div className="discard-inspector-modal" role="dialog" aria-modal="true">
      <div className="dialog-scrim" onClick={onClose} />
      <div className="discard-inspector-box">
        <div className="sheet-handle" />
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
      </div>
    </div>
  );
}

// ==========================================
// 7. OPPONENT INSPECTOR MODAL
// ==========================================
interface OpponentData {
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
  if (!viewingOpponentId) {
    return null;
  }

  const opp = opponents.find((o) => o.id === viewingOpponentId);
  if (!opp) return null;

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 300 }}>
      <div className="dialog-scrim" onClick={onClose} />
      <div className="dialog-panel dialog-panel--table">
        <div className="texture-overlay" />
        <div className="sheet-handle" />

        <div className="dialog-header">
          <div>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px" }}>{opp.name}&apos;s Table</h2>
            <div className="game-opponent-metrics" style={{ fontSize: "0.8rem" }}>
              <span>{opp.handCount} Cards in Hand (Hidden)</span>
              <span>•</span>
              <span style={{ color: "#66df75" }}>Bank: ${opp.bankTotal}M</span>
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
              onClick={() => onOpenBank(opp.id)}
              role="button"
              tabIndex={0}
              aria-label={`View ${opp.name}'s banked cash cards`}
              title={`Click to view ${opp.name}'s bank vault`}
            >
              <div className="game-bank-header">
                <span className="game-bank-title">BANK</span>
                <span className="game-bank-count-pill">{opp.bank.length} cards</span>
              </div>

              <div className="game-bank-balance-display">
                <span className="game-bank-total">${opp.bankTotal}M</span>
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
                    ★ {opp.propertySets.filter((s) => s.isComplete).length} / 3 Sets
                  </span>
                </div>
              </div>

              <div className="game-properties-sets-grid opp-sets-grid--dialog">
                {opp.propertySets.length === 0 ? (
                  <span style={{ fontSize: "0.7rem", color: "var(--outline)", padding: "4px 0" }}>
                    No property sets laid down yet.
                  </span>
                ) : (
                  opp.propertySets.map((set) => {
                    const colorHex = COLOR_CONFIG[set.color as CardColor]?.hex || "#0055A4";
                    const totalCardCount = set.cards.length + (set.hasHouse ? 1 : 0) + (set.hasHotel ? 1 : 0);
                    const CARD_H = 160;
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
      </div>
    </div>
  );
}

// ==========================================
// 8. YOUR PROPERTIES MODAL / BOTTOM SHEET
// ==========================================
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
  if (!isOpen || !you) {
    return null;
  }

  const completedSetsCount = you.propertySets.filter((s) => s.isComplete).length;
  const isActionActive = isYourTurn && gameState.turn.phase === "action" && !gameState.pendingResolution;

  return (
    <div className="join-dialog-overlay" role="dialog" aria-modal="true" style={{ zIndex: 300 }}>
      <div className="dialog-scrim" onClick={onClose} />
      <div className="dialog-panel dialog-panel--table">
        <div className="texture-overlay" />
        <div className="sheet-handle" />

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
                    const CARD_H = 160;
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
      </div>
    </div>
  );
}
