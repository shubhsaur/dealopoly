"use client";

import type { CardInstance } from "@dealopoly/game-engine";
import { Card } from "../../../_components/card";
import { resolveCardDef, type StolenAlertState } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";

interface StealNotificationModalProps {
  stolenAlert: StolenAlertState | null;
  onDismiss: () => void;
}

export function StealNotificationModal({ stolenAlert, onDismiss }: StealNotificationModalProps) {
  return (
    <DialogShell isOpen={Boolean(stolenAlert)} onClose={onDismiss} size="wide" zIndex={220}>
      <div
        className="dialog-header"
        style={{ borderBottom: "1px solid rgba(239, 68, 68, 0.2)", paddingBottom: "12px" }}
      >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "28px" }}>
              {stolenAlert?.type === "deal_breaker"
                ? "gavel"
                : stolenAlert?.type === "sly_deal"
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
                {stolenAlert?.type === "deal_breaker"
                  ? "⚡ Complete Property Set Stolen!"
                  : stolenAlert?.type === "sly_deal"
                  ? "🕵️ Property Card Stolen!"
                  : "🔄 Forced Deal Property Swap!"}
              </h2>
            </div>
          </div>
        </div>

        <div className="dialog-body" style={{ textAlign: "center", padding: "16px 20px" }}>
          <p style={{ margin: "0 0 16px", color: "var(--on-surface-variant)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            <strong style={{ color: "#FFFFFF" }}>{stolenAlert?.attackerName}</strong> played{" "}
            <strong style={{ color: "#ef4444" }}>{stolenAlert?.actionName}</strong> targeting your properties!
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
            {stolenAlert?.actionCard && (
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
                  <div style={{ display: "inline-block" }}>
                    <Card card={resolveCardDef(stolenAlert.actionCard)} size="xs" isInteractive={false} />
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
                {stolenAlert?.type === "deal_breaker"
                  ? `Cards Stolen From You (${stolenAlert.stolenCards.length}):`
                  : stolenAlert?.type === "sly_deal"
                  ? "Card Stolen From You:"
                  : "Card Taken From You:"}
              </span>

              {stolenAlert && stolenAlert.stolenCards.length > 0 ? (
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
                    <div key={c.instanceId}>
                      <Card card={resolveCardDef(c)} size="xs" isInteractive={false} currentColor={c.currentColor} />
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>Property cards transferred.</p>
              )}
            </div>

            {stolenAlert?.swappedCard && (
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
                  <div>
                    <Card card={resolveCardDef(stolenAlert.swappedCard)} size="xs" isInteractive={false} currentColor={stolenAlert.swappedCard?.currentColor} />
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
    </DialogShell>
  );
}
