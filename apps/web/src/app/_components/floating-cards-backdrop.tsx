"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Card, CardBack } from "./card";
import { StandardCard } from "./standard-card";
import { CARD_CATALOGUE } from "@dealopoly/shared";
import type { LeastCountCard } from "@dealopoly/game-engine";

// Selected showcase cards
const dealBreakerCard = CARD_CATALOGUE.find((c) => c.id === "action-deal-breaker")!;
const justSayNoCard = CARD_CATALOGUE.find((c) => c.id === "action-just-say-no")!;
const mayfairCard = CARD_CATALOGUE.find((c) => c.id === "prop-mayfair")!;

const kingOfSpades: LeastCountCard = {
  instanceId: "hero-king-spades",
  rank: "K",
  rankValue: 13,
  suit: "spades",
  points: 0,
};

const aceOfHearts: LeastCountCard = {
  instanceId: "hero-ace-hearts",
  rank: "A",
  rankValue: 1,
  suit: "hearts",
  points: 1,
};

const tenOfDiamonds: LeastCountCard = {
  instanceId: "hero-ten-diamonds",
  rank: "10",
  rankValue: 10,
  suit: "diamonds",
  points: 10,
};

interface FloatingCardItem {
  id: string;
  type: "monopoly" | "standard" | "back";
  cardData?: any;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  baseRotate: number;
  scale: number;
  glowColor: string;
  depthFactor: number;
  floatDuration: number;
  floatDelay: number;
  mobileHidden?: boolean;
}

const FLOATING_CARDS: FloatingCardItem[] = [
  // 1. Monodeal: Deal Breaker (Left Upper)
  {
    id: "float-deal-breaker",
    type: "monopoly",
    cardData: dealBreakerCard,
    position: { top: "6%", left: "3%" },
    baseRotate: -14,
    scale: 0.84,
    glowColor: "rgba(239, 68, 68, 0.35)",
    depthFactor: 22,
    floatDuration: 8.5,
    floatDelay: 0,
  },
  // 2. Lowdeck: Golden King of Spades (Right Upper)
  {
    id: "float-king-spades",
    type: "standard",
    cardData: kingOfSpades,
    position: { top: "5%", right: "3%" },
    baseRotate: 12,
    scale: 0.86,
    glowColor: "rgba(250, 204, 21, 0.4)",
    depthFactor: -24,
    floatDuration: 9.2,
    floatDelay: 1.2,
  },
  // 3. Monodeal: Mayfair (Left Lower)
  {
    id: "float-mayfair",
    type: "monopoly",
    cardData: mayfairCard,
    position: { bottom: "6%", left: "5%" },
    baseRotate: 10,
    scale: 0.78,
    glowColor: "rgba(56, 189, 248, 0.3)",
    depthFactor: 18,
    floatDuration: 10.5,
    floatDelay: 2.5,
  },
  // 4. Lowdeck: Ace of Hearts (Right Lower)
  {
    id: "float-ace-hearts",
    type: "standard",
    cardData: aceOfHearts,
    position: { bottom: "5%", right: "5%" },
    baseRotate: -10,
    scale: 0.8,
    glowColor: "rgba(244, 63, 94, 0.35)",
    depthFactor: -20,
    floatDuration: 8.8,
    floatDelay: 0.8,
  },
  // 5. Monodeal: Official Dealopoly Card Back (Top Center-Right Background)
  {
    id: "float-card-back",
    type: "back",
    position: { top: "14%", right: "18%" },
    baseRotate: -18,
    scale: 0.64,
    glowColor: "rgba(56, 189, 248, 0.25)",
    depthFactor: -12,
    floatDuration: 11.4,
    floatDelay: 3.1,
    mobileHidden: true,
  },
  // 6. Monodeal: Just Say No (Top Center-Left Background)
  {
    id: "float-just-say-no",
    type: "monopoly",
    cardData: justSayNoCard,
    position: { top: "16%", left: "17%" },
    baseRotate: 16,
    scale: 0.66,
    glowColor: "rgba(16, 185, 129, 0.25)",
    depthFactor: 14,
    floatDuration: 12.0,
    floatDelay: 1.8,
    mobileHidden: true,
  },
  // 7. Lowdeck: 10 of Diamonds (Bottom Background)
  {
    id: "float-ten-diamonds",
    type: "standard",
    cardData: tenOfDiamonds,
    position: { bottom: "2%", right: "22%" },
    baseRotate: 15,
    scale: 0.6,
    glowColor: "rgba(249, 115, 22, 0.2)",
    depthFactor: -10,
    floatDuration: 10.0,
    floatDelay: 4.0,
    mobileHidden: true,
  },
];

export function FloatingCardsBackdrop() {
  const [mounted, setMounted] = useState(false);

  // Mouse Parallax Motion Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid inertia
  const springConfig = { damping: 25, stiffness: 60 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <div className="hero-floating-backdrop" aria-hidden="true">
      {/* Ambient Radial Lights */}
      <div className="hero-ambient-aura hero-ambient-aura--cyan" />
      <div className="hero-ambient-aura hero-ambient-aura--gold" />
      <div className="hero-ambient-aura hero-ambient-aura--emerald" />

      {/* Floating 3D Cards */}
      {FLOATING_CARDS.map((item) => (
        <FloatingCardNode
          key={item.id}
          item={item}
          smoothX={smoothX}
          smoothY={smoothY}
        />
      ))}

      {/* Transparent Overlay on top of backdrop to enhance hero contrast */}
      <div className="hero-backdrop-overlay" />
    </div>
  );
}

function FloatingCardNode({
  item,
  smoothX,
  smoothY,
}: {
  item: FloatingCardItem;
  smoothX: any;
  smoothY: any;
}) {
  const x = useTransform(smoothX, (val: number) => val * item.depthFactor);
  const y = useTransform(smoothY, (val: number) => val * item.depthFactor);
  const rotX = useTransform(smoothY, (val: number) => -val * 6);
  const rotY = useTransform(smoothX, (val: number) => val * 8);

  return (
    <motion.div
      className={`hero-floating-card-wrapper ${
        item.mobileHidden ? "hero-floating-card--desktop-only" : ""
      }`}
      style={{
        position: "absolute",
        ...item.position,
        x,
        y,
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: "preserve-3d",
        perspective: 1000,
        zIndex: item.scale > 0.7 ? 2 : 1,
      }}
      initial={{ opacity: 0, scale: item.scale * 0.75 }}
      animate={{
        opacity: 1,
        scale: item.scale,
        y: [0, -14, 0, 12, 0],
        rotate: [
          item.baseRotate,
          item.baseRotate + 3,
          item.baseRotate,
          item.baseRotate - 3,
          item.baseRotate,
        ],
      }}
      transition={{
        opacity: { duration: 1.2, delay: item.floatDelay * 0.2 },
        scale: { duration: 1.2, delay: item.floatDelay * 0.2 },
        y: {
          duration: item.floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: item.floatDelay,
        },
        rotate: {
          duration: item.floatDuration * 1.25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: item.floatDelay,
        },
      }}
    >
      {/* Ambient Halo Glow behind card */}
      <div
        className="hero-card-glow-disc"
        style={{
          background: `radial-gradient(circle, ${item.glowColor} 0%, transparent 70%)`,
        }}
      />

      {/* Card Content */}
      <div className="hero-floating-card-inner">
        {item.type === "monopoly" && item.cardData && (
          <Card card={item.cardData} size="sm" isInteractive={false} />
        )}
        {item.type === "standard" && item.cardData && (
          <StandardCard card={item.cardData} size="sm" showPointsBadge={true} />
        )}
        {item.type === "back" && (
          <CardBack size="sm" isInteractive={false} />
        )}
      </div>
    </motion.div>
  );
}
