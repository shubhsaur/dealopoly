"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "../_components/marketing-nav";
import { BackButton } from "../_components/back-button";
import { Card } from "../_components/card";
import { StandardCard } from "../_components/standard-card";
import { CARD_CATALOGUE, type CardDefinition } from "@dealopoly/shared";

export default function HowToPlayPage() {
  const [selectedGame, setSelectedGame] = useState<"monodeal" | "least_count">("monodeal");

  // 1. Property Set Showcase State
  const [activeSetTab, setActiveSetTab] = useState<"brown" | "dark-blue" | "railroad" | "green">("brown");

  // 2. Play Zones Showcase State
  const [activeZoneTab, setActiveZoneTab] = useState<"bank" | "properties" | "action">("bank");

  // 3. FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Card Lookups
  const cardMediterranean = CARD_CATALOGUE.find((c) => c.id === "prop-mediterranean-avenue")!;
  const cardBaltic = CARD_CATALOGUE.find((c) => c.id === "prop-baltic-avenue")!;

  const cardMayfair = CARD_CATALOGUE.find((c) => c.id === "prop-mayfair")!;
  const cardParkLane = CARD_CATALOGUE.find((c) => c.id === "prop-park-lane")!;

  const cardRail1 = CARD_CATALOGUE.find((c) => c.id === "prop-reading-railroad")!;
  const cardRail2 = CARD_CATALOGUE.find((c) => c.id === "prop-pennsylvania-railroad")!;
  const cardRail3 = CARD_CATALOGUE.find((c) => c.id === "prop-b-and-o-railroad")!;
  const cardRail4 = CARD_CATALOGUE.find((c) => c.id === "prop-short-line")!;

  const cardGreen1 = CARD_CATALOGUE.find((c) => c.id === "prop-regent-street")!;
  const cardGreen2 = CARD_CATALOGUE.find((c) => c.id === "prop-oxford-street")!;
  const cardGreen3 = CARD_CATALOGUE.find((c) => c.id === "prop-bond-street")!;

  // Action & Money Card Lookups
  const cardMoney5M = CARD_CATALOGUE.find((c) => c.id === "money-5m")!;
  const cardMoney2M = CARD_CATALOGUE.find((c) => c.id === "money-2m")!;
  const cardDealBreaker = CARD_CATALOGUE.find((c) => c.id === "action-deal-breaker")!;
  const cardJustSayNo = CARD_CATALOGUE.find((c) => c.id === "action-just-say-no")!;
  const cardPassGo = CARD_CATALOGUE.find((c) => c.id === "action-pass-go")!;
  const cardSlyDeal = CARD_CATALOGUE.find((c) => c.id === "action-sly-deal")!;
  const cardDebtCollector = CARD_CATALOGUE.find((c) => c.id === "action-debt-collector")!;
  const cardRentWild = CARD_CATALOGUE.find((c) => c.id === "rent-wild") || CARD_CATALOGUE.find((c) => c.type === "rent")!;

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="marketing-page u-page">
      <MarketingNav activeTab="how-to-play" />

      <main className="u-page-grow">
        {/* ============================================================ */}
        {/* HERO SECTION                                                 */}
        {/* ============================================================ */}
        <section className="how-hero-section shell u-text-center" style={{ padding: "48px 16px 36px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="u-flex-center" style={{ marginBottom: "16px" }}>
              <BackButton fallbackUrl="/" label="Back to Home" variant="subtle" />
            </div>

            {/* Game Switcher */}
            <div
              className="u-inline-flex u-gap-8"
              style={{
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
                className={`button button--sm ${selectedGame === "monodeal" ? "button--primary" : "button--ghost"} u-text-4sm`}
                style={{ borderRadius: "999px", padding: "6px 18px" }}
              >
                🃏 Monodeal Guide
              </button>
              <button
                type="button"
                onClick={() => setSelectedGame("least_count")}
                className={`button button--sm ${selectedGame === "least_count" ? "button--primary" : "button--ghost"} u-text-4sm`}
                style={{ borderRadius: "999px", padding: "6px 18px" }}
              >
                🎯 Least Count Guide
              </button>
            </div>

            <div className="how-hero-pill">
              <span>🎮 Quick & Fun Beginner's Guide</span>
            </div>

            <h1 className="how-hero-title">
              How to Play <span className="glow-word">{selectedGame === "monodeal" ? "Monodeal" : "Least Count"}</span>
            </h1>

            <p className="how-hero-lede">
              {selectedGame === "monodeal"
                ? "Learn the fast-paced card game where properties change hands, debt collectors knock, and sneaky moves win the day!"
                : "Master point shedding, matching pairs, suit runs, 0-point Kings, and calling SHOW to outsmart your rivals!"}
            </p>

            <div className="how-stats-ribbon">
              <div className="how-stat-chip">
                <span className="material-symbols-outlined">timer</span>
                <span><strong>{selectedGame === "monodeal" ? "15 Mins" : "5–10 Mins"}</strong> per game</span>
              </div>
              <div className="how-stat-chip">
                <span className="material-symbols-outlined">groups</span>
                <span><strong>{selectedGame === "monodeal" ? "2 to 5" : "2 to 6"}</strong> Players</span>
              </div>
              <div className="how-stat-chip">
                <span className="material-symbols-outlined">emoji_events</span>
                <span><strong>{selectedGame === "monodeal" ? "3 Sets to Win" : "Lowest Score Wins"}</strong></span>
              </div>
            </div>
          </div>
        </section>

        {selectedGame === "least_count" ? (
          /* ============================================================ */
          /* LEAST COUNT GUIDE                                            */
          /* ============================================================ */
          <section className="shell u-mt-24" style={{ maxWidth: "860px" }}>
            <div className="u-flex-col" style={{ gap: "28px" }}>
              {/* Step 1: Objective */}
              <div className="how-step-card glass-panel u-p-28">
                <div className="how-step-header">
                  <div className="how-step-badge">STEP 1</div>
                  <div>
                    <h2>The Big Goal: Lowest Hand Score!</h2>
                    <p>Each card in your hand has a point value. Your mission is to discard cards to get your total to <strong>≤ 7 points</strong>, then call <strong>SHOW</strong>.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "18px" }}>
                  <div className="u-p-12 u-text-center" style={{ background: "rgba(234, 179, 8, 0.12)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "10px" }}>
                    <div className="u-text-xl">👑</div>
                    <div className="u-fw-900" style={{ color: "#facc15" }}>King (K)</div>
                    <div className="u-text-3sm" style={{ color: "#94a3b8" }}>0 Points (The Winner!)</div>
                  </div>
                  <div className="u-p-12 u-text-center" style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "10px" }}>
                    <div className="u-text-xl">⭐</div>
                    <div className="u-fw-900" style={{ color: "#38bdf8" }}>Ace (A)</div>
                    <div className="u-text-3sm" style={{ color: "#94a3b8" }}>1 Point</div>
                  </div>
                  <div className="u-p-12 u-text-center" style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "10px" }}>
                    <div className="u-text-xl">🔢</div>
                    <div className="u-fw-900" style={{ color: "#f8fafc" }}>2 to 10</div>
                    <div className="u-text-3sm" style={{ color: "#94a3b8" }}>Face Value (2–10 pts)</div>
                  </div>
                  <div className="u-p-12 u-text-center" style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "10px" }}>
                    <div className="u-text-xl">👸 🃏</div>
                    <div className="u-fw-900" style={{ color: "#f43f5e" }}>J & Q</div>
                    <div className="u-text-3sm" style={{ color: "#94a3b8" }}>J=11 pts, Q=12 pts</div>
                  </div>
                </div>
              </div>

              {/* Step 2: Discard & Draw */}
              <div className="how-step-card glass-panel u-p-28">
                <div className="how-step-header">
                  <div className="how-step-badge">STEP 2</div>
                  <div>
                    <h2>Turn Cycle: Discard, then Draw</h2>
                    <p>On your turn, drop cards to shed points, then draw 1 replacement card.</p>
                  </div>
                </div>

                <div className="u-flex-col u-gap-12 u-mt-16" style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: "#f8fafc" }}>1. Discard Options:</strong>
                    <ul style={{ margin: "6px 0 0 20px" }}>
                      <li><strong>Single Card:</strong> Drop any 1 high-value card.</li>
                      <li><strong>Matching Pair:</strong> Drop 2 cards of the same rank (e.g. two Kings or two 9s) to dump points fast!</li>
                      <li><strong>3-Card Suit Run:</strong> Drop 3 consecutive cards in the same suit (e.g. 5♥-6♥-7♥).</li>
                    </ul>
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <strong style={{ color: "#f8fafc" }}>2. Draw Option:</strong>
                    <p style={{ margin: "4px 0 0" }}>Draw 1 card from the closed deck OR take the top open card from the discard pile if it helps you.</p>
                  </div>
                </div>
              </div>

              {/* Step 3: Declare Show */}
              <div className="how-step-card glass-panel u-p-28">
                <div className="how-step-header">
                  <div className="how-step-badge">STEP 3</div>
                  <div>
                    <h2>Declare SHOW & Win the Round!</h2>
                    <p>When your hand score is <strong>≤ 7 points</strong>, hit the glowing <strong>⭐ DECLARE SHOW</strong> button at the start of your turn.</p>
                  </div>
                </div>

                <div className="u-flex-col u-gap-12 u-mt-16">
                  <div style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px", padding: "14px" }}>
                    <strong style={{ color: "#4ade80" }}>🎉 Successful Show:</strong> You score <strong>0 points</strong> for the round. All other players add their hand scores to their match penalties!
                  </div>
                  <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "10px", padding: "14px" }}>
                    <strong style={{ color: "#f87171" }}>💥 Wrong Show:</strong> If an opponent has equal or fewer points than you, they score 0 and you receive <strong>handScore + 40 penalty points</strong>!
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* MONODEAL GUIDE */
          <>
          {/* STEP 1 */}
          <section className="how-step-section shell u-mt-24">
            <div className="how-step-card glass-panel">
              <div className="how-step-header">
                <div className="how-step-badge">STEP 1</div>
              <div>
                <h2>The Big Goal: Complete 3 Property Sets!</h2>
                <p>The first player to complete <strong>3 full property sets</strong> in front of them wins instantly.</p>
              </div>
            </div>

            <div className="how-info-banner">
              <span className="material-symbols-outlined" style={{ color: "#38bdf8", fontSize: "28px" }}>
                info
              </span>
              <div>
                <strong>How do you know when a set is complete?</strong>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.92rem" }}>
                  Look at the bottom right of any Property card. The circle tells you the <strong>Set Size</strong> (the exact number of cards needed to complete that color set).
                </p>
              </div>
            </div>

            {/* Interactive Property Set Tabs */}
            <div className="how-sets-container">
              <div className="how-tab-bar">
                <button
                  type="button"
                  onClick={() => setActiveSetTab("brown")}
                  className={`how-tab-btn ${activeSetTab === "brown" ? "active" : ""}`}
                >
                  🟤 Brown Set (2 Cards)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSetTab("dark-blue")}
                  className={`how-tab-btn ${activeSetTab === "dark-blue" ? "active" : ""}`}
                >
                  🔵 Dark Blue Set (2 Cards)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSetTab("railroad")}
                  className={`how-tab-btn ${activeSetTab === "railroad" ? "active" : ""}`}
                >
                  🚂 Railroad Set (4 Cards)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSetTab("green")}
                  className={`how-tab-btn ${activeSetTab === "green" ? "active" : ""}`}
                >
                  🟢 Green Set (3 Cards)
                </button>
              </div>

              {/* Set Display Cards */}
              <div className="how-set-display">
                {activeSetTab === "brown" && (
                  <div className="how-set-view">
                    <div className="how-cards-row">
                      {cardMediterranean && <Card card={cardMediterranean} size="sm" isInteractive={false} />}
                      {cardBaltic && <Card card={cardBaltic} size="sm" isInteractive={false} />}
                    </div>
                    <div className="how-set-caption">
                      <span className="how-check-icon">✓</span>
                      <div>
                        <strong>Complete Brown Set (2 of 2 Cards)</strong>
                        <p>Mediterranean Ave & Baltic Ave! Brown only needs 2 cards to be full — the fastest set to complete in the game.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSetTab === "dark-blue" && (
                  <div className="how-set-view">
                    <div className="how-cards-row">
                      {cardMayfair && <Card card={cardMayfair} size="sm" isInteractive={false} />}
                      {cardParkLane && <Card card={cardParkLane} size="sm" isInteractive={false} />}
                    </div>
                    <div className="how-set-caption">
                      <span className="how-check-icon">✓</span>
                      <div>
                        <strong>Complete Dark Blue Set (2 of 2 Cards)</strong>
                        <p>Mayfair + Park Lane! Only 2 cards, and charges a massive $8M rent to your opponents!</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSetTab === "railroad" && (
                  <div className="how-set-view">
                    <div className="how-cards-row">
                      {cardRail1 && <Card card={cardRail1} size="sm" isInteractive={false} />}
                      {cardRail2 && <Card card={cardRail2} size="sm" isInteractive={false} />}
                      {cardRail3 && <Card card={cardRail3} size="sm" isInteractive={false} />}
                      {cardRail4 && <Card card={cardRail4} size="sm" isInteractive={false} />}
                    </div>
                    <div className="how-set-caption">
                      <span className="how-check-icon">✓</span>
                      <div>
                        <strong>Complete Railroad Set (4 of 4 Cards)</strong>
                        <p>Railroads need all 4 station cards (Reading, Pennsylvania, B&O, and Short Line) to complete.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSetTab === "green" && (
                  <div className="how-set-view">
                    <div className="how-cards-row">
                      {cardGreen1 && <Card card={cardGreen1} size="sm" isInteractive={false} />}
                      {cardGreen2 && <Card card={cardGreen2} size="sm" isInteractive={false} />}
                      {cardGreen3 && <Card card={cardGreen3} size="sm" isInteractive={false} />}
                    </div>
                    <div className="how-set-caption">
                      <span className="how-check-icon">✓</span>
                      <div>
                        <strong>Complete Green Set (3 of 3 Cards)</strong>
                        <p>Most colored sets (Green, Red, Yellow, Orange, Pink, Light Blue) require 3 cards to complete.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="how-win-banner">
              <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#facc15" }}>
                workspace_premium
              </span>
              <div>
                <strong>Winning Formula:</strong> Have any 3 complete colored sets on your table at the same time and you win the game on the spot!
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STEP 2: THE 3 PLACES YOU CAN PLAY CARDS                     */}
        {/* ============================================================ */}
        <section className="how-step-section shell u-mt-36">
          <div className="how-step-card glass-panel">
            <div className="how-step-header">
              <div className="how-step-badge">STEP 2</div>
              <div>
                <h2>Where Can You Play Cards? (The 3 Drop Zones)</h2>
                <p>On your turn, you can place your cards into one of these 3 locations on the table:</p>
              </div>
            </div>

            <div className="how-zones-grid">
              {/* Zone 1: The Bank */}
              <div className="how-zone-card">
                <div className="how-zone-icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>account_balance</span>
                </div>
                <h3>1. Your Bank</h3>
                <p className="how-zone-tag">Cash & Shield</p>
                <p className="how-zone-desc">
                  Place <strong>Money cards</strong> or <strong>Action cards</strong> face-up into your Bank.
                </p>
                <div className="how-zone-tip">
                  <strong>💡 Kid Tip:</strong> Action cards in your bank count as money (using the dollar value in the corner). If an opponent charges you rent, you pay from your Bank so you don't lose your properties!
                </div>
                <div className="how-zone-preview">
                  {cardMoney5M && <Card card={cardMoney5M} size="xs" isInteractive={false} />}
                  {cardDebtCollector && <Card card={cardDebtCollector} size="xs" isInteractive={false} />}
                </div>
              </div>

              {/* Zone 2: Your Properties */}
              <div className="how-zone-card">
                <div className="how-zone-icon-box" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>domain</span>
                </div>
                <h3>2. Your Property Table</h3>
                <p className="how-zone-tag">Set Building</p>
                <p className="how-zone-desc">
                  Lay down <strong>Property cards</strong> and <strong>Wild cards</strong> face-up in front of you.
                </p>
                <div className="how-zone-tip">
                  <strong>💡 Kid Tip:</strong> Group cards of the same color together. Once a set is complete, you can charge maximum rent and move one step closer to winning!
                </div>
                <div className="how-zone-preview">
                  {cardMediterranean && <Card card={cardMediterranean} size="xs" isInteractive={false} />}
                  {cardBaltic && <Card card={cardBaltic} size="xs" isInteractive={false} />}
                </div>
              </div>

              {/* Zone 3: Center Action Pile */}
              <div className="how-zone-card">
                <div className="how-zone-icon-box" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>bolt</span>
                </div>
                <h3>3. The Action Center</h3>
                <p className="how-zone-tag">Discard / Middle Pile</p>
                <p className="how-zone-desc">
                  Play <strong>Action cards</strong> into the middle to activate their super powers!
                </p>
                <div className="how-zone-tip">
                  <strong>💡 Kid Tip:</strong> Use cards like <em>Deal Breaker</em> to steal a whole set, <em>Rent</em> to demand money from everyone, or <em>Pass Go</em> to draw extra cards!
                </div>
                <div className="how-zone-preview">
                  {cardDealBreaker && <Card card={cardDealBreaker} size="xs" isInteractive={false} />}
                  {cardPassGo && <Card card={cardPassGo} size="xs" isInteractive={false} />}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STEP 3: THE TURN CYCLE (3 EASY STEPS)                       */}
        {/* ============================================================ */}
        <section className="how-step-section shell u-mt-36">
          <div className="how-step-card glass-panel">
            <div className="how-step-header">
              <div className="how-step-badge">STEP 3</div>
              <div>
                <h2>Your Turn: The 3-Phase Loop</h2>
                <p>Every turn follows this exact 3-step sequence. Play goes clockwise around the table.</p>
              </div>
            </div>

            <div className="how-turn-steps">
              {/* Turn Step 1 */}
              <div className="how-turn-step-item">
                <div className="how-turn-num">1</div>
                <div className="how-turn-content">
                  <h3>Draw 2 Cards</h3>
                  <p>
                    At the start of your turn, pick up <strong>2 cards</strong> from the draw pile and add them to your hand.
                  </p>
                  <div className="how-bonus-note">
                    ✨ <strong>Empty Hand Bonus:</strong> If you start your turn with 0 cards in your hand, you get to draw <strong>5 cards</strong> instead!
                  </div>
                </div>
              </div>

              {/* Turn Step 2 */}
              <div className="how-turn-step-item">
                <div className="how-turn-num">2</div>
                <div className="how-turn-content">
                  <h3>Play Up to 3 Cards</h3>
                  <p>
                    You can play <strong>0, 1, 2, or 3 cards</strong> on your turn. You can put them in your Bank, lay down Properties, or play Action cards into the middle.
                  </p>
                  <div className="how-bonus-note">
                    🧠 <strong>Smart Strategy:</strong> You don't have to play all 3 cards! You can save powerful cards like <em>Just Say No</em> or <em>Deal Breaker</em> in your hand for the perfect moment.
                  </div>
                </div>
              </div>

              {/* Turn Step 3 */}
              <div className="how-turn-step-item">
                <div className="how-turn-num">3</div>
                <div className="how-turn-content">
                  <h3>End Turn & Hand Limit (Max 7 Cards)</h3>
                  <p>
                    When you're finished, check how many cards are in your hand. You can hold a <strong>maximum of 7 cards</strong>.
                  </p>
                  <div className="how-bonus-note" style={{ borderColor: "#f87171", background: "rgba(239, 68, 68, 0.08)" }}>
                    ⚠️ <strong>Discard Rule:</strong> If you have 8 or more cards, choose and discard the extras into the middle pile until you have 7. Then your turn is over!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STEP 4: SUPER ACTION CARDS CHEAT SHEET                      */}
        {/* ============================================================ */}
        <section id="special-cards" className="how-step-section shell u-mt-36">
          <div className="how-step-card glass-panel">
            <div className="how-step-header">
              <div className="how-step-badge">STEP 4</div>
              <div>
                <h2>Sneaky Super Cards (Game Changers)</h2>
                <p>These powerful Action cards can flip the game upside down in seconds!</p>
              </div>
            </div>

            <div className="how-action-cards-grid">
              {/* Just Say No */}
              <div className="how-power-card">
                <div className="how-power-card-preview">
                  {cardJustSayNo && <Card card={cardJustSayNo} size="xs" isInteractive={false} />}
                </div>
                <div className="how-power-card-info">
                  <div className="how-power-card-title">
                    <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>shield</span>
                    <strong>Just Say No</strong>
                  </div>
                  <p>
                    <strong>The Ultimate Shield:</strong> Play this at <em>any time</em> (even on someone else's turn!) to cancel an action played against you. You can even Just Say No to someone else's Just Say No!
                  </p>
                </div>
              </div>

              {/* Deal Breaker */}
              <div className="how-power-card">
                <div className="how-power-card-preview">
                  {cardDealBreaker && <Card card={cardDealBreaker} size="xs" isInteractive={false} />}
                </div>
                <div className="how-power-card-info">
                  <div className="how-power-card-title">
                    <span className="material-symbols-outlined" style={{ color: "#ef4444" }}>gavel</span>
                    <strong>Deal Breaker</strong>
                  </div>
                  <p>
                    <strong>Steal a Complete Set:</strong> Snatch an entire completed property set (including houses and hotels) from any player and place it on your table!
                  </p>
                </div>
              </div>

              {/* Sly Deal */}
              <div className="how-power-card">
                <div className="how-power-card-preview">
                  {cardSlyDeal && <Card card={cardSlyDeal} size="xs" isInteractive={false} />}
                </div>
                <div className="how-power-card-info">
                  <div className="how-power-card-title">
                    <span className="material-symbols-outlined" style={{ color: "#f59e0b" }}>front_hand</span>
                    <strong>Sly Deal</strong>
                  </div>
                  <p>
                    <strong>Steal a Single Card:</strong> Steal 1 property card from any player's table. (Note: You cannot steal from a completed set!).
                  </p>
                </div>
              </div>

              {/* Pass Go */}
              <div className="how-power-card">
                <div className="how-power-card-preview">
                  {cardPassGo && <Card card={cardPassGo} size="xs" isInteractive={false} />}
                </div>
                <div className="how-power-card-info">
                  <div className="how-power-card-title">
                    <span className="material-symbols-outlined" style={{ color: "#10b981" }}>add_card</span>
                    <strong>Pass Go</strong>
                  </div>
                  <p>
                    <strong>Draw 2 Extra Cards:</strong> Play this into the action pile to immediately draw 2 more cards from the deck.
                  </p>
                </div>
              </div>

              {/* Rent Card */}
              <div className="how-power-card">
                <div className="how-power-card-preview">
                  {cardRentWild && <Card card={cardRentWild} size="xs" isInteractive={false} />}
                </div>
                <div className="how-power-card-info">
                  <div className="how-power-card-title">
                    <span className="material-symbols-outlined" style={{ color: "#8b5cf6" }}>payments</span>
                    <strong>Rent Cards</strong>
                  </div>
                  <p>
                    <strong>Collect Cash:</strong> Charge opponents rent for properties you own. If they don't have enough money in their bank, they must pay you with properties!
                  </p>
                </div>
              </div>

              {/* Debt Collector */}
              <div className="how-power-card">
                <div className="how-power-card-preview">
                  {cardDebtCollector && <Card card={cardDebtCollector} size="xs" isInteractive={false} />}
                </div>
                <div className="how-power-card-info">
                  <div className="how-power-card-title">
                    <span className="material-symbols-outlined" style={{ color: "#ec4899" }}>request_quote</span>
                    <strong>Debt Collector</strong>
                  </div>
                  <p>
                    <strong>Target a Player:</strong> Force one target player to pay you $5M directly from their table!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STEP 5: COMMON QUESTIONS & RULES FAQ                        */}
        {/* ============================================================ */}
        <section id="rules" className="how-step-section shell u-mt-36">
          <div className="how-step-card glass-panel">
            <div className="how-step-header">
              <div className="how-step-badge">FAQ</div>
              <div>
                <h2>Frequently Asked Questions & Important Rules</h2>
                <p>Everything you need to resolve table debates like a pro referee.</p>
              </div>
            </div>

            <div className="how-faq-list">
              {/* FAQ 1 */}
              <div className={`how-faq-item ${openFaq === 0 ? "open" : ""}`}>
                <button type="button" className="how-faq-question" onClick={() => toggleFaq(0)}>
                  <span>Can I pay rent or debts with cards from my hand?</span>
                  <span className="material-symbols-outlined how-faq-chevron">
                    {openFaq === 0 ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {openFaq === 0 && (
                  <div className="how-faq-answer">
                    <strong>NO!</strong> You can never pay rent or debts using cards in your hand. You can only pay with cards that are already on your table (in your Bank or Property area). Your hand is strictly private.
                  </div>
                )}
              </div>

              {/* FAQ 2 */}
              <div className={`how-faq-item ${openFaq === 1 ? "open" : ""}`}>
                <button type="button" className="how-faq-question" onClick={() => toggleFaq(1)}>
                  <span>What happens if I don't have enough money or properties to pay rent?</span>
                  <span className="material-symbols-outlined how-faq-chevron">
                    {openFaq === 1 ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {openFaq === 1 && (
                  <div className="how-faq-answer">
                    You pay whatever you have on your table until your table is completely empty. If you have $0 and 0 properties on your table, you pay nothing! You are never forced to pay from your hand.
                  </div>
                )}
              </div>

              {/* FAQ 3 */}
              <div className={`how-faq-item ${openFaq === 2 ? "open" : ""}`}>
                <button type="button" className="how-faq-question" onClick={() => toggleFaq(2)}>
                  <span>Do I get change if I pay with a larger money card?</span>
                  <span className="material-symbols-outlined how-faq-chevron">
                    {openFaq === 2 ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {openFaq === 2 && (
                  <div className="how-faq-answer">
                    <strong>NO change is given in Dealopoly!</strong> If an opponent asks for $2M and your smallest bill on the table is a $5M card, you must hand over the entire $5M card without receiving any change.
                  </div>
                )}
              </div>

              {/* FAQ 4 */}
              <div className={`how-faq-item ${openFaq === 3 ? "open" : ""}`}>
                <button type="button" className="how-faq-question" onClick={() => toggleFaq(3)}>
                  <span>Can I move my Wild property cards to another color set?</span>
                  <span className="material-symbols-outlined how-faq-chevron">
                    {openFaq === 3 ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {openFaq === 3 && (
                  <div className="how-faq-answer">
                    <strong>YES!</strong> On your turn, you can rearrange and flip your Wild property cards between any of their valid matching colors for free (it does NOT cost one of your 3 plays).
                  </div>
                )}
              </div>

              {/* FAQ 5 */}
              <div className={`how-faq-item ${openFaq === 4 ? "open" : ""}`}>
                <button type="button" className="how-faq-question" onClick={() => toggleFaq(4)}>
                  <span>Can someone steal cards from my completed property set?</span>
                  <span className="material-symbols-outlined how-faq-chevron">
                    {openFaq === 4 ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {openFaq === 4 && (
                  <div className="how-faq-answer">
                    Completed sets are safe from cards like <em>Sly Deal</em> and <em>Forced Deal</em>. The <strong>ONLY</strong> card in the whole game that can touch a full set is the mighty <strong>Deal Breaker</strong> (which steals the entire set at once!).
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </>
        )}

        {/* ============================================================ */}
        {/* CALL TO ACTION                                               */}
        {/* ============================================================ */}
        <section className="how-cta-section shell u-mt-40 u-text-center">
          <div className="how-cta-card">
            <h2>Ready to Test Your Skills?</h2>
            <p>Jump in right now — no downloads or registrations required!</p>
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
                View All 110 Cards
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
