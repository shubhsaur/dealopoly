"use client";

import type { PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";
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
    <DialogShell isOpen={Boolean(moveBuildingTarget)} onClose={onClose} size="md" zIndex={210}>
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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
            <Card
              card={resolveCardDef(
                moveBuildingTarget.buildingType === "house"
                  ? moveBuildingTarget.fromSet.houseCard!
                  : moveBuildingTarget.fromSet.hotelCard!,
              )}
              size="xs"
              isInteractive={false}
            />
          </div>
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
    </DialogShell>
  );
}
