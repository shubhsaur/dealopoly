"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "../_components/marketing-nav";
import { BackButton } from "../_components/back-button";
import { Card } from "../_components/card";
import { StandardCard } from "../_components/standard-card";
import { CARD_CATALOGUE, COLOR_CONFIG, type CardColor } from "@dealopoly/shared";

type RuleCategory =
  | "general"
  | "payment"
  | "property"
  | "action"
  | "justsayno"
  | "dealbreaker"
  | "rent"
  | "house";

interface TabConfig {
  id: RuleCategory;
  label: string;
  shortLabel: string;
  icon: string;
}

const RULE_TABS: TabConfig[] = [
  { id: "general", label: "General Rules", shortLabel: "General", icon: "menu_book" },
  { id: "payment", label: "Payments & Bank", shortLabel: "Payment", icon: "payments" },
  { id: "property", label: "Properties & Wilds", shortLabel: "Properties", icon: "domain" },
  { id: "action", label: "Action Cards", shortLabel: "Actions", icon: "bolt" },
  { id: "justsayno", label: "Just Say No", shortLabel: "Just Say No", icon: "shield" },
  { id: "dealbreaker", label: "Deal Breaker", shortLabel: "Deal Breaker", icon: "gavel" },
  { id: "rent", label: "Rent & Multipliers", shortLabel: "Rent", icon: "request_quote" },
  { id: "house", label: "Houses & Hotels", shortLabel: "Houses/Hotels", icon: "apartment" },
];

export default function RulesPage() {
  const [selectedGame, setSelectedGame] = useState<"monodeal" | "least_count">("monodeal");
  const [activeTab, setActiveTab] = useState<RuleCategory>("general");

  // Lookup Sample Cards
  const cardOldKent = CARD_CATALOGUE.find((c) => c.id === "prop-mediterranean-avenue") || CARD_CATALOGUE.find((c) => c.primaryColor === "brown")!;
  const cardWhitechapel = CARD_CATALOGUE.find((c) => c.id === "prop-baltic-avenue") || CARD_CATALOGUE.find((c) => c.primaryColor === "brown")!;
  const cardMayfair = CARD_CATALOGUE.find((c) => c.id === "prop-mayfair")!;
  const cardParkLane = CARD_CATALOGUE.find((c) => c.id === "prop-park-lane")!;
  const cardRail1 = CARD_CATALOGUE.find((c) => c.id === "prop-reading-railroad")!;
  const cardUtility1 = CARD_CATALOGUE.find((c) => c.id === "prop-electric-company")!;

  const cardWildMulti = CARD_CATALOGUE.find((c) => c.id === "wild-multicolor")!;
  const cardWildDual = CARD_CATALOGUE.find((c) => c.id === "wild-dark-blue-green")!;

  const cardMoney10M = CARD_CATALOGUE.find((c) => c.id === "money-10m")!;
  const cardMoney5M = CARD_CATALOGUE.find((c) => c.id === "money-5m")!;
  const cardMoney2M = CARD_CATALOGUE.find((c) => c.id === "money-2m")!;

  const cardDealBreaker = CARD_CATALOGUE.find((c) => c.id === "action-deal-breaker")!;
  const cardJustSayNo = CARD_CATALOGUE.find((c) => c.id === "action-just-say-no")!;
  const cardSlyDeal = CARD_CATALOGUE.find((c) => c.id === "action-sly-deal")!;
  const cardForceDeal = CARD_CATALOGUE.find((c) => c.id === "action-force-deal")!;
  const cardDebtCollector = CARD_CATALOGUE.find((c) => c.id === "action-debt-collector")!;
  const cardPassGo = CARD_CATALOGUE.find((c) => c.id === "action-pass-go")!;
  const cardDoubleRent = CARD_CATALOGUE.find((c) => c.id === "action-double-the-rent")!;
  const cardHouse = CARD_CATALOGUE.find((c) => c.id === "action-house")!;
  const cardHotel = CARD_CATALOGUE.find((c) => c.id === "action-hotel")!;
  const cardRentDual = CARD_CATALOGUE.find((c) => c.id === "rent-green-dark-blue")!;
  const cardRentWild = CARD_CATALOGUE.find((c) => c.id === "rent-wild") || CARD_CATALOGUE.find((c) => c.type === "rent")!;

  return (
    <div className="marketing-page u-flex-col" style={{ minHeight: "100vh" }}>
      <MarketingNav activeTab="rules" />

      <main className="u-flex-1" style={{ paddingBottom: "80px" }}>
        {/* Hero Header */}
        <section className="rules-hero-section shell u-text-center" style={{ padding: "40px 16px 28px" }}>
          <div style={{ maxWidth: "840px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
              <BackButton fallbackUrl="/" label="Back to Home" variant="subtle" />
            </div>

            {/* Game Selector Switcher */}
            <div
              style={{
                display: "inline-flex",
                gap: "8px",
                margin: "0 auto 16px",
                background: "rgba(15, 23, 42, 0.85)",
                padding: "4px",
                borderRadius: "999px",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedGame("monodeal")}
                className={`button button--sm u-text-4sm ${selectedGame === "monodeal" ? "button--primary" : "button--ghost"}`}
                style={{ borderRadius: "999px", padding: "6px 18px" }}
              >
                🃏 Monodeal Rules
              </button>
              <button
                type="button"
                onClick={() => setSelectedGame("least_count")}
                className={`button button--sm u-text-4sm ${selectedGame === "least_count" ? "button--primary" : "button--ghost"}`}
                style={{ borderRadius: "999px", padding: "6px 18px" }}
              >
                🎯 Least Count Rules
              </button>
            </div>

            <div className="how-hero-pill">
              <span>📖 Official {selectedGame === "monodeal" ? "Dealopoly" : "Least Count"} Rulebook</span>
            </div>

            <h1 className="how-hero-title">
              {selectedGame === "monodeal" ? "Monodeal Rules" : "Least Count Rules"}
            </h1>

            <p className="how-hero-lede">
              {selectedGame === "monodeal"
                ? "Explore official rules, card interactions, payments, and strategy tips broken down into clear categories."
                : "Master point shedding, matching pairs, 3-card sequences, 0-point Kings, and the strategic Show declaration."}
            </p>
          </div>

          {/* Monodeal Category Tabs (only shown for Monodeal) */}
          {selectedGame === "monodeal" && (
            <div className="rules-tabs-wrapper">
              <div className="rules-tabs-bar" role="tablist" aria-label="Game Rules Categories">
                {RULE_TABS.map((tab) => {
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
          )}
        </section>

        {/* Tab Content Section */}
        {selectedGame === "least_count" ? (
          <section className="shell u-mt-16" style={{ maxWidth: "920px" }}>
            <div className="rules-card-container u-flex-col" style={{ gap: "28px" }}>
              {/* 1. Objective */}
              <div className="rule-box" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: "14px", padding: "24px" }}>
                <h3 className="u-fw-800" style={{ fontSize: "1.3rem", color: "#38bdf8", margin: "0 0 10px" }}>🎯 Game Objective</h3>
                <p className="u-m0" style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                  The objective of <strong>Least Count</strong> is to have the lowest total score in your hand at the end of each round.
                  When your hand points are <strong>7 or less</strong>, you can declare <strong>"SHOW"</strong> to end the round.
                  If your score is strictly the lowest, you score <strong>0 points</strong> while opponents receive penalty points equal to their hand totals.
                </p>
              </div>

              {/* 2. Card Point Values */}
              <div className="rule-box" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(234, 179, 8, 0.25)", borderRadius: "14px", padding: "24px" }}>
                <h3 className="u-fw-800" style={{ fontSize: "1.3rem", color: "#facc15", margin: "0 0 16px" }}>👑 Card Point Values & Ranks</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                  <div className="u-text-center" style={{ background: "rgba(234, 179, 8, 0.12)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ fontSize: "1.8rem" }}>👑</div>
                    <div className="u-fw-900" style={{ color: "#facc15", fontSize: "1.1rem" }}>King (K)</div>
                    <div className="u-text-4sm" style={{ color: "#94a3b8" }}>0 Points (Golden!)</div>
                  </div>
                  <div className="u-text-center" style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ fontSize: "1.8rem" }}>⭐</div>
                    <div className="u-fw-900" style={{ color: "#38bdf8", fontSize: "1.1rem" }}>Ace (A)</div>
                    <div className="u-text-4sm" style={{ color: "#94a3b8" }}>1 Point</div>
                  </div>
                  <div className="u-text-center" style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ fontSize: "1.8rem" }}>🔢</div>
                    <div className="u-fw-900" style={{ color: "#f8fafc", fontSize: "1.1rem" }}>2 through 10</div>
                    <div className="u-text-4sm" style={{ color: "#94a3b8" }}>Face Value (2–10 pts)</div>
                  </div>
                  <div className="u-text-center" style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ fontSize: "1.8rem" }}>🃏 👸</div>
                    <div className="u-fw-900" style={{ color: "#f43f5e", fontSize: "1.1rem" }}>J = 11 pts, Q = 12 pts</div>
                    <div className="u-text-4sm" style={{ color: "#94a3b8" }}>High penalty cards</div>
                  </div>
                </div>
                <p className="u-text-4sm u-m0" style={{ color: "#94a3b8" }}>
                  * Jokers are excluded entirely. 2 players use 1 deck (52 cards); 3 to 6 players use 2 decks combined (104 cards).
                </p>
              </div>

              {/* 3. Discard Rules */}
              <div className="rule-box" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "14px", padding: "24px" }}>
                <h3 className="u-fw-800" style={{ fontSize: "1.3rem", color: "#34d399", margin: "0 0 16px" }}>📥 Legal Discard Combinations</h3>
                <div className="u-flex-col-14" style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: "#f8fafc" }}>1. Single Card:</strong> Drop any 1 card from your hand.
                  </div>
                  <div>
                    <strong style={{ color: "#f8fafc" }}>2. Matching Pair (2 Cards):</strong> Drop exactly 2 cards of the <strong>exact same rank</strong> (e.g. two Kings, two Queens, or two 7s).
                  </div>
                  <div>
                    <strong style={{ color: "#f8fafc" }}>3. 3-Card Suit Sequence:</strong> Drop exactly 3 consecutive cards in the <strong>same suit</strong> (e.g. 5♥-6♥-7♥ or 10♠-J♠-Q♠).
                  </div>
                </div>
              </div>

              {/* 4. Declare Show & Wrong Show Penalties */}
              <div className="rule-box" style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(244, 63, 94, 0.25)", borderRadius: "14px", padding: "24px" }}>
                <h3 className="u-fw-800" style={{ fontSize: "1.3rem", color: "#fb7185", margin: "0 0 16px" }}>💥 Declaring SHOW & Penalties</h3>
                <div className="u-flex-col u-gap-12" style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                  <p className="u-m0">
                    When your hand total is <strong>7 points or fewer</strong>, you can declare <strong>SHOW</strong> at the beginning of your turn before discarding.
                  </p>
                  <div className="u-p-12" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "8px" }}>
                    <strong style={{ color: "#4ade80" }}>🎉 Successful Show:</strong> If your hand score is strictly lower than every opponent, you score <strong>0 points</strong> and all opponents add their hand scores to their match total.
                  </div>
                  <div className="u-p-12" style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px" }}>
                    <strong style={{ color: "#f87171" }}>💥 Wrong Show (Countered):</strong> If ANY opponent has a score less than or equal to yours, the lowest opponent scores 0 points and you are penalized with <strong>your hand score + 40 penalty points</strong>!
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                    A player is eliminated when their cumulative match score exceeds 100 points. The last remaining player wins the match!
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="shell u-mt-16">
          {/* ======================================================== */}
          {/* 1. GENERAL RULES TAB                                     */}
          {/* ======================================================== */}
          {activeTab === "general" && (
            <div className="rules-content-panel glass-panel">
              <div className="rules-panel-header">
                <div className="rules-badge">01. GENERAL</div>
                <h2>Game Objective & Turn Sequence</h2>
                <p>The core gameplay loop and winning conditions for Dealopoly.</p>
              </div>

              {/* Objective Banner */}
              <div className="rules-highlight-box rules-highlight-box--gold">
                <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#facc15" }}>
                  emoji_events
                </span>
                <div>
                  <strong>The Ultimate Objective:</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--text)", fontSize: "0.95rem" }}>
                    Be the first player to collect <strong>3 complete property sets</strong> of different colors on the
                    table in front of you. Once you complete your 3rd set, you win the game immediately!
                  </p>
                </div>
              </div>

              {/* Turn Sequence Steps */}
              <div className="rules-grid-2col u-mt-24">
                <div className="rules-info-card">
                  <div className="rules-card-icon-circle" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                    1
                  </div>
                  <h3>Start of Game Setup</h3>
                  <ul className="rules-bullets">
                    <li>The deck of 110 cards is shuffled and placed face-down in the center as the <strong>Draw Pile</strong>.</li>
                    <li>Each player is dealt <strong>5 cards</strong> face-down into their private hand.</li>
                    <li>Play proceeds clockwise around the table.</li>
                  </ul>
                </div>

                <div className="rules-info-card">
                  <div className="rules-card-icon-circle" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                    2
                  </div>
                  <h3>Step 1: Draw Cards</h3>
                  <ul className="rules-bullets">
                    <li>At the start of your turn, draw <strong>2 cards</strong> from the draw pile.</li>
                    <li><strong>Empty Hand Bonus:</strong> If you start your turn with 0 cards in your hand, you draw <strong>5 cards</strong> instead!</li>
                    <li>If the draw pile ever runs out, shuffle the discard pile to create a fresh draw pile.</li>
                  </ul>
                </div>

                <div className="rules-info-card">
                  <div className="rules-card-icon-circle" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                    3
                  </div>
                  <h3>Step 2: Play Up to 3 Cards</h3>
                  <ul className="rules-bullets">
                    <li>You can make up to <strong>3 plays</strong> per turn (or choose to play 0, 1, or 2 cards).</li>
                    <li><strong>Where cards go:</strong>
                      <br />• Into your <strong>Bank</strong> (Cash or Action cards as money).
                      <br />• Onto your <strong>Property Table</strong> (Properties & Wild cards).
                      <br />• Into the <strong>Center Discard Pile</strong> (Action cards for their effect).
                    </li>
                  </ul>
                </div>

                <div className="rules-info-card">
                  <div className="rules-card-icon-circle" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                    4
                  </div>
                  <h3>Step 3: End of Turn Hand Limit</h3>
                  <ul className="rules-bullets">
                    <li>At the end of your turn, you cannot hold more than <strong>7 cards</strong> in your hand.</li>
                    <li>If you have 8 or more, you must discard the excess cards into the middle discard pile.</li>
                    <li>Your turn is complete, and play passes to the next player clockwise.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. PAYMENT & BANKING TAB                                 */}
          {/* ======================================================== */}
          {activeTab === "payment" && (
            <div className="rules-content-panel glass-panel">
              <div className="rules-panel-header">
                <div className="rules-badge">02. PAYMENTS</div>
                <h2>Payments, Banking & Debt Resolution</h2>
                <p>How money, rent payments, and bankruptcies work in Dealopoly.</p>
              </div>

              <div className="rules-graphic-card">
                <div className="rules-graphic-preview">
                  {cardMoney10M && <Card card={cardMoney10M} size="xs" isInteractive={false} />}
                  {cardMoney5M && <Card card={cardMoney5M} size="xs" isInteractive={false} />}
                  {cardDebtCollector && <Card card={cardDebtCollector} size="xs" isInteractive={false} />}
                </div>
                <div className="rules-graphic-text">
                  <h3>The 3 Golden Rules of Payment</h3>
                  <ol className="rules-numbered-list">
                    <li>
                      <strong>Cards on the table ONLY:</strong> You can NEVER pay any debt or rent using cards in your hand. You may only pay using cards already on your table (Bank or Properties).
                    </li>
                    <li>
                      <strong>NO Change Given:</strong> If you owe $2M and your only bill on the table is a $5M card, you must give the full $5M card. You receive no change back!
                    </li>
                    <li>
                      <strong>Bankrupt Protection:</strong> If you have $0 in your bank and 0 properties on your table, you pay nothing! You are never forced to pay from your private hand.
                    </li>
                  </ol>
                </div>
              </div>

              <div className="rules-grid-2col u-mt-24">
                <div className="rules-info-card">
                  <div className="rules-subheading">
                    <span className="material-symbols-outlined" style={{ color: "#10b981" }}>account_balance</span>
                    <strong>How Banking Works</strong>
                  </div>
                  <p style={{ fontSize: "0.92rem", color: "var(--muted)", lineHeight: 1.5 }}>
                    When you place Money cards or Action cards in your Bank, they stay face-up.
                    <br /><br />
                    <strong>Important:</strong> Once an Action card is placed in your Bank, it counts strictly as cash for its corner dollar value (e.g. Pass Go = $1M, Deal Breaker = $5M). You cannot use its action power from your Bank!
                  </p>
                </div>

                <div className="rules-info-card">
                  <div className="rules-subheading">
                    <span className="material-symbols-outlined" style={{ color: "#f59e0b" }}>sync_alt</span>
                    <strong>Where Payments Go</strong>
                  </div>
                  <p style={{ fontSize: "0.92rem", color: "var(--muted)", lineHeight: 1.5 }}>
                    When a player pays you:
                    <br />• <strong>Money & Banked Action cards</strong> go directly into your Bank.
                    <br />• <strong>Property cards</strong> go directly into your Property sets area.
                    <br />• <strong>Wild cards</strong> can be placed into any matching color set you choose!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. PROPERTIES & WILDS TAB                                */}
          {/* ======================================================== */}
          {activeTab === "property" && (
            <div className="rules-content-panel glass-panel">
              <div className="rules-panel-header">
                <div className="rules-badge">03. PROPERTIES</div>
                <h2>Properties, Wild Cards & Set Sizes</h2>
                <p>Rules for building full sets, using dual-color wilds, and moving wild cards.</p>
              </div>

              {/* Set Size Table */}
              <div className="rules-set-table-wrap">
                <h3 className="u-text-lg" style={{ marginBottom: "12px" }}>Set Sizes & Full Completeness</h3>
                <div className="rules-table-grid">
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #8B4513" }}>
                    <strong>🟤 Brown</strong>
                    <span>2 Cards</span>
                  </div>
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #0055A4" }}>
                    <strong>🔵 Dark Blue</strong>
                    <span>2 Cards</span>
                  </div>
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #A8A8A8" }}>
                    <strong>💡 Utility</strong>
                    <span>2 Cards</span>
                  </div>
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #87CEEB" }}>
                    <strong>🩵 Light Blue</strong>
                    <span>3 Cards</span>
                  </div>
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #D83A8F" }}>
                    <strong>🩷 Pink</strong>
                    <span>3 Cards</span>
                  </div>
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #F28C28" }}>
                    <strong>🟠 Orange</strong>
                    <span>3 Cards</span>
                  </div>
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #ED1B24" }}>
                    <strong>🔴 Red</strong>
                    <span>3 Cards</span>
                  </div>
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #FFDE00" }}>
                    <strong>🟡 Yellow</strong>
                    <span>3 Cards</span>
                  </div>
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #27A644" }}>
                    <strong>🟢 Green</strong>
                    <span>3 Cards</span>
                  </div>
                  <div className="rules-table-item" style={{ borderLeft: "4px solid #333333" }}>
                    <strong>🚂 Railroad</strong>
                    <span>4 Cards</span>
                  </div>
                </div>
              </div>

              {/* Wild Cards Breakdown */}
              <div className="rules-graphic-card u-mt-24">
                <div className="rules-graphic-preview">
                  {cardWildMulti && <Card card={cardWildMulti} size="xs" isInteractive={false} />}
                  {cardWildDual && <Card card={cardWildDual} size="xs" isInteractive={false} />}
                </div>
                <div className="rules-graphic-text">
                  <h3>Wild Property Card Mechanics</h3>
                  <ul className="rules-bullets">
                    <li>
                      <strong>Dual-Color Wilds:</strong> Can count as either of the two printed colors.
                    </li>
                    <li>
                      <strong>Multi-Color Wilds (10-Color):</strong> Can represent any of the 10 property colors! (Note: Multi-color wilds have $0 value and cannot be banked as cash).
                    </li>
                    <li>
                      <strong>Rearranging on Your Turn:</strong> You can flip, swap, and move your Wild cards between valid color sets on your turn for <strong>FREE</strong> (it does not count toward your 3 card plays!).
                    </li>
                    <li>
                      <strong>Extra Properties:</strong> You can start a second set of the same color once your first set is complete, but you cannot stack extra properties onto a completed set to hide them.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. ACTION CARDS TAB                                      */}
          {/* ======================================================== */}
          {activeTab === "action" && (
            <div className="rules-content-panel glass-panel">
              <div className="rules-panel-header">
                <div className="rules-badge">04. ACTION CARDS</div>
                <h2>Action Cards & Special Abilities</h2>
                <p>Everything you need to know about playing action cards to disrupt opponents.</p>
              </div>

              <div className="rules-info-banner">
                <span className="material-symbols-outlined" style={{ color: "#f59e0b", fontSize: "28px" }}>
                  lightbulb
                </span>
                <div>
                  <strong>Two Ways to Play Every Action Card:</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.92rem" }}>
                    You can either play an action card into the center pile to trigger its superpower, OR place it into your Bank as money for the dollar value shown in the top-right corner.
                  </p>
                </div>
              </div>

              <div className="how-action-cards-grid" style={{ marginTop: "20px" }}>
                <div className="how-power-card">
                  <div className="how-power-card-preview">
                    {cardPassGo && <Card card={cardPassGo} size="xs" isInteractive={false} />}
                  </div>
                  <div className="how-power-card-info">
                    <div className="how-power-card-title">
                      <strong>Pass Go</strong>
                      <span className="rules-val-tag">+$1M Bank</span>
                    </div>
                    <p>Draw <strong>2 extra cards</strong> from the deck immediately. You can play multiple Pass Go cards on the same turn if you have the actions!</p>
                  </div>
                </div>

                <div className="how-power-card">
                  <div className="how-power-card-preview">
                    {cardDebtCollector && <Card card={cardDebtCollector} size="xs" isInteractive={false} />}
                  </div>
                  <div className="how-power-card-info">
                    <div className="how-power-card-title">
                      <strong>Debt Collector</strong>
                      <span className="rules-val-tag">+$3M Bank</span>
                    </div>
                    <p>Force <strong>one specific player</strong> to pay you <strong>$5M</strong> from their table (Bank or Properties).</p>
                  </div>
                </div>

                <div className="how-power-card">
                  <div className="how-power-card-preview">
                    {cardSlyDeal && <Card card={cardSlyDeal} size="xs" isInteractive={false} />}
                  </div>
                  <div className="how-power-card-info">
                    <div className="how-power-card-title">
                      <strong>Sly Deal</strong>
                      <span className="rules-val-tag">+$3M Bank</span>
                    </div>
                    <p>Steal <strong>1 single property card</strong> from any opponent's table. <em>(Cannot be stolen from a completed full set).</em></p>
                  </div>
                </div>

                <div className="how-power-card">
                  <div className="how-power-card-preview">
                    {cardForceDeal && <Card card={cardForceDeal} size="xs" isInteractive={false} />}
                  </div>
                  <div className="how-power-card-info">
                    <div className="how-power-card-title">
                      <strong>Forced Deal</strong>
                      <span className="rules-val-tag">+$3M Bank</span>
                    </div>
                    <p>Swap <strong>1 of your properties</strong> for <strong>1 of an opponent's properties</strong>. <em>(Neither property can be part of a full set).</em></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. JUST SAY NO TAB                                       */}
          {/* ======================================================== */}
          {activeTab === "justsayno" && (
            <div className="rules-content-panel glass-panel">
              <div className="rules-panel-header">
                <div className="rules-badge">05. JUST SAY NO</div>
                <h2>The Ultimate Defense Card: Just Say No</h2>
                <p>Master the timing, rules, and counter-chains of Just Say No.</p>
              </div>

              <div className="rules-graphic-card">
                <div className="rules-graphic-preview">
                  {cardJustSayNo && <Card card={cardJustSayNo} size="xs" isInteractive={false} />}
                </div>
                <div className="rules-graphic-text">
                  <h3>How Just Say No Works</h3>
                  <ul className="rules-bullets">
                    <li>
                      <strong>Play at ANY Time:</strong> You can play a <em>Just Say No</em> card from your hand at any moment — even when it is NOT your turn — and it does <strong>NOT</strong> count as one of your 3 plays!
                    </li>
                    <li>
                      <strong>What it Stops:</strong> Cancels any action card played against you (Deal Breaker, Sly Deal, Forced Deal, Debt Collector, Rent, It's My Birthday).
                    </li>
                    <li>
                      <strong>The Counter Chain:</strong> If you play <em>Just Say No</em>, the attacking player can play their OWN <em>Just Say No</em> from their hand to cancel yours! You can then play another <em>Just Say No</em> to block them right back!
                    </li>
                    <li>
                      <strong>Action Discard:</strong> When blocked by <em>Just Say No</em>, the attacker's action card is considered played and is discarded into the middle pile.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. DEAL BREAKER TAB                                      */}
          {/* ======================================================== */}
          {activeTab === "dealbreaker" && (
            <div className="rules-content-panel glass-panel">
              <div className="rules-panel-header">
                <div className="rules-badge">06. DEAL BREAKER</div>
                <h2>Deal Breaker: The Game Ender</h2>
                <p>The rules and nuances of the most powerful card in the game.</p>
              </div>

              <div className="rules-graphic-card">
                <div className="rules-graphic-preview">
                  {cardDealBreaker && <Card card={cardDealBreaker} size="xs" isInteractive={false} />}
                </div>
                <div className="rules-graphic-text">
                  <h3>Deal Breaker Official Rules</h3>
                  <ul className="rules-bullets">
                    <li>
                      <strong>Steal a Complete Set:</strong> Deal Breaker allows you to steal an entire <strong>completed property set</strong> from any opponent and place it directly onto your table.
                    </li>
                    <li>
                      <strong>Includes Houses & Hotels:</strong> If the completed set has a House or Hotel attached, you get the entire set with the buildings attached!
                    </li>
                    <li>
                      <strong>Strict Condition:</strong> Deal Breaker <strong>ONLY</strong> works on fully completed sets. You cannot use it to steal partial or incomplete sets (use <em>Sly Deal</em> for that).
                    </li>
                    <li>
                      <strong>Countering:</strong> Deal Breaker can only be stopped if the targeted opponent plays a <em>Just Say No</em> card.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 7. RENT & MULTIPLIERS TAB                                */}
          {/* ======================================================== */}
          {activeTab === "rent" && (
            <div className="rules-content-panel glass-panel">
              <div className="rules-panel-header">
                <div className="rules-badge">07. RENT</div>
                <h2>Rent Cards & Double The Rent</h2>
                <p>How rent calculation, dual-color cards, and multipliers work.</p>
              </div>

              <div className="rules-graphic-card">
                <div className="rules-graphic-preview">
                  {cardRentDual && <Card card={cardRentDual} size="xs" isInteractive={false} />}
                  {cardDoubleRent && <Card card={cardDoubleRent} size="xs" isInteractive={false} />}
                </div>
                <div className="rules-graphic-text">
                  <h3>Rent Card Rules</h3>
                  <ul className="rules-bullets">
                    <li>
                      <strong>Must Own Property:</strong> You must own at least 1 property card matching the color of the Rent card to play it.
                    </li>
                    <li>
                      <strong>Dual-Color Rent Cards:</strong> Targets <strong>ALL players</strong> at the table. Everyone must pay you the current rent value of that color set.
                    </li>
                    <li>
                      <strong>Wild Rent Cards:</strong> Targets <strong>1 specific player</strong>, but can be used for ANY property color you own!
                    </li>
                    <li>
                      <strong>Double The Rent:</strong> Play on your turn alongside a Rent card to multiply the rent by 2x! (Counts as 2 separate card plays). You can even play two Double Rent cards with one Rent card to quadruple (4x) the rent!
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 8. HOUSES & HOTELS TAB                                   */}
          {/* ======================================================== */}
          {activeTab === "house" && (
            <div className="rules-content-panel glass-panel">
              <div className="rules-panel-header">
                <div className="rules-badge">08. HOUSES & HOTELS</div>
                <h2>Houses & Hotels: Building Upgrades</h2>
                <p>Rules for supercharging your property rent with buildings.</p>
              </div>

              <div className="rules-graphic-card">
                <div className="rules-graphic-preview">
                  {cardHouse && <Card card={cardHouse} size="xs" isInteractive={false} />}
                  {cardHotel && <Card card={cardHotel} size="xs" isInteractive={false} />}
                </div>
                <div className="rules-graphic-text">
                  <h3>Building Rules</h3>
                  <ul className="rules-bullets">
                    <li>
                      <strong>Completed Sets Only:</strong> You can ONLY place a House on a <strong>complete, full color set</strong>.
                    </li>
                    <li>
                      <strong>House Rent Boost:</strong> Adds <strong>+$3M</strong> to the full rent value of that set.
                    </li>
                    <li>
                      <strong>Hotel Rent Boost:</strong> Can ONLY be placed on a completed set that <strong>already has a House</strong>. Adds an additional <strong>+$4M</strong> rent (Total +$7M boost!).
                    </li>
                    <li>
                      <strong>Exceptions:</strong> Houses and Hotels can <strong>NEVER</strong> be placed on Railroads or Utilities sets.
                    </li>
                    <li>
                      <strong>Limit:</strong> Only 1 House and 1 Hotel per completed property set.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
        )}

        {/* Bottom CTA Banner */}
        <section className="shell u-mt-40 u-text-center">
          <div className="how-cta-card">
            <h2>Ready to Play Dealopoly?</h2>
            <p>Jump right into a game against smart AI bots or create a private room for friends.</p>
            <div className="how-cta-buttons">
              <Link href="/game?mode=bot" className="button button--primary u-text-md" style={{ padding: "12px 24px" }}>
                <span className="material-symbols-outlined">smart_toy</span>
                Play Practice vs Bots
              </Link>
              <Link href="/lobby" className="button button--secondary u-text-md" style={{ padding: "12px 24px" }}>
                <span className="material-symbols-outlined">groups</span>
                Create Multiplayer Room
              </Link>
              <Link href="/cards" className="button button--ghost u-text-md" style={{ padding: "12px 24px" }}>
                <span className="material-symbols-outlined">style</span>
                Card Catalogue
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
