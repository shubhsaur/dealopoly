"use client";

import React, { useState } from "react";
import Link from "next/link";

interface StepItem {
  number: string;
  badge: string;
  badgeColor: string;
  icon: string;
  title: string;
  headline: string;
  description: string;
  actionChips: { label: string; icon: string; highlight?: boolean }[];
  proTip: string;
}

const STEPS: StepItem[] = [
  {
    number: "01",
    badge: "TURN START",
    badgeColor: "#38bdf8",
    icon: "style",
    title: "Draw 2 Cards",
    headline: "Replenish your hand at turn start",
    description:
      "Every turn begins with drawing 2 cards from the central deck into your private hand. If you start your turn with zero cards, draw 5 instead!",
    actionChips: [
      { label: "+2 Cards Hand Draw", icon: "add" },
      { label: "Private Hand", icon: "visibility_off" },
      { label: "Hidden Tactics", icon: "psychology" },
    ],
    proTip:
      "Keep powerful defensive cards like Just Say No concealed until an opponent strikes.",
  },
  {
    number: "02",
    badge: "MAIN PHASE",
    badgeColor: "#10b981",
    icon: "bolt",
    title: "Play Up to 3 Actions",
    headline: "Bank cash, lay properties, or strike rivals",
    description:
      "You have up to 3 action points per turn. You can stash money in your Bank vault, build property sets on your board, charge rent, or play aggressive action cards.",
    actionChips: [
      { label: "🏦 Bank Vault (Safe Cash)", icon: "savings", highlight: true },
      { label: "🏢 Lay Properties", icon: "domain", highlight: true },
      { label: "⚡ Play Action Cards", icon: "flash_on", highlight: true },
    ],
    proTip:
      "Debts can only be paid from your Bank or table properties—never from your hand! Keep your bank funded.",
  },
  {
    number: "03",
    badge: "VICTORY",
    badgeColor: "#facc15",
    icon: "emoji_events",
    title: "Complete 3 Sets to Win",
    headline: "First player with 3 full sets wins!",
    description:
      "Assemble 3 complete color sets of properties (e.g., 2 Dark Blue, 3 Green, 4 Railroads). Wildcards and Houses/Hotels help accelerate your empire to victory.",
    actionChips: [
      { label: "3 Color Sets Needed", icon: "stars" },
      { label: "Instant Round Win", icon: "trophy" },
      { label: "Max 7 Hand at Turn End", icon: "pan_tool" },
    ],
    proTip:
      "Beware of Deal Breakers! Opponents will try to steal your completed sets before you can seal the win.",
  },
];

const CARD_PILLARS = [
  {
    type: "Properties",
    icon: "domain",
    color: "#38bdf8",
    desc: "Lay onto your table. Complete matching color sets to charge higher rent.",
  },
  {
    type: "Action Cards",
    icon: "bolt",
    color: "#f43f5e",
    desc: "Steal sets (Deal Breaker), swap properties (Forced Deal), or block actions (Just Say No).",
  },
  {
    type: "Rent Cards",
    icon: "payments",
    color: "#eab308",
    desc: "Force opponents to pay rent on matching property groups. Pair with Double Rent!",
  },
  {
    type: "Bank Vault",
    icon: "savings",
    color: "#10b981",
    desc: "Safely stash money & action cards as currency. You can never pay rent from your hand.",
  },
];

export function QuickHowToPlay() {
  const [activeStep, setActiveStep] = useState<number>(0);

  return (
    <section
      id="how-to-play"
      className="quick-htp-section shell"
      aria-label="How to play Dealopoly"
    >
      <div
        className="section-header"
        style={{ textAlign: "center", marginBottom: "40px" }}
      >
        <p className="kicker" style={{ color: "#38bdf8", letterSpacing: "0.12em" }}>
          NEW PLAYER CRASH COURSE
        </p>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            fontWeight: 900,
            margin: "8px 0 14px",
          }}
        >
          How to Play in <span className="glow-word">60 Seconds</span>
        </h2>
        <p
          style={{
            color: "#94a3b8",
            maxWidth: "680px",
            margin: "0 auto",
            fontSize: "1.05rem",
            lineHeight: 1.6,
          }}
        >
          Dealopoly is fast, high-stakes property trading. Master these 3 simple phases
          and you are ready to compete in any match!
        </p>
      </div>

      {/* 3 Step Interactive Cards Grid */}
      <div className="quick-htp-grid">
        {STEPS.map((step, idx) => {
          const isSelected = activeStep === idx;
          return (
            <div
              key={step.number}
              onClick={() => setActiveStep(idx)}
              className={`quick-htp-card ${isSelected ? "quick-htp-card--active" : ""}`}
              tabIndex={0}
              role="button"
              aria-label={`Step ${step.number}: ${step.title}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setActiveStep(idx);
                }
              }}
            >
              <div className="quick-htp-card-header">
                <span className="quick-htp-step-num" style={{ color: step.badgeColor }}>
                  {step.number}
                </span>
                <span
                  className="quick-htp-badge"
                  style={{
                    color: step.badgeColor,
                    borderColor: `${step.badgeColor}40`,
                    background: `${step.badgeColor}15`,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "14px" }}
                  >
                    {step.icon}
                  </span>
                  {step.badge}
                </span>
              </div>

              <h3 className="quick-htp-card-title">{step.title}</h3>
              <p className="quick-htp-card-headline" style={{ color: step.badgeColor }}>
                {step.headline}
              </p>
              <p className="quick-htp-card-desc">{step.description}</p>

              {/* Action Chips */}
              <div className="quick-htp-chips">
                {step.actionChips.map((chip) => (
                  <span
                    key={chip.label}
                    className={`quick-htp-chip ${chip.highlight ? "quick-htp-chip--highlight" : ""}`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "14px" }}
                    >
                      {chip.icon}
                    </span>
                    {chip.label}
                  </span>
                ))}
              </div>

              {/* Pro Tip Box */}
              <div className="quick-htp-protip">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px", color: step.badgeColor }}
                >
                  lightbulb
                </span>
                <span>
                  <strong>Tip:</strong> {step.proTip}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* The 4 Card Pillars Micro-Bar */}
      <div className="quick-htp-pillars-wrap">
        <h4 className="quick-htp-pillars-title">The 4 Fundamental Card Pillars</h4>
        <div className="quick-htp-pillars-grid">
          {CARD_PILLARS.map((p) => (
            <div
              className="quick-htp-pillar"
              key={p.type}
              style={{ borderTopColor: p.color }}
            >
              <div
                className="quick-htp-pillar-icon"
                style={{ color: p.color, background: `${p.color}15` }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  {p.icon}
                </span>
              </div>
              <div className="quick-htp-pillar-info">
                <span className="quick-htp-pillar-name" style={{ color: p.color }}>
                  {p.type}
                </span>
                <p className="quick-htp-pillar-desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deep-Dive Help Callout */}
      <div className="quick-htp-footer-cta">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "28px", color: "#38bdf8" }}
          >
            menu_book
          </span>
          <div>
            <strong>Need the complete rulebook or turn timing details?</strong>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "2px 0 0" }}>
              Explore our comprehensive illustrated guide with card rankings, rent
              charts, and FAQs.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            href="/how-to-play"
            className="button button--secondary"
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
          >
            Visual How to Play
          </Link>
          <Link
            href="/rules"
            className="button button--ghost"
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
          >
            Official Rules
          </Link>
        </div>
      </div>
    </section>
  );
}
