"use client";

import React from "react";
import type { CardProps } from "./types";
import { MonopolyMSymbol, HasbroChevronBackground, HasbroPennybagsWatermark } from "./glyphs";

export interface HasbroMoneyTheme {
  cardstock: string;
  frameGradient: string;
  guillocheStroke: string;
  watermarkStroke: string;
  watermarkFill: string;
  brandColor: string;
  ghostColor: string;
  centerBg: string;
  centerNumX: number;
  centerNumY: number;
  centerNumSize: number;
  centerStrokeOuter: number;
  centerStrokeInner: number;
  mTransform: string;
  coinNumSize?: string;
  ghostLeftSize?: string;
  ghostLeftPos?: { bottom?: string; left?: string };
  ghostRightPos?: { bottom?: string; right?: string };
}


export const HASBRO_MONEY_THEMES: Record<number, HasbroMoneyTheme> = {
  1: {
    cardstock: "#FAF8F2",
    frameGradient: "linear-gradient(145deg, #F6F4EB 0%, #E7EFE4 35%, #F5EDE4 70%, #ECE7DE 100%)",
    guillocheStroke: "rgba(75, 95, 70, 0.18)",
    watermarkStroke: "#4D6D47",
    watermarkFill: "#DCE7D8",
    brandColor: "#FFFFFF",
    ghostColor: "#728F6A",
    centerBg: "#FAF8F2",
    centerNumX: 102,
    centerNumY: 125,
    centerNumSize: 108,
    centerStrokeOuter: 20,
    centerStrokeInner: 10,
    mTransform: "translate(24, 40) scale(1.2)",
    coinNumSize: "1.38em",
    ghostLeftSize: "5.6em",
    ghostLeftPos: { bottom: "-0.2em", left: "0.2em" },
    ghostRightPos: { bottom: "0.6em", right: "0.6em" },
  },
  2: {
    cardstock: "#F84B82",
    frameGradient: "linear-gradient(175deg, #FFD7E6 0%, #FBAEC8 45%, #EE558C 100%)",
    guillocheStroke: "rgba(185, 30, 90, 0.22)",
    watermarkStroke: "#A6134E",
    watermarkFill: "#FBAEC8",
    brandColor: "#F84B82",
    ghostColor: "#A6134E",
    centerBg: "#F84B82",
    centerNumX: 98,
    centerNumY: 125,
    centerNumSize: 106,
    centerStrokeOuter: 22,
    centerStrokeInner: 12,
    mTransform: "translate(24, 38) scale(1.2)",
    coinNumSize: "1.35em",
    ghostLeftSize: "5.6em",
    ghostLeftPos: { bottom: "-0.2em", left: "0.2em" },
    ghostRightPos: { bottom: "0.6em", right: "0.6em" },
  },
  3: {
    cardstock: "#3DB4E8",
    frameGradient: "linear-gradient(175deg, #B5EBFB 0%, #89DCF8 45%, #58CAF2 100%)",
    guillocheStroke: "rgba(15, 110, 160, 0.22)",
    watermarkStroke: "#0E6593",
    watermarkFill: "#89DCF8",
    brandColor: "#3DB4E8",
    ghostColor: "#0E6593",
    centerBg: "#3DB4E8",
    centerNumX: 100,
    centerNumY: 125,
    centerNumSize: 106,
    centerStrokeOuter: 22,
    centerStrokeInner: 12,
    mTransform: "translate(24, 38) scale(1.2)",
    coinNumSize: "1.35em",
    ghostLeftSize: "5.6em",
    ghostLeftPos: { bottom: "-0.2em", left: "0.2em" },
    ghostRightPos: { bottom: "0.6em", right: "0.6em" },
  },
  4: {
    cardstock: "#70C63E",
    frameGradient: "linear-gradient(175deg, #BDE75A 0%, #AEE048 45%, #9CD83B 100%)",
    guillocheStroke: "rgba(62, 119, 28, 0.22)",
    watermarkStroke: "#3E771C",
    watermarkFill: "#BEE65C",
    brandColor: "#70C63E",
    ghostColor: "#3E771C",
    centerBg: "#70C63E",
    centerNumX: 96,
    centerNumY: 125,
    centerNumSize: 106,
    centerStrokeOuter: 22,
    centerStrokeInner: 12,
    mTransform: "translate(24, 38) scale(1.2)",
    coinNumSize: "1.35em",
    ghostLeftSize: "5.6em",
    ghostLeftPos: { bottom: "-0.2em", left: "0.2em" },
    ghostRightPos: { bottom: "0.6em", right: "0.6em" },
  },
  5: {
    cardstock: "#9B5AA4",
    frameGradient: "linear-gradient(175deg, #DEBEE6 0%, #C996D4 45%, #B473C3 100%)",
    guillocheStroke: "rgba(100, 30, 115, 0.22)",
    watermarkStroke: "#5C1E68",
    watermarkFill: "#C996D4",
    brandColor: "#9B5AA4",
    ghostColor: "#631C6E",
    centerBg: "#9B5AA4",
    centerNumX: 98,
    centerNumY: 125,
    centerNumSize: 106,
    centerStrokeOuter: 22,
    centerStrokeInner: 12,
    mTransform: "translate(24, 38) scale(1.2)",
    coinNumSize: "1.35em",
    ghostLeftSize: "5.6em",
    ghostLeftPos: { bottom: "-0.2em", left: "0.2em" },
    ghostRightPos: { bottom: "0.6em", right: "0.6em" },
  },
  10: {
    cardstock: "#F58220",
    frameGradient: "linear-gradient(175deg, #FFBE80 0%, #FFA14D 45%, #F58220 100%)",
    guillocheStroke: "rgba(195, 75, 0, 0.25)",
    watermarkStroke: "#B34A00",
    watermarkFill: "#FFA14D",
    brandColor: "#F58220",
    ghostColor: "#BD5000",
    centerBg: "#F58220",
    centerNumX: 98,
    centerNumY: 120,
    centerNumSize: 84,
    centerStrokeOuter: 18,
    centerStrokeInner: 10,
    mTransform: "translate(14, 56) scale(1.15)",
    coinNumSize: "1.28em",
    ghostLeftSize: "4.6em",
    ghostLeftPos: { bottom: "-0.2em", left: "0.15em" },
    ghostRightPos: { bottom: "0.5em", right: "0.45em" },
  },
};

/**
 * Authentic Hasbro Monopoly Deal Money Card
 * Faithfully matches the official Hasbro Money card reference designs across all denominations
 */

export const HasbroMoneyCard = React.memo(function HasbroMoneyCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value || 4;
  const theme: HasbroMoneyTheme = HASBRO_MONEY_THEMES[value] ?? (HASBRO_MONEY_THEMES[4] as HasbroMoneyTheme);

  return (
    <div
      onClick={onClick}
      className={`hasbro-money-card hasbro-money-card--${size} ${
        isInteractive ? "hasbro-money-card--interactive" : "hasbro-money-card--disabled"
      } ${className}`}
      style={
        {
          "--money-cardstock": theme.cardstock,
          "--money-frame-bg": theme.frameGradient,
          "--money-center-bg": theme.centerBg,
          "--money-brand-color": theme.brandColor,
          "--money-ghost-color": theme.ghostColor,
        } as React.CSSProperties
      }
      role="img"
      aria-label={`$${value}M Dealopoly Money Card (Hasbro Edition)`}
    >
      <div className="hasbro-money-frame">
        {/* Subtle Security Chevron Guilloche Pattern */}
        <HasbroChevronBackground
          strokeColor={theme.guillocheStroke}
          id={`hasbroMoneyHerringbone-${value}`}
        />

        {/* Top-Right Watermark: Rich Uncle Pennybags (Mr. Monopoly) */}
        <HasbroPennybagsWatermark
          stroke={theme.watermarkStroke}
          fill={theme.watermarkFill}
        />

        {/* Top-Left Circular Coin Value Badge */}
        <div className="hasbro-money-coin">
          <span className="hasbro-coin-val">
            <MonopolyMSymbol
              size="0.65em"
              style={{ marginRight: "1.5px", marginTop: "0.12em" }}
            />
            <span
              className="hasbro-coin-num"
              style={theme.coinNumSize ? { fontSize: theme.coinNumSize } : undefined}
            >
              {value}
            </span>
          </span>
        </div>

        {/* Central Circular Feature Badge */}
        <div className="hasbro-money-circle-badge">
          <svg viewBox="0 0 160 160" className="hasbro-money-center-svg">
            {/* Double-barred M Symbol */}
            <g
              transform={theme.mTransform}
              stroke="#111111"
              strokeWidth="2.4"
              fill="none"
            >
              <path
                d="M2.5 17.5V2.5h3.6l3.9 6.8 3.9-6.8h3.6v15h-3.2V7.2L10.8 13.2h-1.6L5.7 7.2v10.3H2.5z"
                fill="#111111"
              />
              <rect x="0.5" y="7.5" width="19" height="2" rx="0.5" fill="#111111" />
              <rect x="0.5" y="11.5" width="19" height="2" rx="0.5" fill="#111111" />
            </g>

            {/* Giant Numeral with Triple-Layer Double-Contour */}
            {/* Layer 1: Heavy Black Outer Stroke */}
            <text
              x={theme.centerNumX}
              y={theme.centerNumY}
              fill="#111111"
              stroke="#111111"
              strokeWidth={theme.centerStrokeOuter}
              strokeLinejoin="miter"
              strokeMiterlimit="3"
              fontSize={theme.centerNumSize}
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
            >
              {value}
            </text>

            {/* Layer 2: Theme Inner Gap Stroke */}
            <text
              x={theme.centerNumX}
              y={theme.centerNumY}
              fill={theme.centerBg}
              stroke={theme.centerBg}
              strokeWidth={theme.centerStrokeInner}
              strokeLinejoin="miter"
              strokeMiterlimit="3"
              fontSize={theme.centerNumSize}
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
            >
              {value}
            </text>

            {/* Layer 3: Solid Black Core Numeral */}
            <text
              x={theme.centerNumX}
              y={theme.centerNumY}
              fill="#111111"
              stroke="#111111"
              strokeWidth="2"
              fontSize={theme.centerNumSize}
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
            >
              {value}
            </text>
          </svg>
        </div>

        {/* "DEALOPOLY" Brand Plaque directly underneath Circle */}
        <div className="hasbro-money-brand-wrap">
          <div className="hasbro-money-brand-pill">
            <span className="hasbro-money-brand-text">DEALOPOLY</span>
            <span className="hasbro-money-brand-sub">® BRAND</span>
          </div>
        </div>

        {/* Bottom Giant Ghosted Watermarks */}
        <div
          className="hasbro-money-ghost-left"
          style={{
            fontSize: theme.ghostLeftSize || "5.6em",
            ...(theme.ghostLeftPos || {}),
          }}
        >
          {value}
        </div>
        <div
          className="hasbro-money-ghost-right"
          style={{
            ...(theme.ghostRightPos || {}),
          }}
        >
          <MonopolyMSymbol
            size={value === 10 ? "3.0em" : "3.4em"}
            style={{ opacity: 0.45, color: theme.ghostColor }}
          />
        </div>
      </div>
    </div>
  );
});

