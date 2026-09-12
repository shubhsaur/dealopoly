"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MarketingNav } from "../../_components/marketing-nav";
import { MarketingFooter } from "../../_components/marketing-footer";
import { BackButton } from "../../_components/back-button";

export default function LowdeckHowToPlayPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="marketing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Lowdeck Navigation */}
      <MarketingNav game="lowdeck" activeTab="how-to-play" />

      <main style={{ flex: 1, paddingBottom: "80px" }}>
        {/* HERO SECTION */}
        <section className="how-hero-section shell" style={{ textAlign: "center", padding: "48px 16px 36px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <BackButton fallbackUrl="/lowdeck" label="Back to Lowdeck" variant="subtle" />
            </div>

            <div className="how-hero-pill">
              <span>🎯 Beginner's Visual Guide</span>
            </div>

            <h1 className="how-hero-title">
              How to Play <span className="glow-word">Lowdeck</span>
            </h1>

            <p className="how-hero-lede">
              Master point shedding, combo pairs, same-suit runs, 0-point Kings, and calling SHOW to outsmart your opponents.
            </p>

            <div className="how-stats-ribbon">
              <div className="how-stat-chip">
                <span className="material-symbols-outlined">timer</span>
                <span><strong>5–10 Mins</strong> per round</span>
              </div>
              <div className="how-stat-chip">
                <span className="material-symbols-outlined">groups</span>
                <span><strong>2 to 6</strong> Players</span>
              </div>
              <div className="how-stat-chip">
                <span className="material-symbols-outlined">emoji_events</span>
                <span><strong>Lowest Points</strong> Wins</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 STEP GUIDE */}
        <section className="shell" style={{ maxWidth: "860px", marginTop: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Step 1: Objective */}
            <div className="how-step-card glass-panel" style={{ padding: "28px" }}>
              <div className="how-step-header">
                <div className="how-step-badge">STEP 1</div>
                <div>
                  <h2>The Big Goal: Lowest Hand Score!</h2>
                  <p>Each card in your hand has a point value. Your mission is to discard cards to get your total to <strong>≤ 7 points</strong>, then call <strong>SHOW</strong>.</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "18px" }}>
                <div style={{ background: "rgba(234, 179, 8, 0.12)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.6rem" }}>👑</div>
                  <div style={{ fontWeight: 900, color: "#facc15" }}>King (K)</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>0 Points (The Winner!)</div>
                </div>
                <div style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.6rem" }}>⭐</div>
                  <div style={{ fontWeight: 900, color: "#38bdf8" }}>Ace (A)</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>1 Point</div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.6rem" }}>🔢</div>
                  <div style={{ fontWeight: 900, color: "#f8fafc" }}>2 to 10</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Face Value (2–10 pts)</div>
                </div>
                <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.6rem" }}>👸 🃏</div>
                  <div style={{ fontWeight: 900, color: "#f43f5e" }}>J & Q</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>J=11 pts, Q=12 pts</div>
                </div>
              </div>
            </div>

            {/* Step 2: Discard & Draw */}
            <div className="how-step-card glass-panel" style={{ padding: "28px" }}>
              <div className="how-step-header">
                <div className="how-step-badge">STEP 2</div>
                <div>
                  <h2>Turn Cycle: Discard, then Draw</h2>
                  <p>On your turn, drop cards to shed points, then draw 1 replacement card.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px", color: "#cbd5e1", lineHeight: 1.6 }}>
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
            <div className="how-step-card glass-panel" style={{ padding: "28px" }}>
              <div className="how-step-header">
                <div className="how-step-badge">STEP 3</div>
                <div>
                  <h2>Declare SHOW & Win the Round!</h2>
                  <p>When your hand score is <strong>≤ 7 points</strong>, hit the glowing <strong>⭐ DECLARE SHOW</strong> button at the start of your turn.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                <div style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px", padding: "14px" }}>
                  <strong style={{ color: "#4ade80" }}>🎉 Successful Show:</strong> You score <strong>0 points</strong> for the round. All other players add their hand scores to their match penalties!
                </div>
                <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "10px", padding: "14px" }}>
                  <strong style={{ color: "#f87171" }}>💥 Wrong Show:</strong> If an opponent has equal or fewer points than you, they score 0 and you receive <strong>handScore + 40 penalty points</strong>!
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="how-step-card glass-panel" style={{ padding: "28px" }}>
              <div className="how-step-header">
                <div className="how-step-badge">FAQ</div>
                <div>
                  <h2>Frequently Asked Questions</h2>
                  <p>Mastering Lowdeck strategies & edge cases.</p>
                </div>
              </div>

              <div className="how-faq-list" style={{ marginTop: "16px" }}>
                <div className={`how-faq-item ${openFaq === 1 ? "open" : ""}`}>
                  <button type="button" className="how-faq-question" onClick={() => toggleFaq(1)}>
                    <span>Can I call SHOW at 8 or 9 points?</span>
                    <span className="material-symbols-outlined">
                      {openFaq === 1 ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {openFaq === 1 && (
                    <div className="how-faq-answer">
                      <strong>No!</strong> You can only declare SHOW when your total hand score is <strong>7 or less</strong>.
                    </div>
                  )}
                </div>

                <div className={`how-faq-item ${openFaq === 2 ? "open" : ""}`}>
                  <button type="button" className="how-faq-question" onClick={() => toggleFaq(2)}>
                    <span>How does deck scaling work for 3 to 6 players?</span>
                    <span className="material-symbols-outlined">
                      {openFaq === 2 ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {openFaq === 2 && (
                    <div className="how-faq-answer">
                      For 2 players, 1 standard 52-card deck is used. For 3 to 6 players, <strong>2 full decks (104 cards)</strong> are shuffled together so there are plenty of cards and combination opportunities!
                    </div>
                  )}
                </div>

                <div className={`how-faq-item ${openFaq === 3 ? "open" : ""}`}>
                  <button type="button" className="how-faq-question" onClick={() => toggleFaq(3)}>
                    <span>What happens if an opponent also has the same points during my Show?</span>
                    <span className="material-symbols-outlined">
                      {openFaq === 3 ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {openFaq === 3 && (
                    <div className="how-faq-answer">
                      If an opponent ties or beats your score, you suffer a <strong>Wrong Show</strong> and receive your hand score + 40 penalty points. Only call SHOW when you are confident you hold the lowest hand!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="how-cta-section shell" style={{ marginTop: "40px", textAlign: "center" }}>
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
