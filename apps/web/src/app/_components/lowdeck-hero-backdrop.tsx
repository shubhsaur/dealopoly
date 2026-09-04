"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface FloatingSuitGlyph {
  id: string;
  symbol: string;
  color: string;
  fontSize: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  baseRotate: number;
  depthFactor: number;
  duration: number;
  delay: number;
  opacity: number;
}

const SUIT_GLYPHS: FloatingSuitGlyph[] = [
  // Top left: King Spade
  {
    id: "glyph-spade-1",
    symbol: "♠",
    color: "#38bdf8",
    fontSize: "3.5rem",
    position: { top: "8%", left: "6%" },
    baseRotate: -15,
    depthFactor: 18,
    duration: 9.5,
    delay: 0,
    opacity: 0.18,
  },
  // Bottom left: Crimson Heart
  {
    id: "glyph-heart-1",
    symbol: "♥",
    color: "#f43f5e",
    fontSize: "4.2rem",
    position: { bottom: "12%", left: "4%" },
    baseRotate: 12,
    depthFactor: 24,
    duration: 11,
    delay: 1.5,
    opacity: 0.22,
  },
  // Top right: Golden Diamond
  {
    id: "glyph-diamond-1",
    symbol: "♦",
    color: "#fbbf24",
    fontSize: "3.8rem",
    position: { top: "10%", right: "8%" },
    baseRotate: 16,
    depthFactor: -20,
    duration: 8.8,
    delay: 0.8,
    opacity: 0.2,
  },
  // Bottom right: Emerald Club
  {
    id: "glyph-club-1",
    symbol: "♣",
    color: "#34d399",
    fontSize: "4rem",
    position: { bottom: "10%", right: "6%" },
    baseRotate: -10,
    depthFactor: -22,
    duration: 10.2,
    delay: 2.2,
    opacity: 0.18,
  },
  // Center-left faint spade
  {
    id: "glyph-spade-2",
    symbol: "♠",
    color: "#94a3b8",
    fontSize: "2.4rem",
    position: { top: "45%", left: "14%" },
    baseRotate: 8,
    depthFactor: 12,
    duration: 12.5,
    delay: 3,
    opacity: 0.12,
  },
  // Center-right faint heart
  {
    id: "glyph-heart-2",
    symbol: "♥",
    color: "#fb7185",
    fontSize: "2.8rem",
    position: { top: "40%", right: "16%" },
    baseRotate: -18,
    depthFactor: -14,
    duration: 10.8,
    delay: 1.8,
    opacity: 0.14,
  },
];

export function LowdeckHeroBackdrop() {
  const [mounted, setMounted] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

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
    <div className="lowdeck-hero-backdrop" aria-hidden="true">
      {/* Ambient Casino Lighting Auras */}
      <div className="lowdeck-atmosphere-glow lowdeck-atmosphere-glow--gold" />
      <div className="lowdeck-atmosphere-glow lowdeck-atmosphere-glow--emerald" />
      <div className="lowdeck-atmosphere-glow lowdeck-atmosphere-glow--ruby" />

      {/* Subtle Casino Table Felt Texture Grid */}
      <div className="lowdeck-felt-grid" />

      {/* Floating 3D Suit Watermark Glyphs */}
      {SUIT_GLYPHS.map((glyph) => (
        <SuitGlyphNode
          key={glyph.id}
          glyph={glyph}
          smoothX={smoothX}
          smoothY={smoothY}
        />
      ))}

      {/* Vignette Overlay to ensure text readability */}
      <div className="lowdeck-backdrop-vignette" />
    </div>
  );
}

function SuitGlyphNode({
  glyph,
  smoothX,
  smoothY,
}: {
  glyph: FloatingSuitGlyph;
  smoothX: any;
  smoothY: any;
}) {
  const x = useTransform(smoothX, (val: number) => val * glyph.depthFactor);
  const y = useTransform(smoothY, (val: number) => val * glyph.depthFactor);
  const rotX = useTransform(smoothY, (val: number) => -val * 6);
  const rotY = useTransform(smoothX, (val: number) => val * 8);

  return (
    <motion.div
      className="lowdeck-floating-glyph"
      style={{
        position: "absolute",
        ...glyph.position,
        x,
        y,
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: "preserve-3d",
        color: glyph.color,
        fontSize: glyph.fontSize,
        opacity: glyph.opacity,
        userSelect: "none",
        pointerEvents: "none",
        zIndex: 1,
        fontFamily: "serif, 'Times New Roman', Georgia",
        textShadow: `0 0 24px ${glyph.color}80`,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: glyph.opacity,
        scale: 1,
        y: [0, -16, 0, 14, 0],
        rotate: [
          glyph.baseRotate,
          glyph.baseRotate + 4,
          glyph.baseRotate,
          glyph.baseRotate - 4,
          glyph.baseRotate,
        ],
      }}
      transition={{
        opacity: { duration: 1.2, delay: glyph.delay * 0.2 },
        scale: { duration: 1.2, delay: glyph.delay * 0.2 },
        y: {
          duration: glyph.duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: glyph.delay,
        },
        rotate: {
          duration: glyph.duration * 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: glyph.delay,
        },
      }}
    >
      {glyph.symbol}
    </motion.div>
  );
}
