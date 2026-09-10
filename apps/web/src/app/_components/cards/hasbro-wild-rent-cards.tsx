"use client";

import React from "react";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import type { CardProps } from "./types";
import { MonopolyMSymbol, HasbroChevronBackground, HasbroActionHeaderGlyph, HasbroDualWildPropertyCountGlyph, HasbroMoneyStackGlyph } from "./glyphs";

export const HasbroWildAllCard = React.memo(function HasbroWildAllCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`hasbro-wild-card hasbro-wild-card--${size} ${
        isInteractive ? "hasbro-wild-card--interactive" : "hasbro-wild-card--disabled"
      } ${className}`}
      role="img"
      aria-label="Hasbro Monopoly Deal Wild Property Card (All Sets)"
    >
      <div className="hasbro-wild-frame">
        <svg viewBox="0 0 240 370" className="hasbro-wild-svg">
          <defs>
            {/* Header Rainbow Gradient */}
            <linearGradient id="hasbroWildRainbow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EE2A7B" />
              <stop offset="14%" stopColor="#ED1B24" />
              <stop offset="32%" stopColor="#F7941D" />
              <stop offset="52%" stopColor="#FFDE00" />
              <stop offset="70%" stopColor="#00A651" />
              <stop offset="86%" stopColor="#00AEEF" />
              <stop offset="100%" stopColor="#2E3192" />
            </linearGradient>

            {/* Letter Fill Rainbow Gradient for WILD */}
            <linearGradient id="hasbroWildLetters" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EE2A7B" />
              <stop offset="16%" stopColor="#ED1B24" />
              <stop offset="36%" stopColor="#F7941D" />
              <stop offset="56%" stopColor="#FFDE00" />
              <stop offset="74%" stopColor="#00A651" />
              <stop offset="90%" stopColor="#00AEEF" />
              <stop offset="100%" stopColor="#2E3192" />
            </linearGradient>

            {/* Property Letter Rainbow Gradient */}
            <linearGradient id="hasbroPropLetters" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ED1B24" />
              <stop offset="18%" stopColor="#F7941D" />
              <stop offset="38%" stopColor="#FFDE00" />
              <stop offset="58%" stopColor="#00A651" />
              <stop offset="78%" stopColor="#00AEEF" />
              <stop offset="100%" stopColor="#1B365D" />
            </linearGradient>

            {/* Rainbow Bar for Mini Card 3 */}
            <linearGradient id="hasbroMiniRainbow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ED1B24" />
              <stop offset="25%" stopColor="#F7941D" />
              <stop offset="50%" stopColor="#FFDE00" />
              <stop offset="75%" stopColor="#00A651" />
              <stop offset="100%" stopColor="#00AEEF" />
            </linearGradient>
          </defs>

          {/* Cream Base Background for the Entire Card */}
          <rect width="240" height="370" fill="#F8F9F3" />

          {/* Top Rainbow Header Bar (x=0 to 240, y=0 to 68) */}
          <rect x="0" y="0" width="240" height="68" fill="url(#hasbroWildRainbow)" />

          {/* Solid Black 3D Shadow for WILD in Upper Right */}
          <polygon points="168,10 240,22 240,68 180,68" fill="#111111" />

          {/* The Angled Black Banner & Right Field Shape */}
          {/* Crisp diagonal bottom edge from (34, 168) down-right to (240, 282) */}
          <path
            d="M20,68
               L240,68
               L240,282
               L34,168
               C22,162 14,148 14,130
               C14,110 14,88 18,74
               C19,70 20,68 20,68 Z"
            fill="#111111"
          />

          {/* Three Floating Mini Property Cards (in Black Zone on Right) */}
          {/* Card 1 (Top-Right, tilted right) */}
          <g transform="translate(196, 142) rotate(14)">
            <rect x="-13" y="-18" width="26" height="36" rx="2.5" fill="#FFFFFF" stroke="#111111" strokeWidth="1.4" />
            <rect x="-11.5" y="-16.5" width="23" height="9.5" rx="1.2" fill="#ED1B24" />
            <line x1="-8" y1="-1" x2="8" y2="-1" stroke="#888888" strokeWidth="1.3" />
            <line x1="-8" y1="4" x2="6" y2="4" stroke="#888888" strokeWidth="1.3" />
            {/* White sparkle ticks */}
            <line x1="18" y1="-8" x2="24" y2="-13" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="20" y1="4" x2="26" y2="3" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* Card 2 (Upper-Left of Card 1, tilted left) */}
          <g transform="translate(158, 160) rotate(-16)">
            <rect x="-11" y="-15" width="22" height="30" rx="2.2" fill="#FFFFFF" stroke="#111111" strokeWidth="1.3" />
            <rect x="-9.8" y="-13.8" width="19.6" height="8" rx="1" fill="#EE314E" />
            <line x1="-7" y1="-1" x2="7" y2="-1" stroke="#888888" strokeWidth="1.1" />
            <line x1="-7" y1="3.5" x2="5" y2="3.5" stroke="#888888" strokeWidth="1.1" />
            <line x1="-7" y1="8" x2="6" y2="8" stroke="#888888" strokeWidth="1.1" />
            {/* Ticks */}
            <line x1="-15" y1="-2" x2="-20" y2="-5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <line x1="-13" y1="9" x2="-18" y2="10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Card 3 (Bottom, Rainbow Multi-Color, tilted right) */}
          <g transform="translate(182, 196) rotate(18)">
            <rect x="-12" y="-17" width="24" height="34" rx="2.4" fill="#FFFFFF" stroke="#111111" strokeWidth="1.4" />
            <rect x="-10.5" y="-15.5" width="21" height="9" rx="1.2" fill="url(#hasbroMiniRainbow)" />
            <line x1="-7" y1="-1" x2="7" y2="-1" stroke="#888888" strokeWidth="1.2" />
            <line x1="-7" y1="3.5" x2="5" y2="3.5" stroke="#888888" strokeWidth="1.2" />
            {/* Radiating action dashes */}
            <line x1="-15" y1="-8" x2="-20" y2="-12" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="-16" y1="5" x2="-21" y2="4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="13" x2="21" y2="17" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* Top Text: WILD (Big, bold, italic with black 3D extrusion) */}
          <g id="wildGroup">
            {/* Solid Black 3D Shadow */}
            <text
              x="110"
              y="47"
              fill="#111111"
              stroke="#111111"
              strokeWidth="10"
              strokeLinejoin="miter"
              strokeMiterlimit="3"
              fontSize="64"
              fontWeight="900"
              fontStyle="italic"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
              letterSpacing="-0.02em"
            >
              WILD
            </text>
            {/* Front Face */}
            <text
              x="105"
              y="50"
              fill="url(#hasbroWildLetters)"
              stroke="#111111"
              strokeWidth="4.2"
              strokeLinejoin="miter"
              strokeMiterlimit="3"
              fontSize="64"
              fontWeight="900"
              fontStyle="italic"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
              letterSpacing="-0.02em"
            >
              WILD
            </text>
          </g>

          {/* Sub-Header: PROPERTY (Bold, wide, rainbow gradient) */}
          <g id="propertyGroup">
            {/* Front Face (sitting on black banner) */}
            <text
              x="110"
              y="83"
              fill="url(#hasbroPropLetters)"
              stroke="#111111"
              strokeWidth="2.2"
              strokeLinejoin="miter"
              strokeMiterlimit="3"
              fontSize="28"
              fontWeight="900"
              fontStyle="italic"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
              letterSpacing="0.04em"
            >
              PROPERTY
            </text>
          </g>

          {/* Angled Action Text in Black Banner: "USE THIS CARD AS" / "PART OF ANY SET" */}
          <g transform="rotate(-8, 114, 126)">
            <text
              x="114"
              y="118"
              fill="#FFFFFF"
              fontSize="18"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
              letterSpacing="0.02em"
            >
              USE THIS CARD AS
            </text>
            <text
              x="114"
              y="141"
              fill="#FFFFFF"
              fontSize="18"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
              letterSpacing="0.02em"
            >
              PART OF ANY SET
            </text>
          </g>

          {/* Rich Uncle Pennybags (Mr. Monopoly) - Fills bottom ~50% with hat held ABOVE his head */}
          <g id="unclePennybagsFull" transform="translate(126, 272) scale(1.18)">
            {/* Motion lines behind kicked foot */}
            <path d="M-60 38 C-66 52 -50 62 -40 60" stroke="#111111" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M-50 44 C-56 56 -42 64 -32 62" stroke="#111111" strokeWidth="2.4" fill="none" strokeLinecap="round" />

            {/* Walking Cane (in left hand, angled down to right) */}
            <g id="cane">
              <path
                d="M24 10 L38 46"
                stroke="#111111"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M24 10 L38 46"
                stroke="#FFFFFF"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              {/* Curved Cane Handle (J-curve) */}
              <path
                d="M17 12 C13 4 23 -2 29 4 C33 8 29 16 23 12"
                fill="none"
                stroke="#111111"
                strokeWidth="4.8"
                strokeLinecap="round"
              />
              <path
                d="M17 12 C13 4 23 -2 29 4 C33 8 29 16 23 12"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </g>

            {/* Billowing Coattails (Behind on Right) */}
            <path
              d="M12 2 C36 -2 44 22 38 34 C26 42 16 30 6 20 Z"
              fill="#111111"
              stroke="#111111"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Kicking Leg (Forward Left) */}
            <path
              d="M-10 16 C-24 24 -44 28 -58 22 C-56 30 -46 32 -32 32 C-20 32 -6 26 -2 18 Z"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            {/* Kicking Shoe */}
            <path
              d="M-58 22 C-66 20 -72 24 -70 28 C-66 32 -58 32 -52 30 Z"
              fill="#111111"
              stroke="#111111"
              strokeWidth="1.8"
            />

            {/* Planted Standing Leg (Right) */}
            <path
              d="M-2 18 C0 32 4 48 6 56 C12 56 16 54 14 44 C12 34 8 22 6 16 Z"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            {/* Planted Shoe */}
            <path
              d="M6 56 C6 62 14 64 20 62 C20 58 14 54 6 56 Z"
              fill="#111111"
              stroke="#111111"
              strokeWidth="1.8"
            />

            {/* Tuxedo Jacket Body (Black) */}
            <path
              d="M-20 -18 C-14 -12 6 -12 18 -10 C22 4 18 16 4 18 C-12 18 -22 10 -22 -6 Z"
              fill="#111111"
              stroke="#111111"
              strokeWidth="2.2"
            />

            {/* White Vest */}
            <polygon
              points="-12,-14 6,-12 4,14 -10,12"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.8"
            />
            {/* Vest Buttons */}
            <circle cx="-3" cy="-5" r="1.4" fill="#111111" />
            <circle cx="-3" cy="2" r="1.4" fill="#111111" />
            <circle cx="-3" cy="9" r="1.4" fill="#111111" />

            {/* White Collar & Black Bowtie */}
            <polygon points="-8,-16 2,-16 -3,-8" fill="#FFFFFF" stroke="#111111" strokeWidth="1.2" />
            <polygon points="-7,-16 -2,-13 -7,-10" fill="#111111" />
            <polygon points="1,-16 -4,-13 1,-10" fill="#111111" />
            <circle cx="-3" cy="-13" r="1.2" fill="#111111" />

            {/* Left Arm & Hand (Holding Cane) */}
            <path
              d="M8 -6 C16 -2 24 6 22 14"
              stroke="#111111"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            {/* White Glove holding handle */}
            <ellipse cx="22" cy="14" rx="5" ry="4" fill="#FFFFFF" stroke="#111111" strokeWidth="1.8" />
            <path d="M20 12 C24 12 26 14 25 17" stroke="#111111" strokeWidth="1.2" fill="none" />

            {/* Right Arm (Reaching up to Hat Brim above Head) */}
            <path
              d="M-18 -10 C-30 -20 -30 -38 -20 -50 C-16 -54 -8 -56 2 -56"
              stroke="#111111"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* White Shirt Cuff */}
            <rect x="-3" y="-60" width="5.5" height="4.5" rx="1" fill="#FFFFFF" stroke="#111111" strokeWidth="1.2" />
            {/* White Gloved Hand gripping Brim */}
            <ellipse cx="3" cy="-57" rx="5.5" ry="4" fill="#FFFFFF" stroke="#111111" strokeWidth="1.8" />
            <line x1="2" y1="-59" x2="4" y2="-53" stroke="#111111" strokeWidth="1.2" />

            {/* Head & Bald Dome (Right below the Hat) */}
            <ellipse cx="-2" cy="-24" rx="16" ry="15" fill="#FFFFFF" stroke="#111111" strokeWidth="2.4" />
            {/* Ear */}
            <path d="M-18 -24 C-20 -21 -19 -16 -17 -18" fill="#FFFFFF" stroke="#111111" strokeWidth="1.8" />

            {/* Happy Eyes */}
            <ellipse cx="-8" cy="-29" rx="2.2" ry="2.6" fill="#111111" />
            <ellipse cx="4" cy="-29" rx="2.2" ry="2.6" fill="#111111" />

            {/* Curved Arched Eyebrows */}
            <path d="M-12 -34 Q-8 -38 -4 -34" stroke="#111111" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M0 -34 Q4 -38 8 -34" stroke="#111111" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Cute Round Nose */}
            <ellipse cx="-2" cy="-25" rx="3.5" ry="2.8" fill="#FFFFFF" stroke="#111111" strokeWidth="1.8" />

            {/* Big Fluffy White Mustache */}
            <path
              d="M-2 -22 C-10 -26 -22 -22 -25 -16 C-16 -14 -8 -17 -2 -18 C4 -17 12 -14 21 -16 C18 -22 6 -26 -2 -22 Z"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Happy Open Smile Line */}
            <path d="M-7 -14 Q-2 -9 3 -14" stroke="#111111" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* The Top Hat (FLOATING CLEARLY ABOVE HIS HEAD, TIPPED TO THE RIGHT) */}
            <g transform="translate(10, -68) rotate(16)">
              {/* Hat Crown Body (White with Black Outline, matching Hasbro reference) */}
              <path
                d="M-14 8 L-10 -26 L24 -22 L18 10 Z"
                fill="#FFFFFF"
                stroke="#111111"
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
              {/* Black Hatband */}
              <polygon
                points="-13,3 -12,-5 19,-2 18,5"
                fill="#111111"
                stroke="#111111"
                strokeWidth="1.2"
              />
              {/* Wide Curved Brim (Tipped in Air) */}
              <path
                d="M-26 12 C-10 4 14 6 34 16 C18 10 -6 10 -26 12 Z"
                fill="#FFFFFF"
                stroke="#111111"
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
              <path
                d="M-26 12 Q2 4 34 16"
                stroke="#111111"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Frame Perimeter Outline */}
          <rect
            x="0"
            y="0"
            width="240"
            height="370"
            fill="none"
            stroke="#111111"
            strokeWidth="3.6"
          />
        </svg>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Pass Go Card
 * Faithfully matches official Hasbro Pass Go reference photo (white cardstock, ₥1 coin, 3D ACTION, PASS GO badge with left arrow, Draw 2 cards)
 */


function getHasbroRentColorHex(color?: string): string {
  switch (color) {
    case "red":
      return "#ED1B24";
    case "yellow":
      return "#FFDE00";
    case "green":
      return "#00A651";
    case "dark-blue":
      return "#0071BC";
    case "brown":
      return "#8B4513";
    case "light-blue":
      return "#5BC8E8";
    case "pink":
      return "#D83A8F";
    case "orange":
      return "#F28C28";
    case "railroad":
      return "#1F2327";
    case "utility":
      return "#B8DBBE";
    default:
      return color && COLOR_CONFIG[color as keyof typeof COLOR_CONFIG]?.hex
        ? COLOR_CONFIG[color as keyof typeof COLOR_CONFIG].hex
        : "#ED1B24";
  }
}

/**
 * Authentic Hasbro Monopoly Deal Rent Card
 * Faithfully matches the official Hasbro Rent card reference photo (Red / Yellow and all dual-color pairs)
 */


export const HasbroRentCard = React.memo(function HasbroRentCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const isWildRent =
    card.id === "rent-wild" ||
    (card.type === "rent" && (card as { primaryColor?: string }).primaryColor === "all");

  const primaryConfig = card.primaryColor
    ? COLOR_CONFIG[card.primaryColor]
    : undefined;
  const secondaryConfig = card.secondaryColor
    ? COLOR_CONFIG[card.secondaryColor]
    : undefined;

  const leftColorHex = getHasbroRentColorHex(card.primaryColor);
  const rightColorHex = getHasbroRentColorHex(card.secondaryColor);

  const leftColorName = (primaryConfig?.name ?? card.primaryColor ?? "red").toUpperCase();
  const rightColorName = (secondaryConfig?.name ?? card.secondaryColor ?? "yellow").toUpperCase();
  const isLongColorName = leftColorName.length >= 8 || rightColorName.length >= 8;

  return (
    <div
      onClick={onClick}
      className={`hasbro-rent-card hasbro-rent-card--${size} ${
        isWildRent ? "hasbro-rent-card--wild" : ""
      } ${
        isInteractive ? "hasbro-rent-card--interactive" : "hasbro-rent-card--disabled"
      } ${className}`}
      role="img"
      aria-label={`${card.name} (Hasbro Monopoly Deal Edition)`}
    >
      <div className="hasbro-rent-frame">
        {/* Subtle Security Chevron Guilloche Pattern */}
        <HasbroChevronBackground
          strokeColor={isWildRent ? "rgba(14, 110, 160, 0.16)" : undefined}
          id={`hasbro-rent-chevron-${card.id}`}
        />

        {/* Top-Left Circular Coin Value Badge */}
        {card.value > 0 && (
          <div className="hasbro-rent-coin">
            <span className="hasbro-coin-val">
              <MonopolyMSymbol
                size="0.65em"
                style={{ marginRight: "1.5px", marginTop: "0.12em" }}
              />
              <span className="hasbro-coin-num">{card.value}</span>
            </span>
          </div>
        )}

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-rent-header-row">
          <HasbroActionHeaderGlyph
            className="hasbro-rent-action-svg"
            frontFill="#FFFFFF"
            shadowColor={isWildRent ? "#42A6D8" : "#111111"}
            strokeColor={isWildRent ? "#308FB8" : "#111111"}
            strokeWidth={isWildRent ? 2.6 : 3.6}
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        {/* Central Circular Badge with Dual Border Rings */}
        <div className="hasbro-rent-circle-badge">
          {/* Top Segment: "RENT" */}
          <div className="hasbro-rent-circle-top">
            <h3 className="hasbro-rent-circle-title">RENT</h3>
          </div>

          {/* Middle Segment: Rainbow or Split Color Banner with 3D Cash Stack */}
          {isWildRent ? (
            <div
              className="hasbro-rent-circle-middle hasbro-rent-circle-middle--wild"
              style={{
                background:
                  "linear-gradient(to right, #ED1B24 0%, #F37023 16%, #FFDE00 32%, #00A651 48%, #00ADEF 64%, #2E3192 80%, #662D91 100%)",
              }}
            >
              {/* 3D Banknote Stack */}
              <div className="hasbro-rent-money-stack-wrap">
                <HasbroMoneyStackGlyph />
              </div>
            </div>
          ) : (
            <div className="hasbro-rent-circle-middle">
              <div
                className="hasbro-rent-color-half"
                style={{ backgroundColor: leftColorHex }}
              />
              <div className="hasbro-rent-color-divider" />
              <div
                className="hasbro-rent-color-half"
                style={{ backgroundColor: rightColorHex }}
              />

              {/* 3D Banknote Stack Straddling the Center Divider */}
              <div className="hasbro-rent-money-stack-wrap">
                <HasbroMoneyStackGlyph />
              </div>
            </div>
          )}

          {/* Bottom Segment */}
          <div className="hasbro-rent-circle-bottom">
            <p
              className="hasbro-rent-choose-label"
              style={{
                fontSize: isWildRent ? "0.82em" : isLongColorName ? "0.66em" : "0.74em",
                lineHeight: isWildRent ? 1.15 : 1.12,
              }}
            >
              {isWildRent ? (
                <>
                  <span style={{ whiteSpace: "nowrap" }}>CHOOSE ANY</span>
                  <br />
                  <span style={{ whiteSpace: "nowrap" }}>COLOR</span>
                </>
              ) : (
                <>
                  <span style={{ whiteSpace: "nowrap" }}>CHOOSE {leftColorName}</span>
                  <br />
                  <span style={{ whiteSpace: "nowrap" }}>OR {rightColorName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-rent-desc">
          {isWildRent ? (
            <>
              <span>Choose any one player</span>
              <br />
              <span>and collect rent from that</span>
              <br />
              <span>player for each property</span>
              <br />
              <span>you own in that color.</span>
            </>
          ) : (
            <>
              <span>Collect rent from</span>
              <br />
              <span>each player for each</span>
              <br />
              <span>property you own</span>
              <br />
              <span>in that color.</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});



function getHasbroDualWildColorHex(color?: string): string {
  switch (color) {
    case "light-blue":
      return "#BCE0F5"; // Authentic pastel sky blue matching Hasbro photo
    case "yellow":
      return "#FFDE00";
    case "red":
      return "#ED1B24";
    case "green":
      return "#00A651";
    case "dark-blue":
      return "#0071BC";
    case "brown":
      return "#8B4513";
    case "pink":
      return "#D83A8F";
    case "orange":
      return "#F28C28";
    case "railroad":
      return "#1F2327";
    case "utility":
      return "#B8DBBE";
    default:
      return getHasbroRentColorHex(color);
  }
}



export const HasbroDualWildPropertyCard = React.memo(
  function HasbroDualWildPropertyCard({
    card,
    size = "md",
    isInteractive = true,
    className = "",
    onClick,
    currentColor,
  }: CardProps) {
    const isFlipped = currentColor && card.secondaryColor && currentColor === card.secondaryColor;

    const activePrimaryColor = isFlipped ? card.secondaryColor : card.primaryColor;
    const activeSecondaryColor = isFlipped ? card.primaryColor : card.secondaryColor;

    const primaryConfig = activePrimaryColor
      ? COLOR_CONFIG[activePrimaryColor]
      : undefined;
    const secondaryConfig = activeSecondaryColor
      ? COLOR_CONFIG[activeSecondaryColor]
      : undefined;

    const primaryHex = getHasbroDualWildColorHex(activePrimaryColor);
    const secondaryHex = getHasbroDualWildColorHex(activeSecondaryColor);

    const isPrimaryDarkText =
      activePrimaryColor === "yellow" ||
      activePrimaryColor === "light-blue" ||
      activePrimaryColor === "orange" ||
      activePrimaryColor === "utility";

    const isSecondaryDarkText =
      activeSecondaryColor === "yellow" ||
      activeSecondaryColor === "light-blue" ||
      activeSecondaryColor === "orange" ||
      activeSecondaryColor === "utility";

    const primaryMiniTextColor =
      activePrimaryColor === "yellow"
        ? "#B8860B"
        : activePrimaryColor === "light-blue"
        ? "#0284C7"
        : activePrimaryColor === "utility"
        ? "#2D6A4F"
        : activePrimaryColor === "orange"
        ? "#C25E00"
        : primaryHex;

    const secondaryMiniTextColor =
      activeSecondaryColor === "yellow"
        ? "#B8860B"
        : activeSecondaryColor === "light-blue"
        ? "#0284C7"
        : activeSecondaryColor === "utility"
        ? "#2D6A4F"
        : activeSecondaryColor === "orange"
        ? "#C25E00"
        : secondaryHex;

    const primaryTiers = primaryConfig?.rentTiers
      ? primaryConfig.rentTiers.map((rent, idx) => ({
          setCount: idx + 1,
          rent,
          isComplete: idx + 1 === primaryConfig.setSize,
        }))
      : [];

    const secondaryTiers = secondaryConfig?.rentTiers
      ? secondaryConfig.rentTiers.map((rent, idx) => ({
          setCount: idx + 1,
          rent,
          isComplete: idx + 1 === secondaryConfig.setSize,
        }))
      : [];

    return (
      <div
        onClick={onClick}
        className={`hasbro-dual-wild-card hasbro-dual-wild-card--${size} ${
          isInteractive ? "hasbro-dual-wild-card--interactive" : "hasbro-dual-wild-card--disabled"
        } ${className}`}
        role="img"
        aria-label={`${card.name} (${primaryConfig?.name ?? activePrimaryColor} / ${
          secondaryConfig?.name ?? activeSecondaryColor
        })`}
      >
        <div className="hasbro-dual-wild-frame">
          {/* Top Banner (Primary) */}
          <div
            className="hasbro-dual-wild-banner hasbro-dual-wild-banner--top"
            style={{
              backgroundColor: primaryHex,
              color: isPrimaryDarkText ? "#111111" : "#FFFFFF",
            }}
          >
            <div className="hasbro-dual-wild-title">WILD PROPERTY</div>
            <div className="hasbro-dual-wild-subtitle">CHOOSE ONE COLOR</div>
          </div>

          {/* Top-Left Coin Badge */}
          {card.value > 0 && (
            <div className="hasbro-dual-wild-coin hasbro-dual-wild-coin--top-left">
              <span className="hasbro-coin-val">
                <MonopolyMSymbol
                  size="0.6em"
                  style={{ marginRight: "1.5px", marginTop: "0.1em" }}
                />
                <span className="hasbro-coin-num">{card.value}</span>
              </span>
            </div>
          )}

          {/* Card Body: Left Rent Table, Center Arrows, Right Inverted Rent Table */}
          <div className="hasbro-dual-wild-body">
            {/* Left Rent Table (Primary) */}
            <div className="hasbro-dual-wild-col hasbro-dual-wild-col--left">
              <div className="hasbro-dual-wild-table">
                <div className="hasbro-dual-wild-table-header">
                  <div className="hasbro-dual-wild-th-left">
                    <span>PROPERTIES</span>
                    <span>OWNED</span>
                  </div>
                  <div className="hasbro-dual-wild-th-right">RENT</div>
                </div>

                <div className="hasbro-dual-wild-rows">
                  {primaryTiers.map((tier) => (
                    <div key={tier.setCount} className="hasbro-dual-wild-row">
                      <div className="hasbro-dual-wild-mini-card-wrap">
                        <HasbroDualWildPropertyCountGlyph
                          count={tier.setCount}
                          color={primaryHex}
                          isComplete={tier.isComplete}
                          textColor={primaryMiniTextColor}
                        />
                        {tier.isComplete && (
                          <div className="hasbro-complete-tag">
                            <span>COMPLETE</span>
                            <span>SET</span>
                          </div>
                        )}
                      </div>
                      <div className="hasbro-dual-wild-rent-wrap">
                        <MonopolyMSymbol
                          size="0.55em"
                          style={{ marginRight: "1.5px", marginTop: "0.08em" }}
                        />
                        <span className="hasbro-dual-wild-rent-num">{tier.rent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Arrows Connecting Top and Bottom Banners */}
            <div className="hasbro-dual-wild-center">
              <svg
                viewBox="0 0 32 200"
                preserveAspectRatio="none"
                className="hasbro-dual-wild-arrow-svg"
              >
                {/* Left Arrow: emerges from bottom banner, points UP, colored in secondaryHex */}
                <path
                  d="M 0,200 L 16,200 L 16,24 L 21,24 L 8,1 L -5,24 L 0,24 Z"
                  fill={secondaryHex}
                  stroke="#111111"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                {/* Right Arrow: emerges from top banner, points DOWN, colored in primaryHex */}
                <path
                  d="M 16,0 L 32,0 L 32,176 L 37,176 L 24,199 L 11,176 L 16,176 Z"
                  fill={primaryHex}
                  stroke="#111111"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                {/* Vertical Center Seam Line */}
                <line
                  x1="16"
                  y1="0"
                  x2="16"
                  y2="200"
                  stroke="#111111"
                  strokeWidth="1.8"
                />
              </svg>
            </div>

            {/* Right Rent Table (Secondary - Inverted 180°) */}
            <div className="hasbro-dual-wild-col hasbro-dual-wild-col--right hasbro-dual-wild-col--inverted">
              <div className="hasbro-dual-wild-table">
                <div className="hasbro-dual-wild-table-header">
                  <div className="hasbro-dual-wild-th-left">
                    <span>PROPERTIES</span>
                    <span>OWNED</span>
                  </div>
                  <div className="hasbro-dual-wild-th-right">RENT</div>
                </div>

                <div className="hasbro-dual-wild-rows">
                  {secondaryTiers.map((tier) => (
                    <div key={tier.setCount} className="hasbro-dual-wild-row">
                      <div className="hasbro-dual-wild-mini-card-wrap">
                        <HasbroDualWildPropertyCountGlyph
                          count={tier.setCount}
                          color={secondaryHex}
                          isComplete={tier.isComplete}
                          textColor={secondaryMiniTextColor}
                        />
                        {tier.isComplete && (
                          <div className="hasbro-complete-tag">
                            <span>COMPLETE</span>
                            <span>SET</span>
                          </div>
                        )}
                      </div>
                      <div className="hasbro-dual-wild-rent-wrap">
                        <MonopolyMSymbol
                          size="0.55em"
                          style={{ marginRight: "1.5px", marginTop: "0.08em" }}
                        />
                        <span className="hasbro-dual-wild-rent-num">{tier.rent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-Right Coin Badge (Inverted) */}
          {card.value > 0 && (
            <div className="hasbro-dual-wild-coin hasbro-dual-wild-coin--bottom-right">
              <span className="hasbro-coin-val">
                <MonopolyMSymbol
                  size="0.6em"
                  style={{ marginRight: "1.5px", marginTop: "0.1em" }}
                />
                <span className="hasbro-coin-num">{card.value}</span>
              </span>
            </div>
          )}

          {/* Bottom Banner (Secondary - Rotated 180) */}
          <div
            className="hasbro-dual-wild-banner hasbro-dual-wild-banner--bottom"
            style={{
              backgroundColor: secondaryHex,
              color: isSecondaryDarkText ? "#111111" : "#FFFFFF",
            }}
          >
            <div className="hasbro-dual-wild-banner-inverted">
              <div className="hasbro-dual-wild-title">WILD PROPERTY</div>
              <div className="hasbro-dual-wild-subtitle">CHOOSE ONE COLOR</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

