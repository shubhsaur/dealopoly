"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "../../_components/marketing-nav";
import { MarketingFooter } from "../../_components/marketing-footer";
import { BackButton } from "../../_components/back-button";
import { StandardCard } from "../../_components/standard-card";

type LowdeckRuleCategory =
  | "objective"
  | "point_values"
  | "discard_rules"
  | "draw_rules"
  | "show_declaration"
  | "penalty_rules"
  | "deck_scaling";

interface TabConfig {
  id: LowdeckRuleCategory;
  label: string;
  shortLabel: string;
  icon: string;
}

const LOWDECK_RULE_TABS: TabConfig[] = [
  { id: "objective", label: "Objective & Win", shortLabel: "Objective", icon: "emoji_events" },
  { id: "point_values", label: "Card Point Values", shortLabel: "Point Values", icon: "numbers" },
  { id: "discard_rules", label: "Discard Combos", shortLabel: "Discards", icon: "style" },
  { id: "draw_rules", label: "Draw Options", shortLabel: "Draw", icon: "download" },
  { id: "show_declaration", label: "Declare SHOW", shortLabel: "Show", icon: "star" },
  { id: "penalty_rules", label: "Wrong Show (+40)", shortLabel: "Penalties", icon: "warning" },
  { id: "deck_scaling", label: "Deck Scaling (2–6P)", shortLabel: "Decks", icon: "groups" },
];

export default function LowdeckRulesPage() {
  const [activeTab, setActiveTab] = useState<LowdeckRuleCategory>("objective");

  return (
    <div className="marketing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Lowdeck Navigation */}
      <MarketingNav game="lowdeck" activeTab="rules" />

      <main style={{ flex: 1, paddingBottom: "80px" }}>
        <section className="rules-hero-section shell" style={{ textAlign: "center", padding: "40px 16px 28px" }}>
          <div style={{ maxWidth: "840px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
              <BackButton fallbackUrl="/lowdeck" label="Back to Lowdeck" variant="subtle" />
            </div>

            <div className="how-hero-pill">
              <span>📖 Official Lowdeck Rulebook</span>
            </div>

            <h1 className="how-hero-title">
              Official <span className="glow-word">Lowdeck Rules</span>
            </h1>

            <p className="how-hero-lede">
              Explore the complete official rulebook for Lowdeck: point values, combo discards, show rules, and penalty structures.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="rules-tabs-wrapper">
            <div className="rules-tabs-bar" role="tablist" aria-label="Lowdeck Rule Categories">
              {LOWDECK_RULE_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rules-nav-tab ${isActive ? "active" : ""}`}
                  >
                    <span className="material-symbols-outlined rules-tab-icon">{tab.icon}</span>
                    <span className="rules-tab-text-full">{tab.label}</span>
                    <span className="rules-tab-text-short">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tab Content Section */}
        <section className="shell" style={{ marginTop: "16px" }}>
          {activeTab === "objective" && (
            <div className="rules-tab-content">
              <div className="rules-card-container">
                <div className="rule-box">
                  <h3>🎯 The Big Objective</h3>
                  <p>
                    Your goal is to reduce your total hand point score to <strong>≤ 7 points</strong>, then call <strong>SHOW</strong> at the start of your turn.
                  </p>
                </div>
                <div className="rule-box">
                  <h3>🏆 Round Scoring & Match Winner</h3>
                  <p>
                    If your Show is successful, you score <strong>0 points</strong>. All opponents receive penalty points equal to the total point sum in their hands. The match ends when an opponent reaches the elimination ceiling (typically 100 points). Lowest score wins!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "point_values" && (
            <div className="rules-tab-content">
              <div className="rules-card-container">
                <div className="rule-box">
                  <h3>👑 King (K) = 0 Points</h3>
                  <p>
                    Kings are the most valuable cards in Lowdeck because they contribute <strong>0 points</strong> to your hand total.
                  </p>
                </div>
                <div className="rule-box">
                  <h3>⭐ Ace (A) = 1 Point</h3>
                  <p>Aces contribute only <strong>1 point</strong>.</p>
                </div>
                <div className="rule-box">
                  <h3>🔢 Number Cards 2–10 = Face Value</h3>
                  <p>Cards 2 through 10 carry their face value (e.g. 7 = 7 points, 10 = 10 points).</p>
                </div>
                <div className="rule-box">
                  <h3>👸 J = 11 Points, Q = 12 Points</h3>
                  <p>Jacks are 11 points and Queens are 12 points. Shed them quickly with pairs or suit runs!</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "discard_rules" && (
            <div className="rules-tab-content">
              <div className="rules-card-container">
                <div className="rule-box">
                  <h3>1️⃣ Single Card Discard</h3>
                  <p>Drop any single card from your hand into the discard pile.</p>
                </div>
                <div className="rule-box">
                  <h3>2️⃣ Matching Rank Pair</h3>
                  <p>Drop <strong>2 cards of identical rank</strong> (e.g. two Kings or two Queens) simultaneously to dump points fast!</p>
                </div>
                <div className="rule-box">
                  <h3>3️⃣ 3-Card Same-Suit Run</h3>
                  <p>Drop <strong>3 consecutive rank cards of the exact same suit</strong> (e.g. 5♠-6♠-7♠).</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "draw_rules" && (
            <div className="rules-tab-content">
              <div className="rules-card-container">
                <div className="rule-box">
                  <h3>📥 Draw 1 Card</h3>
                  <p>
                    After discarding, you must draw 1 card to replenish your hand. You may choose to draw from the <strong>closed Draw Deck</strong> or snatch the top open card from the <strong>Discard Pile</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "show_declaration" && (
            <div className="rules-tab-content">
              <div className="rules-card-container">
                <div className="rule-box">
                  <h3>⭐ When Can You Declare SHOW?</h3>
                  <p>
                    You can declare SHOW at the start of your turn if the point total of all cards in your hand is <strong>≤ 7 points</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "penalty_rules" && (
            <div className="rules-tab-content">
              <div className="rules-card-container">
                <div className="rule-box">
                  <h3>💥 Wrong Show Penalty (+40 Points)</h3>
                  <p>
                    If you call SHOW and another player holds an equal or lower hand score, you suffer a <strong>Wrong Show</strong>! The opponent scores 0 points, and you receive your <strong>hand score + 40 penalty points</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deck_scaling" && (
            <div className="rules-tab-content">
              <div className="rules-card-container">
                <div className="rule-box">
                  <h3>👥 2 Players = 1 Deck (52 Cards)</h3>
                  <p>Standard 52-card deck (Jokers excluded).</p>
                </div>
                <div className="rule-box">
                  <h3>👥 3 to 6 Players = 2 Decks (104 Cards)</h3>
                  <p>Two full 52-card decks combined to support up to 6 simultaneous players.</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CTA Banner */}
        <section className="shell" style={{ marginTop: "40px", textAlign: "center" }}>
          <div className="how-cta-card">
            <h2>Ready to Play Lowdeck?</h2>
            <p>Jump right into a game against smart AI bots or create a private room for friends.</p>
            <div className="how-cta-buttons">
              <Link href="/game?mode=bot&game=lowdeck" className="button button--primary" style={{ padding: "12px 24px", fontSize: "1rem" }}>
                <span className="material-symbols-outlined">smart_toy</span>
                Play Practice vs Bots
              </Link>
              <Link href="/lobby?game=least_count" className="button button--secondary" style={{ padding: "12px 24px", fontSize: "1rem" }}>
                <span className="material-symbols-outlined">groups</span>
                Create Multiplayer Room
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MarketingFooter game="lowdeck" />
    </div>
  );
}
