"use client";

import React from "react";
import { COLOR_CONFIG } from "@dealopoly/shared";

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
        {/* Subtle Chevron Security Pattern inside Circular Badge */}
        <pattern id="debtBadgeChevron" width="14" height="9" patternUnits="userSpaceOnUse">
          <path d="M0 0 L7 4.5 L14 0 M0 4.5 L7 9 L14 4.5" fill="none" stroke="rgba(30, 110, 160, 0.22)" strokeWidth="1.1" />
        </pattern>
        <clipPath id="debtCircleClip">
          <circle cx="85" cy="85" r="80" />
        </clipPath>
      </defs>

      {/* Circular Badge Background & Chevron Guilloche */}
      <circle cx="85" cy="85" r="84" fill="#BCE7FA" />
      <circle cx="85" cy="85" r="84" fill="url(#debtBadgeChevron)" />

      {/* Inner Concentric Ring matching official card */}
      <circle cx="85" cy="85" r="78" fill="none" stroke="#111111" strokeWidth="1.5" />

      {/* "DEBT" Typography (Centered, Upper Third) */}
      <text
        x="85"
        y="34"
        fill="#111111"
        fontSize="28"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.04em"
      >
        DEBT
      </text>

      {/* "COLLECTOR" Typography (Centered below DEBT) */}
      <text
        x="85"
        y="56"
        fill="#111111"
        fontSize="20"
        fontWeight="900"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif"
        textAnchor="middle"
        letterSpacing="0.02em"
      >
        COLLECTOR
      </text>

      {/* Rich Uncle Pennybags Illustrated Character (Clipped to circular badge) */}
      <g clipPath="url(#debtCircleClip)">
        <g id="debtPennybags" transform="translate(85, 111)">
          {/* Tuxedo Body & Coat (Extending down to bottom rim) */}
          <path
            d="M-34 26 C-32 12 -16 6 0 6 C16 6 32 12 34 26 L38 62 L-38 62 Z"
            fill="#111111"
            stroke="#111111"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* White Shirtfront V-Triangle */}
          <polygon points="-7,8 7,8 0,30" fill="#FFFFFF" stroke="#111111" strokeWidth="1.4" />

          {/* Black Bowtie */}
          <polygon points="-7,9 -1,11 -7,14" fill="#111111" stroke="#111111" strokeWidth="0.8" />
          <polygon points="7,9 1,11 7,14" fill="#111111" stroke="#111111" strokeWidth="0.8" />
          <circle cx="0" cy="11.5" r="1.4" fill="#111111" />

          {/* LEFT ARM & MONEY WAD (Viewer's Right - Raised Holding Fanned Bills) */}
          {/* Arm Sleeve extending up-right */}
          <path
            d="M18 16 C26 14 36 10 44 1"
            stroke="#111111"
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* White Shirt Cuff */}
          <rect
            x="40"
            y="-3"
            width="5.5"
            height="5"
            rx="1"
            transform="rotate(-35, 42, -1)"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="1.3"
          />

          {/* Fanned Green Monopoly Banknotes in Left Hand */}
          <g id="moneyWad" transform="translate(48, -5)">
            {/* Bill 1 (Leftmost / Back) */}
            <polygon
              points="-13,-14 -6,-23 -1,-6 -8,3"
              fill="#BAE73C"
              stroke="#111111"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            {/* Bill 2 (Mid-Left) */}
            <polygon
              points="-7,-26 4,-26 5,-8 -6,-8"
              fill="#A4E02C"
              stroke="#111111"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            {/* Bill 3 (Mid-Right) */}
            <polygon
              points="1,-27 13,-22 9,-4 -3,-9"
              fill="#8ED424"
              stroke="#111111"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            {/* Bill 4 (Frontmost with M Emblem) */}
            <polygon
              points="5,-24 20,-15 15,1 0,-8"
              fill="#B4E538"
              stroke="#111111"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Inner Border on Front Bill */}
            <polygon
              points="6,-21 18,-13 13,-1 1,-8"
              fill="none"
              stroke="#569914"
              strokeWidth="1"
            />
            {/* Currency Emblem Circle on Front Bill */}
            <ellipse cx="10" cy="-11" rx="4.2" ry="3.8" fill="#FFFFFF" stroke="#111111" strokeWidth="1.1" />
            {/* Monopoly M Emblem */}
            <g transform="translate(10, -11) scale(0.32)">
              <path d="M-4 4 V-4 H-1 L0 0 L1 -4 H4 V4 H2.5 V0 L0.5 3 H-0.5 L-2.5 0 V4 Z" fill="#111111" />
              <line x1="-5" y1="-1" x2="5" y2="-1" stroke="#111111" strokeWidth="1.2" />
            </g>

            {/* White Gloved Left Hand Fingers Gripping Base of Bills */}
            <path
              d="M-4 3 C-2 -2 6 -2 8 3"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.5"
            />
            <ellipse cx="1" cy="4" rx="4.5" ry="3.8" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />
            <path d="M-1 1 L-1 6 M2 1 L2 7" stroke="#111111" strokeWidth="1" />
          </g>

          {/* RIGHT ARM & PROMINENT WHITE WALKING CANE (Viewer's Left) */}
          {/* Right Arm Sleeve reaching down-left */}
          <path
            d="M-18 16 C-26 19 -34 25 -30 33"
            stroke="#111111"
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* White Shirt Cuff */}
          <rect
            x="-34"
            y="28"
            width="5.5"
            height="5"
            rx="1"
            transform="rotate(25, -32, 30)"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="1.3"
          />

          {/* PROMINENT WHITE WALKING CANE WITH CURVED J-HANDLE */}
          <g id="walkingCane">
            {/* Cane Shaft extending down-right across torso to bottom boundary */}
            <line x1="-28" y1="33" x2="-10" y2="58" stroke="#111111" strokeWidth="6.5" strokeLinecap="round" />
            <line x1="-28" y1="33" x2="-10" y2="58" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" />

            {/* Cane Crook Handle (Curving Up, Left, and Down into J-Hook) */}
            {/* Black Outline */}
            <path
              d="M-28 33 L-29 19 C-30 6 -47 6 -48 19 L-47 28"
              fill="none"
              stroke="#111111"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* White Solid Interior */}
            <path
              d="M-28 33 L-29 19 C-30 6 -47 6 -48 19 L-47 28"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* White Gloved Right Hand Gripping Cane Shaft */}
          <g id="rightHand" transform="translate(-28, 33)">
            <ellipse cx="0" cy="0" rx="4.8" ry="4.2" fill="#FFFFFF" stroke="#111111" strokeWidth="1.6" />
            <path d="M-2 -2 C1 -2 3 0 1 3" stroke="#111111" strokeWidth="1.2" fill="none" />
          </g>

          {/* HEAD, CHEEKS & EXPRESSION */}
          {/* Head Contour (Rounded Cheeks) */}
          <path
            d="M0 -15 C10 -15 15 -11 16 -4 C18 3 16 10 12 13 C6 17 -6 17 -12 13 C-16 10 -18 3 -16 -4 C-15 -11 -10 -15 0 -15 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="2.4"
          />
          {/* Right Ear */}
          <path d="M16 -4 C19 -1 18 3 16 1" fill="#FFFFFF" stroke="#111111" strokeWidth="1.8" />

          {/* Arched Eyebrows */}
          <path d="M-9 -8 Q-5 -11 -1 -8" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M2 -8 Q6 -11 10 -8" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Black Round Eyes */}
          <ellipse cx="-5" cy="-4" rx="1.6" ry="2" fill="#111111" />
          <ellipse cx="5" cy="-4" rx="1.6" ry="2" fill="#111111" />

          {/* Button Nose */}
          <ellipse cx="0" cy="-1" rx="2.2" ry="1.7" fill="#FFFFFF" stroke="#111111" strokeWidth="1.4" />

          {/* Big Fluffy Handlebar Mustache */}
          <path
            d="M0 0 C-6 -4 -16 -2 -21 4 C-14 4 -5 2 0 1 C5 2 14 4 21 4 C16 -2 6 -4 0 0 Z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Smile Line under Mustache */}
          <path d="M-4 7 Q0 10 4 7" stroke="#111111" strokeWidth="1.7" fill="none" strokeLinecap="round" />

          {/* CLASSIC BLACK TOP HAT */}
          <g transform="translate(1, -14) rotate(4)">
            {/* Crown */}
            <polygon
              points="-12,0 -9,-22 13,-20 12,0"
              fill="#111111"
              stroke="#111111"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* White Highlight Reflection on Crown */}
            <polygon
              points="-7,-1 -5,-20 -2,-20 -4,-1"
              fill="#FFFFFF"
              opacity="0.25"
            />
            {/* White Ribbon Hatband */}
            <polygon
              points="-12,-1 -11,-5 12,-3 12,0"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.2"
            />
            {/* Wide Curved Brim */}
            <path
              d="M-21 2 C-6 -3 9 -2 23 3 C9 -1 -6 -1 -21 2 Z"
              fill="#111111"
              stroke="#111111"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path
              d="M-21 2 Q2 -3 23 3"
              stroke="#111111"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>
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


/**
 * Authentic Mini Property Card Glyphs for Dual-Color Wild Property Cards
 * Ensures 100% consistent front-card size across single cards, 2-stacks, 3-stacks, and 4-stacks.
 */
export function HasbroDualWildPropertyCountGlyph({
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
  const cardW = 17;
  const cardH = 25;
  const rx = 2.4;
  const strokeW = 1.4;

  let stackSvg = null;
  if (count === 1) {
    stackSvg = (
      <>
        <rect
          x="13.5"
          y="3"
          width={cardW}
          height={cardH}
          rx={rx}
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth={strokeW}
        />
        <path
          d={`M 13.5 ${3 + rx} A ${rx} ${rx} 0 0 1 ${13.5 + rx} 3 L ${13.5 + cardW - rx} 3 A ${rx} ${rx} 0 0 1 ${13.5 + cardW} ${3 + rx} L ${13.5 + cardW} 9 L 13.5 9 Z`}
          fill={color}
          stroke="#111111"
          strokeWidth={strokeW}
        />
        <text
          x="22"
          y="22"
          fill={digitColor}
          fontSize="12"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
        >
          1
        </text>
      </>
    );
  } else if (count === 2) {
    stackSvg = (
      <>
        <g transform="translate(13.5, 3) rotate(-11 13.5 15)">
          <rect
            x="0"
            y="0"
            width={cardW}
            height={cardH}
            rx={rx}
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth={strokeW}
          />
          <path
            d={`M 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 L ${cardW - rx} 0 A ${rx} ${rx} 0 0 1 ${cardW} ${rx} L ${cardW} 6 L 0 6 Z`}
            fill={color}
            stroke="#111111"
            strokeWidth={strokeW}
          />
        </g>
        <rect
          x="14"
          y="4"
          width={cardW}
          height={cardH}
          rx={rx}
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth={strokeW}
        />
        <path
          d={`M 14 ${4 + rx} A ${rx} ${rx} 0 0 1 ${14 + rx} 4 L ${14 + cardW - rx} 4 A ${rx} ${rx} 0 0 1 ${14 + cardW} ${4 + rx} L ${14 + cardW} 10 L 14 10 Z`}
          fill={color}
          stroke="#111111"
          strokeWidth={strokeW}
        />
        <text
          x="22.5"
          y="23"
          fill={digitColor}
          fontSize="12"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
        >
          2
        </text>
      </>
    );
  } else if (count === 3) {
    stackSvg = (
      <>
        <g transform="translate(13.5, 3) rotate(-13 13.5 15)">
          <rect
            x="0"
            y="0"
            width={cardW}
            height={cardH}
            rx={rx}
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth={strokeW}
          />
          <path
            d={`M 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 L ${cardW - rx} 0 A ${rx} ${rx} 0 0 1 ${cardW} ${rx} L ${cardW} 6 L 0 6 Z`}
            fill={color}
            stroke="#111111"
            strokeWidth={strokeW}
          />
        </g>
        <g transform="translate(13.5, 3) rotate(13 30.5 15)">
          <rect
            x="0"
            y="0"
            width={cardW}
            height={cardH}
            rx={rx}
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth={strokeW}
          />
          <path
            d={`M 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 L ${cardW - rx} 0 A ${rx} ${rx} 0 0 1 ${cardW} ${rx} L ${cardW} 6 L 0 6 Z`}
            fill={color}
            stroke="#111111"
            strokeWidth={strokeW}
          />
        </g>
        <rect
          x="13.5"
          y="4"
          width={cardW}
          height={cardH}
          rx={rx}
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth={strokeW}
        />
        <path
          d={`M 13.5 ${4 + rx} A ${rx} ${rx} 0 0 1 ${13.5 + rx} 4 L ${13.5 + cardW - rx} 4 A ${rx} ${rx} 0 0 1 ${13.5 + cardW} ${4 + rx} L ${13.5 + cardW} 10 L 13.5 10 Z`}
          fill={color}
          stroke="#111111"
          strokeWidth={strokeW}
        />
        <text
          x="22"
          y="23"
          fill={digitColor}
          fontSize="12"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
        >
          3
        </text>
      </>
    );
  } else {
    stackSvg = (
      <>
        <g transform="translate(13.5, 3) rotate(-18 13.5 15)">
          <rect
            x="0"
            y="0"
            width={cardW}
            height={cardH}
            rx={rx}
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth={strokeW}
          />
          <path
            d={`M 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 L ${cardW - rx} 0 A ${rx} ${rx} 0 0 1 ${cardW} ${rx} L ${cardW} 6 L 0 6 Z`}
            fill={color}
            stroke="#111111"
            strokeWidth={strokeW}
          />
        </g>
        <g transform="translate(13.5, 3) rotate(-8 13.5 15)">
          <rect
            x="0"
            y="0"
            width={cardW}
            height={cardH}
            rx={rx}
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth={strokeW}
          />
          <path
            d={`M 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 L ${cardW - rx} 0 A ${rx} ${rx} 0 0 1 ${cardW} ${rx} L ${cardW} 6 L 0 6 Z`}
            fill={color}
            stroke="#111111"
            strokeWidth={strokeW}
          />
        </g>
        <g transform="translate(13.5, 3) rotate(13 30.5 15)">
          <rect
            x="0"
            y="0"
            width={cardW}
            height={cardH}
            rx={rx}
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth={strokeW}
          />
          <path
            d={`M 0 ${rx} A ${rx} ${rx} 0 0 1 ${rx} 0 L ${cardW - rx} 0 A ${rx} ${rx} 0 0 1 ${cardW} ${rx} L ${cardW} 6 L 0 6 Z`}
            fill={color}
            stroke="#111111"
            strokeWidth={strokeW}
          />
        </g>
        <rect
          x="13.5"
          y="4"
          width={cardW}
          height={cardH}
          rx={rx}
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth={strokeW}
        />
        <path
          d={`M 13.5 ${4 + rx} A ${rx} ${rx} 0 0 1 ${13.5 + rx} 4 L ${13.5 + cardW - rx} 4 A ${rx} ${rx} 0 0 1 ${13.5 + cardW} ${4 + rx} L ${13.5 + cardW} 10 L 13.5 10 Z`}
          fill={color}
          stroke="#111111"
          strokeWidth={strokeW}
        />
        <text
          x="22"
          y="23"
          fill={digitColor}
          fontSize="12"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
        >
          4
        </text>
      </>
    );
  }

  return (
    <svg
      viewBox="0 0 44 32"
      className="hasbro-dual-wild-mini-card-svg"
      style={{ overflow: "visible", display: "block" }}
    >
      {isComplete && (
        <>
          <line
            x1="2"
            y1="12"
            x2="8"
            y2="15"
            stroke="#111111"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line
            x1="3"
            y1="22"
            x2="8"
            y2="19"
            stroke="#111111"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line
            x1="42"
            y1="12"
            x2="36"
            y2="15"
            stroke="#111111"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line
            x1="41"
            y1="22"
            x2="36"
            y2="19"
            stroke="#111111"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      )}
      {stackSvg}
    </svg>
  );
}

