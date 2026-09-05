"use client";

import React from "react";
import type { LeastCountCard, Suit } from "@dealopoly/game-engine";

export interface StandardCardProps {
  card?: LeastCountCard;
  isSelected?: boolean;
  onClick?: () => void;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  faceDown?: boolean;
  variant?: "classic" | "gold" | "carbon";
  showPointsBadge?: boolean;
  disabled?: boolean;
  className?: string;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const SUIT_COLORS: Record<Suit, { primary: string; secondary: string; dark: string }> = {
  spades: { primary: "#111827", secondary: "#1e293b", dark: "#090d16" },
  hearts: { primary: "#be123c", secondary: "#e11d48", dark: "#881337" },
  diamonds: { primary: "#c2410c", secondary: "#ea580c", dark: "#7c2d12" },
  clubs: { primary: "#1e293b", secondary: "#334155", dark: "#0f172a" },
};

/**
 * Ornate 3D Embossed "CARD VALUE" Shield Badge
 */
const CardValueShield: React.FC<{
  points: number;
  isKing: boolean;
  size?: string;
  suit: Suit;
}> = ({ points, isKing, suit }) => {
  const isRed = suit === "hearts" || suit === "diamonds";
  const shieldBg = isKing ? "#16253b" : isRed ? "#23151b" : "#16253b";
  const numColor = isKing ? "#fde047" : "#ffffff";

  return (
    <div className={`card-value-shield ${isKing ? "card-value-shield--king" : ""}`}>
      {/* SVG Shield Base */}
      <svg
        className="card-value-shield-svg"
        viewBox="0 0 100 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`shieldGoldGrad-${points}-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#d4a34b" />
            <stop offset="70%" stopColor="#b47b1e" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>
          <linearGradient id={`shieldBgGrad-${points}-${suit}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={shieldBg} />
            <stop offset="100%" stopColor="#0a101d" />
          </linearGradient>
          <filter id={`shieldShadow-${points}-${suit}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Outer Metallic Shield with bevel */}
        <path
          d="M50 3 L88 15 C88 56 68 84 50 93 C32 84 12 56 12 15 Z"
          fill={`url(#shieldGoldGrad-${points}-${suit})`}
          filter={`url(#shieldShadow-${points}-${suit})`}
        />
        {/* Inner Shield Core */}
        <path
          d="M50 7 L84 18 C84 53 66 79 50 87 C34 79 16 53 16 18 Z"
          fill={`url(#shieldBgGrad-${points}-${suit})`}
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="1.5"
        />

        {/* Ribbon Header Container */}
        <rect x="8" y="24" width="84" height="23" rx="3" fill="#0b1320" stroke={`url(#shieldGoldGrad-${points}-${suit})`} strokeWidth="1.5" />
        <text
          x="50"
          y="39"
          textAnchor="middle"
          fill="#fef3c7"
          fontSize="9.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1.2"
        >
          CARD VALUE:
        </text>

        {/* Large Points Display */}
        <text
          x="50"
          y="77"
          textAnchor="middle"
          fill={numColor}
          fontSize="30"
          fontWeight="900"
          fontFamily="serif, 'Times New Roman', Georgia"
          filter={isKing ? "drop-shadow(0px 0px 4px #fbbf24)" : "drop-shadow(0px 1px 2px #000)"}
        >
          {points}
        </text>
      </svg>
    </div>
  );
};

/**
 * Detailed Vector Illustration for King (K)
 */
const KingIllustration: React.FC<{ suitColor: string; suitSymbol: string }> = ({ suitColor, suitSymbol }) => (
  <svg viewBox="0 0 160 170" className="character-art-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Royal Throne Backrest */}
    <path d="M42 55 L42 165 L118 165 L118 55 C118 45 42 45 42 55 Z" fill="#9a3412" stroke="#b45309" strokeWidth="2.5" />
    <circle cx="38" cy="46" r="6" fill="#facc15" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="122" cy="46" r="6" fill="#facc15" stroke="#b45309" strokeWidth="1.5" />

    {/* Royal Ermine Cloak */}
    <path d="M30 110 C25 150 40 170 80 170 C120 170 135 150 130 110 Z" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
    <path d="M45 125 L49 132 M115 125 L111 132 M75 140 L80 148 M85 140 L80 148" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />

    {/* Blue/Red Royal Coat */}
    <path d="M48 95 C45 130 55 160 80 160 C105 160 115 130 112 95 Z" fill="#1e3a8a" stroke="#ca8a04" strokeWidth="2" />
    <path d="M72 95 L80 160 L88 95 Z" fill="#b91c1c" />

    {/* Scepter with Golden Suit Pip (Left Hand) */}
    <line x1="28" y1="50" x2="28" y2="160" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
    <circle cx="28" cy="45" r="9" fill="#fde047" stroke="#b45309" strokeWidth="2" />
    <text x="28" y="49" textAnchor="middle" fill="#78350f" fontSize="10" fontWeight="900">{suitSymbol}</text>

    {/* Hand holding Scepter */}
    <circle cx="28" cy="100" r="7" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />

    {/* Beer Mug / Goblet (Right Hand) */}
    <rect x="126" y="85" width="18" height="26" rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
    <path d="M144 92 C150 92 150 104 144 104" stroke="#ca8a04" strokeWidth="2.5" fill="none" />
    <rect x="124" y="82" width="22" height="6" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
    <circle cx="126" cy="100" r="7" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />

    {/* King Head & Beard */}
    <circle cx="80" cy="72" r="19" fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />
    {/* Full Majestic Beard */}
    <path d="M62 72 C62 98 98 98 98 72 C98 88 80 102 62 72 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
    {/* Mustache */}
    <path d="M68 76 C74 72 80 76 80 76 C80 76 86 72 92 76 C86 82 74 82 68 76 Z" fill="#451a03" />
    {/* Smile & Eyes */}
    <path d="M74 78 Q80 83 86 78" stroke="#f8fafc" strokeWidth="2" fill="none" />
    <circle cx="73" cy="67" r="2.5" fill="#0f172a" />
    <circle cx="87" cy="67" r="2.5" fill="#0f172a" />
    <path d="M70 63 Q74 60 77 63" stroke="#451a03" strokeWidth="1.5" fill="none" />
    <path d="M83 63 Q86 60 90 63" stroke="#451a03" strokeWidth="1.5" fill="none" />

    {/* Golden Imperial Crown */}
    <path d="M60 56 L62 34 L71 44 L80 28 L89 44 L98 34 L100 56 Z" fill="#facc15" stroke="#b45309" strokeWidth="2.5" />
    <circle cx="80" cy="28" r="3" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
    <circle cx="62" cy="34" r="2.5" fill="#3b82f6" />
    <circle cx="98" cy="34" r="2.5" fill="#3b82f6" />
    <circle cx="80" cy="48" r="3.5" fill="#ef4444" />
  </svg>
);

/**
 * Detailed Vector Illustration for Queen (Q)
 */
const QueenIllustration: React.FC<{ suitColor: string; suitSymbol: string }> = ({ suitColor, suitSymbol }) => (
  <svg viewBox="0 0 160 170" className="character-art-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Royal Arch Frame */}
    <path d="M44 55 C44 30 116 30 116 55 L116 165 L44 165 Z" fill="#831843" stroke="#be123c" strokeWidth="2" />

    {/* Gown & Veil */}
    <path d="M38 100 C32 145 45 170 80 170 C115 170 128 145 122 100 Z" fill="#fce7f3" stroke="#db2777" strokeWidth="2" />
    <path d="M52 95 C50 130 58 160 80 160 C102 160 110 130 108 95 Z" fill="#be185d" stroke="#f472b6" strokeWidth="1.5" />

    {/* Rose (Right Hand) */}
    <circle cx="130" cy="95" r="7" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
    <circle cx="132" cy="80" r="8" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
    <path d="M132 88 L132 105" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />

    {/* Scepter / Fan (Left Hand) */}
    <circle cx="30" cy="95" r="7" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
    <line x1="30" y1="60" x2="30" y2="120" stroke="#facc15" strokeWidth="3" />
    <circle cx="30" cy="55" r="8" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />
    <text x="30" y="59" textAnchor="middle" fill="#831843" fontSize="10" fontWeight="900">{suitSymbol}</text>

    {/* Queen Head */}
    <circle cx="80" cy="74" r="18" fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />
    {/* Golden Curls */}
    <path d="M62 70 C60 90 66 100 70 100 M98 70 C100 90 94 100 90 100" stroke="#b45309" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Eyes & Smile */}
    <circle cx="74" cy="72" r="2.5" fill="#0f172a" />
    <circle cx="86" cy="72" r="2.5" fill="#0f172a" />
    <path d="M76 82 Q80 85 84 82" stroke="#be123c" strokeWidth="2" fill="none" />

    {/* Golden Tiara */}
    <path d="M64 58 L68 40 L74 48 L80 34 L86 48 L92 40 L96 58 Z" fill="#facc15" stroke="#b45309" strokeWidth="2" />
    <circle cx="80" cy="34" r="3" fill="#3b82f6" />
    <circle cx="68" cy="40" r="2" fill="#ef4444" />
    <circle cx="92" cy="40" r="2" fill="#ef4444" />
  </svg>
);

/**
 * Detailed Vector Illustration for Jack (J)
 */
const JackIllustration: React.FC<{ suitColor: string; suitSymbol: string }> = ({ suitColor, suitSymbol }) => (
  <svg viewBox="0 0 160 170" className="character-art-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Knight Crest Armor */}
    <path d="M48 60 L112 60 L112 165 L48 165 Z" fill="#0f766e" stroke="#14b8a6" strokeWidth="2" />
    <path d="M56 100 C56 140 104 140 104 100 Z" fill="#042f2e" stroke="#facc15" strokeWidth="1.5" />

    {/* Sword (Right Hand) */}
    <line x1="128" y1="45" x2="128" y2="150" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="118" y1="65" x2="138" y2="65" stroke="#ca8a04" strokeWidth="3" />
    <circle cx="128" cy="75" r="7" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />

    {/* Shield (Left Hand) */}
    <path d="M22 65 L40 65 L40 110 C40 120 22 135 22 135 C22 135 22 120 22 110 Z" fill="#b91c1c" stroke="#facc15" strokeWidth="2" />
    <text x="31" y="95" textAnchor="middle" fill="#facc15" fontSize="12" fontWeight="900">{suitSymbol}</text>

    {/* Jack Head */}
    <circle cx="80" cy="74" r="18" fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />
    {/* Eyes & Confident Smile */}
    <circle cx="74" cy="73" r="2.5" fill="#0f172a" />
    <circle cx="86" cy="73" r="2.5" fill="#0f172a" />
    <path d="M75 82 Q80 86 85 82" stroke="#78350f" strokeWidth="2" fill="none" />

    {/* Feathered Cap */}
    <path d="M60 62 C60 46 100 46 100 62 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
    {/* Feather */}
    <path d="M64 54 C50 30 54 18 68 18 C64 26 62 38 64 54 Z" fill="#facc15" stroke="#b45309" strokeWidth="1.5" />
  </svg>
);

/**
 * Detailed Vector Illustration for Ace (A)
 */
const AceIllustration: React.FC<{ suitColor: string; suitSymbol: string }> = ({ suitColor, suitSymbol }) => (
  <svg viewBox="0 0 160 170" className="character-art-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Radiating Filigree Burst */}
    <circle cx="80" cy="82" r="52" fill="none" stroke="#d4a34b" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.6" />
    <circle cx="80" cy="82" r="42" fill="none" stroke="#d4a34b" strokeWidth="1.8" opacity="0.8" />

    {/* Ornate Leaf Crest */}
    <path d="M80 25 C50 45 40 85 80 135 C120 85 110 45 80 25 Z" fill="rgba(212, 163, 75, 0.08)" stroke="#d4a34b" strokeWidth="2" />

    {/* Giant Master Suit Emblem */}
    <text
      x="80"
      y="98"
      textAnchor="middle"
      fill={suitColor}
      fontSize="62"
      fontWeight="900"
      fontFamily="serif, 'Times New Roman', Georgia"
      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.35))"
    >
      {suitSymbol}
    </text>

    {/* Crown at apex of Ace */}
    <path d="M70 34 L73 24 L80 28 L87 24 L90 34 Z" fill="#facc15" stroke="#b45309" strokeWidth="1.5" />
  </svg>
);

/**
 * Pip Layout for Number Cards (2 to 10)
 */
const NumberIllustration: React.FC<{
  rank: string;
  suitColor: string;
  suitSymbol: string;
}> = ({ rank, suitColor, suitSymbol }) => {
  const count = parseInt(rank, 10) || 1;

  return (
    <div className="standard-card-pip-grid">
      <div className="standard-card-pip-center-crest">
        <span className="standard-card-pip-symbol" style={{ color: suitColor }}>
          {suitSymbol}
        </span>
        <div className="standard-card-pip-count-tag" style={{ color: "#78350f" }}>
          {count}
        </div>
      </div>
    </div>
  );
};

export const StandardCard: React.FC<StandardCardProps> = ({
  card,
  isSelected = false,
  onClick,
  size = "md",
  faceDown = false,
  variant = "classic",
  showPointsBadge = true,
  disabled = false,
  className = "",
}) => {
  if (faceDown || !card) {
    return (
      <div
        className={`standard-card standard-card--facedown standard-card--back-${variant} standard-card--${size} ${className}`}
        onClick={disabled ? undefined : onClick}
      >
        <div className="standard-card-back-pattern">
          <span className="standard-card-back-logo">LC</span>
        </div>
      </div>
    );
  }

  const { suit, rank, points } = card;
  const isRed = suit === "hearts" || suit === "diamonds";
  const suitSymbol = SUIT_SYMBOLS[suit] || "♠";
  const suitColorObj = SUIT_COLORS[suit] || SUIT_COLORS.spades;
  const isKing = rank === "K";
  const isQueen = rank === "Q";
  const isJack = rank === "J";
  const isAce = rank === "A";

  return (
    <div
      className={`standard-card monopoly-card monopoly-card--${size} standard-card--${size} ${isRed ? "standard-card--red" : "standard-card--black"} ${
        isSelected ? "standard-card--selected" : ""
      } ${disabled ? "standard-card--disabled" : ""} ${className}`}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      style={
        {
          "--suit-color": suitColorObj.primary,
          "--suit-color-dark": suitColorObj.dark,
        } as React.CSSProperties
      }
    >
      {/* 1. Vintage Linen Card Texture & Watermark Suit Wallpaper */}
      <div className="standard-card-wallpaper" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="wallpaper-pip">
            {suitSymbol}
          </span>
        ))}
      </div>

      {/* 2. Ornate Inner Gold Contoured Border */}
      <div className="standard-card-contour-border" aria-hidden="true" />

      {/* 3. Top-Left Index */}
      <div className="standard-card-index standard-card-index--top">
        <span className="standard-card-rank">{rank}</span>
        <span className="standard-card-suit">{suitSymbol}</span>
      </div>

      {/* 4. Center Character Art / Illustration */}
      <div className="standard-card-art-frame">
        {isKing ? (
          <KingIllustration suitColor={suitColorObj.primary} suitSymbol={suitSymbol} />
        ) : isQueen ? (
          <QueenIllustration suitColor={suitColorObj.primary} suitSymbol={suitSymbol} />
        ) : isJack ? (
          <JackIllustration suitColor={suitColorObj.primary} suitSymbol={suitSymbol} />
        ) : isAce ? (
          <AceIllustration suitColor={suitColorObj.primary} suitSymbol={suitSymbol} />
        ) : (
          <NumberIllustration rank={rank} suitColor={suitColorObj.primary} suitSymbol={suitSymbol} />
        )}
      </div>

      {/* 5. Bottom-Right Inverted Index */}
      <div className="standard-card-index standard-card-index--bottom">
        <span className="standard-card-rank">{rank}</span>
        <span className="standard-card-suit">{suitSymbol}</span>
      </div>

      {/* 6. Signature 3D Embossed CARD VALUE Shield Badge */}
      {showPointsBadge && (
        <CardValueShield
          points={points}
          isKing={isKing}
          suit={suit}
          size={size}
        />
      )}

      {/* 7. Selected Glow Indicator */}
      {isSelected && <div className="standard-card-selected-glow" />}
    </div>
  );
};
