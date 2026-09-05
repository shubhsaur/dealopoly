"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../../lib/use-settings";
import { playReactionPop, triggerHaptic } from "../../lib/sound-effects";

export interface EmojiBurst {
  id: string;
  emoji: string;
  senderName?: string;
  isSelf?: boolean;
  x?: number; // relative percent or px offset
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
];

interface QuickReactionDockProps {
  onReact: (emoji: string) => void;
  className?: string;
}

export const QuickReactionDock: React.FC<QuickReactionDockProps> = ({ onReact, className = "" }) => {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  // If user disabled reactions in settings, hide dock entirely
  if (!settings.showReactions) return null;

  const handleSelectEmoji = (emoji: string) => {
    playReactionPop();
    triggerHaptic();
    onReact(emoji);
    setIsOpen(false);
  };

  return (
    <div className={`reaction-dock-container ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="reaction-palette"
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {REACTION_EMOJIS.map(({ emoji, label }) => (
              <button
                key={emoji}
                type="button"
                className="reaction-emoji-btn"
                onClick={() => handleSelectEmoji(emoji)}
                title={label}
                aria-label={label}
              >
                <span>{emoji}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className={`reaction-toggle-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close reactions" : "Quick Reactions"}
        aria-label="Toggle reactions menu"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
          {isOpen ? "close" : "add_reaction"}
        </span>
        <span className="reaction-toggle-label">React</span>
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
