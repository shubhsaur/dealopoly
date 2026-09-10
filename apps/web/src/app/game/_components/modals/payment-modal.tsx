"use client";

import type { CardInstance, MaskedGameState, PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { triggerHaptic } from "../../../../lib/sound-effects";
import { DialogShell } from "../../../_components/dialog-shell";

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
  const paidIds = pending.paidDebtorIds || [];
  const allDebtorIds = pending.debtorPlayerIds || [];
  const isDebtor =
    (allDebtorIds.includes(actualPlayerId) || pending.debtorPlayerId === actualPlayerId) &&
    !paidIds.includes(actualPlayerId);

  const isOpen = pending.type === "payment" && isDebtor;

  const bankCards = (you?.bank || []).map((c) => ({
      ...c,
      source: "bank" as const,
      color: undefined as CardColor | undefined,
      isHouse: false,
      isHotel: false,
    })).sort((a, b) => a.value - b.value);

  const propertyCards = (you?.propertySets.flatMap((s) => {
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
    }) || []);

  const payableCards = [...bankCards, ...propertyCards].filter((c) => c.value > 0);

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
    <DialogShell isOpen={isOpen} onClose={() => {}} size="wide">
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
            <div style={{ flexShrink: 0 }}>
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
            <div className="dialog-card-grid dialog-card-grid--labeled">
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
                    className={`dialog-card-item dialog-card-item--labeled ${isSelected ? "dialog-card-item--selected" : ""} ${isDisabled ? "dialog-card-item--disabled" : ""}`}
                  >
                    <Card card={cardDef} size="xs" isInteractive={false} currentColor={card.currentColor} />
                    <span className="dialog-card-label">
                      {cardDef.name}
                    </span>
                    <span className="dialog-card-value">
                      ${cardDef.value}M
                    </span>
                    {isSelected && (
                      <span className="dialog-card-check">
                        <span className="material-symbols-outlined" style={{ fontSize: "11px", fontWeight: 900, color: "#ffffff" }}>
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
    </DialogShell>
  );
}
