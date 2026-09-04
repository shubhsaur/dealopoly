"use client";

import React from "react";
import { Card, CardBack } from "./card";
import { StandardCard } from "./standard-card";
import type { CardDefinition } from "@dealopoly/shared";
import type { LeastCountCard } from "@dealopoly/game-engine";

export type CardLoaderVariant = "arcade" | "monodeal" | "lowdeck";

export interface CardLoaderProps {
  /** Game variant for the loader cards */
  game?: CardLoaderVariant;
  /** Size of the loader cards */
  size?: "sm" | "md" | "lg";
  /** Optional text shown below the loader */
  text?: string;
  /** Additional className on the root wrapper */
  className?: string;
}

/**
 * Three representative Monodeal cards used in the Monodeal loader animation.
 */
const MONODEAL_LOADER_CARDS: CardDefinition[] = [
  {
    id: "loader-action",
    name: "Deal Breaker",
    type: "action",
    value: 5,
    count: 1,
    tagline: "ACTION",
    description: "Steal a complete set of properties from any player.",
    icon: "handshake",
  },
  {
    id: "loader-property",
    name: "Mayfair",
    type: "property",
    primaryColor: "dark-blue",
    value: 4,
    count: 1,
    setSize: 2,
    rentTiers: [
      { setCount: 1, rent: 3 },
      { setCount: 2, rent: 8, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "loader-money",
    name: "5M",
    type: "money",
    value: 5,
    count: 1,
  },
];

/**
 * Three representative Lowdeck cards used in the Lowdeck loader animation.
 */
const LOWDECK_LOADER_CARDS: LeastCountCard[] = [
  {
    instanceId: "loader-king",
    suit: "spades",
    rank: "K",
    rankValue: 13,
    points: 0,
  },
  {
    instanceId: "loader-ace",
    suit: "hearts",
    rank: "A",
    rankValue: 1,
    points: 1,
  },
  {
    instanceId: "loader-queen",
    suit: "diamonds",
    rank: "Q",
    rankValue: 12,
    points: 12,
  },
];

/**
 * Dealopoly Arcade Card Loader supporting 3 variants:
 * 1. "arcade"   - Brand Dealopoly card backs shuffling/flipping
 * 2. "monodeal" - Authentic Monodeal property, action & money cards
 * 3. "lowdeck"  - Standard 52-suit playing cards (King=0, Ace=1, Queen=12)
 */
export function CardLoader({
  game = "arcade",
  size = "md",
  text,
  className = "",
}: CardLoaderProps) {
  const cardCount = 3;

  return (
    <div
      className={`card-loader card-loader--${size} card-loader--${game} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div className="card-loader__spinner">
        <div className="card-loader__stack">
          {Array.from({ length: cardCount }).map((_, index) => {
            const monodealCard = MONODEAL_LOADER_CARDS[index];
            const lowdeckCard = LOWDECK_LOADER_CARDS[index];

            return (
              <div
                key={`${game}-card-${index}`}
                className="card-loader__card-wrapper"
                style={
                  {
                    "--loader-index": index,
                    "--loader-rotate": `${(index - 1) * 16}deg`,
                    zIndex: cardCount - index,
                  } as React.CSSProperties
                }
              >
                {game === "monodeal" && monodealCard ? (
                  <Card card={monodealCard} size="xs" isInteractive={false} />
                ) : game === "lowdeck" && lowdeckCard ? (
                  <StandardCard card={lowdeckCard} size="xs" showPointsBadge={true} />
                ) : (
                  /* Arcade Launcher: Dealopoly branded card back */
                  <CardBack size="xs" isInteractive={false} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {text && <p className="card-loader__text">{text}</p>}
      {/* Visually hidden live text for screen readers */}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Shortcut for Arcade Hub Loader */
export function ArcadeCardLoader(props: Omit<CardLoaderProps, "game">) {
  return <CardLoader {...props} game="arcade" />;
}

/** Shortcut for Monodeal Loader */
export function MonodealCardLoader(props: Omit<CardLoaderProps, "game">) {
  return <CardLoader {...props} game="monodeal" />;
}

/** Shortcut for Lowdeck Loader */
export function LowdeckCardLoader(props: Omit<CardLoaderProps, "game">) {
  return <CardLoader {...props} game="lowdeck" />;
}
