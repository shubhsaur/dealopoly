"use client";

import type { CardInstance, MaskedGameState } from "@dealopoly/game-engine";
import type { PaymentCompletedEvent } from "@dealopoly/game-engine";
import { Card } from "../../../_components/card";
import { DialogShell } from "../../../_components/dialog-shell";
import { resolveCardDef } from "../types";

interface RentSummaryModalProps {
  event: PaymentCompletedEvent | null;
  gameState: MaskedGameState;
  onDismiss: () => void;
}

interface GroupedCards {
  money: CardInstance[];
  properties: CardInstance[];
}

function groupCardsByType(cards: CardInstance[]): GroupedCards {
  return cards.reduce<GroupedCards>(
    (acc, card) => {
      if (card.type === "property" || card.type === "property-wild") {
        acc.properties.push(card);
      } else {
        acc.money.push(card);
      }
      return acc;
    },
    { money: [], properties: [] },
  );
}

export function RentSummaryModal({ event, gameState, onDismiss }: RentSummaryModalProps) {
  if (!event) return null;

  const isRent = event.reason.toLowerCase().includes("rent");
  const title = isRent ? "Rent Collected" : "Payment Collected";
  const icon = isRent ? "payments" : "account_balance_wallet";
  const totalDebtors = event.payments.length;
  const paidCount = event.payments.filter((p) => !p.blockedByJsn).length;
  const blockedCount = event.payments.filter((p) => p.blockedByJsn).length;

  return (
    <DialogShell isOpen={Boolean(event)} onClose={onDismiss} size="wide" zIndex={240}>
      <div className="dialog-header" style={{ borderBottom: "1px solid rgba(245, 158, 11, 0.2)", paddingBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="material-symbols-outlined" style={{ color: "#f59e0b", fontSize: "28px" }}>
            {icon}
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  background: "rgba(245, 158, 11, 0.2)",
                  color: "#f59e0b",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                }}
              >
                Collection Complete
              </span>
            </div>
            <h2 style={{ color: "#f59e0b", fontSize: "1.2rem", margin: "4px 0 0", fontWeight: 800 }}>
              {title}
            </h2>
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
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Collected
            </span>
            <strong style={{ fontSize: "1.4rem", color: "#f59e0b", display: "block", fontFamily: "var(--display)" }}>
              ${event.totalCollected}M
            </strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Amount Due
            </span>
            <strong style={{ fontSize: "1.1rem", color: "var(--text)", display: "block", fontFamily: "var(--display)" }}>
              ${event.amountDue}M
            </strong>
          </div>
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
              Debtors
            </span>
            <strong style={{ fontSize: "1.1rem", color: "var(--text)", fontFamily: "var(--display)" }}>{totalDebtors}</strong>
          </div>
          <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255, 255, 255, 0.1)", borderRight: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <span style={{ fontSize: "0.66rem", color: "var(--muted)", textTransform: "uppercase", fontFamily: "var(--mono)", fontWeight: 700, display: "block" }}>
              Paid
            </span>
            <strong style={{ fontSize: "1.1rem", color: "#66df75", fontFamily: "var(--display)" }}>{paidCount}</strong>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.66rem", color: "var(--muted)", textTransform: "uppercase", fontFamily: "var(--mono)", fontWeight: 700, display: "block" }}>
              Blocked
            </span>
            <strong style={{ fontSize: "1.1rem", color: blockedCount > 0 ? "#ef4444" : "var(--text)", fontFamily: "var(--display)" }}>{blockedCount}</strong>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", fontFamily: "var(--mono)", fontWeight: 700 }}>
            Debtor Breakdown
          </span>

          {event.payments.map((payment) => {
            const debtorName = gameState.players[payment.debtorPlayerId]?.name || "Unknown";
            const grouped = groupCardsByType(payment.paidCards);

            return (
              <div
                key={payment.debtorPlayerId}
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                  <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>{debtorName}</strong>
                  {payment.blockedByJsn ? (
                    <span
                      style={{
                        background: "rgba(96, 165, 250, 0.15)",
                        color: "#93c5fd",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>shield</span>
                      Just Say No
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#86efac",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      Paid ${payment.totalValue}M
                    </span>
                  )}
                </div>

                {!payment.blockedByJsn && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {grouped.money.length > 0 && (
                      <div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            display: "block",
                            marginBottom: "6px",
                          }}
                        >
                          Money ({grouped.money.length})
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {grouped.money.map((card) => (
                            <Card
                              key={card.instanceId}
                              card={resolveCardDef(card)}
                              size="xs"
                              isInteractive={false}
                              currentColor={card.currentColor}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {grouped.properties.length > 0 && (
                      <div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            display: "block",
                            marginBottom: "6px",
                          }}
                        >
                          Property ({grouped.properties.length})
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {grouped.properties.map((card) => (
                            <Card
                              key={card.instanceId}
                              card={resolveCardDef(card)}
                              size="xs"
                              isInteractive={false}
                              currentColor={card.currentColor}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

{!payment.blockedByJsn && payment.paidCards.length === 0 && (
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.82rem" }}>No cards surrendered.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="dialog-footer" style={{ justifyContent: "center", padding: "16px 20px" }}>
        <button
          type="button"
          className="button button--primary"
          style={{ width: "100%", maxWidth: "240px", background: "#f59e0b", borderColor: "#d97706" }}
          onClick={onDismiss}
        >
          Understood
        </button>
      </div>
    </DialogShell>
  );
}
