"use client";

import React from "react";
import { COLOR_CONFIG } from "@dealopoly/shared";
import type { CardProps } from "./types";
import { MonopolyMSymbol, HasbroPropertyCountGlyph } from "./glyphs";

export const HasbroPropertyCard = React.memo(function HasbroPropertyCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const primaryConfig = card.primaryColor
    ? COLOR_CONFIG[card.primaryColor]
    : undefined;

  // Authentic Hasbro palette matching reference cards:
  // - Utility cards (Electric Company, Water Works) have light sage/mint green banner
  // - Dark Blue matches royal dark blue #0071BC
  // - Railroad has classic dark slate/black banner
  const primaryHex =
    card.primaryColor === "utility"
      ? "#B8DBBE"
      : card.primaryColor === "dark-blue"
      ? "#0071BC"
      : card.primaryColor === "railroad"
      ? "#1F2327"
      : primaryConfig?.hex ?? "#0071BC";

  const isDarkText =
    card.primaryColor === "yellow" ||
    card.primaryColor === "light-blue" ||
    card.primaryColor === "orange" ||
    card.primaryColor === "utility" ||
    primaryConfig?.textHex === "#111415";

  // Legible accent color for mini card numbers on white background
  const miniCardTextColor =
    card.primaryColor === "yellow"
      ? "#B8860B"
      : card.primaryColor === "light-blue"
      ? "#0284C7"
      : card.primaryColor === "utility"
      ? "#2D6A4F"
      : card.primaryColor === "orange"
      ? "#C25E00"
      : primaryHex;

  // Display name (preserve iconic PARK PLACE for prop-park-lane)
  const isParkLane = card.id === "prop-park-lane";
  const displayName = (isParkLane ? "PARK PLACE" : card.name).toUpperCase();
  const titleLength = displayName.length;
  const titleSizeClass =
    titleLength >= 18
      ? "hasbro-card-title--long"
      : titleLength >= 13
      ? "hasbro-card-title--medium"
      : "";

  const effectiveRentTiers =
    card.rentTiers && card.rentTiers.length > 0
      ? card.rentTiers
      : primaryConfig?.rentTiers
      ? primaryConfig.rentTiers.map((rent, idx) => ({
          setCount: idx + 1,
          rent,
          isComplete: idx + 1 === (primaryConfig.setSize || card.setSize || 3),
        }))
      : [];

  const tierCount = effectiveRentTiers.length || 3;

  return (
    <div
      onClick={onClick}
      style={{ "--card-color": primaryHex } as React.CSSProperties}
      className={`hasbro-card hasbro-card--${size} ${
        isInteractive ? "hasbro-card--interactive" : "hasbro-card--disabled"
      } ${className}`}
      role="img"
      aria-label={`${displayName} (Hasbro Monopoly Deal Edition)`}
    >
      <div className="hasbro-card-frame">
        {/* Top Color Banner */}
        <div
          className={`hasbro-card-banner ${
            isDarkText ? "hasbro-card-banner--dark-text" : ""
          }`}
          style={{ background: primaryHex }}
        >
          <h3 className={`hasbro-card-title ${titleSizeClass}`}>{displayName}</h3>
        </div>

        {/* Top-Left Circular Coin Value Badge Straddling Header/Body Line */}
        {card.value > 0 && (
          <div className="hasbro-card-coin">
            <span className="hasbro-coin-val">
              <MonopolyMSymbol
                size="0.65em"
                style={{ marginRight: "1.5px", marginTop: "0.12em" }}
              />
              <span className="hasbro-coin-num">{card.value}</span>
            </span>
          </div>
        )}

        {/* Card Body with Rent Table */}
        <div className={`hasbro-card-body hasbro-card-body--tiers-${tierCount}`}>
          {/* Table Header: PROPERTIES OWNED / RENT */}
          <div className="hasbro-table-header">
            <div className="hasbro-header-left">
              <span>PROPERTIES</span>
              <span>OWNED</span>
            </div>
            <div className="hasbro-header-right">
              <span>RENT</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="hasbro-table-rows">
            {effectiveRentTiers.map((tier) => (
              <div key={tier.setCount} className="hasbro-table-row">
                <div className="hasbro-mini-card-col">
                  <HasbroPropertyCountGlyph
                    count={tier.setCount}
                    color={primaryHex}
                    isComplete={tier.isComplete}
                    textColor={miniCardTextColor}
                  />
                  {tier.isComplete && (
                    <div className="hasbro-complete-tag">
                      <span>COMPLETE</span>
                      <span>SET</span>
                    </div>
                  )}
                </div>

                <div className="hasbro-rent-col">
                  <div className="hasbro-rent-amount">
                    <MonopolyMSymbol
                      size="0.65em"
                      style={{
                        marginRight: "3px",
                        marginTop: "0.16em",
                      }}
                    />
                    <span className="hasbro-rent-digit">{tier.rent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hasbro-card-bottom-spacer" />
        </div>
      </div>
    </div>
  );
});
