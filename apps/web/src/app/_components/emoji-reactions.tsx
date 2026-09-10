"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../../lib/use-settings";
import { playReactionPop, playEmojiRain, triggerHaptic } from "../../lib/sound-effects";

export interface EmojiBurst {
  id: string;
  emoji: string;
  senderName?: string;
  isSelf?: boolean;
  x?: number; // relative percent or px offset
}

export interface EmojiRainDrop {
  id: string;
  emoji: string;
  x: number; // percent across viewport width
  delay: number; // seconds before this drop starts falling
  duration: number; // seconds for this drop to fall
  size: number; // font-size in rem
  rotation: number; // degrees
  sway: number; // horizontal sway amplitude in rem
}

export const REACTION_EMOJIS = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "😎", label: "Smooth" },
  { emoji: "👏", label: "Bravo" },
  { emoji: "😱", label: "Shocked" },
  { emoji: "💸", label: "Cash" },
  { emoji: "💀", label: "Dead" },
  { emoji: "🎲", label: "Gambit" },
  { emoji: "🎉", label: "Party" },
  { emoji: "🃏", label: "Nope!" },
  { emoji: "💰", label: "Rent!" },
  { emoji: "🏠", label: "Property!" },
  { emoji: "😈", label: "Sneaky" },
  { emoji: "🤝", label: "Deal!" },
  { emoji: "💎", label: "Wild!" },
  { emoji: "🤑", label: "Rich!" },
  { emoji: "👑", label: "King!" },
];

const LONG_PRESS_MS = 500;
const GROW_DURATION_MS = 3000;
const RAIN_DURATION_MS = 5000;
const RAIN_DROP_COUNT = 50;

interface QuickReactionDockProps {
  onReact: (emoji: string) => void;
  onRain?: (emoji: string) => void;
  className?: string;
}

export const QuickReactionDock: React.FC<QuickReactionDockProps> = ({
  onReact,
  onRain,
  className = "",
}) => {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [longPressedEmoji, setLongPressedEmoji] = useState<string | null>(null);
  const [isBursting, setIsBursting] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const growTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (growTimerRef.current) {
      clearTimeout(growTimerRef.current);
      growTimerRef.current = null;
    }
    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
      burstTimerRef.current = null;
    }
    setLongPressedEmoji(null);
    setIsBursting(false);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (growTimerRef.current) clearTimeout(growTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  // Close palette on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        cancelLongPress();
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen, cancelLongPress]);

  // If user disabled reactions in settings, hide dock entirely
  if (!settings.showReactions) return null;

  const handleSelectEmoji = (emoji: string) => {
    playReactionPop();
    triggerHaptic();
    onReact(emoji);
    setIsOpen(false);
  };

  const handlePointerDown = (emoji: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setLongPressedEmoji(emoji);
      setIsBursting(false);
      triggerHaptic("heavy");
      // After inflate duration, transition to burst phase
      growTimerRef.current = setTimeout(() => {
        setIsBursting(true);
        triggerHaptic("heavy");
        // After burst animation (350ms), trigger rain
        burstTimerRef.current = setTimeout(() => {
          playEmojiRain();
          onRain?.(emoji);
          setLongPressedEmoji(null);
          setIsBursting(false);
          setIsOpen(false);
        }, 350);
      }, GROW_DURATION_MS);
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // If inflating (not yet burst), cancel
    if (longPressedEmoji && !isBursting) {
      cancelLongPress();
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressedEmoji && !isBursting) {
      cancelLongPress();
    }
  };

  return (
    <div ref={containerRef} className={`reaction-dock-container ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="reaction-palette"
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {REACTION_EMOJIS.map(({ emoji, label }) => {
              const isLongPressed = longPressedEmoji === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  className={`reaction-emoji-btn ${isLongPressed ? (isBursting ? "reaction-emoji-btn--burst" : "reaction-emoji-btn--long-press") : ""}`}
                  onClick={() => {
                    if (!longPressedEmoji) handleSelectEmoji(emoji);
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handlePointerDown(emoji);
                  }}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                  onContextMenu={(e) => e.preventDefault()}
                  title={label}
                  aria-label={label}
                >
                  <span className="reaction-emoji-btn-emoji">{emoji}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className={`reaction-toggle-btn ${isOpen ? "active" : ""}`}
        onClick={() => {
          setIsOpen(!isOpen);
          cancelLongPress();
        }}
        title={isOpen ? "Close reactions" : "Quick Reactions"}
        aria-label="Toggle reactions menu"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
          {isOpen ? "close" : "add_reaction"}
        </span>
      </button>
    </div>
  );
};

export const ReactionBurstsOverlay: React.FC<{
  bursts: EmojiBurst[];
  onBurstComplete: (id: string) => void;
}> = ({ bursts, onBurstComplete }) => {
  const { settings } = useSettings();
  if (!settings.showReactions) return null;

  return (
    <div className="reaction-bursts-overlay" style={{ pointerEvents: "none" }}>
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.div
            key={b.id}
            className="reaction-burst-item"
            style={{
              position: "absolute",
              bottom: "90px",
              right: b.isSelf ? "36px" : undefined,
              left: !b.isSelf ? (b.x ? `${b.x}%` : "50%") : undefined,
              transform: !b.isSelf && !b.x ? "translateX(-50%)" : undefined,
            }}
            initial={{
              opacity: 0,
              scale: 0.5,
              y: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.35, 1.15, 0.9],
              y: -140,
            }}
            transition={{
              duration: settings.animationSpeed === "reduced" ? 0.6 : settings.animationSpeed === "cinematic" ? 2.0 : 1.25,
              ease: "easeOut",
            }}
            onAnimationComplete={() => onBurstComplete(b.id)}
          >
            <span className="reaction-burst-emoji">{b.emoji}</span>
            {b.senderName && (
              <span className="reaction-burst-sender">{b.senderName}</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Generates a shower of rain drops for the given emoji.
 */
function generateRainDrops(emoji: string): EmojiRainDrop[] {
  const drops: EmojiRainDrop[] = [];
  for (let i = 0; i < RAIN_DROP_COUNT; i++) {
    drops.push({
      id: `rain-${Date.now()}-${i}`,
      emoji,
      x: Math.random() * 100,
      delay: Math.random() * 3.5, // staggered start within first 3.5s
      duration: 1.5 + Math.random() * 2.5, // 1.5–4s fall time
      size: 1.2 + Math.random() * 1.8, // 1.2–3rem
      rotation: Math.random() * 360,
      sway: 0.3 + Math.random() * 1.2, // 0.3–1.5rem sway
    });
  }
  return drops;
}

export const EmojiRainOverlay: React.FC<{
  emoji: string | null;
  onAnimationEnd: () => void;
}> = ({ emoji, onAnimationEnd }) => {
  const { settings } = useSettings();
  const [drops, setDrops] = useState<EmojiRainDrop[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!emoji) {
      setDrops([]);
      return;
    }
    if (!settings.showReactions) return;

    setDrops(generateRainDrops(emoji));
    startTimeRef.current = Date.now();

    const timer = setTimeout(() => {
      onAnimationEnd();
    }, RAIN_DURATION_MS);

    return () => clearTimeout(timer);
  }, [emoji, settings.showReactions, onAnimationEnd]);

  if (!emoji || !settings.showReactions || drops.length === 0) return null;

  const reducedMotion = settings.animationSpeed === "reduced";

  return (
    <div className="emoji-rain-overlay" style={{ pointerEvents: "none" }}>
      {drops.map((drop) => (
        <motion.div
          key={drop.id}
          className="emoji-rain-drop"
          style={{
            left: `${drop.x}%`,
            fontSize: `${drop.size}rem`,
            position: "absolute",
            top: 0,
          }}
          initial={{
            y: -60,
            x: 0,
            rotate: drop.rotation,
            opacity: 0,
          }}
          animate={
            reducedMotion
              ? { y: "100vh", opacity: [0, 1, 0] }
              : {
                  y: ["0vh", "100vh"],
                  x: [`0rem`, `${drop.sway}rem`, `-${drop.sway * 0.6}rem`, `${drop.sway * 0.3}rem`],
                  rotate: [drop.rotation, drop.rotation + 180],
                  opacity: [0, 1, 1, 0.6, 0],
                }
          }
          transition={{
            delay: reducedMotion ? 0 : drop.delay,
            duration: reducedMotion ? 1 : drop.duration,
            ease: "easeIn",
          }}
        >
          {drop.emoji}
        </motion.div>
      ))}
    </div>
  );
};
