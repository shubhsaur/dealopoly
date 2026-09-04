"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { StandardCard } from "./standard-card";
import type { LeastCountCard } from "@dealopoly/game-engine";

interface ShowcaseCardItem {
  id: string;
  card: LeastCountCard;
  tag: string;
  tagIcon: string;
  tagColor: string;
  glow: string;
  resting: {
    x: number;
    y: number;
    z: number;
    rotate: number;
    scale: number;
    zIndex: number;
  };
}

interface HandPreset {
  name: string;
  cards: ShowcaseCardItem[];
}

const HAND_PRESETS: HandPreset[] = [
  // Preset 0: The Golden Kings Lock (King = 0 Pts)
  {
    name: "Golden Kings Lock",
    cards: [
      {
        id: "hero-king-hearts",
        card: {
          instanceId: "hero-kh",
          suit: "hearts",
          rank: "K",
          points: 0,
          rankValue: 13,
        },
        tag: "👑 0 PTS • PAIR DROP",
        tagIcon: "workspace_premium",
        tagColor: "#fde047",
        glow: "radial-gradient(circle, rgba(250, 204, 21, 0.75) 0%, transparent 70%)",
        resting: { x: -110, y: 16, z: 10, rotate: -12, scale: 0.94, zIndex: 10 },
      },
      {
        id: "hero-king-spades",
        card: {
          instanceId: "hero-ks",
          suit: "spades",
          rank: "K",
          points: 0,
          rankValue: 13,
        },
        tag: "👑 0 PTS • ULTIMATE WINNER",
        tagIcon: "crown",
        tagColor: "#facc15",
        glow: "radial-gradient(circle, rgba(250, 204, 21, 0.85) 0%, transparent 70%)",
        resting: { x: 0, y: -10, z: 50, rotate: 0, scale: 1.06, zIndex: 25 },
      },
      {
        id: "hero-ace-diamonds",
        card: {
          instanceId: "hero-ad",
          suit: "diamonds",
          rank: "A",
          points: 1,
          rankValue: 1,
        },
        tag: "⭐ 1 PT • HAND TOTAL: 1 PT",
        tagIcon: "star",
        tagColor: "#86efac",
        glow: "radial-gradient(circle, rgba(16, 185, 129, 0.75) 0%, transparent 70%)",
        resting: { x: 110, y: 22, z: 10, rotate: 12, scale: 0.94, zIndex: 12 },
      },
    ],
  },
  // Preset 1: 3-Card Same-Suit Run Combo Drop
  {
    name: "3-Card Run Combo",
    cards: [
      {
        id: "hero-five-clubs",
        card: {
          instanceId: "hero-5c",
          suit: "clubs",
          rank: "5",
          points: 5,
          rankValue: 5,
        },
        tag: "RUN 1/3 (5♣)",
        tagIcon: "style",
        tagColor: "#bae6fd",
        glow: "radial-gradient(circle, rgba(56, 189, 248, 0.75) 0%, transparent 70%)",
        resting: { x: -110, y: 16, z: 10, rotate: -12, scale: 0.94, zIndex: 10 },
      },
      {
        id: "hero-six-clubs",
        card: {
          instanceId: "hero-6c",
          suit: "clubs",
          rank: "6",
          points: 6,
          rankValue: 6,
        },
        tag: "🔥 COMBO • 3-CARD FLUSH RUN",
        tagIcon: "bolt",
        tagColor: "#fde047",
        glow: "radial-gradient(circle, rgba(245, 158, 11, 0.85) 0%, transparent 70%)",
        resting: { x: 0, y: -10, z: 50, rotate: 0, scale: 1.06, zIndex: 25 },
      },
      {
        id: "hero-seven-clubs",
        card: {
          instanceId: "hero-7c",
          suit: "clubs",
          rank: "7",
          points: 7,
          rankValue: 7,
        },
        tag: "RUN 3/3 (7♣)",
        tagIcon: "style",
        tagColor: "#bae6fd",
        glow: "radial-gradient(circle, rgba(56, 189, 248, 0.75) 0%, transparent 70%)",
        resting: { x: 110, y: 22, z: 10, rotate: 12, scale: 0.94, zIndex: 12 },
      },
    ],
  },
  // Preset 2: High-Danger Discard (Shed Heavy Points)
  {
    name: "Heavyweight Danger Drop",
    cards: [
      {
        id: "hero-jack-hearts",
        card: {
          instanceId: "hero-jh",
          suit: "hearts",
          rank: "J",
          points: 11,
          rankValue: 11,
        },
        tag: "⚠️ 11 PTS • HIGH DANGER",
        tagIcon: "warning",
        tagColor: "#fbcfe8",
        glow: "radial-gradient(circle, rgba(244, 63, 94, 0.75) 0%, transparent 70%)",
        resting: { x: -110, y: 16, z: 10, rotate: -12, scale: 0.94, zIndex: 10 },
      },
      {
        id: "hero-queen-spades",
        card: {
          instanceId: "hero-qs",
          suit: "spades",
          rank: "Q",
          points: 12,
          rankValue: 12,
        },
        tag: "🚨 12 PTS • SHED FIRST!",
        tagIcon: "delete_sweep",
        tagColor: "#fca5a5",
        glow: "radial-gradient(circle, rgba(239, 68, 68, 0.85) 0%, transparent 70%)",
        resting: { x: 0, y: -10, z: 50, rotate: 0, scale: 1.06, zIndex: 25 },
      },
      {
        id: "hero-ten-diamonds",
        card: {
          instanceId: "hero-10d",
          suit: "diamonds",
          rank: "10",
          points: 10,
          rankValue: 10,
        },
        tag: "⚠️ 10 PTS • HEAVYWEIGHT",
        tagIcon: "warning",
        tagColor: "#fdba74",
        glow: "radial-gradient(circle, rgba(249, 115, 22, 0.75) 0%, transparent 70%)",
        resting: { x: 110, y: 22, z: 10, rotate: 12, scale: 0.94, zIndex: 12 },
      },
    ],
  },
  // Preset 3: Winning Show Declaration (Total ≤ 7 Pts)
  {
    name: "Winning Show Declaration",
    cards: [
      {
        id: "hero-two-spades",
        card: {
          instanceId: "hero-2s",
          suit: "spades",
          rank: "2",
          points: 2,
          rankValue: 2,
        },
        tag: "2 PTS • SAFE",
        tagIcon: "shield",
        tagColor: "#bae6fd",
        glow: "radial-gradient(circle, rgba(56, 189, 248, 0.75) 0%, transparent 70%)",
        resting: { x: -110, y: 16, z: 10, rotate: -12, scale: 0.94, zIndex: 10 },
      },
      {
        id: "hero-ace-spades",
        card: {
          instanceId: "hero-as",
          suit: "spades",
          rank: "A",
          points: 1,
          rankValue: 1,
        },
        tag: "🏆 TOTAL 6 PTS • CALL SHOW!",
        tagIcon: "emoji_events",
        tagColor: "#86efac",
        glow: "radial-gradient(circle, rgba(16, 185, 129, 0.85) 0%, transparent 70%)",
        resting: { x: 0, y: -10, z: 50, rotate: 0, scale: 1.06, zIndex: 25 },
      },
      {
        id: "hero-three-hearts",
        card: {
          instanceId: "hero-3h",
          suit: "hearts",
          rank: "3",
          points: 3,
          rankValue: 3,
        },
        tag: "3 PTS • SAFE",
        tagIcon: "shield",
        tagColor: "#fbcfe8",
        glow: "radial-gradient(circle, rgba(244, 63, 94, 0.75) 0%, transparent 70%)",
        resting: { x: 110, y: 22, z: 10, rotate: 12, scale: 0.94, zIndex: 12 },
      },
    ],
  },
];

export function LeastCountHeroShowcase() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [cards, setCards] = useState<ShowcaseCardItem[]>(HAND_PRESETS[0]!.cards);
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

    // Phase 1: Smoothly split cards outward in 3D arc
    const t1 = setTimeout(() => {
      const nextIdx = (presetIndex + 1) % HAND_PRESETS.length;
      setPresetIndex(nextIdx);
      const targetPreset = HAND_PRESETS[nextIdx] ?? HAND_PRESETS[0]!;
      setCards(targetPreset.cards);
      setShufflePhase("gather");
    }, 280);

    // Phase 2: Gather through center
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
    <div className="hero-showcase-wrapper" aria-label="Lowdeck 3D Interactive Card Showcase">
      {/* Lowdeck Warm Amber & Emerald Spotlight */}
      <div className="hero-showcase-spotlight hero-showcase-spotlight--lowdeck" />

      {/* 3D Cards Stage */}
      <div
        className="hero-showcase-stage"
        onClick={handleShuffle}
        title="Click any card to shuffle hands"
      >
        {cards.map((item, idx) => {
          const isHovered = hoveredIdx === idx && !isShuffling;
          const isOtherHovered = hoveredIdx !== null && !isHovered && !isShuffling;

          let animX = item.resting.x;
          let animY = item.resting.y;
          let animZ = item.resting.z;
          let animRotate = item.resting.rotate;
          let animScale = item.resting.scale;
          let animZIndex = item.resting.zIndex;

          if (isShuffling) {
            if (shufflePhase === "split") {
              animX = idx === 0 ? -150 : idx === 2 ? 150 : 0;
              animY = idx === 1 ? -60 : -10;
              animZ = idx === 1 ? 110 : 70;
              animRotate = (idx - 1) * 22;
              animScale = idx === 1 ? 1.12 : 1.04;
              animZIndex = idx === 1 ? 35 : 20;
            } else if (shufflePhase === "gather") {
              animX = idx === 0 ? 30 : idx === 2 ? -30 : 0;
              animY = idx === 1 ? 10 : -15;
              animZ = (2 - idx) * 25 + 20;
              animRotate = (1 - idx) * 8;
              animScale = 1.0;
              animZIndex = (2 - idx) * 10 + 20;
            } else if (shufflePhase === "fan") {
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
              key={`lowdeck-slot-${idx}-${item.id}`}
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

              {/* Floating Lowdeck Strategy Pill */}
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

              {/* Standard Playing Card */}
              <div className="hero-card-physical-frame">
                <StandardCard
                  card={item.card}
                  size="md"
                  isSelected={isHovered || idx === 1}
                  showPointsBadge={true}
                />
              </div>

              {/* Base Contact Shadow */}
              <div className="hero-card-contact-shadow" />
            </motion.div>
          );
        })}
      </div>

      {/* 3D Casino-Grade Pedestal Platform */}
      <div className="hero-platform-container">
        <div className="hero-platform-shadow" />
        <div className="hero-platform-base">
          <div className="hero-platform-outer-ring hero-platform-outer-ring--lowdeck" />
          <div className="hero-platform-middle-ring hero-platform-middle-ring--lowdeck" />
          <div className="hero-platform-surface hero-platform-surface--lowdeck">
            <div className="hero-platform-surface-glow hero-platform-surface-glow--lowdeck" />
            <div className="hero-platform-concentric-lines" />
          </div>
        </div>
      </div>

      {/* Desktop Shuffle Trigger Hint Badge */}
      <button
        type="button"
        className="hero-shuffle-badge hero-shuffle-badge--lowdeck game-desktop-only"
        onClick={handleShuffle}
        disabled={isShuffling}
        title="Shuffle random hands from Lowdeck"
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
        <span>
          {isShuffling
            ? "Dealing 52-Card Deck…"
            : `Hand ${presetIndex + 1}/${HAND_PRESETS.length}: ${(HAND_PRESETS[presetIndex] ?? HAND_PRESETS[0]!).name} • Click to shuffle`}
        </span>
      </button>
    </div>
  );
}

