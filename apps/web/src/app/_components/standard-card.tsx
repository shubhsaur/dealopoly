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

export const SUIT_PATHS: Record<Suit, string> = {
  spades:
    "M 50.0 4.0 C 50.6 6.7, 79.4 31.8, 89.6 51.7 C 96.0 58.3, 96.0 63.6, 96.0 68.9 C 96.0 79.6, 83.5 93.5, 77.2 93.5 C 66.9 93.5, 61.6 88.2, 53.9 82.9 C 54.6 92.1, 57.7 105.4, 68.5 116.0 L 31.5 116.0 C 42.3 105.4, 45.4 92.1, 46.1 82.9 C 38.4 88.2, 33.1 93.5, 22.8 93.5 C 16.5 93.5, 4.0 79.6, 4.0 68.9 C 4.0 63.6, 4.0 58.3, 10.4 51.7 C 20.6 31.8, 49.4 6.7, 50.0 4.0 Z",
  hearts:
    "M 50.0 32.0 C 53.0 18.0, 62.0 8.0, 76.0 8.0 C 89.0 8.0, 96.0 18.0, 96.0 36.0 C 96.0 56.0, 80.0 82.0, 50.0 116.0 C 20.0 82.0, 4.0 56.0, 4.0 36.0 C 4.0 18.0, 11.0 8.0, 24.0 8.0 C 38.0 8.0, 47.0 18.0, 50.0 32.0 Z",
  diamonds:
    "M 50.0 4.0 C 52.0 30.0, 70.0 50.0, 92.0 60.0 C 70.0 70.0, 52.0 90.0, 50.0 116.0 C 48.0 90.0, 30.0 70.0, 8.0 60.0 C 30.0 50.0, 48.0 30.0, 50.0 4.0 Z",
  clubs:
    "M 66.3 50.9 A 21.3 21.3 0 1 0 33.7 50.9 A 21.3 21.3 0 1 0 46.5 75.2 L 46.5 85.9 C 46.5 95.0, 42.0 102.0, 37.3 104.2 L 62.7 104.2 C 58.0 102.0, 53.5 95.0, 53.5 85.9 L 53.5 75.2 A 21.3 21.3 0 1 0 66.3 50.9 Z",
};

export const SUIT_COLORS: Record<
  Suit,
  { primary: string; secondary: string; dark: string; glow: string }
> = {
  spades: {
    primary: "#f8fafc",
    secondary: "#cbd5e1",
    dark: "#090d16",
    glow: "rgba(248, 250, 252, 0.45)",
  },
  hearts: {
    primary: "#fb7185",
    secondary: "#f43f5e",
    dark: "#881337",
    glow: "rgba(251, 113, 133, 0.45)",
  },
  diamonds: {
    primary: "#fbbf24",
    secondary: "#f59e0b",
    dark: "#78350f",
    glow: "rgba(251, 191, 36, 0.45)",
  },
  clubs: {
    primary: "#38bdf8",
    secondary: "#0284c7",
    dark: "#0f172a",
    glow: "rgba(56, 189, 248, 0.45)",
  },
};

/**
 * High-Precision Geometric Suit Pip SVG Component
 */
export const SuitPip: React.FC<{
  suit: Suit;
  className?: string;
  style?: React.CSSProperties;
}> = ({ suit, className = "", style }) => {
  return (
    <svg
      className={`standard-card-suit-svg ${className}`}
      viewBox="0 0 100 120"
      fill="none"
      style={style}
    >
      <path d={SUIT_PATHS[suit]} fill="currentColor" />
    </svg>
  );
};

/**
 * Circular Neon "VALUE {X}" Badge
 */
export const CardValueBadge: React.FC<{
  points: number;
  isKing?: boolean;
  isQueen?: boolean;
  isJack?: boolean;
  isAce?: boolean;
}> = ({ points, isKing, isQueen, isJack, isAce }) => {
  const badgeClass = isKing
    ? "card-value-badge--king"
    : isQueen
    ? "card-value-badge--queen"
    : isJack
    ? "card-value-badge--jack"
    : isAce
    ? "card-value-badge--ace"
    : "";

  return (
    <div className={`card-value-badge ${badgeClass}`}>
      <span className="badge-label">VALUE</span>
      <span className="badge-number">{points}</span>
    </div>
  );
};

/**
 * Shared SVG Gradients & Filters for Luxury Card Deck
 */
export const CardSvgDefs: React.FC = () => (
  <defs>
    <linearGradient id="suitGrad-spades" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="60%" stopColor="#f8fafc" />
      <stop offset="100%" stopColor="#cbd5e1" />
    </linearGradient>
    <linearGradient id="suitGrad-hearts" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fecdd3" />
      <stop offset="50%" stopColor="#fb7185" />
      <stop offset="100%" stopColor="#e11d48" />
    </linearGradient>
    <linearGradient id="suitGrad-diamonds" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fef08a" />
      <stop offset="50%" stopColor="#fbbf24" />
      <stop offset="100%" stopColor="#d97706" />
    </linearGradient>
    <linearGradient id="suitGrad-clubs" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#bae6fd" />
      <stop offset="50%" stopColor="#38bdf8" />
      <stop offset="100%" stopColor="#0284c7" />
    </linearGradient>

    {/* Metallic Gold & Silver Gradients */}
    <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#fef08a" />
      <stop offset="25%" stopColor="#facc15" />
      <stop offset="60%" stopColor="#ca8a04" />
      <stop offset="85%" stopColor="#854d0e" />
      <stop offset="100%" stopColor="#fef08a" />
    </linearGradient>
    <linearGradient id="goldCrown" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#fef9c3" />
      <stop offset="30%" stopColor="#eab308" />
      <stop offset="75%" stopColor="#a16207" />
      <stop offset="100%" stopColor="#713f12" />
    </linearGradient>
    <linearGradient id="silverPlate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="45%" stopColor="#e2e8f0" />
      <stop offset="80%" stopColor="#94a3b8" />
      <stop offset="100%" stopColor="#64748b" />
    </linearGradient>
    <linearGradient id="bladeLight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="100%" stopColor="#e2e8f0" />
    </linearGradient>
    <linearGradient id="bladeDark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#94a3b8" />
      <stop offset="100%" stopColor="#64748b" />
    </linearGradient>
    <filter id="artDropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.75" />
    </filter>
  </defs>
);

/**
 * Detailed Vector Illustration for King (K - 0 Pts)
 */
const KingIllustration: React.FC<{ suit: Suit; suitColor: string }> = ({ suit }) => {
  const suitPath = SUIT_PATHS[suit];
  const suitGrad = `url(#suitGrad-${suit})`;

  return (
    <svg viewBox="0 0 600 900" className="character-art-svg w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <CardSvgDefs />
      <defs>
        <g id={`king-half-${suit}`}>
          {/* Wavy Flowing Locks of Hair */}
          <g transform="translate(192, 230)">
            <path d="M 65 0 C 28 8, 4 38, 4 78 C 4 112, 24 138, 52 148 L 58 136 C 34 126, 18 106, 18 78 C 18 48, 38 20, 72 10 Z" fill="#070a12" stroke="#0f172a" strokeWidth="2" />
            <path d="M 70 14 C 40 24, 22 52, 22 84 C 22 110, 38 130, 60 140 L 64 128 C 46 120, 34 104, 34 84 C 34 58, 48 34, 76 24 Z" fill="#cbd5e1" />
            <path d="M 76 28 C 52 38, 38 64, 38 90 C 38 112, 50 126, 68 134 L 72 122 C 58 116, 48 104, 48 90 C 48 70, 60 48, 82 38 Z" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M 82 40 C 64 50, 52 72, 52 94 C 52 112, 62 122, 76 128 L 79 118 C 68 114, 60 106, 60 94 C 60 78, 70 60, 88 50 Z" fill="#cbd5e1" />
            <path d="M 88 52 C 74 62, 64 80, 64 98 C 64 112, 72 120, 84 124 L 86 114 C 76 112, 70 106, 70 98 C 70 84, 78 70, 92 60 Z" fill="#090d16" />
          </g>

          {/* Refined Crown with Suit Crest */}
          <g transform="translate(300, 198)">
            <path d="M -96 36 Q 0 28 96 36 L 92 52 Q 0 44 -92 52 Z" fill="url(#goldCrown)" stroke="#070a10" strokeWidth="3" />
            <path d="M -88 44 Q 0 36 88 44" stroke="#070a10" strokeWidth="2" fill="none" />
            <circle cx="-56" cy="43" r="3.5" fill="#070a10" />
            <circle cx="0" cy="40" r="4" fill="#070a10" />
            <circle cx="56" cy="43" r="3.5" fill="#070a10" />
            <path d="M -96 36 L -96 -10 L -52 16 L -32 -26 L 0 -48 L 32 -26 L 52 16 L 96 -10 L 96 36 Q 0 28 -96 36 Z" fill="url(#goldCrown)" stroke="#070a10" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M 0 -48 L 0 33" stroke="#070a10" strokeWidth="2.5" opacity="0.6" />
            <g transform="translate(-12, -10) scale(0.24)">
              <path d={suitPath} fill={suitGrad} stroke="#070a10" strokeWidth="2.5" />
            </g>
          </g>

          {/* Face, Eye, Mustache & Beard */}
          <g transform="translate(300, 240)">
            <path d="M -32 10 L -32 74 C -32 98 2 130 38 130 C 62 130 76 112 78 85 L 78 28 C 78 8 54 -2 12 -2 L -32 10 Z" fill="#f8fafc" stroke="#070a10" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M -30 65 L -30 74 C -30 98 2 130 38 130 C 45 130 52 126 56 120 C 32 120 4 94 -4 68 Z" fill="#e2e8f0" />
            <g transform="translate(-16, 44)">
              <path d="M 0 0 C -10 0 -16 8 -16 18 C -16 28 -8 34 0 34 C 6 34 8 28 8 20 C 8 10 4 0 0 0 Z" fill="#f8fafc" stroke="#070a10" strokeWidth="3" />
              <path d="M -4 8 C -8 10 -10 16 -10 22 C -10 26 -6 28 -2 28" fill="none" stroke="#070a10" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <path d="M 6 18 C 18 12 36 14 48 18 L 48 24 C 36 20 20 18 8 24 Z" fill="#070a10" />
            <path d="M 12 28 C 22 25 36 26 44 30" stroke="#070a10" strokeWidth="2" fill="none" />
            <path d="M 14 34 Q 28 26 44 34 Q 28 42 14 34 Z" fill="#ffffff" stroke="#070a10" strokeWidth="2" />
            <circle cx="33" cy="34" r="5" fill="#070a10" />
            <circle cx="34.5" cy="32.5" r="1.5" fill="#ffffff" />
            <path d="M 44 26 L 56 60 L 40 64" stroke="#070a10" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d="M 18 70 C 38 56 60 62 72 86 C 64 88 52 82 44 76 C 32 80 20 84 14 74 Z" fill="#070a10" />
            <path d="M 34 84 L 46 84" stroke="#070a10" strokeWidth="2" />
            <path d="M 32 88 L 48 88 L 40 102 Z" fill="#070a10" />
            <path d="M 30 104 L 50 104 L 40 130 Z" fill="#070a10" />
            <path d="M 40 130 C 40 130 58 116 60 94 L 52 94 C 52 108 40 130 40 130 Z" fill="#070a10" />
          </g>

          {/* Regalia Cross-Sashes & Star Emblems */}
          <g transform="translate(300, 360)">
            <path d="M 80 -18 L -100 88 L -68 100 L 112 -6 Z" fill="url(#silverPlate)" stroke="#070a10" strokeWidth="3.5" />
            <path d="M -92 -18 L 88 88 L 120 76 L -60 -30 Z" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="3.5" />
            <circle cx="0" cy="46" r="22" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="3.5" />
            <circle cx="0" cy="46" r="12" fill="#070a12" stroke="#fef08a" strokeWidth="2" />
            <circle cx="0" cy="46" r="4" fill="#fef08a" />
            <path d="M 0 10 Q 0 22 -10 22 Q 0 22 0 34 Q 0 22 10 22 Q 0 22 0 10 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          </g>

          {/* Left Sleeve & Hand Gripping Downward Sword */}
          <g transform="translate(156, 350)">
            <path d="M -16 15 C -16 -40 58 -60 80 -28 L 60 74 C 34 84 -16 68 -16 15 Z" fill="#070a12" stroke="#070a10" strokeWidth="3.5" />
            <path d="M 6 -46 L -10 -22 L -10 -2 L 28 -34 Z" fill="url(#goldMetallic)" />
            <path d="M 44 -34 L -8 20 L -6 40 L 62 -12 Z" fill="url(#goldMetallic)" />
            <path d="M 72 4 L 14 68 L 30 76 L 76 30 Z" fill="url(#goldMetallic)" />
            <g transform="translate(24, 8) scale(0.38)">
              <path d={suitPath} fill={suitGrad} stroke="#070a10" strokeWidth="2.5" />
            </g>
            <g transform="translate(16, 76)">
              <path d="M -6 2 C -16 2 -22 14 -22 26 C -22 38 -12 44 2 44 L 28 44 C 40 44 46 34 46 22 C 46 10 36 2 24 2 Z" fill="#f8fafc" stroke="#070a10" strokeWidth="3.5" />
              <path d="M -6 12 Q 10 12 28 12" stroke="#070a10" strokeWidth="3" strokeLinecap="round" />
              <path d="M -6 22 Q 12 22 30 22" stroke="#070a10" strokeWidth="3" strokeLinecap="round" />
              <path d="M -4 32 Q 12 32 30 32" stroke="#070a10" strokeWidth="3" strokeLinecap="round" />
              <g transform="translate(4, 52)">
                <path d="M -42 0 L 58 0 L 52 14 L -36 14 Z" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="3" />
                <circle cx="-38" cy="7" r="4.5" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2" />
                <circle cx="54" cy="7" r="4.5" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2" />
              </g>
              <g transform="translate(8, 66)">
                <path d="M 0 0 L 0 85 L 8 85 L 8 0 Z" fill="url(#bladeLight)" stroke="#070a10" strokeWidth="2" />
                <path d="M 8 0 L 8 85 L 16 85 L 16 0 Z" fill="url(#bladeDark)" stroke="#070a10" strokeWidth="2" />
                <line x1="8" y1="0" x2="8" y2="85" stroke="#ffffff" strokeWidth="1.5" />
              </g>
            </g>
          </g>

          {/* Upright Broadsword & White-Gloved Right Hand */}
          <g transform="translate(442, 206)">
            <path d="M -12 165 L -12 30 L 0 0 L 0 165 Z" fill="url(#bladeLight)" stroke="#070a10" strokeWidth="3" strokeLinejoin="round" />
            <path d="M 0 0 L 12 30 L 12 165 L 0 165 Z" fill="url(#bladeDark)" stroke="#070a10" strokeWidth="3" strokeLinejoin="round" />
            <line x1="0" y1="0" x2="0" y2="165" stroke="#ffffff" strokeWidth="2" />
            <g transform="translate(0, 165)">
              <path d="M -40 0 L 40 0 L 34 16 L -34 16 Z" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="3" />
              <circle cx="-36" cy="8" r="5" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2.5" />
              <circle cx="36" cy="8" r="5" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2.5" />
            </g>
            <g transform="translate(-16, 185)">
              <rect x="-8" y="0" width="36" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="3" />
              <line x1="8" y1="2" x2="8" y2="9" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <rect x="-8" y="11" width="37" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="3" />
              <line x1="9" y1="13" x2="9" y2="20" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <rect x="-8" y="22" width="36" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="3" />
              <line x1="8" y1="24" x2="8" y2="31" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <rect x="-8" y="33" width="34" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="3" />
              <line x1="7" y1="35" x2="7" y2="42" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <circle cx="10" cy="56" r="9" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="3" />
            </g>
            <g transform="translate(-42, 204)">
              <path d="M -38 0 C -38 -45 28 -55 50 -22 L 40 76 C 12 86 -38 66 -38 0 Z" fill="#0c111c" stroke="#070a10" strokeWidth="3.5" />
              <path d="M 38 -22 L 50 -22 L 44 6 Z" fill="url(#goldMetallic)" />
              <g transform="translate(-16, 0) scale(0.38)">
                <path d={suitPath} fill={suitGrad} stroke="#070a10" strokeWidth="2.5" />
              </g>
            </g>
          </g>
        </g>
      </defs>

      <use href={`#king-half-${suit}`} filter="url(#artDropShadow)" />
      <use href={`#king-half-${suit}`} transform="rotate(180 300 450)" filter="url(#artDropShadow)" />
      <line x1="80" y1="450" x2="160" y2="450" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="2" />
      <line x1="440" y1="450" x2="520" y2="450" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="2" />
    </svg>
  );
};

/**
 * Detailed Vector Illustration for Queen (Q - 12 Pts)
 */
const QueenIllustration: React.FC<{ suit: Suit; suitColor: string }> = ({ suit }) => {
  const suitPath = SUIT_PATHS[suit];
  const suitGrad = `url(#suitGrad-${suit})`;

  return (
    <svg viewBox="0 0 600 900" className="character-art-svg w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <CardSvgDefs />
      <defs>
        <g id={`queen-half-${suit}`}>
          {/* Cascading Royal Locks */}
          <g transform="translate(196, 226)">
            <path d="M 64 0 C 26 10, 2 40, 2 82 C 2 120, 22 148, 54 158 L 60 144 C 36 134, 18 112, 18 82 C 18 50, 36 22, 70 12 Z" fill="#070a12" stroke="#0f172a" strokeWidth="2" />
            <path d="M 70 16 C 38 28, 20 58, 20 90 C 20 118, 38 138, 62 148 L 66 136 C 46 126, 34 110, 34 90 C 34 62, 48 38, 76 26 Z" fill="#cbd5e1" />
            <path d="M 78 32 C 54 42, 40 68, 40 96 C 40 118, 52 134, 70 140 L 74 128 C 60 122, 50 110, 50 96 C 50 74, 62 52, 84 42 Z" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
          </g>

          {/* Regal Art-Deco Tiara */}
          <g transform="translate(300, 194)">
            <path d="M -90 36 Q 0 26 90 36 L 86 50 Q 0 40 -86 50 Z" fill="url(#goldCrown)" stroke="#070a10" strokeWidth="3" />
            <path d="M -80 43 Q 0 34 80 43" stroke="#070a10" strokeWidth="2" fill="none" />
            <circle cx="-50" cy="42" r="3.5" fill="#ffffff" />
            <circle cx="0" cy="38" r="4.5" fill="#facc15" />
            <circle cx="50" cy="42" r="3.5" fill="#ffffff" />
            <path d="M -90 36 L -75 0 L -50 20 L -25 -20 L 0 -44 L 25 -20 L 50 20 L 75 0 L 90 36 Q 0 26 -90 36 Z" fill="url(#goldCrown)" stroke="#070a10" strokeWidth="3" strokeLinejoin="round" />
            <path d="M 0 -44 L 0 30" stroke="#070a10" strokeWidth="2" opacity="0.6" />
            <g transform="translate(-14, -8) scale(0.28)">
              <path d={suitPath} fill={suitGrad} stroke="#070a10" strokeWidth="2.5" />
            </g>
          </g>

          {/* Noble Queen Profile */}
          <g transform="translate(300, 240)">
            <path d="M -26 12 L -26 72 C -26 98 4 126 36 126 C 60 126 74 108 76 80 L 76 26 C 76 6 50 -4 10 -4 L -26 12 Z" fill="#fdf4ff" stroke="#070a10" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M -24 64 L -24 72 C -24 98 4 126 36 126 C 44 126 50 122 54 116 C 30 116 4 90 -4 64 Z" fill="#fce7f3" />
            <g transform="translate(-14, 46)">
              <path d="M 0 0 C -8 0 -14 6 -14 15 C -14 24 -6 30 0 30 C 6 30 8 24 8 16 C 8 8 4 0 0 0 Z" fill="#fdf4ff" stroke="#070a10" strokeWidth="2.5" />
              <path d="M -7 34 C -11 34 -12 42 -7 46 C -2 42 -3 34 -7 34 Z" fill="#ffffff" stroke="#070a10" strokeWidth="1.5" />
            </g>
            <path d="M 12 18 C 24 14 38 16 48 20 L 48 24 C 38 20 22 18 14 22 Z" fill="#070a10" />
            <path d="M 16 28 C 24 25 36 26 44 30" stroke="#070a10" strokeWidth="1.8" fill="none" />
            <path d="M 18 34 Q 30 26 44 34 Q 30 42 18 34 Z" fill="#ffffff" stroke="#070a10" strokeWidth="2" />
            <circle cx="33" cy="34" r="4.5" fill="#070a10" />
            <circle cx="34.5" cy="32.5" r="1.5" fill="#ffffff" />
            <path d="M 44 32 L 50 28 M 42 30 L 46 25 M 38 28 L 40 22" stroke="#070a10" strokeWidth="2" strokeLinecap="round" />
            <path d="M 44 26 L 54 58 L 42 62" stroke="#070a10" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d="M 24 78 Q 36 72 48 78 Q 36 86 24 78 Z" fill="#e11d48" stroke="#070a10" strokeWidth="2" />
            <line x1="26" y1="78" x2="46" y2="78" stroke="#881337" strokeWidth="1.5" />
          </g>

          {/* Royal Corsage & Ermine Fur Collar */}
          <g transform="translate(300, 360)">
            <path d="M -110 -16 L 110 -16 L 90 90 L -90 90 Z" fill="#0f172a" stroke="#070a10" strokeWidth="3.5" />
            <path d="M -114 -22 L 114 -22 L 98 12 L -98 12 Z" fill="#ffffff" stroke="#070a10" strokeWidth="3" />
            <path d="M -60 -10 L -55 4 M 0 -12 L 0 4 M 60 -10 L 55 4" stroke="#070a10" strokeWidth="3" strokeLinecap="round" />
            <path d="M -80 12 L 0 90 L 80 12 L 40 12 L 0 54 L -40 12 Z" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2.5" />
            <path d="M -40 12 L 0 54 L 40 12 Z" fill="url(#silverPlate)" stroke="#070a10" strokeWidth="2" />
            <circle cx="0" cy="46" r="22" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="3.5" />
            <circle cx="0" cy="46" r="14" fill="#070a12" stroke="#fef08a" strokeWidth="1.8" />
            <g transform="translate(-11, 35) scale(0.22)">
              <path d={suitPath} fill={suitGrad} />
            </g>
          </g>

          {/* Left Hand Holding Royal Scepter */}
          <g transform="translate(446, 210)">
            <line x1="0" y1="0" x2="0" y2="240" stroke="url(#goldMetallic)" strokeWidth="7" strokeLinecap="round" />
            <line x1="0" y1="0" x2="0" y2="240" stroke="#070a10" strokeWidth="2" />
            <circle cx="0" cy="18" r="16" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2.5" />
            <circle cx="0" cy="18" r="8" fill="#070a12" />
            <g transform="translate(-7, 10) scale(0.14)">
              <path d={suitPath} fill={suitGrad} />
            </g>
            <g transform="translate(-16, 170)">
              <rect x="-6" y="0" width="34" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="2.5" />
              <rect x="-6" y="11" width="35" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="2.5" />
              <rect x="-6" y="22" width="34" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="2.5" />
              <rect x="-6" y="33" width="32" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="2.5" />
            </g>
          </g>

          {/* Right Arm & Hand Holding Art-Deco Rose */}
          <g transform="translate(154, 340)">
            <path d="M -16 15 C -16 -40 54 -58 76 -26 L 56 70 C 30 80 -16 64 -16 15 Z" fill="#0c111c" stroke="#070a10" strokeWidth="3.5" />
            <g transform="translate(18, 64)">
              <path d="M -4 0 C -14 0 -20 12 -20 22 C -20 34 -10 40 4 40 L 26 40 C 36 40 42 30 42 20 C 42 8 32 0 20 0 Z" fill="#f8fafc" stroke="#070a10" strokeWidth="3" />
              <path d="M 12 0 L 12 -65" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
              <g transform="translate(12, -72)">
                <circle cx="0" cy="0" r="18" fill="url(#suitGrad-hearts)" stroke="#070a10" strokeWidth="2" />
                <circle cx="0" cy="0" r="10" fill="#e11d48" stroke="#ca8a04" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="4" fill="#facc15" />
              </g>
            </g>
          </g>
        </g>
      </defs>

      <use href={`#queen-half-${suit}`} filter="url(#artDropShadow)" />
      <use href={`#queen-half-${suit}`} transform="rotate(180 300 450)" filter="url(#artDropShadow)" />
      <line x1="80" y1="450" x2="160" y2="450" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="2" />
      <line x1="440" y1="450" x2="520" y2="450" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="2" />
    </svg>
  );
};

/**
 * Detailed Vector Illustration for Jack (J - 11 Pts)
 */
const JackIllustration: React.FC<{ suit: Suit; suitColor: string }> = ({ suit }) => {
  const suitPath = SUIT_PATHS[suit];
  const suitGrad = `url(#suitGrad-${suit})`;

  return (
    <svg viewBox="0 0 600 900" className="character-art-svg w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <CardSvgDefs />
      <defs>
        <g id={`jack-half-${suit}`}>
          {/* Cavalier Cap with Sweeping Feather Plume */}
          <g transform="translate(300, 192)">
            <path d="M -90 10 C -120 -30, -80 -80, -20 -90 C -60 -60, -60 -20, -40 10 Z" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2.5" />
            <path d="M -85 36 C -95 -10, 85 -10, 95 36 Z" fill="#0f172a" stroke="#070a10" strokeWidth="3.5" />
            <path d="M -90 36 L 90 36 L 85 48 L -85 48 Z" fill="url(#goldCrown)" stroke="#070a10" strokeWidth="2.5" />
            <circle cx="-50" cy="24" r="16" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2.5" />
            <circle cx="-50" cy="24" r="10" fill="#070a12" />
            <g transform="translate(-58, 16) scale(0.16)">
              <path d={suitPath} fill={suitGrad} />
            </g>
          </g>

          {/* Chiseled Heroic Knight Face */}
          <g transform="translate(300, 246)">
            <path d="M -28 10 L -28 72 C -28 98 2 126 36 126 C 60 126 74 108 76 80 L 76 26 C 76 6 52 -4 10 -4 L -28 10 Z" fill="#f8fafc" stroke="#070a10" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M -26 64 L -26 72 C -26 98 2 126 36 126 C 44 126 50 122 54 116 C 30 116 2 90 -4 64 Z" fill="#e2e8f0" />
            <g transform="translate(-14, 44)">
              <path d="M 0 0 C -8 0 -14 6 -14 15 C -14 24 -6 30 0 30 C 6 30 8 24 8 16 C 8 8 4 0 0 0 Z" fill="#f8fafc" stroke="#070a10" strokeWidth="2.5" />
            </g>
            <path d="M 12 18 C 24 12 40 14 50 18 L 50 24 C 38 20 22 18 14 24 Z" fill="#070a10" />
            <path d="M 16 28 C 24 25 36 26 44 30" stroke="#070a10" strokeWidth="2" fill="none" />
            <path d="M 18 34 Q 30 26 44 34 Q 30 42 18 34 Z" fill="#ffffff" stroke="#070a10" strokeWidth="2" />
            <circle cx="33" cy="34" r="5" fill="#070a10" />
            <circle cx="34.5" cy="32.5" r="1.5" fill="#ffffff" />
            <path d="M 44 26 L 56 58 L 42 62" stroke="#070a10" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path d="M 22 80 C 32 76 44 76 52 82" stroke="#070a10" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <line x1="36" y1="94" x2="48" y2="94" stroke="#94a3b8" strokeWidth="2" />
          </g>

          {/* Steel Plate Armor & Knight Sashes */}
          <g transform="translate(300, 360)">
            <path d="M -105 -18 L 105 -18 L 85 92 L -85 92 Z" fill="url(#silverPlate)" stroke="#070a10" strokeWidth="3.5" />
            <path d="M -60 -18 L 60 -18 L 40 24 L -40 24 Z" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2.5" />
            <path d="M -85 -18 L 65 92 L 95 82 L -55 -28 Z" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="3" />
            <circle cx="0" cy="46" r="20" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="3.5" />
            <circle cx="0" cy="46" r="11" fill="#070a12" stroke="#fef08a" strokeWidth="1.8" />
            <g transform="translate(-9, 36) scale(0.18)">
              <path d={suitPath} fill={suitGrad} />
            </g>
          </g>

          {/* Left Hand Holding Knight Heater Shield */}
          <g transform="translate(150, 330)">
            <path d="M -20 -30 L 60 -30 L 60 50 C 60 90, 20 120, 20 120 C 20 120, -20 90, -20 50 Z" fill="#0f172a" stroke="url(#goldMetallic)" strokeWidth="4" />
            <path d="M -12 -22 L 52 -22 L 52 46 C 52 80, 20 108, 20 108 C 20 108, -12 80, -12 46 Z" fill="#1e293b" stroke="#070a10" strokeWidth="2" />
            <g transform="translate(3, 10) scale(0.34)">
              <path d={suitPath} fill={suitGrad} stroke="#070a10" strokeWidth="2" />
            </g>
            <g transform="translate(38, 50)">
              <circle cx="10" cy="10" r="14" fill="#f8fafc" stroke="#070a10" strokeWidth="3" />
            </g>
          </g>

          {/* Right Hand Holding Upright Rapier */}
          <g transform="translate(445, 210)">
            <path d="M -8 165 L -8 20 L 0 0 L 0 165 Z" fill="#ffffff" stroke="#070a10" strokeWidth="2.5" />
            <path d="M 0 0 L 8 20 L 8 165 L 0 165 Z" fill="#94a3b8" stroke="#070a10" strokeWidth="2.5" />
            <line x1="0" y1="0" x2="0" y2="165" stroke="#ffffff" strokeWidth="1.8" />
            <g transform="translate(0, 165)">
              <path d="M -36 0 L 36 0 L 30 14 L -30 14 Z" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2.5" />
              <circle cx="-32" cy="7" r="4" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2" />
              <circle cx="32" cy="7" r="4" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2" />
            </g>
            <g transform="translate(-16, 185)">
              <rect x="-6" y="0" width="34" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="2.5" />
              <rect x="-6" y="11" width="35" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="2.5" />
              <rect x="-6" y="22" width="34" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="2.5" />
              <rect x="-6" y="33" width="32" height="11" rx="5.5" fill="#f8fafc" stroke="#070a10" strokeWidth="2.5" />
              <circle cx="10" cy="54" r="8" fill="url(#goldMetallic)" stroke="#070a10" strokeWidth="2.5" />
            </g>
          </g>
        </g>
      </defs>

      <use href={`#jack-half-${suit}`} filter="url(#artDropShadow)" />
      <use href={`#jack-half-${suit}`} transform="rotate(180 300 450)" filter="url(#artDropShadow)" />
      <line x1="80" y1="450" x2="160" y2="450" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="2" />
      <line x1="440" y1="450" x2="520" y2="450" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="2" />
    </svg>
  );
};

/**
 * Detailed Vector Illustration for Master Ace (A - 1 Pt)
 */
const AceIllustration: React.FC<{ suit: Suit; suitColor: string }> = ({ suit }) => {
  const suitPath = SUIT_PATHS[suit];
  const suitGrad = `url(#suitGrad-${suit})`;

  return (
    <svg viewBox="0 0 600 900" className="character-art-svg w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <CardSvgDefs />

      {/* Radiating Sunburst Rays */}
      <g transform="translate(300, 440)" opacity="0.35">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          return (
            <line
              key={i}
              x1="0"
              y1="0"
              x2="0"
              y2="-260"
              stroke="url(#goldMetallic)"
              strokeWidth={i % 2 === 0 ? 2 : 1}
              strokeDasharray={i % 2 === 0 ? "none" : "4 6"}
              transform={`rotate(${angle})`}
            />
          );
        })}
      </g>

      {/* Concentric Guilloche Rings */}
      <circle cx="300" cy="440" r="240" stroke="rgba(212, 175, 55, 0.25)" strokeWidth="1.5" strokeDasharray="3 5" />
      <circle cx="300" cy="440" r="200" stroke="rgba(212, 175, 55, 0.35)" strokeWidth="2" />
      <circle cx="300" cy="440" r="160" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1.2" />

      {/* Imperial Crown Over Apex */}
      <g transform="translate(300, 270)">
        <path d="M -40 20 L -30 -10 L -15 4 L 0 -18 L 15 4 L 30 -10 L 40 20 Z" fill="url(#goldCrown)" stroke="#070a10" strokeWidth="2.5" />
        <circle cx="0" cy="-18" r="3" fill="#ffffff" />
        <circle cx="-30" cy="-10" r="2.5" fill="#facc15" />
        <circle cx="30" cy="-10" r="2.5" fill="#facc15" />
      </g>

      {/* Grand Master Central Suit Crest */}
      <g transform="translate(195, 315) scale(2.1)" filter="url(#artDropShadow)">
        <path d={suitPath} fill={suitGrad} stroke="#070a10" strokeWidth="2" />
        <path d={suitPath} fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.2" transform="scale(0.92) translate(4, 4)" />
      </g>

      {/* Golden Laurel Branches Flanking Lower Suit */}
      <g transform="translate(300, 600)">
        <path d="M -30 20 C -70 -10, -110 -50, -120 -100" stroke="url(#goldMetallic)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="-65" cy="-15" r="5" fill="url(#goldMetallic)" />
        <circle cx="-95" cy="-45" r="5" fill="url(#goldMetallic)" />
        <circle cx="-115" cy="-80" r="5" fill="url(#goldMetallic)" />
        <path d="M 30 20 C 70 -10, 110 -50, 120 -100" stroke="url(#goldMetallic)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="65" cy="-15" r="5" fill="url(#goldMetallic)" />
        <circle cx="95" cy="-45" r="5" fill="url(#goldMetallic)" />
        <circle cx="115" cy="-80" r="5" fill="url(#goldMetallic)" />
      </g>

      {/* Royal Chevron Ribbon */}
      <g transform="translate(300, 635)">
        <path d="M -80 0 L 80 0 L 60 22 L 0 16 L -60 22 Z" fill="url(#goldCrown)" stroke="#070a10" strokeWidth="2" />
        <text x="0" y="14" textAnchor="middle" fill="#070a10" fontFamily="'Cinzel', serif" fontWeight="900" fontSize="11" letterSpacing="3">LOWDECK</text>
      </g>
    </svg>
  );
};

/**
 * Multi-Pip Geometric Matrix for Number Cards (2 to 10)
 */
const NumberIllustration: React.FC<{
  rank: string;
  suit: Suit;
  suitColor: string;
}> = ({ rank, suit }) => {
  const suitPath = SUIT_PATHS[suit];
  const suitGrad = `url(#suitGrad-${suit})`;

  const PIP_COORDS: Record<string, Array<{ x: number; y: number; inv: boolean }>> = {
    "2": [
      { x: 300, y: 240, inv: false },
      { x: 300, y: 660, inv: true },
    ],
    "3": [
      { x: 300, y: 230, inv: false },
      { x: 300, y: 450, inv: false },
      { x: 300, y: 670, inv: true },
    ],
    "4": [
      { x: 210, y: 230, inv: false }, { x: 390, y: 230, inv: false },
      { x: 210, y: 670, inv: true }, { x: 390, y: 670, inv: true },
    ],
    "5": [
      { x: 210, y: 230, inv: false }, { x: 390, y: 230, inv: false },
      { x: 300, y: 450, inv: false },
      { x: 210, y: 670, inv: true }, { x: 390, y: 670, inv: true },
    ],
    "6": [
      { x: 210, y: 230, inv: false }, { x: 390, y: 230, inv: false },
      { x: 210, y: 450, inv: false }, { x: 390, y: 450, inv: false },
      { x: 210, y: 670, inv: true }, { x: 390, y: 670, inv: true },
    ],
    "7": [
      { x: 210, y: 230, inv: false }, { x: 390, y: 230, inv: false },
      { x: 300, y: 340, inv: false },
      { x: 210, y: 450, inv: false }, { x: 390, y: 450, inv: false },
      { x: 210, y: 670, inv: true }, { x: 390, y: 670, inv: true },
    ],
    "8": [
      { x: 210, y: 230, inv: false }, { x: 390, y: 230, inv: false },
      { x: 300, y: 340, inv: false },
      { x: 210, y: 450, inv: false }, { x: 390, y: 450, inv: false },
      { x: 300, y: 560, inv: true },
      { x: 210, y: 670, inv: true }, { x: 390, y: 670, inv: true },
    ],
    "9": [
      { x: 210, y: 220, inv: false }, { x: 390, y: 220, inv: false },
      { x: 210, y: 370, inv: false }, { x: 390, y: 370, inv: false },
      { x: 300, y: 450, inv: false },
      { x: 210, y: 530, inv: true }, { x: 390, y: 530, inv: true },
      { x: 210, y: 680, inv: true }, { x: 390, y: 680, inv: true },
    ],
    "10": [
      { x: 210, y: 215, inv: false }, { x: 390, y: 215, inv: false },
      { x: 300, y: 290, inv: false },
      { x: 210, y: 365, inv: false }, { x: 390, y: 365, inv: false },
      { x: 210, y: 535, inv: true }, { x: 390, y: 535, inv: true },
      { x: 300, y: 610, inv: true },
      { x: 210, y: 685, inv: true }, { x: 390, y: 685, inv: true },
    ],
  };

  const coords = PIP_COORDS[rank] || PIP_COORDS["2"] || [];

  return (
    <svg viewBox="0 0 600 900" className="character-art-svg w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <CardSvgDefs />

      {/* Faint Background Guilloche & Contours */}
      <circle cx="300" cy="450" r="220" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1.5" />
      <circle cx="300" cy="450" r="160" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
      <g transform="translate(230, 360) scale(1.4)" opacity="0.06">
        <path d={suitPath} fill="#ffffff" />
      </g>

      {/* Precision Pips Matrix */}
      {coords.map((c, idx) => (
        <g
          key={idx}
          transform={`translate(${c.x}, ${c.y}) ${c.inv ? "rotate(180)" : ""} translate(-32, -38) scale(0.64)`}
          filter="url(#artDropShadow)"
        >
          <path d={suitPath} fill={suitGrad} stroke="#070a10" strokeWidth="2.5" />
          <path d={suitPath} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" transform="scale(0.92) translate(4, 4)" />
        </g>
      ))}
    </svg>
  );
};

/**
 * Luxury Face-Down Card Back Illustration
 */
export const CardBackIllustration: React.FC<{ variant?: "classic" | "gold" | "carbon" }> = () => {
  return (
    <svg viewBox="0 0 600 900" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <CardSvgDefs />
      <defs>
        <pattern id="cardBackGuilloche" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 0 20 Q 20 0 40 20 Q 20 40 0 20 Z" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="1.2" fill="none" />
          <path d="M 20 0 Q 40 20 20 40 Q 0 20 20 0 Z" stroke="rgba(245, 158, 11, 0.18)" strokeWidth="1.2" fill="none" />
          <circle cx="20" cy="20" r="3" fill="rgba(254, 240, 138, 0.3)" />
        </pattern>
      </defs>

      {/* Outer Guilloche Background */}
      <rect x="20" y="20" width="560" height="860" rx="20" fill="#080c14" />
      <rect x="20" y="20" width="560" height="860" rx="20" fill="url(#cardBackGuilloche)" />

      {/* Concentric Gold Border Frames */}
      <rect x="34" y="34" width="532" height="832" rx="16" stroke="url(#goldMetallic)" strokeWidth="3" fill="none" />
      <rect x="44" y="44" width="512" height="812" rx="12" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1.5" strokeDasharray="4 6" fill="none" />

      {/* 4 Corner Suit Filigree */}
      <g transform="translate(64, 64) scale(0.35)"><path d={SUIT_PATHS.spades} fill="url(#goldMetallic)" /></g>
      <g transform="translate(502, 64) scale(0.35)"><path d={SUIT_PATHS.hearts} fill="url(#goldMetallic)" /></g>
      <g transform="translate(64, 802) scale(0.35)"><path d={SUIT_PATHS.clubs} fill="url(#goldMetallic)" /></g>
      <g transform="translate(502, 802) scale(0.35)"><path d={SUIT_PATHS.diamonds} fill="url(#goldMetallic)" /></g>

      {/* Center Medallion Shield */}
      <g transform="translate(300, 450)" filter="url(#artDropShadow)">
        <circle cx="0" cy="0" r="155" fill="#0b0f19" stroke="url(#goldMetallic)" strokeWidth="4" />
        <circle cx="0" cy="0" r="140" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        <circle cx="0" cy="0" r="120" fill="#070a10" stroke="url(#goldMetallic)" strokeWidth="2" />

        {/* Interlocking "LD" Monogram */}
        <text x="0" y="28" textAnchor="middle" fill="url(#goldMetallic)" fontFamily="'Cinzel', serif" fontWeight="900" fontSize="86" letterSpacing="4">LD</text>
        <text x="0" y="68" textAnchor="middle" fill="#38bdf8" fontFamily="monospace" fontWeight="700" fontSize="15" letterSpacing="6">LOWDECK</text>
      </g>
    </svg>
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
        <div className={`standard-card-dealopoly-back dealopoly-card-back dealopoly-card-back--${variant}`}>
          <div className={`card-back-image-fill card-back-image-fill--${variant}`} />
        </div>
      </div>
    );
  }

  const { suit, rank, points } = card;
  const isRed = suit === "hearts" || suit === "diamonds";
  const suitColorObj = SUIT_COLORS[suit] || SUIT_COLORS.spades;
  const isKing = rank === "K";
  const isQueen = rank === "Q";
  const isJack = rank === "J";
  const isAce = rank === "A";

  return (
    <div
      className={`standard-card standard-card--${suit} standard-card--${size} ${
        isRed ? "standard-card--red" : "standard-card--black"
      } ${isSelected ? "standard-card--selected" : ""} ${
        disabled ? "standard-card--disabled" : ""
      } ${className}`}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      style={
        {
          "--suit-color": suitColorObj.primary,
          "--suit-glow": suitColorObj.glow,
          "--suit-color-dark": suitColorObj.dark,
        } as React.CSSProperties
      }
    >
      <div className="standard-card-canvas">
        {/* 1. Ornate Inner Hairline Contoured Border */}
        <div className="standard-card-contour-border" aria-hidden="true" />

        {/* 2. Top-Left Index */}
        <div className="standard-card-index standard-card-index--top">
          <span className="standard-card-rank">{rank}</span>
          <SuitPip suit={suit} className="standard-card-suit" />
        </div>

        {/* 3. Center Character Art / Number Illustration */}
        <div className="standard-card-art-frame">
          {isKing ? (
            <KingIllustration suit={suit} suitColor={suitColorObj.primary} />
          ) : isQueen ? (
            <QueenIllustration suit={suit} suitColor={suitColorObj.primary} />
          ) : isJack ? (
            <JackIllustration suit={suit} suitColor={suitColorObj.primary} />
          ) : isAce ? (
            <AceIllustration suit={suit} suitColor={suitColorObj.primary} />
          ) : (
            <NumberIllustration rank={rank} suit={suit} suitColor={suitColorObj.primary} />
          )}
        </div>

        {/* 4. Bottom-Right Inverted Index */}
        <div className="standard-card-index standard-card-index--bottom">
          <span className="standard-card-rank">{rank}</span>
          <SuitPip suit={suit} className="standard-card-suit" />
        </div>

        {/* 5. Circular Neon VALUE Badge */}
        {showPointsBadge && (
          <CardValueBadge
            points={points}
            isKing={isKing}
            isQueen={isQueen}
            isJack={isJack}
            isAce={isAce}
          />
        )}

        {/* 6. Selected Glow Indicator */}
        {isSelected && <div className="standard-card-selected-glow" />}
      </div>
    </div>
  );
};
