"use client";

import type { CardInstance, MaskedGameState } from "@dealopoly/game-engine";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";

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
  if (!viewingBankPlayerId) return null;

  const bankPlayer =
    viewingBankPlayerId === "self" || viewingBankPlayerId === you?.id || viewingBankPlayerId === actualPlayerId
      ? you
      : gameState.players[viewingBankPlayerId] ||
        Object.values(gameState.players).find((p) => p.id === viewingBankPlayerId);

  if (!bankPlayer) return null;

  return (
    <DialogShell isOpen={Boolean(viewingBankPlayerId && bankPlayer)} onClose={onClose} size="sm" zIndex={400}>
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
                <Card card={resolveCardDef(c)} size="xs" isInteractive={false} currentColor={c.currentColor} />
                <span className="game-bank-modal-card-val">${c.value}M Cash</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogShell>
  );
}
