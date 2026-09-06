import React from "react";
import type { CardDefinition } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";

export interface CardProps {
  card: CardDefinition;
  size?: "xs" | "sm" | "md" | "lg";
  isInteractive?: boolean;
  className?: string;
  onClick?: () => void;
  designVariant?: "classic" | "hasbro";
}

/**
 * Authentic Double-Barred Monopoly M Currency Symbol
 * Matches the official Hasbro Monopoly Deal currency symbol on cards
 */
export function MonopolyMSymbol({
  size = "1em",
  className = "",
  style = {},
}: {
  size?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={`monopoly-currency-symbol ${className}`}
      style={{
        display: "inline-block",
        verticalAlign: "-0.08em",
        flexShrink: 0,
        ...style,
      }}
      fill="currentColor"
    >
      {/* Letter M glyph */}
      <path d="M2.5 17.5V2.5h3.6l3.9 6.8 3.9-6.8h3.6v15h-3.2V7.2L10.8 13.2h-1.6L5.7 7.2v10.3H2.5z" />
      {/* Upper horizontal strike bar */}
      <rect x="0.5" y="7.5" width="19" height="1.6" rx="0.5" />
      {/* Lower horizontal strike bar */}
      <rect x="0.5" y="11.2" width="19" height="1.6" rx="0.5" />
    </svg>
  );
}

/**
 * Authentic Mini Property Card Glyphs for Properties Owned Column
 * Faithfully matches single card and stacked cards with radiating burst dashes from Hasbro photo
 */
export function HasbroPropertyCountGlyph({
  count,
  color,
  isComplete = false,
  textColor,
}: {
  count: number;
  color: string;
  isComplete?: boolean;
  textColor?: string;
}) {
  const digitColor = textColor ?? color;

  if (count === 1) {
    return (
      <svg
        viewBox="0 0 40 50"
        className="hasbro-mini-card-svg hasbro-mini-card-svg--single"
      >
        {/* Main Card Body with 3D drop shadow */}
        <rect
          x="5"
          y="4"
          width="30"
          height="42"
          rx="4"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
          style={{ filter: "drop-shadow(0 1.8px 1.2px rgba(0,0,0,0.22))" }}
        />
        {/* Colored Top Stripe */}
        <path
          d="M5 8a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v7H5V8z"
          fill={color}
          stroke="#111111"
          strokeWidth="2.4"
        />
        {/* Digit 1 in matching color - large & bold */}
        <text
          x="20"
          y="38"
          fill={digitColor}
          fontSize="21"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
        >
          1
        </text>
      </svg>
    );
  }

  // Count >= 2: Stacked Cards
  // For count === 2: 1 back card tilted left, 1 front card
  // For count >= 3: 1 back card tilted left, 1 back card tilted right, 1 front card
  // Radiating action burst dashes are ONLY rendered on the complete set tier
  return (
    <svg
      viewBox="0 0 58 52"
      className="hasbro-mini-card-svg hasbro-mini-card-svg--stack"
    >
      {/* Radiating Action Dashes: Only on complete set row */}
      {isComplete && (
        <>
          {/* Left Radiating Action Dashes */}
          <line
            x1="3"
            y1="20"
            x2="9"
            y2="23"
            stroke="#111111"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="34"
            x2="9"
            y2="30"
            stroke="#111111"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Right Radiating Action Dashes */}
          <line
            x1="55"
            y1="20"
            x2="49"
            y2="23"
            stroke="#111111"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <line
            x1="54"
            y1="34"
            x2="49"
            y2="30"
            stroke="#111111"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Back Card Left (tilted -10deg with drop shadow) */}
      <g
        transform="translate(13, 5) rotate(-10 13 19)"
        style={{ filter: "drop-shadow(0 1.8px 1.4px rgba(0,0,0,0.22))" }}
      >
        <rect
          x="0"
          y="0"
          width="26"
          height="37"
          rx="3.5"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
        />
        <path
          d="M0 3.5a3.5 3.5 0 0 1 3.5-3.5h19a3.5 3.5 0 0 1 3.5 3.5v7H0v-7z"
          fill={color}
          stroke="#111111"
          strokeWidth="2.4"
        />
      </g>

      {/* For count >= 3, add Back Card Right (tilted +10deg) */}
      {count >= 3 && (
        <g
          transform="translate(23, 5) rotate(10 36 19)"
          style={{ filter: "drop-shadow(0 1.8px 1.4px rgba(0,0,0,0.22))" }}
        >
          <rect
            x="0"
            y="0"
            width="26"
            height="37"
            rx="3.5"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="2.4"
          />
          <path
            d="M0 3.5a3.5 3.5 0 0 1 3.5-3.5h19a3.5 3.5 0 0 1 3.5 3.5v7H0v-7z"
            fill={color}
            stroke="#111111"
            strokeWidth="2.4"
          />
        </g>
      )}

      {/* Front Card casting shadow onto back cards */}
      <g
        transform="translate(18, 7)"
        style={{ filter: "drop-shadow(-1.5px 1.8px 1.2px rgba(0,0,0,0.28))" }}
      >
        <rect
          x="0"
          y="0"
          width="26"
          height="37"
          rx="3.5"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
        />
        <path
          d="M0 3.5a3.5 3.5 0 0 1 3.5-3.5h19a3.5 3.5 0 0 1 3.5 3.5v7H0v-7z"
          fill={color}
          stroke="#111111"
          strokeWidth="2.4"
        />
        <text
          x="13"
          y="30"
          fill={digitColor}
          fontSize="19"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
        >
          {count}
        </text>
      </g>
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly Deal Property Card
 * Faithfully matches the official Hasbro card design from reference cards
 */
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

export interface CardBackProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "classic" | "gold" | "carbon";
  isInteractive?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CardBack = React.memo(function CardBack({
  size = "md",
  variant = "classic",
  isInteractive = false,
  className = "",
  onClick,
}: CardBackProps) {
  return (
    <div
      onClick={onClick}
      className={`monopoly-card monopoly-card--${size} dealopoly-card-back dealopoly-card-back--${variant} ${
        isInteractive ? "monopoly-card--interactive" : ""
      } ${className}`}
      role="img"
      aria-label="Dealopoly Card Back"
    >
      <div className={`card-back-image-fill card-back-image-fill--${variant}`} />
    </div>
  );
});

/**
 * Vector illustration of an isometric stack of Monopoly banknotes
 * Matches the cash stack on the Hasbro Rent card reference photo
 */
export function HasbroMoneyStackGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 68"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      <defs>
        <filter id="hasbroMoneyStackShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2.2" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter="url(#hasbroMoneyStackShadow)">
        {/* Front-Left Face (Green stack side) */}
        <polygon
          points="10,24 50,42 50,60 10,42"
          fill="#43A047"
          stroke="#111111"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* Horizontal note lines on Left Face */}
        <line x1="10" y1="28.5" x2="50" y2="46.5" stroke="#2E7D32" strokeWidth="1.2" />
        <line x1="10" y1="33" x2="50" y2="51" stroke="#2E7D32" strokeWidth="1.2" />
        <line x1="10" y1="37.5" x2="50" y2="55.5" stroke="#2E7D32" strokeWidth="1.2" />

        {/* Front-Right Face (Darker green stack side) */}
        <polygon
          points="50,42 90,24 90,42 50,60"
          fill="#388E3C"
          stroke="#111111"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* Horizontal note lines on Right Face */}
        <line x1="50" y1="46.5" x2="90" y2="28.5" stroke="#1B5E20" strokeWidth="1.2" />
        <line x1="50" y1="51" x2="90" y2="33" stroke="#1B5E20" strokeWidth="1.2" />
        <line x1="50" y1="55.5" x2="90" y2="37.5" stroke="#1B5E20" strokeWidth="1.2" />

        {/* Top Face (Pale mint banknote face) */}
        <polygon
          points="50,6 90,24 50,42 10,24"
          fill="#C8E6C9"
          stroke="#111111"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />

        {/* Inner rectangular border on Top Face */}
        <polygon
          points="50,11 83,24 50,37 17,24"
          fill="none"
          stroke="#4CAF50"
          strokeWidth="1.4"
        />

        {/* Center Double-barred M Symbol on top of the banknote */}
        <g transform="translate(43, 16.5) scale(0.72)">
          <path
            d="M2.5 17.5V2.5h3.6l3.9 6.8 3.9-6.8h3.6v15h-3.2V7.2L10.8 13.2h-1.6L5.7 7.2v10.3H2.5z"
            fill="#111111"
          />
          <rect x="0.5" y="7.5" width="19" height="1.6" rx="0.5" fill="#111111" />
          <rect x="0.5" y="11.2" width="19" height="1.6" rx="0.5" fill="#111111" />
        </g>
      </g>
    </svg>
  );
}

/**
 * 3D Isometric "ACTION" Header Typography
 * Slanted heavy italic with solid black extrusion block shadow
 */
export function HasbroActionHeaderGlyph({
  className = "",
  style,
  frontFill = "#FFFFFF",
  strokeColor = "#111111",
  shadowColor = "#111111",
  strokeWidth = 3.6,
}: {
  className?: string;
  style?: React.CSSProperties;
  frontFill?: string;
  strokeColor?: string;
  shadowColor?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 150 44"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* 3D Extrusion Shadow Layers */}
      {[7, 6, 5, 4, 3, 2, 1].map((offset) => (
        <text
          key={offset}
          x={offset * 1.0}
          y={31 + offset * 1.1}
          fill={shadowColor}
          stroke={shadowColor}
          strokeWidth="3.2"
          strokeLinejoin="round"
          fontSize="33"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
          letterSpacing="0.04em"
        >
          ACTION
        </text>
      ))}

      {/* Front Letters with Crisp Outline */}
      <text
        x="0"
        y="31"
        fill={frontFill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        paintOrder="stroke fill"
        fontSize="33"
        fontWeight="900"
        fontStyle="italic"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        letterSpacing="0.04em"
      >
        ACTION
      </text>
    </svg>
  );
}

/**
 * Authentic Monopoly "GO" Wordmark Vector
 * Crisp geometric squared-shoulder typography matching official Hasbro Monopoly Deal GO logo
 */
export function HasbroGoWordGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 48"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* Letter 'G' */}
      <path
        d="M 46,11 L 46,2 L 15,2 Q 8,2 8,9 L 8,39 Q 8,46 15,46 L 39,46 Q 46,46 46,39 L 46,22 L 25,22 L 25,31 L 36,31 L 36,37 L 18,37 L 18,11 Z"
        fill="#111111"
      />
      {/* Letter 'O' */}
      <path
        fillRule="evenodd"
        d="M 61,2 L 85,2 Q 92,2 92,9 L 92,39 Q 92,46 85,46 L 61,46 Q 54,46 54,39 L 54,9 Q 54,2 61,2 Z M 64,11 L 64,37 L 82,37 L 82,11 Z"
        fill="#111111"
      />
    </svg>
  );
}

/**
 * Authentic Monopoly Deal Red Arrow Vector (Pointing Left)
 * Leftward arrowhead, horizontal shaft, and notched fletching fins
 */
export function HasbroPassGoArrowGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 16"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      <path
        d="M 4,8 L 16,1.5 L 16,6.5 L 82,6.5 L 95,1.5 L 89,8 L 95,14.5 L 82,9.5 L 16,9.5 L 16,14.5 Z"
        fill="#ED1B24"
      />
    </svg>
  );
}

/**
 * Authentic Hasbro Birthday Cake Illustration Glyph
 * Round two-layer frosted birthday cake with 3 lit candles and radiance rays
 */
export function HasbroBirthdayCakeGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 70"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* Radiance bursts */}
      <line x1="33" y1="9" x2="37" y2="11" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="39" y1="3" x2="42" y2="6" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="50" y1="1" x2="50" y2="4" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="61" y1="3" x2="58" y2="6" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="67" y1="9" x2="63" y2="11" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />

      {/* Outer Plate */}
      <ellipse cx="50" cy="57" rx="35" ry="5.5" fill="#FAF9F5" stroke="#111111" strokeWidth="2.4" />
      <ellipse cx="50" cy="55.5" rx="30" ry="4.2" fill="#FAF9F5" stroke="#111111" strokeWidth="1.6" />

      {/* Lower Cake Sponge Layer */}
      <path
        d="M 27,42 C 27,42 35,46 50,46 C 65,46 73,42 73,42 L 73,50 C 73,54.5 65,57 50,57 C 35,57 27,54.5 27,50 Z"
        fill="#F7A831"
        stroke="#111111"
        strokeWidth="2.2"
      />

      {/* Middle Cream Layer */}
      <path
        d="M 27,41 C 35,45 65,45 73,41 L 73,44.5 C 65,48.5 35,48.5 27,44.5 Z"
        fill="#FFFFFF"
        stroke="#111111"
        strokeWidth="1.6"
      />

      {/* Upper Cake Sponge Layer */}
      <path
        d="M 27,33 C 27,28.5 36,26 50,26 C 64,26 73,28.5 73,33 L 73,41 C 65,44.5 35,44.5 27,41 Z"
        fill="#F7A831"
        stroke="#111111"
        strokeWidth="2.2"
      />

      {/* Top Frosting Cap with Drips */}
      <path
        d="M 27,33 C 27,27.5 36,25 50,25 C 64,25 73,27.5 73,33 C 73,36.5 70,38 67,35 C 64,32 62,38 59,35.5 C 56,33 53,39 50,36.5 C 47,34 44,39 41,36 C 38,33 36,37 33,35 C 30,33 28,36.5 27,33 Z"
        fill="#FFFFFF"
        stroke="#111111"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Candles */}
      <rect x="40" y="15" width="4" height="12" rx="1" fill="#FF4B7E" stroke="#111111" strokeWidth="1.4" />
      <rect x="48" y="13" width="4" height="13" rx="1" fill="#FF4B7E" stroke="#111111" strokeWidth="1.4" />
      <rect x="56" y="15" width="4" height="12" rx="1" fill="#FF4B7E" stroke="#111111" strokeWidth="1.4" />

      {/* Wicks */}
      <line x1="42" y1="15" x2="42" y2="12" stroke="#111111" strokeWidth="1.2" />
      <line x1="50" y1="13" x2="50" y2="10" stroke="#111111" strokeWidth="1.2" />
      <line x1="58" y1="15" x2="58" y2="12" stroke="#111111" strokeWidth="1.2" />

      {/* Flame Drops */}
      <path d="M 42,7 C 40,9.5 40,11.5 42,12 C 44,11.5 44,9.5 42,7 Z" fill="#FFD200" stroke="#111111" strokeWidth="1.2" />
      <path d="M 50,5 C 48,7.5 48,9.5 50,10 C 52,9.5 52,7.5 50,5 Z" fill="#FFD200" stroke="#111111" strokeWidth="1.2" />
      <path d="M 58,7 C 56,9.5 56,11.5 58,12 C 60,11.5 60,9.5 58,7 Z" fill="#FFD200" stroke="#111111" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly Green House Vector Glyph
 * 3D isometric pitched roof with chimney, grooved front paneling, and door
 */
export function HasbroHouseGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 70"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* Chimney */}
      <polygon points="50,22 50,14 62,12 62,20" fill="#228B3B" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="56" cy="13" rx="6" ry="2.2" fill="#2ECC71" stroke="#111111" strokeWidth="2" />

      {/* Roof Front Face */}
      <polygon points="34,17 76,12 85,34 38,41" fill="#2ECC71" stroke="#111111" strokeWidth="2.8" strokeLinejoin="round" />

      {/* Roof Gable (Left End) */}
      <polygon points="34,17 14,35 38,41" fill="#228B3B" stroke="#111111" strokeWidth="2.8" strokeLinejoin="round" />

      {/* Left Wall */}
      <polygon points="18,36 38,42 38,62 18,55" fill="#1B6E2F" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Front Wall */}
      <polygon points="38,42 82,35 82,54 38,62" fill="#228B3B" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Front Wall Door & Windows */}
      <polygon points="45,43 51,42 51,53 45,54" fill="#145223" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="56,41 64,40 64,60 56,61" fill="#145223" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="69,39 75,38 75,49 69,50" fill="#145223" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly Red Hotel Vector Glyph
 * 3D isometric pitched roof with chimney and grooved vertical architectural columns
 */
export function HasbroHotelGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 70"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* Chimney */}
      <polygon points="51,21 51,13 63,11 63,19" fill="#C0392B" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="57" cy="12" rx="6" ry="2.2" fill="#ED1B24" stroke="#111111" strokeWidth="2" />

      {/* Roof Front Face */}
      <polygon points="34,17 76,12 85,33 38,39" fill="#ED1B24" stroke="#111111" strokeWidth="2.8" strokeLinejoin="round" />

      {/* Roof Gable (Left End) */}
      <polygon points="34,17 14,34 38,39" fill="#C0392B" stroke="#111111" strokeWidth="2.8" strokeLinejoin="round" />

      {/* Left Wall */}
      <polygon points="18,35 38,40 38,62 18,56" fill="#96171B" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Front Wall */}
      <polygon points="38,40 82,34 82,55 38,62" fill="#C0392B" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Front Wall Vertical Columns / Panels */}
      <polygon points="42,41 48,40 48,59 42,60" fill="#881519" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" />
      <polygon points="52,39.5 58,38.5 58,57.5 52,58.5" fill="#881519" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" />
      <polygon points="62,38 68,37 68,56 62,57" fill="#881519" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" />
      <polygon points="72,36.5 78,35.5 78,54.5 72,55.5" fill="#881519" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly Double The Rent Money Sacks Glyph
 * Two orange burlap money sacks with tied bunch tops, radiance bursts, and bold double-barred ₥ marks
 */
export function HasbroMoneySacksGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 160 125"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* Radiance Accent Bursts */}
      <g stroke="#111111" strokeWidth="2.4" strokeLinecap="round">
        <line x1="28" y1="52" x2="16" y2="44" />
        <line x1="24" y1="68" x2="12" y2="68" />
        <line x1="28" y1="84" x2="18" y2="90" />
        <line x1="72" y1="20" x2="72" y2="8" />
        <line x1="132" y1="36" x2="144" y2="28" />
        <line x1="140" y1="54" x2="152" y2="52" />
        <line x1="136" y1="72" x2="148" y2="76" />
      </g>

      {/* Rear Money Sack (Right, nestled behind) */}
      <g id="rearMoneySack" transform="translate(94, 28)">
        {/* Bunched Top Ruffles */}
        <path
          d="M12 18 C8 8 16 4 24 6 C32 4 40 8 36 18 Z"
          fill="#F37023"
          stroke="#111111"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Tied Neck */}
        <path d="M14 18 Q24 22 34 18" stroke="#111111" strokeWidth="2.4" fill="none" />
        {/* Main Sack Body */}
        <path
          d="M14 18 C4 20 -2 36 -2 50 C-2 68 12 76 26 76 C40 76 52 68 52 50 C52 36 46 20 34 18 Z"
          fill="#F37023"
          stroke="#111111"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Organic Creases */}
        <path d="M6 34 Q16 40 18 46" stroke="#111111" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M44 36 Q34 42 32 48" stroke="#111111" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* Double-Barred Monopoly M Symbol on Sack */}
        <g transform="translate(25, 48) scale(0.72)">
          <path
            d="M-10 10 L-10 -10 L0 2 L10 -10 L10 10"
            stroke="#111111"
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="-14" y1="-2" x2="14" y2="-2" stroke="#111111" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="-14" y1="3" x2="14" y2="3" stroke="#111111" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      </g>

      {/* Front Money Sack (Left, in foreground) */}
      <g id="frontMoneySack" transform="translate(36, 24)">
        {/* Bunched Top Ruffles */}
        <path
          d="M14 20 C10 8 20 2 30 5 C40 2 50 8 46 20 Z"
          fill="#F78222"
          stroke="#111111"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Tied Neck Tie */}
        <path d="M16 20 Q30 24 44 20" stroke="#111111" strokeWidth="2.8" fill="none" />
        {/* Main Sack Body */}
        <path
          d="M16 20 C4 24 -4 42 -4 60 C-4 80 12 90 30 90 C48 90 64 80 64 60 C64 42 56 24 44 20 Z"
          fill="#F78222"
          stroke="#111111"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* Organic Creases */}
        <path d="M6 38 Q18 46 20 54" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M54 40 Q42 48 40 56" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M22 84 Q30 87 38 84" stroke="#111111" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* Double-Barred Monopoly M Symbol on Sack */}
        <g transform="translate(30, 58) scale(0.92)">
          <path
            d="M-10 10 L-10 -10 L0 2 L10 -10 L10 10"
            stroke="#111111"
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="-14" y1="-2" x2="14" y2="-2" stroke="#111111" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="-14" y1="3" x2="14" y2="3" stroke="#111111" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly "Just Say No" Comic Feature Badge Glyph
 * Features bold "JUST SAY", comic speech bubble with "NO", and Rich Uncle Pennybags smugly folding his arms
 */
export function HasbroJustSayNoGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 170 170"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* "JUST SAY" Typography */}
      <text
        x="20"
        y="42"
        fill="#111111"
        fontSize="25"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        letterSpacing="0.02em"
      >
        JUST SAY
      </text>

      {/* Comic Speech Bubble with Tail pointing to Pennybags' mouth */}
      <polygon
        points="18,48 76,48 76,82 86,88 76,88 76,92 18,92"
        fill="#FFFFFF"
        stroke="#111111"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <text
        x="47"
        y="82"
        fill="#111111"
        fontSize="34"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.04em"
      >
        NO
      </text>

      {/* Rich Uncle Pennybags Smug Folded Arms Illustration */}
      <g id="pennybagsJustSayNo">
        {/* Tuxedo Body & Chest */}
        <path
          d="M84 122 Q112 110 144 116 L154 170 L74 170 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="2"
        />

        {/* White Shirt Collar & Black Tie */}
        <polygon points="112,112 122,112 118,128 116,128" fill="#FFFFFF" stroke="#111111" strokeWidth="1.6" />
        <polygon points="115,116 119,116 118,126 116,126" fill="#111111" />

        {/* White Pocket Square / Handkerchief */}
        <polygon points="138,122 144,115 146,122" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />

        {/* Crossed Arms / Folded Hands */}
        <path
          d="M88 126 Q98 146 128 142"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          fill="none"
          opacity="0.35"
        />
        {/* White Gloved Right Hand resting smugly across chest */}
        <path
          d="M98 120 C92 122 88 132 94 138 C102 144 114 136 114 126 C114 118 106 118 98 120 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.2"
        />
        {/* Finger lines on glove */}
        <line x1="94" y1="128" x2="104" y2="128" stroke="#111111" strokeWidth="1.5" />
        <line x1="96" y1="133" x2="106" y2="133" stroke="#111111" strokeWidth="1.5" />

        {/* Head Contour (Classic White Cartoon Line Art) */}
        <path
          d="M100 84 C98 64 114 54 128 54 C144 54 150 66 148 84 C146 98 138 106 124 108 C112 108 102 98 100 84 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.6"
        />
        {/* Left Ear */}
        <path d="M147 78 Q152 78 151 86 Q150 92 144 91" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />

        {/* Arched Eyebrows */}
        <path d="M106 68 Q112 64 118 68" stroke="#111111" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M124 67 Q130 63 136 67" stroke="#111111" strokeWidth="2.4" fill="none" strokeLinecap="round" />

        {/* Smiling Squint Eyes */}
        <path d="M108 74 Q113 70 118 74" stroke="#111111" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M125 73 Q130 69 135 73" stroke="#111111" strokeWidth="2.6" fill="none" strokeLinecap="round" />

        {/* Button Nose */}
        <ellipse cx="120" cy="78" rx="3.6" ry="3" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />

        {/* Iconic Fluffy Mustache */}
        <path
          d="M120 81 Q110 78 94 84 Q106 94 120 86 Q134 94 146 84 Q132 78 120 81 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />

        {/* Smug Smirk under Mustache */}
        <path d="M112 88 Q120 94 128 88" stroke="#111111" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly "Sly Deal" Feature Badge Glyph
 * Features Rich Uncle Pennybags tiptoeing and running sneakily with a burglar eye mask,
 * carrying an orange burlap money sack with ₥ currency mark over his shoulder, and bold "SLY DEAL" typography.
 */
export function HasbroSlyDealGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 170 170"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* Rich Uncle Pennybags Burglar Runner */}
      <g id="slyBurglar" transform="translate(82, 56) scale(0.92)">
        {/* Coattails Flapping Behind (Left) */}
        <path
          d="M-18 10 C-32 8 -46 16 -54 26 C-42 20 -30 18 -16 16 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M-20 14 C-34 18 -46 28 -50 38 C-40 30 -28 24 -16 20 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.5"
        />

        {/* Trailing Rear Leg (Left) */}
        <path
          d="M-10 16 C-22 22 -34 26 -50 24 L-46 32 C-30 34 -18 28 -6 22 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Rear Black Shoe (Pointed Tip) */}
        <path
          d="M-50 24 C-56 23 -64 24 -68 26 C-64 30 -54 32 -46 32 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.8"
        />

        {/* Forward Stepping Leg (Right) */}
        <path
          d="M4 16 C14 24 28 30 42 26 L44 34 C26 40 10 32 -4 22 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Forward Black Shoe */}
        <path
          d="M42 26 C48 24 56 26 60 30 C56 34 48 36 44 34 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.8"
        />

        {/* Orange Burlap Money Sack (Over Shoulder / Tucked) */}
        <g id="sack">
          <path
            d="M6 -16 C20 -20 36 -10 34 8 C32 20 18 26 6 18 C0 12 -2 -2 6 -16 Z"
            fill="#F78222"
            stroke="#111111"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Bunched Tied Sack Mouth */}
          <path
            d="M6 -16 C8 -22 14 -24 18 -20 C14 -18 10 -16 6 -16 Z"
            fill="#F37023"
            stroke="#111111"
            strokeWidth="1.8"
          />
          {/* Double-Barred M on Sack */}
          <g transform="translate(18, 5) scale(0.6)">
            <path
              d="M-7 7 V-6 H-2.5 L0 0 L2.5 -6 H7 V7 H4.5 V-1 L1 4.5 H-1 L-4.5 -1 V7 Z"
              fill="#111111"
            />
            <rect x="-8.5" y="-2" width="17" height="1.6" fill="#111111" />
            <rect x="-8.5" y="1.5" width="17" height="1.6" fill="#111111" />
          </g>
        </g>

        {/* Tuxedo Torso & Vest */}
        <path
          d="M-14 0 C-10 -10 4 -12 14 -4 C16 10 8 20 -2 22 C-12 22 -16 12 -14 0 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="2.2"
        />
        {/* White Shirt V-Collar */}
        <polygon points="-4,-8 4,-6 0,6 -6,4" fill="#FFFFFF" stroke="#111111" strokeWidth="1.4" />
        <circle cx="0" cy="-1" r="1.6" fill="#111111" />

        {/* Left Arm Clasping Sack */}
        <path
          d="M2 -2 C8 4 14 10 20 8"
          stroke="#111111"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="20" cy="8" rx="3.2" ry="2.6" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />

        {/* Head & Burglar Mask */}
        <ellipse cx="-4" cy="-19" rx="12.5" ry="10.5" fill="#FFFFFF" stroke="#111111" strokeWidth="2.2" />

        {/* Black Bandit Eye Mask */}
        <path
          d="M-14 -24 C-9 -28 3 -28 8 -24 C10 -21 8 -16 4 -16 C-1 -19 -7 -19 -12 -16 C-16 -16 -16 -21 -14 -24 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Eye Cutouts */}
        <ellipse cx="-8.5" cy="-22" rx="2" ry="1.6" fill="#FFFFFF" />
        <circle cx="-8" cy="-22" r="0.8" fill="#111111" />
        <ellipse cx="2.5" cy="-22" rx="2" ry="1.6" fill="#FFFFFF" />
        <circle cx="3" cy="-22" r="0.8" fill="#111111" />

        {/* Bushy White Mustache */}
        <path
          d="M-3 -15 C-9 -19 -19 -15 -22 -11 C-14 -9 -6 -11 -2 -12 C2 -11 10 -9 18 -11 C15 -15 5 -19 -1 -15 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M-6 -9 Q-3 -7 0 -9" stroke="#111111" strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {/* Top Hat (Crown White with Black Outline, Hatband Black) */}
        {/* Crown */}
        <polygon points="-12,-32 -7,-50 10,-47 5,-30" fill="#FFFFFF" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
        {/* Hatband (Solid Black) */}
        <polygon points="-11,-33 -9,-38 7,-35 5,-31" fill="#111111" stroke="#111111" strokeWidth="1.2" />
        {/* Brim (Curved Line) */}
        <path
          d="M-20 -29 Q-3 -37 15 -28"
          stroke="#111111"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Arm (Raised to Brim in Sly Sneaking Gesture) */}
        <path
          d="M-10 -2 C-18 -10 -22 -20 -18 -27"
          stroke="#111111"
          strokeWidth="4.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M-18 -27 C-22 -30 -18 -34 -14 -32 C-12 -30 -14 -26 -18 -27 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="1.5"
        />
      </g>

      {/* "SLY DEAL" Typography */}
      <text
        x="85"
        y="126"
        fill="#111111"
        fontSize="25"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.04em"
      >
        SLY
      </text>
      <text
        x="85"
        y="152"
        fill="#111111"
        fontSize="25"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.04em"
      >
        DEAL
      </text>
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly "Debt Collector" Feature Badge Glyph
 * Features bold "DEBT COLLECTOR" typography and Rich Uncle Pennybags holding a walking cane in one hand and a fanned wad of green banknotes in the other.
 */
export function HasbroDebtCollectorGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 170 170"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      <defs>
        <clipPath id="debtCircleClip">
          <circle cx="85" cy="85" r="82" />
        </clipPath>
      </defs>

      {/* "DEBT COLLECTOR" Typography at Top */}
      <text
        x="85"
        y="34"
        fill="#111111"
        fontSize="24"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.04em"
      >
        DEBT
      </text>
      <text
        x="85"
        y="56"
        fill="#111111"
        fontSize="19"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.03em"
      >
        COLLECTOR
      </text>

      {/* Rich Uncle Pennybags Debt Collector Portrait (Clipped to Circle) */}
      <g id="debtPennybags" clipPath="url(#debtCircleClip)" transform="translate(85, 116) scale(1.12)">
        {/* Tuxedo Body & Chest (Extending to Bottom of Badge) */}
        <path
          d="M-32 38 C-30 14 -18 4 0 4 C18 4 30 14 32 38 L38 60 L-38 60 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="2"
        />
        {/* White Shirt V-Front & Bowtie */}
        <polygon points="-6,4 6,4 0,22" fill="#FFFFFF" stroke="#111111" strokeWidth="1.2" />
        <polygon points="-5,6 0,8 5,6 0,11" fill="#111111" />

        {/* Right Arm (Holding Walking Cane) */}
        <path
          d="M-22 12 C-32 18 -40 26 -36 34"
          stroke="#111111"
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* White Gloved Right Hand gripping Cane */}
        <ellipse cx="-36" cy="33" rx="3.5" ry="3" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />

        {/* White Walking Cane with Curved J-Handle */}
        <path
          d="M-45 25 C-45 16 -37 16 -35 25 L-24 56"
          stroke="#111111"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M-44 25 C-44 18 -38 18 -36 25 L-25 56"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left Arm (Raised holding Money Wad) */}
        <path
          d="M20 14 C28 12 38 6 42 -2"
          stroke="#111111"
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* White Gloved Left Hand holding Bills */}
        <ellipse cx="42" cy="-2" rx="3.5" ry="3" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />

        {/* Fanned Green Monopoly Banknotes */}
        <g id="banknotes" transform="translate(44, -8)">
          {/* Bill 1 (Back Left) */}
          <polygon
            points="-8,-14 0,-18 4,-4 -4,0"
            fill="#8AD435"
            stroke="#111111"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Bill 2 (Center) */}
          <polygon
            points="-3,-22 9,-20 10,-6 -2,-8"
            fill="#7ECE2A"
            stroke="#111111"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Bill 3 (Front Right) */}
          <polygon
            points="4,-16 16,-10 13,2 1,-4"
            fill="#9CD83B"
            stroke="#111111"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Currency Emblem on Center Bill */}
          <circle cx="3.5" cy="-14" r="2.4" fill="#FFFFFF" stroke="#111111" strokeWidth="0.8" />
          <g transform="translate(3.5, -14) scale(0.26)">
            <path d="M-4 4 V-4 H-1 L0 0 L1 -4 H4 V4 H2.5 V0 L0.5 3 H-0.5 L-2.5 0 V4 Z" fill="#111111" />
            <line x1="-5" y1="-1" x2="5" y2="-1" stroke="#111111" strokeWidth="1.2" />
            <line x1="-5" y1="1" x2="5" y2="1" stroke="#111111" strokeWidth="1.2" />
          </g>
        </g>

        {/* Head Contour (White) */}
        <ellipse cx="0" cy="-12" rx="14.5" ry="12.5" fill="#FFFFFF" stroke="#111111" strokeWidth="2.2" />

        {/* Determined Eyebrows */}
        <path d="M-8 -18 Q-4 -20 0 -17" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M3 -17 Q7 -20 11 -18" stroke="#111111" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Focused Eyes */}
        <circle cx="-4" cy="-13" r="1.5" fill="#111111" />
        <circle cx="6" cy="-13" r="1.5" fill="#111111" />

        {/* Button Nose */}
        <ellipse cx="1" cy="-9" rx="1.8" ry="1.4" fill="#FFFFFF" stroke="#111111" strokeWidth="1.2" />

        {/* Fluffy White Mustache */}
        <path
          d="M1 -7 C-6 -10 -16 -8 -20 -3 C-12 -1 -4 -3 0 -4 C4 -3 12 -1 20 -3 C16 -8 6 -10 1 -7 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Black Top Hat */}
        {/* Crown */}
        <polygon points="-10,-22 -8,-44 12,-42 10,-20" fill="#111111" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
        {/* Hatband (Light Grey / White) */}
        <polygon points="-10,-23 -9,-28 10,-26 10,-21" fill="#E2E8F0" stroke="#111111" strokeWidth="1.2" />
        {/* Brim (Curved Line) */}
        <path
          d="M-18 -20 Q1 -27 20 -18"
          stroke="#111111"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly "Deal Breaker" Feature Badge Glyph
 * Features bold "DEAL BREAKER" typography and Rich Uncle Pennybags tiptoeing/running sneakily with a burglar eye mask,
 * carrying an overflowing orange burlap sack while green Monopoly banknotes and property deeds stream out behind him.
 */
export function HasbroDealBreakerGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 170 170"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* Rich Uncle Pennybags Burglar Runner with Flying Loot */}
      <g id="dealBreakerRunner" transform="translate(80, 56) scale(0.90)">
        {/* Flying Cash & Property Deeds Streaming Out of Sack */}
        <g id="flyingLoot" transform="translate(20, -10)">
          {/* Green Banknote 1 */}
          <polygon
            points="0,-16 10,-22 14,-14 4,-8"
            fill="#8AD435"
            stroke="#111111"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Property Deed 1 (White with Blue Header Bar) */}
          <g transform="translate(14, -26) rotate(18)">
            <rect x="-5" y="-8" width="10" height="15" rx="1" fill="#FFFFFF" stroke="#111111" strokeWidth="1.2" />
            <rect x="-4" y="-7" width="8" height="4" fill="#0072BB" />
            <line x1="-3" y1="0" x2="3" y2="0" stroke="#CCCCCC" strokeWidth="0.8" />
            <line x1="-3" y1="2.5" x2="2" y2="2.5" stroke="#CCCCCC" strokeWidth="0.8" />
          </g>

          {/* Green Banknote 2 */}
          <polygon
            points="22,-16 32,-14 30,-6 20,-8"
            fill="#7ECE2A"
            stroke="#111111"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Property Deed 2 (White with Red Header Bar) */}
          <g transform="translate(10, -8) rotate(-12)">
            <rect x="-5" y="-8" width="10" height="15" rx="1" fill="#FFFFFF" stroke="#111111" strokeWidth="1.2" />
            <rect x="-4" y="-7" width="8" height="4" fill="#ED1B24" />
            <line x1="-3" y1="0" x2="3" y2="0" stroke="#CCCCCC" strokeWidth="0.8" />
            <line x1="-3" y1="2.5" x2="2" y2="2.5" stroke="#CCCCCC" strokeWidth="0.8" />
          </g>

          {/* Green Banknote 3 */}
          <g transform="translate(26, -4) rotate(15)">
            <rect x="-4" y="-6" width="8" height="12" rx="0.5" fill="#8AD435" stroke="#111111" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.4" fill="#FFFFFF" stroke="#111111" strokeWidth="0.6" />
          </g>

          {/* Property Deed 3 (White with Yellow Header Bar) */}
          <g transform="translate(38, -2) rotate(28)">
            <rect x="-4.5" y="-7" width="9" height="14" rx="1" fill="#FFFFFF" stroke="#111111" strokeWidth="1.1" />
            <rect x="-3.5" y="-6" width="7" height="3.5" fill="#FFDE00" />
            <line x1="-2.5" y1="0" x2="2.5" y2="0" stroke="#CCCCCC" strokeWidth="0.7" />
          </g>
        </g>

        {/* Coattails Flapping Behind (Left) */}
        <path
          d="M-18 10 C-32 8 -46 16 -54 26 C-42 20 -30 18 -16 16 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M-20 14 C-34 18 -46 28 -50 38 C-40 30 -28 24 -16 20 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.5"
        />

        {/* Trailing Rear Leg (Left) */}
        <path
          d="M-10 16 C-22 22 -34 26 -50 24 L-46 32 C-30 34 -18 28 -6 22 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M-50 24 C-56 23 -64 24 -68 26 C-64 30 -54 32 -46 32 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.8"
        />

        {/* Forward Stepping Leg (Right) */}
        <path
          d="M4 16 C14 24 28 30 42 26 L44 34 C26 40 10 32 -4 22 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M42 26 C48 24 56 26 60 30 C56 34 48 36 44 34 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.8"
        />

        {/* Orange Burlap Money Sack (Over Shoulder) */}
        <g id="sack">
          <path
            d="M6 -16 C20 -20 36 -10 34 8 C32 20 18 26 6 18 C0 12 -2 -2 6 -16 Z"
            fill="#F78222"
            stroke="#111111"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Bunched Tied Sack Mouth */}
          <path
            d="M6 -16 C8 -22 14 -24 18 -20 C14 -18 10 -16 6 -16 Z"
            fill="#F37023"
            stroke="#111111"
            strokeWidth="1.8"
          />
          {/* Double-Barred M on Sack */}
          <g transform="translate(18, 5) scale(0.6)">
            <path
              d="M-7 7 V-6 H-2.5 L0 0 L2.5 -6 H7 V7 H4.5 V-1 L1 4.5 H-1 L-4.5 -1 V7 Z"
              fill="#111111"
            />
            <rect x="-8.5" y="-2" width="17" height="1.6" fill="#111111" />
            <rect x="-8.5" y="1.5" width="17" height="1.6" fill="#111111" />
          </g>
        </g>

        {/* Tuxedo Torso & Vest */}
        <path
          d="M-14 0 C-10 -10 4 -12 14 -4 C16 10 8 20 -2 22 C-12 22 -16 12 -14 0 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="2.2"
        />
        {/* White Shirt V-Collar */}
        <polygon points="-4,-8 4,-6 0,6 -6,4" fill="#FFFFFF" stroke="#111111" strokeWidth="1.4" />
        <circle cx="0" cy="-1" r="1.6" fill="#111111" />

        {/* Left Arm Clasping Sack */}
        <path
          d="M2 -2 C8 4 14 10 20 8"
          stroke="#111111"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="20" cy="8" rx="3.2" ry="2.6" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />

        {/* Head & Burglar Mask */}
        <ellipse cx="-4" cy="-19" rx="12.5" ry="10.5" fill="#FFFFFF" stroke="#111111" strokeWidth="2.2" />

        {/* Black Bandit Eye Mask */}
        <path
          d="M-14 -24 C-9 -28 3 -28 8 -24 C10 -21 8 -16 4 -16 C-1 -19 -7 -19 -12 -16 C-16 -16 -16 -21 -14 -24 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Eye Cutouts */}
        <ellipse cx="-8.5" cy="-22" rx="2" ry="1.6" fill="#FFFFFF" />
        <circle cx="-8" cy="-22" r="0.8" fill="#111111" />
        <ellipse cx="2.5" cy="-22" rx="2" ry="1.6" fill="#FFFFFF" />
        <circle cx="3" cy="-22" r="0.8" fill="#111111" />

        {/* Bushy White Mustache */}
        <path
          d="M-3 -15 C-9 -19 -19 -15 -22 -11 C-14 -9 -6 -11 -2 -12 C2 -11 10 -9 18 -11 C15 -15 5 -19 -1 -15 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M-6 -9 Q-3 -7 0 -9" stroke="#111111" strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {/* Top Hat (Crown White with Black Outline, Hatband Black) */}
        <polygon points="-12,-32 -7,-50 10,-47 5,-30" fill="#FFFFFF" stroke="#111111" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="-11,-33 -9,-38 7,-35 5,-31" fill="#111111" stroke="#111111" strokeWidth="1.2" />
        <path
          d="M-20 -29 Q-3 -37 15 -28"
          stroke="#111111"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Arm (Raised to Brim in Sly Sneaking Gesture) */}
        <path
          d="M-10 -2 C-18 -10 -22 -20 -18 -27"
          stroke="#111111"
          strokeWidth="4.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M-18 -27 C-22 -30 -18 -34 -14 -32 C-12 -30 -14 -26 -18 -27 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="1.5"
        />
      </g>

      {/* "DEAL BREAKER" Typography */}
      <text
        x="85"
        y="126"
        fill="#2E0A36"
        fontSize="25"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.04em"
      >
        DEAL
      </text>
      <text
        x="85"
        y="150"
        fill="#2E0A36"
        fontSize="21"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.03em"
      >
        BREAKER
      </text>
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly "Forced Deal" Feature Badge Glyph
 * Features bold "FORCED DEAL" typography, Rich Uncle Pennybags clutching his head in distress/shock,
 * and player hands swapping property deeds (Red, Orange, Green) across the conference table.
 */
export function HasbroForcedDealGlyph({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 170 170"
      className={className}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
    >
      {/* Rich Uncle Pennybags in Shock / Distress */}
      <g id="distressedPennybags" transform="translate(85, 36) scale(0.92)">
        {/* Tuxedo Jacket & Torso */}
        <path
          d="M-24 22 C-20 12 -10 8 0 8 C10 8 20 12 24 22 L16 34 C8 32 -8 32 -16 34 Z"
          fill="#1B2A38"
          stroke="#111111"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* White Shirt Collar & Lapels */}
        <polygon points="-6,10 6,10 0,22" fill="#FFFFFF" stroke="#111111" strokeWidth="1.3" />
        {/* Small Black Bowtie */}
        <polygon points="-5,11 -1,13 -5,15" fill="#111111" />
        <polygon points="5,11 1,13 5,15" fill="#111111" />
        <circle cx="0" cy="13" r="1.2" fill="#111111" />

        {/* Head & Bald Dome */}
        <ellipse cx="0" cy="-1" rx="12.5" ry="13.5" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
        {/* Side Hair Tufts */}
        <path d="M-12.5 3 C-16 1 -16 8 -12.5 9" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />
        <path d="M12.5 3 C16 1 16 8 12.5 9" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />

        {/* Forehead Worry Creases */}
        <path d="M-5 -8 Q0 -10 5 -8" stroke="#111111" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M-4 -6 Q0 -8 4 -6" stroke="#111111" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Distressed Eyebrows (Curved up towards center in worry) */}
        <path d="M-8 -2 Q-4 -6 -1 -3" stroke="#111111" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M8 -2 Q4 -6 1 -3" stroke="#111111" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Wide Worried Eyes */}
        <ellipse cx="-4.5" cy="1" rx="2.4" ry="2.6" fill="#FFFFFF" stroke="#111111" strokeWidth="1.2" />
        <circle cx="-4.2" cy="1" r="1.2" fill="#111111" />
        <ellipse cx="4.5" cy="1" rx="2.4" ry="2.6" fill="#FFFFFF" stroke="#111111" strokeWidth="1.2" />
        <circle cx="4.2" cy="1" r="1.2" fill="#111111" />

        {/* Bushy White Mustache Drooping in Dismay */}
        <path
          d="M0 5 C-5 4 -13 5 -16 9 C-11 10 -4 8 0 7 C4 8 11 10 16 9 C13 5 5 4 0 5 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Distressed Open Mouth Gasp below mustache */}
        <ellipse cx="0" cy="12" rx="2.4" ry="3.2" fill="#111111" />

        {/* Left Arm Clutching Head (Elbow pointed out, forearm to top of head) */}
        <path
          d="M-18 16 Q-28 12 -26 3 Q-24 -6 -9 -11"
          stroke="#1B2A38"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Left Hand Resting on Top of Head */}
        <g transform="translate(-8, -13)">
          <ellipse cx="0" cy="0" rx="3.5" ry="2.5" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />
          <line x1="-2" y1="-1" x2="2" y2="1" stroke="#111111" strokeWidth="1" />
          <line x1="-1" y1="-2" x2="3" y2="0" stroke="#111111" strokeWidth="1" />
        </g>

        {/* Right Arm Clutching Head (Elbow pointed out, forearm to top of head) */}
        <path
          d="M18 16 Q28 12 26 3 Q24 -6 9 -11"
          stroke="#1B2A38"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right Hand Resting on Top of Head */}
        <g transform="translate(8, -13)">
          <ellipse cx="0" cy="0" rx="3.5" ry="2.5" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />
          <line x1="2" y1="-1" x2="-2" y2="1" stroke="#111111" strokeWidth="1" />
          <line x1="1" y1="-2" x2="-3" y2="0" stroke="#111111" strokeWidth="1" />
        </g>
      </g>

      {/* Tabletop & Forced Card Swap Scene */}
      <g id="propertySwap" transform="translate(85, 76)">
        {/* Curved Table Arc Outline */}
        <path
          d="M-40 14 C-20 7 20 7 40 14"
          stroke="#1B365D"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left Property Deed (Red Header Bar) */}
        <g transform="translate(-24, -2) rotate(-16)">
          <rect x="-9" y="-14" width="18" height="28" rx="1.8" fill="#FFFFFF" stroke="#111111" strokeWidth="1.6" />
          <rect x="-7.6" y="-12.6" width="15.2" height="7" rx="0.5" fill="#EE314E" />
          <line x1="-6" y1="-1" x2="6" y2="-1" stroke="#BBBBBB" strokeWidth="1.1" />
          <line x1="-6" y1="3.5" x2="4.5" y2="3.5" stroke="#BBBBBB" strokeWidth="1.1" />
          <line x1="-6" y1="8" x2="3" y2="8" stroke="#BBBBBB" strokeWidth="1.1" />
        </g>

        {/* Center Property Deed (Orange Header Bar) */}
        <g transform="translate(0, 3) rotate(0)">
          <rect x="-8.5" y="-13.5" width="17" height="27" rx="1.8" fill="#FFFFFF" stroke="#111111" strokeWidth="1.6" />
          <rect x="-7.2" y="-12.2" width="14.4" height="6.8" rx="0.5" fill="#F78222" />
          <line x1="-5.5" y1="-1" x2="5.5" y2="-1" stroke="#BBBBBB" strokeWidth="1.1" />
          <line x1="-5.5" y1="3.5" x2="4" y2="3.5" stroke="#BBBBBB" strokeWidth="1.1" />
          <line x1="-5.5" y1="8" x2="2.5" y2="8" stroke="#BBBBBB" strokeWidth="1.1" />
        </g>

        {/* Right Property Deed (Green Header Bar) */}
        <g transform="translate(24, -4) rotate(16)">
          <rect x="-9" y="-14" width="18" height="28" rx="1.8" fill="#FFFFFF" stroke="#111111" strokeWidth="1.6" />
          <rect x="-7.6" y="-12.6" width="15.2" height="7" rx="0.5" fill="#30B55A" />
          <line x1="-6" y1="-1" x2="6" y2="-1" stroke="#BBBBBB" strokeWidth="1.1" />
          <line x1="-6" y1="3.5" x2="4.5" y2="3.5" stroke="#BBBBBB" strokeWidth="1.1" />
          <line x1="-6" y1="8" x2="3" y2="8" stroke="#BBBBBB" strokeWidth="1.1" />
        </g>

        {/* Player 1 Hand (Reaching from Left) */}
        <g transform="translate(-36, 12)">
          {/* Arm/Cuff Lines */}
          <path d="M-14 12 L-2 4" stroke="#1B365D" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M-11 16 L1 8" stroke="#1B365D" strokeWidth="2.5" strokeLinecap="round" />
          {/* Hand grabbing left deed */}
          <path
            d="M-2 4 C2 1 7 2 11 6 C9 9 4 10 0 8 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* Fingers clasping card */}
          <path d="M6 4 C9 3 11 6 12 9" stroke="#111111" strokeWidth="1.4" fill="none" />
          <path d="M8 8 C11 8 13 10 13 13" stroke="#111111" strokeWidth="1.4" fill="none" />
        </g>

        {/* Player 2 Hand (Reaching from Right) */}
        <g transform="translate(36, 10)">
          {/* Arm/Cuff Lines */}
          <path d="M14 12 L2 4" stroke="#1B365D" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M11 16 L-1 8" stroke="#1B365D" strokeWidth="2.5" strokeLinecap="round" />
          {/* Hand grabbing right deed */}
          <path
            d="M2 4 C-2 1 -7 2 -11 6 C-9 9 -4 10 0 8 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* Fingers clasping card */}
          <path d="M-6 4 C-9 3 -11 6 -12 9" stroke="#111111" strokeWidth="1.4" fill="none" />
          <path d="M-8 8 C-11 8 -13 10 -13 13" stroke="#111111" strokeWidth="1.4" fill="none" />
        </g>
      </g>

      {/* "FORCED DEAL" Typography */}
      <text
        x="85"
        y="126"
        fill="#1B365D"
        fontSize="27"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.03em"
      >
        FORCED
      </text>
      <text
        x="85"
        y="153"
        fill="#1B365D"
        fontSize="26"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.05em"
      >
        DEAL
      </text>
    </svg>
  );
}

/**
 * Authentic Guilloche Chevron Background for Hasbro Action, Rent & Money Cards
 */
export function HasbroChevronBackground({
  className = "",
  strokeColor = "rgba(0, 0, 0, 0.055)",
  id = "hasbroHerringbone",
}: {
  className?: string;
  strokeColor?: string;
  id?: string;
}) {
  return (
    <svg
      className={`hasbro-chevron-bg ${className}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <defs>
        <pattern
          id={id}
          width="16"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0 L8 5 L16 0 M0 5 L8 10 L16 5"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * Line-art watermark drawing of Rich Uncle Pennybags (Mr. Monopoly)
 * Matches the top-right watermark on the physical Hasbro Money Card
 */
export function HasbroPennybagsWatermark({
  className = "",
  style,
  stroke = "#3E771C",
  fill = "#BEE65C",
}: {
  className?: string;
  style?: React.CSSProperties;
  stroke?: string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      style={{
        position: "absolute",
        top: "-0.2em",
        right: "-0.4em",
        width: "7.5em",
        height: "8.8em",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.82,
        ...style,
      }}
    >
      <g stroke={stroke} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Top Hat Crown */}
        <path d="M38 10 L84 10 L80 48 L34 48 Z" />
        {/* Hatband Stripes */}
        <path d="M35 40 L81 40" strokeWidth="2.6" />
        <line x1="42" y1="40" x2="48" y2="48" strokeWidth="1.6" />
        <line x1="54" y1="40" x2="60" y2="48" strokeWidth="1.6" />
        <line x1="66" y1="40" x2="72" y2="48" strokeWidth="1.6" />
        <line x1="74" y1="40" x2="79" y2="47" strokeWidth="1.6" />

        {/* Hat Brim */}
        <path d="M22 48 Q58 54 98 46" strokeWidth="3.2" />

        {/* Head Contour */}
        <path d="M34 50 Q28 75 42 100 Q58 112 78 100 Q92 75 86 50" />

        {/* Eyebrows */}
        <path d="M44 65 Q50 61 56 65" strokeWidth="2.4" />
        <path d="M66 65 Q72 61 78 65" strokeWidth="2.4" />

        {/* Eyes */}
        <circle cx="50" cy="72" r="2.8" fill={stroke} stroke="none" />
        <circle cx="72" cy="72" r="2.8" fill={stroke} stroke="none" />

        {/* Button Nose */}
        <path d="M60 74 Q63 79 59 81 Q55 80 57 75" />

        {/* Iconic Fluffy Mustache */}
        <path
          d="M59 83 Q45 80 32 87 Q45 98 58 87 Q60 87 62 87 Q75 98 88 87 Q75 80 61 83 Z"
          fill={fill}
          strokeWidth="2.4"
        />

        {/* Chin / Smile line */}
        <path d="M54 94 Q60 98 66 94" />

        {/* Bowtie */}
        <path d="M48 108 L60 112 L72 108 L70 120 L60 114 L50 120 Z" fill={fill} />
        <circle cx="60" cy="113" r="2.5" fill={stroke} />
      </g>
    </svg>
  );
}

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
      aria-label={`$${value}M Monopoly Money Card (Hasbro Edition)`}
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

        {/* "MONOPOLY" Brand Plaque directly underneath Circle */}
        <div className="hasbro-money-brand-wrap">
          <div className="hasbro-money-brand-pill">
            <span className="hasbro-money-brand-text">MONOPOLY</span>
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

/**
 * Authentic Hasbro Monopoly Deal Wild Card (All Sets)
 * Faithfully matches official Hasbro Wild Property reference photo
 * Features:
 * - White cardstock margin with 3D beveling
 * - Inner black frame with pale blue-grey gradient ground
 * - Vibrant rainbow gradient header banner
 * - 3D comic-style WILD and PROPERTY typography with extrusion drop shadow
 * - Angled black wedge banner with "USE THIS CARD AS PART OF ANY SET"
 * - 3 tumbling mini property cards (red, pink, rainbow) in the black field
 * - Vintage line-art illustration of Rich Uncle Pennybags strutting, tipping top hat, and holding walking cane
 */
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
            <linearGradient id="hasbroWildRainbow" x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0%" stopColor="#E51937" />
              <stop offset="18%" stopColor="#F36E21" />
              <stop offset="38%" stopColor="#FFDD00" />
              <stop offset="60%" stopColor="#1DB355" />
              <stop offset="82%" stopColor="#00A0E9" />
              <stop offset="100%" stopColor="#2D3B96" />
            </linearGradient>

            {/* Letter Fill Rainbow Gradient */}
            <linearGradient id="hasbroWildLetters" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF2A4B" />
              <stop offset="22%" stopColor="#FFA200" />
              <stop offset="45%" stopColor="#FFE600" />
              <stop offset="68%" stopColor="#2CDA6D" />
              <stop offset="88%" stopColor="#18B8FF" />
              <stop offset="100%" stopColor="#4B5EFF" />
            </linearGradient>

            {/* Subtle Lower Ground Gradient */}
            <linearGradient id="hasbroWildGround" x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#F3F6F9" />
              <stop offset="60%" stopColor="#E6EDF3" />
              <stop offset="100%" stopColor="#D9E3EC" />
            </linearGradient>
          </defs>

          {/* Lower Base Ground */}
          <rect width="240" height="370" fill="url(#hasbroWildGround)" />

          {/* Angled Black Wedge (Right and Upper-Middle Zone) */}
          <polygon points="0,86 240,86 240,242 0,146" fill="#111111" />

          {/* Angled Action Text in Black Wedge */}
          <g transform="rotate(-6, 120, 116)">
            <text
              x="120"
              y="114"
              fill="#FFFFFF"
              fontSize="13.5"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
              letterSpacing="0.6"
            >
              USE THIS CARD AS
            </text>
            <text
              x="120"
              y="130"
              fill="#FFFFFF"
              fontSize="13.5"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
              textAnchor="middle"
              letterSpacing="0.6"
            >
              PART OF ANY SET
            </text>
          </g>

          {/* Tumbling Mini Property Cards in Black Area */}
          {/* Mini Card 1: Red Property Card */}
          <g transform="translate(152, 148) rotate(-14)">
            <rect width="26" height="36" rx="2.5" fill="#FFFFFF" stroke="#111111" strokeWidth="1" />
            <rect x="1" y="1" width="24" height="9.5" rx="1.5" fill="#ED1B24" />
            <line x1="5" y1="16" x2="21" y2="16" stroke="#111111" strokeWidth="1.3" />
            <line x1="5" y1="21" x2="19" y2="21" stroke="#111111" strokeWidth="1.3" />
            <line x1="5" y1="26" x2="16" y2="26" stroke="#111111" strokeWidth="1.3" />
            <line x1="5" y1="31" x2="20" y2="31" stroke="#111111" strokeWidth="1.3" />
          </g>

          {/* Mini Card 2: Pink/Rose Property Card */}
          <g transform="translate(126, 154) rotate(16)">
            <rect width="22" height="30" rx="2.5" fill="#FFFFFF" stroke="#111111" strokeWidth="1" />
            <rect x="1" y="1" width="20" height="8" rx="1.5" fill="#E6578C" />
            <line x1="4" y1="13.5" x2="18" y2="13.5" stroke="#111111" strokeWidth="1.2" />
            <line x1="4" y1="17.5" x2="16" y2="17.5" stroke="#111111" strokeWidth="1.2" />
            <line x1="4" y1="21.5" x2="14" y2="21.5" stroke="#111111" strokeWidth="1.2" />
            <line x1="4" y1="25.5" x2="17" y2="25.5" stroke="#111111" strokeWidth="1.2" />
          </g>

          {/* Mini Card 3: Multi-Color Rainbow Wild Property Card */}
          <g transform="translate(138, 194) rotate(-20)">
            <rect width="24" height="34" rx="2.5" fill="#FFFFFF" stroke="#111111" strokeWidth="1" />
            <rect x="1" y="1" width="22" height="9" rx="1.5" fill="url(#hasbroWildRainbow)" />
            <line x1="5" y1="15" x2="19" y2="15" stroke="#111111" strokeWidth="1.3" />
            <line x1="5" y1="20" x2="17" y2="20" stroke="#111111" strokeWidth="1.3" />
            <line x1="5" y1="25" x2="15" y2="25" stroke="#111111" strokeWidth="1.3" />
            <line x1="5" y1="30" x2="18" y2="30" stroke="#111111" strokeWidth="1.3" />
          </g>

          {/* Motion Dash Lines around Mini Cards */}
          <line x1="184" y1="168" x2="192" y2="175" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
          <line x1="180" y1="184" x2="188" y2="191" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
          <line x1="120" y1="186" x2="126" y2="193" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
          <line x1="166" y1="224" x2="173" y2="230" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />

          {/* Rich Uncle Pennybags Illustration (Mr. Monopoly) */}
          <g id="unclePennybagsWild">
            {/* Motion Lines trailing behind kicking foot */}
            <path d="M26 278 Q18 300 36 308" stroke="#111111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M38 270 Q28 294 48 302" stroke="#111111" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Walking Cane (in left hand, extends diagonally down) */}
            <path
              d="M86 234 Q80 224 90 220 Q98 218 100 226 L93 296"
              stroke="#111111"
              strokeWidth="4.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M86 234 Q80 224 90 220 Q98 218 100 226 L93 296"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Billowing Tuxedo Coat Tails (fanning out behind him) */}
            <path
              d="M94 238 Q132 236 128 266 Q122 284 94 268 Z"
              fill="#111111"
            />

            {/* Kicking Left Leg (lifted high forward in joy) */}
            <path
              d="M72 245 Q56 265 42 278 Q48 284 56 278 Q68 268 84 252 Z"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="2.8"
            />
            {/* Kicking Shoe (black pointed dress shoe) */}
            <path
              d="M36 274 Q42 270 48 276 L40 286 Q30 288 34 278 Z"
              fill="#111111"
            />

            {/* Trailing Right Leg (striding/standing leg) */}
            <path
              d="M78 248 L76 300 Q78 308 86 308 L90 298 L88 250 Z"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="2.8"
            />
            {/* Trailing Shoe */}
            <path
              d="M76 300 Q84 316 94 310 L92 300 Z"
              fill="#111111"
            />

            {/* Tuxedo Jacket Body */}
            <path
              d="M66 182 L58 240 L88 246 L96 200 Z"
              fill="#111111"
            />

            {/* White/Cream Vest */}
            <path
              d="M66 188 L70 238 L84 240 L82 192 Z"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.8"
            />
            {/* Vest Buttons */}
            <circle cx="76" cy="204" r="1.5" fill="#111111" />
            <circle cx="76" cy="216" r="1.5" fill="#111111" />
            <circle cx="76" cy="228" r="1.5" fill="#111111" />

            {/* Bowtie (Authentic White with crisp black outline) */}
            <path
              d="M68 184 L76 188 L84 184 L82 192 L76 189 L70 192 Z"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.8"
            />

            {/* Left Arm & Hand (holding cane) */}
            <path
              d="M86 195 Q96 215 94 235"
              stroke="#111111"
              strokeWidth="8.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="94" cy="235" r="4.5" fill="#FFFFFF" stroke="#111111" strokeWidth="1.8" />

            {/* Right Arm (reaching up to tip his top hat) */}
            <path
              d="M62 195 Q54 175 64 152"
              stroke="#111111"
              strokeWidth="8.5"
              strokeLinecap="round"
              fill="none"
            />
            <rect x="62" y="148" width="6" height="5" rx="1" fill="#FFFFFF" stroke="#111111" strokeWidth="1" />
            <ellipse cx="68" cy="146" rx="4.5" ry="3.5" fill="#FFFFFF" stroke="#111111" strokeWidth="1.8" />

            {/* Head Contour (Classic White Cartoon Line Art) */}
            <ellipse cx="78" cy="172" rx="18" ry="17" fill="#FFFFFF" stroke="#111111" strokeWidth="2.4" />
            <path d="M60 172 Q57 175 60 178" stroke="#111111" strokeWidth="2" fill="none" />

            {/* Eyes */}
            <ellipse cx="71" cy="166" rx="2.5" ry="3" fill="#111111" />
            <ellipse cx="85" cy="166" rx="2.5" ry="3" fill="#111111" />

            {/* Eyebrows */}
            <path d="M67 160 Q71 157 75 160" stroke="#111111" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M81 160 Q85 157 89 160" stroke="#111111" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Nose */}
            <ellipse cx="78" cy="171" rx="3.5" ry="2.8" fill="#FFFFFF" stroke="#111111" strokeWidth="1.8" />

            {/* Big Iconic Fluffy Mustache */}
            <path
              d="M78 174 Q68 171 58 177 Q68 186 78 178 Q88 186 98 177 Q88 171 78 174 Z"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="2.2"
            />

            {/* Smile under mustache */}
            <path d="M74 180 Q78 184 82 180" stroke="#111111" strokeWidth="2" fill="none" />

            {/* Top Hat (tilted, tipped off his head) */}
            <g transform="translate(68, 142) rotate(-18)">
              {/* Curved Brim */}
              <path d="M-8 8 Q16 12 40 4" stroke="#111111" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              {/* Crown Body */}
              <path d="M0 6 L3 -26 L30 -28 L28 4 Z" fill="#111111" stroke="#111111" strokeWidth="2" />
              {/* Crown Highlight Stripe */}
              <path d="M5 2 L7 -24 L14 -25 L12 3 Z" fill="#444444" opacity="0.6" />
              {/* Hatband */}
              <path d="M0 2 L28 0" stroke="#FFFFFF" strokeWidth="3" />
            </g>
          </g>

          {/* Top Header Banner */}
          <rect x="0" y="0" width="240" height="86" fill="url(#hasbroWildRainbow)" />
          {/* Black Shadow Wedge connecting WILD to Top-Right */}
          <polygon points="172,12 240,36 240,86 182,86" fill="#111111" />
          <line x1="0" y1="86" x2="240" y2="86" stroke="#111111" strokeWidth="3.6" />

          {/* 3D WILD Header Typography */}
          {/* Layer 1: Isometric Solid Black Extrusion Shadow */}
          <text
            x="124"
            y="52"
            fill="#111111"
            stroke="#111111"
            strokeWidth="7"
            strokeLinejoin="miter"
            strokeMiterlimit="3"
            fontSize="50"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
            textAnchor="middle"
          >
            WILD
          </text>

          {/* Layer 2: Rainbow Front Letters with Black Stroke */}
          <text
            x="120"
            y="48"
            fill="url(#hasbroWildLetters)"
            stroke="#111111"
            strokeWidth="3.4"
            strokeLinejoin="miter"
            strokeMiterlimit="3"
            fontSize="50"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
            textAnchor="middle"
          >
            WILD
          </text>

          {/* 3D PROPERTY Sub-Header Typography */}
          {/* Shadow Layer */}
          <text
            x="122"
            y="78"
            fill="#111111"
            stroke="#111111"
            strokeWidth="4"
            fontSize="23"
            fontWeight="900"
            letterSpacing="3.5"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
            textAnchor="middle"
          >
            PROPERTY
          </text>

          {/* Front Face Layer */}
          <text
            x="120"
            y="76"
            fill="url(#hasbroWildLetters)"
            stroke="#111111"
            strokeWidth="1.8"
            fontSize="23"
            fontWeight="900"
            letterSpacing="3.5"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
            textAnchor="middle"
          >
            PROPERTY
          </text>

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
export const HasbroPassGoCard = React.memo(function HasbroPassGoCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 1;

  return (
    <div
      className={`hasbro-passgo-card hasbro-passgo-card--${size} ${
        isInteractive ? "hasbro-passgo-card--interactive" : ""
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      {/* Inner Black Frame with Subtle Iridescent Pastel Guilloche */}
      <div className="hasbro-passgo-frame">
        {/* Pastel Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-passgo-guilloche"
          strokeColor="#B8A7BF"
        />

        {/* Top-Left Circular Coin Badge: ₥1 */}
        <div className="hasbro-passgo-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-passgo-header-row">
          <HasbroActionHeaderGlyph className="hasbro-passgo-action-svg" />
        </div>

        {/* Central White Circular Feature Badge */}
        <div className="hasbro-passgo-circle-badge">
          <span className="hasbro-passgo-pass-text">PASS</span>
          <div className="hasbro-passgo-go-wrap">
            <HasbroGoWordGlyph className="hasbro-passgo-go-svg" />
          </div>
          <div className="hasbro-passgo-arrow-wrap">
            <HasbroPassGoArrowGlyph className="hasbro-passgo-arrow-svg" />
          </div>
        </div>

        {/* Bottom Rules Description ("Draw 2 cards.") */}
        <div className="hasbro-passgo-desc">
          <span>Draw 2 cards.</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal It's Your Birthday Action Card
 * Faithfully matches official Hasbro reference photo (vibrant pink cardstock, ₥2 coin, 3D ACTION, IT'S YOUR BIRTHDAY badge with cake, Collect ₥2 from each player.)
 */
export const HasbroBirthdayCard = React.memo(function HasbroBirthdayCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 2;

  return (
    <div
      className={`hasbro-birthday-card hasbro-birthday-card--${size} ${
        isInteractive ? "hasbro-birthday-card--interactive" : ""
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      {/* Inner Black Frame with Subtle Pink Herringbone Guilloche */}
      <div className="hasbro-birthday-frame">
        {/* Pink Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-birthday-guilloche"
          strokeColor="rgba(200, 20, 80, 0.2)"
        />

        {/* Top-Left Circular Coin Badge: ₥2 */}
        <div className="hasbro-birthday-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-birthday-header-row">
          <HasbroActionHeaderGlyph className="hasbro-birthday-action-svg" />
        </div>

        {/* Central Circular Pink Feature Badge */}
        <div className="hasbro-birthday-circle-badge">
          <span className="hasbro-birthday-title-top">IT'S YOUR</span>
          <span className="hasbro-birthday-title-bottom">BIRTHDAY</span>
          <div className="hasbro-birthday-cake-wrap">
            <HasbroBirthdayCakeGlyph className="hasbro-birthday-cake-svg" />
          </div>
        </div>

        {/* Bottom Rules Description ("Collect ₥2 from each player.") */}
        <div className="hasbro-birthday-desc">
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <span>Collect</span>
            <MonopolyMSymbol size="0.82em" style={{ margin: "0 0.04em 0 0.16em" }} />
            <span>2 from</span>
          </span>
          <br />
          <span>each player.</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal House Action Card
 * Faithfully matches official Hasbro House reference photo (cyan cardstock, ₥3 coin, 3D ACTION, HOUSE badge with green house, Place on a complete property set to add ₥3 to rent. May not be placed on railroads or utilities.)
 */
export const HasbroHouseCard = React.memo(function HasbroHouseCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 3;

  return (
    <div
      className={`hasbro-house-card hasbro-house-card--${size} ${
        isInteractive ? "hasbro-house-card--interactive" : ""
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      {/* Inner Black Frame with Subtle Cyan Herringbone Guilloche */}
      <div className="hasbro-house-frame">
        {/* Cyan Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-house-guilloche"
          strokeColor="rgba(0, 140, 200, 0.2)"
        />

        {/* Top-Left Circular Coin Badge: ₥3 */}
        <div className="hasbro-house-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-house-header-row">
          <HasbroActionHeaderGlyph className="hasbro-house-action-svg" />
        </div>

        {/* Central Circular Cyan Feature Badge */}
        <div className="hasbro-house-circle-badge">
          <div className="hasbro-house-glyph-wrap">
            <HasbroHouseGlyph className="hasbro-house-glyph-svg" />
          </div>
          <span className="hasbro-house-title">HOUSE</span>
        </div>

        {/* Bottom Rules Description */}
        <div className="hasbro-house-desc">
          <div className="hasbro-house-desc-primary">
            <span>Place on a complete</span>
            <br />
            <span>property set to</span>
            <br />
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <span>add</span>
              <MonopolyMSymbol size="0.82em" style={{ margin: "0 0.04em 0 0.16em" }} />
              <span>3 to rent.</span>
            </span>
          </div>
          <div className="hasbro-house-desc-secondary">
            <span>May not be placed on</span>
            <br />
            <span>railroads or utilities.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Hotel Action Card
 * Faithfully matches official Hasbro Hotel reference photo (lime green cardstock, ₥4 coin, 3D ACTION, HOTEL badge with red hotel, Place on a complete property set that has a house to add ₥4 to rent. The house stays.)
 */
export const HasbroHotelCard = React.memo(function HasbroHotelCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 4;

  return (
    <div
      className={`hasbro-hotel-card hasbro-hotel-card--${size} ${
        isInteractive ? "hasbro-hotel-card--interactive" : ""
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      {/* Inner Black Frame with Subtle Lime Herringbone Guilloche */}
      <div className="hasbro-hotel-frame">
        {/* Lime Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-hotel-guilloche"
          strokeColor="rgba(80, 140, 20, 0.25)"
        />

        {/* Top-Left Circular Coin Badge: ₥4 */}
        <div className="hasbro-hotel-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-hotel-header-row">
          <HasbroActionHeaderGlyph className="hasbro-hotel-action-svg" />
        </div>

        {/* Central Circular Lime Feature Badge */}
        <div className="hasbro-hotel-circle-badge">
          <div className="hasbro-hotel-glyph-wrap">
            <HasbroHotelGlyph className="hasbro-hotel-glyph-svg" />
          </div>
          <span className="hasbro-hotel-title">HOTEL</span>
        </div>

        {/* Bottom Rules Description */}
        <div className="hasbro-hotel-desc">
          <div className="hasbro-hotel-desc-primary">
            <span>Place on a complete</span>
            <br />
            <span>property set that has a</span>
            <br />
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <span>house to add</span>
              <MonopolyMSymbol size="0.82em" style={{ margin: "0 0.04em 0 0.16em" }} />
              <span>4 to rent.</span>
            </span>
          </div>
          <div className="hasbro-hotel-desc-secondary">
            <span>The house stays.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Double The Rent Action Card
 * Faithfully matches official Hasbro reference photo (cream cardstock, ₥1 coin, 3D ACTION, DOUBLE THE RENT badge with money sacks, Play with a rent card. Collect double the rent!)
 */
export const HasbroDoubleTheRentCard = React.memo(function HasbroDoubleTheRentCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 1;

  return (
    <div
      className={`hasbro-double-rent-card hasbro-double-rent-card--${size} ${
        isInteractive ? "hasbro-double-rent-card--interactive" : "hasbro-double-rent-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-double-rent-frame">
        {/* Iridescent Pastel Chevron Security Guilloche Pattern */}
        <HasbroChevronBackground
          id="hasbro-double-rent-guilloche"
          strokeColor="rgba(30, 120, 80, 0.12)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥1 */}
        <div className="hasbro-double-rent-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-double-rent-header-row">
          <HasbroActionHeaderGlyph className="hasbro-double-rent-action-svg" />
        </div>

        {/* Central Circular White Badge with Money Sacks */}
        <div className="hasbro-double-rent-circle-badge">
          <HasbroMoneySacksGlyph style={{ width: "6.6em", height: "4.8em", marginTop: "0.2em" }} />
          <div className="hasbro-double-rent-title-wrap">
            <span className="hasbro-double-rent-line1">DOUBLE</span>
            <span className="hasbro-double-rent-line2">THE RENT</span>
          </div>
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-double-rent-desc">
          <span>Play with a rent card.</span>
          <br />
          <span>Collect double the rent!</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Just Say No Action Card
 * Faithfully matches official Hasbro reference photo (vibrant grass green cardstock, ₥4 coin, 3D ACTION, JUST SAY NO badge with folded-arms Pennybags, Cancel an action card played against you.)
 */
export const HasbroJustSayNoCard = React.memo(function HasbroJustSayNoCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 4;

  return (
    <div
      className={`hasbro-justsayno-card hasbro-justsayno-card--${size} ${
        isInteractive ? "hasbro-justsayno-card--interactive" : "hasbro-justsayno-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-justsayno-frame">
        {/* Subtle Spring Green Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-justsayno-guilloche"
          strokeColor="rgba(40, 110, 15, 0.22)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥4 */}
        <div className="hasbro-justsayno-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title (White letters with green extrusion) */}
        <div className="hasbro-justsayno-header-row">
          <HasbroActionHeaderGlyph
            className="hasbro-justsayno-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#509C12"
            strokeColor="#44860E"
            strokeWidth={2.4}
          />
        </div>

        {/* Central Circular Green Feature Badge */}
        <div className="hasbro-justsayno-circle-badge">
          <HasbroJustSayNoGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-justsayno-desc">
          <span>Cancel an action card</span>
          <br />
          <span>played against you.</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Sly Deal Action Card
 * Faithfully matches official Hasbro reference photo (sky blue cardstock, ₥3 coin, 3D ACTION, SLY DEAL circular badge with burglar Uncle Pennybags, Steal one property from any player & place it in front of you. You may not steal a property that's part of a complete set.)
 */
export const HasbroSlyDealCard = React.memo(function HasbroSlyDealCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 3;

  return (
    <div
      className={`hasbro-slydeal-card hasbro-slydeal-card--${size} ${
        isInteractive ? "hasbro-slydeal-card--interactive" : "hasbro-slydeal-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-slydeal-frame">
        {/* Subtle Sky Blue Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-slydeal-guilloche"
          strokeColor="rgba(40, 130, 180, 0.18)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥3 */}
        <div className="hasbro-slydeal-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title with Sky Blue Extrusion & Diagonal Shard */}
        <div className="hasbro-slydeal-header-row">
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "72%",
              height: "3.2em",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <polygon points="35,0 100,0 100,28 0,28" fill="rgba(255, 255, 255, 0.38)" />
          </svg>
          <HasbroActionHeaderGlyph
            className="hasbro-slydeal-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#72C4ED"
            strokeColor="#56B2E0"
            strokeWidth={2.4}
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        {/* Central Circular Baby-Blue Feature Badge */}
        <div className="hasbro-slydeal-circle-badge">
          <HasbroSlyDealGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-slydeal-desc">
          <div className="hasbro-slydeal-desc-primary">
            <span>Steal one property</span>
            <br />
            <span>from any player &amp; place</span>
            <br />
            <span>it in front of you.</span>
          </div>
          <div className="hasbro-slydeal-desc-secondary">
            <span>You may not steal a property</span>
            <br />
            <span>that&apos;s part of a complete set.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Debt Collector Action Card
 * Faithfully matches official Hasbro reference photo (sky blue cardstock, ₥3 coin, 3D ACTION, DEBT COLLECTOR circular badge with Uncle Pennybags holding walking cane and money wad, Collect ₥5 from any player.)
 */
export const HasbroDebtCollectorCard = React.memo(function HasbroDebtCollectorCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 3;

  return (
    <div
      className={`hasbro-debtcollector-card hasbro-debtcollector-card--${size} ${
        isInteractive ? "hasbro-debtcollector-card--interactive" : "hasbro-debtcollector-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-debtcollector-frame">
        {/* Subtle Sky Blue Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-debtcollector-guilloche"
          strokeColor="rgba(40, 130, 180, 0.18)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥3 */}
        <div className="hasbro-debtcollector-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title with Sky Blue Extrusion & Diagonal Shard */}
        <div className="hasbro-debtcollector-header-row">
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "72%",
              height: "3.2em",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <polygon points="35,0 100,0 100,28 0,28" fill="rgba(255, 255, 255, 0.38)" />
          </svg>
          <HasbroActionHeaderGlyph
            className="hasbro-debtcollector-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#72C4ED"
            strokeColor="#56B2E0"
            strokeWidth={2.4}
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        {/* Central Circular Baby-Blue Feature Badge */}
        <div className="hasbro-debtcollector-circle-badge">
          <HasbroDebtCollectorGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text: Collect ₥5 from any player.) */}
        <div className="hasbro-debtcollector-desc">
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <span>Collect</span>
            <MonopolyMSymbol size="0.82em" style={{ margin: "0 0.04em 0 0.16em" }} />
            <span>5 from</span>
          </span>
          <br />
          <span>any player.</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Deal Breaker Action Card
 * Faithfully matches official Hasbro reference photo (orchid lavender cardstock, ₥5 coin, 3D ACTION with purple extrusion, DEAL BREAKER circular badge with sneaky runner Uncle Pennybags and flying money deeds, and 4-line rules text)
 */
export const HasbroDealBreakerCard = React.memo(function HasbroDealBreakerCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 5;

  return (
    <div
      className={`hasbro-dealbreaker-card hasbro-dealbreaker-card--${size} ${
        isInteractive ? "hasbro-dealbreaker-card--interactive" : "hasbro-dealbreaker-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-dealbreaker-frame">
        {/* Subtle Lavender / Orchid Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-dealbreaker-guilloche"
          strokeColor="rgba(120, 50, 140, 0.16)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥5 */}
        <div className="hasbro-dealbreaker-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title with Orchid Purple Extrusion & Diagonal Shard */}
        <div className="hasbro-dealbreaker-header-row">
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "72%",
              height: "3.2em",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <polygon points="35,0 100,0 100,28 0,28" fill="rgba(255, 255, 255, 0.38)" />
          </svg>
          <HasbroActionHeaderGlyph
            className="hasbro-dealbreaker-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#A478C8"
            strokeColor="#8E5EB6"
            strokeWidth={2.4}
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        {/* Central Circular Lavender Feature Badge */}
        <div className="hasbro-dealbreaker-circle-badge">
          <HasbroDealBreakerGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-dealbreaker-desc">
          <div className="hasbro-dealbreaker-desc-primary">
            <span>Steal a complete property</span>
            <br />
            <span>set from any player,</span>
            <br />
            <span>including any buildings.</span>
          </div>
          <div className="hasbro-dealbreaker-desc-secondary">
            <span>Place it in front of you.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Forced Deal Action Card
 * Faithfully matches official Hasbro reference photo (sky blue cardstock, ₥3 coin, 3D ACTION, FORCED DEAL circular badge with distressed Uncle Pennybags & property swap, Swap any one of your properties with any one of another player's. You may not take a property that's part of a complete set.)
 */
export const HasbroForcedDealCard = React.memo(function HasbroForcedDealCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 3;

  return (
    <div
      className={`hasbro-forceddeal-card hasbro-forceddeal-card--${size} ${
        isInteractive ? "hasbro-forceddeal-card--interactive" : "hasbro-forceddeal-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-forceddeal-frame">
        {/* Subtle Sky Blue Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-forceddeal-guilloche"
          strokeColor="rgba(40, 130, 180, 0.18)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥3 */}
        <div className="hasbro-forceddeal-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title with Sky Blue Extrusion & Diagonal Shard */}
        <div className="hasbro-forceddeal-header-row">
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "72%",
              height: "3.2em",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <polygon points="35,0 100,0 100,28 0,28" fill="rgba(255, 255, 255, 0.38)" />
          </svg>
          <HasbroActionHeaderGlyph
            className="hasbro-forceddeal-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#72C4ED"
            strokeColor="#56B2E0"
            strokeWidth={2.4}
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        {/* Central Circular Baby-Blue Feature Badge */}
        <div className="hasbro-forceddeal-circle-badge">
          <HasbroForcedDealGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-forceddeal-desc">
          <div className="hasbro-forceddeal-desc-primary">
            <span>Swap any one of your</span>
            <br />
            <span>properties with any one</span>
            <br />
            <span>of another player&apos;s.</span>
          </div>
          <div className="hasbro-forceddeal-desc-secondary">
            <span>You may not take a property</span>
            <br />
            <span>that&apos;s part of a complete set.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Rent Card
 * Faithfully matches the official Hasbro Rent card reference photo (Red / Yellow)
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

  const leftColorHex =
    card.primaryColor === "red"
      ? "#ED1B24"
      : primaryConfig?.hex ?? "#ED1B24";

  const rightColorHex =
    card.secondaryColor === "yellow"
      ? "#FFDE00"
      : secondaryConfig?.hex ?? "#FFDE00";

  const leftColorName = (primaryConfig?.name ?? card.primaryColor ?? "red").toUpperCase();
  const rightColorName = (secondaryConfig?.name ?? card.secondaryColor ?? "yellow").toUpperCase();

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
          {isWildRent && (
            <svg
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "72%",
                height: "3.2em",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              <polygon points="35,0 100,0 100,28 0,28" fill="rgba(255, 255, 255, 0.38)" />
            </svg>
          )}
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
              style={{ fontSize: isWildRent ? "0.82em" : "0.74em", lineHeight: isWildRent ? 1.15 : 1.12 }}
            >
              {isWildRent ? (
                <>
                  <span>CHOOSE ANY</span>
                  <br />
                  <span>COLOR</span>
                </>
              ) : (
                <>
                  <span>CHOOSE {leftColorName}</span>
                  <br />
                  <span>OR {rightColorName}</span>
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

export const Card = React.memo(function Card({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
  designVariant,
}: CardProps) {
  // Check if this card should use the authentic Hasbro Monopoly Deal design:
  const isParkLane =
    card.id === "prop-park-lane" || card.name.toLowerCase() === "park place";
  const isRentRedYellow = card.id === "rent-red-yellow";
  const isRentWild =
    card.id === "rent-wild" ||
    (card.type === "rent" && (card as { primaryColor?: string }).primaryColor === "all");
  const isMoney1M = card.id === "money-1m" || (card.type === "money" && card.value === 1);
  const isMoney2M = card.id === "money-2m" || (card.type === "money" && card.value === 2);
  const isMoney3M = card.id === "money-3m" || (card.type === "money" && card.value === 3);
  const isMoney4M = card.id === "money-4m";
  const isMoney5M = card.id === "money-5m" || (card.type === "money" && card.value === 5);
  const isMoney10M = card.id === "money-10m" || (card.type === "money" && card.value === 10);
  const isPassGo = card.id === "action-pass-go";
  const isDoubleTheRent = card.id === "action-double-the-rent";
  const isJustSayNo = card.id === "action-just-say-no";
  const isSlyDeal = card.id === "action-sly-deal";
  const isDebtCollector = card.id === "action-debt-collector";
  const isDealBreaker = card.id === "action-deal-breaker";
  const isForcedDeal = card.id === "action-force-deal" || card.id === "action-forced-deal";
  const isBirthday = card.id === "action-its-my-birthday";
  const isHouse = card.id === "action-house";
  const isHotel = card.id === "action-hotel";
  const isWildAll =
    card.id === "wild-multicolor" ||
    (card.type === "property-wild" && (card as { primaryColor?: string }).primaryColor === "all");

  if (
    (designVariant === "hasbro" && isWildAll) ||
    (designVariant !== "classic" && isWildAll)
  ) {
    return (
      <HasbroWildAllCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isJustSayNo) ||
    (designVariant !== "classic" && isJustSayNo)
  ) {
    return (
      <HasbroJustSayNoCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isSlyDeal) ||
    (designVariant !== "classic" && isSlyDeal)
  ) {
    return (
      <HasbroSlyDealCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isDebtCollector) ||
    (designVariant !== "classic" && isDebtCollector)
  ) {
    return (
      <HasbroDebtCollectorCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isDealBreaker) ||
    (designVariant !== "classic" && isDealBreaker)
  ) {
    return (
      <HasbroDealBreakerCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isForcedDeal) ||
    (designVariant !== "classic" && isForcedDeal)
  ) {
    return (
      <HasbroForcedDealCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isDoubleTheRent) ||
    (designVariant !== "classic" && isDoubleTheRent)
  ) {
    return (
      <HasbroDoubleTheRentCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isPassGo) ||
    (designVariant !== "classic" && isPassGo)
  ) {
    return (
      <HasbroPassGoCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isBirthday) ||
    (designVariant !== "classic" && isBirthday)
  ) {
    return (
      <HasbroBirthdayCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isHouse) ||
    (designVariant !== "classic" && isHouse)
  ) {
    return (
      <HasbroHouseCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  if (
    (designVariant === "hasbro" && isHotel) ||
    (designVariant !== "classic" && isHotel)
  ) {
    return (
      <HasbroHotelCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  const useHasbroMoney =
    (designVariant === "hasbro" && card.type === "money") ||
    (designVariant !== "classic" && (isMoney1M || isMoney2M || isMoney3M || isMoney4M || isMoney5M || isMoney10M));

  if (useHasbroMoney) {
    return (
      <HasbroMoneyCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  const useHasbroRent =
    (designVariant === "hasbro" && card.type === "rent") ||
    (designVariant !== "classic" && (isRentRedYellow || isRentWild));

  if (useHasbroRent) {
    return (
      <HasbroRentCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  const useHasbroDesign =
    designVariant === "hasbro" ||
    (designVariant !== "classic" && (card.type === "property" || isParkLane));

  if (useHasbroDesign) {
    return (
      <HasbroPropertyCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  const primaryConfig = card.primaryColor
    ? COLOR_CONFIG[card.primaryColor]
    : undefined;
  const secondaryConfig = card.secondaryColor
    ? COLOR_CONFIG[card.secondaryColor]
    : undefined;

  const primaryHex = primaryConfig?.hex ?? (card.type === "money" ? "#1F8A4C" : "#0055A4");
  const darkHex = primaryConfig?.darkHex ?? (card.type === "money" ? "#0E522B" : "#002F5E");
  const secondaryHex = secondaryConfig?.hex;
  const isDarkText =
    primaryConfig?.textHex === "#111415" ||
    card.primaryColor === "yellow" ||
    card.primaryColor === "light-blue";

  // Category label for the header
  const categoryLabel =
    card.tagline ||
    (card.type === "property"
      ? "PROPERTY"
      : card.type === "property-wild"
      ? "WILD PROPERTY"
      : card.type === "action"
      ? "ACTION"
      : card.type === "rent"
      ? "RENT"
      : card.type === "money"
      ? "MONEY"
      : "RULES");

  // Default icons for top-left coin
  const coinIcon =
    card.icon ||
    (card.type === "property"
      ? card.primaryColor === "railroad"
        ? "train"
        : card.primaryColor === "utility"
        ? "bolt"
        : "location_city"
      : card.type === "property-wild"
      ? "auto_awesome"
      : card.type === "action"
      ? "bolt"
      : card.type === "rent"
      ? "payments"
      : card.type === "money"
      ? "attach_money"
      : "help");

  // Resolve rent tiers from card or fallback to COLOR_CONFIG
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

  return (
    <div
      onClick={onClick}
      style={
        {
          "--card-color": primaryHex,
          "--card-color-dark": darkHex,
          "--card-color-secondary": secondaryHex,
          "--card-text-color": isDarkText ? "#111415" : "#FFFFFF",
        } as React.CSSProperties
      }
      className={`monopoly-card monopoly-card--${size} monopoly-card--${card.type} ${
        isInteractive ? "monopoly-card--interactive" : "monopoly-card--disabled"
      } ${className}`}
      role="img"
      aria-label={card.name}
    >
      {/* Texture Noise Overlay */}
      <div className="texture-overlay" />

      {/* Inner Card Frame */}
      <div className="card-inner-frame">
        {/* ============================================================ */}
        {/* 1. TOP HEADER BANNER (Matching Shared Reference Design)      */}
        {/* ============================================================ */}
        <div
          className={`card-arched-header ${
            isDarkText ? "card-arched-header--dark-text" : "card-arched-header--light-text"
          }`}
          style={
            card.primaryColor === "all"
              ? {
                  background:
                    "linear-gradient(135deg, #8B4513 0%, #87CEEB 15%, #D83A8F 30%, #F28C28 45%, #ED1B24 60%, #FFDE00 75%, #008000 90%, #0055A4 100%)",
                  color: "#FFFFFF",
                }
              : secondaryHex
              ? {
                  background: `linear-gradient(135deg, ${primaryHex} 50%, ${secondaryHex} 50%)`,
                  color: "#FFFFFF",
                }
              : undefined
          }
        >
          {/* Top-Left Circular Badge with Solid White Background & Card-Color Skyline */}
          <div className="card-header-badge-circle">
            {card.type === "property" ? (
              <svg
                viewBox="0 0 36 36"
                className="card-header-city-svg"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Left Building with 45-deg angled pitched roof */}
                <path d="M4 31V15l5-5v21H4z" fill={primaryHex} />
                {/* Left-mid building */}
                <path d="M9 31V12.5h4v18.5H9z" fill={primaryHex} />
                {/* Center Tall Skyscraper with Spire Needle & Stepped Tiers */}
                <path d="M13 31V9.5h10V31H13z" fill={primaryHex} />
                <path d="M15 9.5V5.5h6v4h-6z" fill={primaryHex} />
                <path d="M17 5.5V1.5h2v4h-2z" fill={primaryHex} />
                {/* Window Cutouts in Center Skyscraper */}
                <rect x="14.8" y="11.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="11.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="14.8" y="15.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="15.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="14.8" y="19.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="19.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="14.8" y="23.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="23.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="14.8" y="27.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="27.5" width="2" height="2.5" fill="#FFFFFF" />
                {/* Right Mid Building with Spire Antenna */}
                <path d="M23 31V13.5h4.5V31H23z" fill={primaryHex} />
                <path d="M24.8 13.5V7.5h1.2v6h-1.2z" fill={primaryHex} />
                {/* Far Right Stepped Building with Window Dots */}
                <path d="M27.5 31V17h4.5v14h-4.5z" fill={primaryHex} />
                <rect x="29" y="19.5" width="1.6" height="2.2" fill="#FFFFFF" />
                <rect x="29" y="23.5" width="1.6" height="2.2" fill="#FFFFFF" />
                <rect x="29" y="27.5" width="1.6" height="2.2" fill="#FFFFFF" />
                {/* Horizontal Ground Line */}
                <rect x="3" y="30.5" width="30" height="2" fill={primaryHex} />
              </svg>
            ) : (
              <span
                className="material-symbols-outlined"
                style={{ color: primaryHex, fontVariationSettings: "'FILL' 1", fontSize: "1.25em" }}
              >
                {coinIcon}
              </span>
            )}
          </div>

          {/* Top-Right Circular Badge with Right-Half Color Value Text */}
          {card.value > 0 && (
            <div className="card-header-badge-circle card-header-badge-circle--right">
              <span
                className="card-header-value-text"
                style={{ color: secondaryHex || primaryHex }}
              >
                ${card.value}M
              </span>
            </div>
          )}

          {/* Category Tag with Dash Accents (e.g. — PROPERTY —) */}
          <span className="card-header-category">{categoryLabel}</span>

          {/* Main Card Title in Bold High-Contrast Black Typography */}
          <h3 className="card-header-title">{card.name}</h3>

          {/* Bottom Center Point Star Shield */}
          <div className="card-header-star-shield">
            <span className="card-star-glyph">★</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. CARD BODY SECTION (Dynamic Sizing Based on Tiers)         */}
        {/* ============================================================ */}
        <div
          className={`card-body-section card-body-section--${card.type} ${
            effectiveRentTiers.length > 0
              ? `card-body-section--tiers-${effectiveRentTiers.length}`
              : ""
          }`}
        >
          {/* Property Card Body (Matching Shared Reference) */}
          {card.type === "property" && (
            <>
              <div className="card-body-heading">
                <span className="card-body-heading-dash">—</span>
                <span>RENT</span>
                <span className="card-body-heading-dash">—</span>
              </div>
              <p className="card-body-subtitle">
                Collect rent from the player who has this card in their hand.
              </p>
              <div className="card-rent-table-box">
                <div className="card-rent-table-rows">
                  {effectiveRentTiers.map((tier) => (
                    <div key={tier.setCount} className="card-rent-row">
                      <div className="card-rent-set-col">
                        <span className="card-rent-set-label">
                          {tier.setCount} {tier.setCount === 1 ? "SET" : "SETS"}
                        </span>
                        {tier.isComplete && (
                          <span className="card-rent-complete-tag">(COMPLETE)</span>
                        )}
                      </div>

                      {/* Center Money Bag Icon in Card Color */}
                      <div className="card-rent-moneybag-col">
                        <svg
                          viewBox="0 0 24 24"
                          className="card-rent-moneybag-svg"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.5 5.5c0-.8.7-1.5 1.5-1.5h2c.8 0 1.5.7 1.5 1.5 0 .4-.2.8-.5 1h-4c-.3-.2-.5-.6-.5-1z"
                            fill={primaryHex}
                          />
                          <rect
                            x="8.5"
                            y="6"
                            width="7"
                            height="1.2"
                            rx="0.6"
                            fill={primaryHex}
                          />
                          <path
                            d="M5.5 10c0-2 2-2.8 4-2.8h5c2 0 4 .8 4 2.8 0 4.5 1 9.5-3 10.5-1.5.4-5.5.4-7 0-4-1-3-6-3-10.5z"
                            fill={primaryHex}
                          />
                          <text
                            x="12"
                            y="15.8"
                            fill="#FFFFFF"
                            fontSize="6.5"
                            fontWeight="900"
                            textAnchor="middle"
                            fontFamily="system-ui, -apple-system, sans-serif"
                          >
                            $
                          </text>
                        </svg>
                      </div>

                      <div className="card-rent-amount-col">
                        <span className="card-rent-amount">M{tier.rent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Property Wild Card Body */}
          {card.type === "property-wild" && (
            <>
              <div className="card-body-heading">WILD PROPERTY</div>
              <p className="card-body-subtitle">
                {card.description || "Can be part of either matching color set. Swap colors freely on your turn."}
              </p>
              <div className="card-wild-indicator-box">
                {card.primaryColor === "all" ? (
                  <div className="card-wild-rainbow-text">★ 10-COLOR MULTI-WILD ★</div>
                ) : (
                  <div className="card-wild-dual-tags">
                    <span
                      className="card-wild-dual-pill"
                      style={{ background: primaryHex, color: isDarkText ? "#111" : "#FFF" }}
                    >
                      {primaryConfig?.name || "Color 1"}
                    </span>
                    <span className="card-wild-dual-divider">⇄</span>
                    <span
                      className="card-wild-dual-pill"
                      style={{ background: secondaryHex || primaryHex, color: "#FFF" }}
                    >
                      {secondaryConfig?.name || "Color 2"}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Card Body */}
          {card.type === "action" && (
            <>
              <div className="card-action-icon-badge">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {coinIcon}
                </span>
              </div>
              <div className="card-action-desc-box">
                <p className="card-action-description-text">{card.description}</p>
              </div>
              <div className="card-action-bank-val">
                <span>BANK VALUE: ${card.value}M</span>
              </div>
            </>
          )}

          {/* Rent Card Body */}
          {card.type === "rent" && (
            <>
              <div className="card-body-heading">RENT ACTION</div>
              <div className="card-rent-icon-badge">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  payments
                </span>
              </div>
              <div className="card-action-desc-box">
                <p className="card-action-description-text">{card.description}</p>
              </div>
            </>
          )}

          {/* Money Card Body */}
          {card.type === "money" && (
            <div className="card-money-banknote">
              <div className="card-money-banknote-inner">
                <div className="card-money-banknote-corner-tl">${card.value}M</div>
                <div className="card-money-banknote-corner-tr">${card.value}M</div>
                <div className="card-money-banknote-center">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "1.4em", fontVariationSettings: "'FILL' 1" }}
                  >
                    attach_money
                  </span>
                  <span className="card-money-banknote-amount">${card.value}M</span>
                  <span className="card-money-banknote-label">DEALOPOLY CASH</span>
                </div>
                <div className="card-money-banknote-corner-bl">${card.value}M</div>
                <div className="card-money-banknote-corner-br">${card.value}M</div>
              </div>
            </div>
          )}

          {/* Rule Card Body */}
          {card.type === "rule" && (
            <div className="card-rule-body">
              <div className="card-body-heading">RULES OF PLAY</div>
              <ul className="card-rule-list">
                <li><strong>1. Draw:</strong> 2 cards from deck.</li>
                <li><strong>2. Play:</strong> Up to 3 cards per turn.</li>
                <li><strong>3. Bank:</strong> Action & Money go to bank.</li>
                <li><strong>4. Win:</strong> 3 full property sets!</li>
              </ul>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 3. CARD FOOTER WITH SKYLINE & PLINTH & BRAND TAB             */}
        {/* ============================================================ */}
        <div className="card-footer-zone">
          {/* Skyline Silhouette Watermark (Spanning Full Left to Right) */}
          <div
            className="card-skyline-vector"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 50' fill='%239E9284'%3E%3Cpath d='M0,50 L0,32 L8,32 L8,24 L14,24 L14,14 L20,14 L20,50 L28,50 L28,20 L34,10 L40,20 L40,50 L48,50 L48,34 L56,34 L56,50 L66,50 L66,16 L72,6 L78,16 L78,50 L90,50 L90,26 L100,26 L100,50 L112,50 L112,22 L118,12 L124,22 L124,50 L136,50 L136,30 L146,30 L146,50 L158,50 L158,18 L164,8 L170,18 L170,50 L182,50 L182,24 L192,24 L192,50 L204,50 L204,14 L210,4 L216,14 L216,50 L226,50 L226,30 L234,30 L234,50 L240,50 L240,50 Z'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Center Plinth / Emblem */}
          <div className="card-bottom-plinth">
            <div className="card-plinth-circle">
              <span>{card.setSize ?? (card.value > 0 ? card.value : "★")}</span>
            </div>
          </div>

          {/* Bottom Brand Pill Tab */}
          <div className="card-bottom-brand-pill">
            DEALOPOLY
          </div>
        </div>
      </div>
    </div>
  );
});
