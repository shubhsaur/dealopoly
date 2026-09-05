"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "./card";
import type { CardDefinition } from "@dealopoly/shared";
import { CARD_CATALOGUE, COLOR_CONFIG } from "@dealopoly/shared";

interface HeroCardData {
  id: string;
  card: CardDefinition;
  glow: string;
  tag: string;
  tagIcon: string;
  tagColor: string;
  resting: {
    x: number;
    y: number;
    z: number;
    rotate: number;
    scale: number;
    zIndex: number;
  };
}

const PLAYABLE_CARDS = CARD_CATALOGUE.filter((c) => c.type !== "rule");

function getHeroCardMetadata(card: CardDefinition): { glow: string; tag: string; tagIcon: string; tagColor: string } {
  if (card.type === "action") {
    if (card.id.includes("deal-breaker")) {
      return { glow: "radial-gradient(circle, rgba(239, 68, 68, 0.75) 0%, transparent 70%)", tag: "STEAL COMPLETE SET", tagIcon: "gavel", tagColor: "#fca5a5" };
    }
    if (card.id.includes("just-say-no")) {
      return { glow: "radial-gradient(circle, rgba(16, 185, 129, 0.75) 0%, transparent 70%)", tag: "COUNTER DEFENSE", tagIcon: "shield", tagColor: "#86efac" };
    }
    if (card.id.includes("sly-deal") || card.id.includes("forced-deal")) {
      return { glow: "radial-gradient(circle, rgba(245, 158, 11, 0.75) 0%, transparent 70%)", tag: "STEAL / SWAP PROPERTY", tagIcon: "sync_alt", tagColor: "#fde68a" };
    }
    if (card.id.includes("debt-collector") || card.id.includes("birthday")) {
      return { glow: "radial-gradient(circle, rgba(236, 72, 153, 0.75) 0%, transparent 70%)", tag: "COLLECT CASH", tagIcon: "payments", tagColor: "#fbcfe8" };
    }
    if (card.id.includes("hotel") || card.id.includes("house")) {
      return { glow: "radial-gradient(circle, rgba(249, 115, 22, 0.75) 0%, transparent 70%)", tag: "+$4M RENT BOOST", tagIcon: "domain", tagColor: "#fdba74" };
    }
    return { glow: "radial-gradient(circle, rgba(56, 189, 248, 0.75) 0%, transparent 70%)", tag: "POWER ACTION", tagIcon: "bolt", tagColor: "#bae6fd" };
  }
  if (card.type === "property" || card.type === "property-wild") {
    const colorHex = card.primaryColor && COLOR_CONFIG[card.primaryColor] ? COLOR_CONFIG[card.primaryColor].hex : "#38bdf8";
    const colorName = card.primaryColor && COLOR_CONFIG[card.primaryColor] ? COLOR_CONFIG[card.primaryColor].name : "Property";
    return {
      glow: `radial-gradient(circle, ${colorHex}99 0%, transparent 70%)`,
      tag: card.isWild ? "WILD PROPERTY" : `${colorName.toUpperCase()} SET ($${card.value}M)`,
      tagIcon: card.isWild ? "auto_awesome" : "location_city",
      tagColor: colorHex === "#FFDE00" || colorHex === "#87CEEB" ? "#fef08a" : "#93c5fd",
    };
  }
  if (card.type === "rent") {
    return {
      glow: "radial-gradient(circle, rgba(234, 179, 8, 0.75) 0%, transparent 70%)",
      tag: "CHARGE RENT",
      tagIcon: "request_quote",
      tagColor: "#fef08a",
    };
  }
  if (card.type === "money") {
    return {
      glow: "radial-gradient(circle, rgba(34, 197, 94, 0.75) 0%, transparent 70%)",
      tag: `BANK VALUE $${card.value}M`,
      tagIcon: "attach_money",
      tagColor: "#86efac",
    };
  }
  return {
    glow: "radial-gradient(circle, rgba(56, 189, 248, 0.75) 0%, transparent 70%)",
    tag: "CARD",
    tagIcon: "style",
    tagColor: "#bae6fd",
  };
}

const INITIAL_HERO_CARDS: HeroCardData[] = [
  {
    id: "deal-breaker",
    card: {
      id: "action-deal-breaker",
      name: "Deal Breaker",
      type: "action",
      value: 5,
      count: 2,
      tagline: "ACTION",
      description: "Steal a complete set of properties from any player. (Includes any buildings).",
      icon: "handshake",
    },
    ...getHeroCardMetadata({
      id: "action-deal-breaker",
      name: "Deal Breaker",
      type: "action",
      value: 5,
      count: 2,
    }),
    resting: {
      x: -110,
      y: 20,
      z: 10,
      rotate: -12,
      scale: 0.94,
      zIndex: 10,
    },
  },
  {
    id: "mayfair",
    card: {
      id: "prop-mayfair",
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
    ...getHeroCardMetadata({
      id: "prop-mayfair",
      name: "Mayfair",
      type: "property",
      primaryColor: "dark-blue",
      value: 4,
      count: 1,
    }),
    resting: {
      x: 0,
      y: -10,
      z: 50,
      rotate: 0,
      scale: 1.06,
      zIndex: 25,
    },
  },
  {
    id: "just-say-no",
    card: {
      id: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
      count: 3,
      tagline: "ACTION",
      description: "Use at any time to cancel an action played against you. Can also cancel another Just Say No!",
      icon: "block",
    },
    ...getHeroCardMetadata({
      id: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
      count: 3,
    }),
    resting: {
      x: 110,
      y: 25,
      z: 10,
      rotate: 12,
      scale: 0.94,
      zIndex: 12,
    },
  },
];

function pickThreeRandomCards(excludeIds: string[] = []): CardDefinition[] {
  const pool = PLAYABLE_CARDS.filter((c) => !excludeIds.includes(c.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export function HeroCardShowcase() {
  const [cards, setCards] = useState<HeroCardData[]>(INITIAL_HERO_CARDS);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shufflePhase, setShufflePhase] = useState<"idle" | "split" | "gather" | "fan">("idle");
  const shuffleTimerRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      shuffleTimerRef.current.forEach(clearTimeout);
    };
  }, []);

  const handleShuffle = () => {
    if (isShuffling) return;

    setIsShuffling(true);
    setShufflePhase("split");

    // Phase 1: Smoothly split cards outward into dramatic 3D fan arc
    const t1 = setTimeout(() => {
      const currentIds = cards.map((c) => c.card.id);
      const newThree = pickThreeRandomCards(currentIds);

      const positions = [
        { x: -110, y: 20, z: 10, rotate: -12, scale: 0.94, zIndex: 10 },
        { x: 0, y: -10, z: 50, rotate: 0, scale: 1.06, zIndex: 25 },
        { x: 110, y: 25, z: 10, rotate: 12, scale: 0.94, zIndex: 12 },
      ];

      const newHeroCards: HeroCardData[] = newThree.map((card, idx) => ({
        id: `slot-${idx}-${card.id}`,
        card,
        ...getHeroCardMetadata(card),
        resting: positions[idx] ?? { x: 0, y: 0, z: 10, rotate: 0, scale: 1, zIndex: 10 },
      }));

      // Swap cards at maximum separation while in fluid flight
      setCards(newHeroCards);
      setShufflePhase("gather");
    }, 280);

    // Phase 2: Gather and interleave through center
    const t2 = setTimeout(() => {
      setShufflePhase("fan");
    }, 500);

    // Phase 3: Settle softly into final resting posture
    const t3 = setTimeout(() => {
      setIsShuffling(false);
      setShufflePhase("idle");
    }, 850);

    shuffleTimerRef.current = [t1, t2, t3];
  };

  return (
    <div className="hero-showcase-wrapper" aria-label="Dealopoly 3D Card Showcase">
      {/* Ambient Spotlight */}
      <div className="hero-showcase-spotlight" />

      {/* 3D Cards Deck Stage */}
      <div
        className="hero-showcase-stage"
        onClick={handleShuffle}
        title="Click any card to shuffle deck"
      >
        {cards.map((item, idx) => {
          const isHovered = hoveredIdx === idx && !isShuffling;
          const isOtherHovered = hoveredIdx !== null && !isHovered && !isShuffling;

          // Compute continuous smooth 3D transforms
          let animX = item.resting.x;
          let animY = item.resting.y;
          let animZ = item.resting.z;
          let animRotate = item.resting.rotate;
          let animScale = item.resting.scale;
          let animZIndex = item.resting.zIndex;

          if (isShuffling) {
            if (shufflePhase === "split") {
              // Smooth outward 3D burst
              animX = idx === 0 ? -150 : idx === 2 ? 150 : 0;
              animY = idx === 1 ? -60 : -10;
              animZ = idx === 1 ? 110 : 70;
              animRotate = (idx - 1) * 22;
              animScale = idx === 1 ? 1.12 : 1.04;
              animZIndex = idx === 1 ? 35 : 20;
            } else if (shufflePhase === "gather") {
              // Crisp interleave sweep
              animX = idx === 0 ? 30 : idx === 2 ? -30 : 0;
              animY = idx === 1 ? 10 : -15;
              animZ = (2 - idx) * 25 + 20;
              animRotate = (1 - idx) * 8;
              animScale = 1.0;
              animZIndex = (2 - idx) * 10 + 20;
            } else if (shufflePhase === "fan") {
              // Smoothly glide into resting slots
              animX = item.resting.x;
              animY = item.resting.y;
              animZ = item.resting.z;
              animRotate = item.resting.rotate;
              animScale = item.resting.scale;
              animZIndex = item.resting.zIndex;
            }
          } else {
            animX = isHovered ? item.resting.x * 0.75 : isOtherHovered ? item.resting.x * 1.12 : item.resting.x;
            animY = isHovered ? item.resting.y - 36 : isOtherHovered ? item.resting.y + 6 : item.resting.y;
            animZ = isHovered ? 90 : isOtherHovered ? item.resting.z * 0.5 : item.resting.z;
            animRotate = isHovered ? 0 : item.resting.rotate;
            animScale = isHovered ? 1.14 : isOtherHovered ? 0.90 : item.resting.scale;
            animZIndex = isHovered ? 50 : item.resting.zIndex;
          }

          return (
            <motion.div
              key={`hero-slot-${idx}`}
              className="hero-showcase-card-container"
              style={{
                zIndex: animZIndex,
              }}
              animate={{
                x: animX,
                y: animY,
                z: animZ,
                rotate: animRotate,
                scale: animScale,
                filter: isOtherHovered ? "brightness(0.92)" : "brightness(1)",
                zIndex: animZIndex,
              }}
              transition={{
                type: "spring",
                stiffness: isShuffling ? 280 : 360,
                damping: isShuffling ? 22 : 25,
                mass: 0.8,
              }}
              onHoverStart={() => !isShuffling && setHoveredIdx(idx)}
              onHoverEnd={() => !isShuffling && setHoveredIdx(null)}
            >
              {/* Dynamic Aura Glow */}
              <div
                className={`hero-card-glow-aura ${isHovered ? "hero-card-glow-aura--active" : ""}`}
                style={{ background: item.glow }}
              />

              {/* Floating Synergy Pill (Visible on Hover) */}
              <motion.div
                className="hero-card-floating-pill"
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: isHovered && !isShuffling ? 1 : 0,
                  y: isHovered && !isShuffling ? -12 : 10,
                }}
                transition={{ duration: 0.2 }}
                style={{ borderColor: item.tagColor }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px", color: item.tagColor }}
                >
                  {item.tagIcon}
                </span>
                <span style={{ color: item.tagColor }}>{item.tag}</span>
              </motion.div>

              {/* Authentic Dealopoly Card */}
              <div className="hero-card-physical-frame">
                <Card card={item.card} size="md" isInteractive={false} />
              </div>

              {/* Base Contact Shadow */}
              <div className="hero-card-contact-shadow" />
            </motion.div>
          );
        })}
      </div>

      {/* 3D Circular Pedestal Platform (Positioned directly below the cards) */}
      <div className="hero-platform-container">
        <div className="hero-platform-shadow" />
        <div className="hero-platform-base">
          <div className="hero-platform-outer-ring" />
          <div className="hero-platform-middle-ring" />
          <div className="hero-platform-surface">
            <div className="hero-platform-surface-glow" />
            <div className="hero-platform-concentric-lines" />
          </div>
        </div>
      </div>

      {/* Desktop Shuffle Trigger Hint Badge */}
      <button
        type="button"
        className="hero-shuffle-badge game-desktop-only"
        onClick={handleShuffle}
        disabled={isShuffling}
        title="Shuffle random cards from deck"
      >
        <span
          className="material-symbols-outlined hero-shuffle-icon"
          style={{
            fontSize: "15px",
            animation: isShuffling ? "spin 0.6s linear infinite" : "none",
          }}
        >
          {isShuffling ? "sync" : "shuffle"}
        </span>
        <span>{isShuffling ? "Shuffling 110-Card Deck…" : "Click cards to shuffle deck"}</span>
      </button>
    </div>
  );
}
