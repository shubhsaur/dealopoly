"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchStatsApi, type ServerStats } from "../../lib/api";
import { getHeroStatsCopy } from "../../lib/hero-stats";
import { MarketingNav } from "../_components/marketing-nav";
import { MarketingFooter } from "../_components/marketing-footer";
import { JoinRoomDialog } from "../_components/join-room-dialog";
import { PlayBotsDialog } from "../_components/play-bots-dialog";
import { CreateRoomDialog } from "../_components/create-room-dialog";
import { HeroCardShowcase } from "../_components/hero-card-showcase";
import { SkyscraperBackdrop } from "../_components/skyscraper-backdrop";

const monodealFeatures = [
  {
    icon: "domain",
    tag: "PROPERTY SETS",
    title: "Collect 3 Full Sets",
    description: "Build color sets, develop Houses & Hotels, and dominate the real-estate board.",
    themeClass: "feature-card--blue",
    boxModifier: "feature-icon-box--blue",
  },
  {
    icon: "gavel",
    tag: "RUTHLESS DEALS",
    title: "Steal with Deal Breaker",
    description: "Flip the game instantly by stealing complete property sets or charging double rent.",
    themeClass: "feature-card--green",
    boxModifier: "feature-icon-box--green",
  },
  {
    icon: "payments",
    tag: "BANK VAULT",
    title: "Protect Your Assets",
    description: "Stash cash and action cards in your Bank to safely pay off debt collectors and rent.",
    themeClass: "feature-card--amber",
    boxModifier: "feature-icon-box--amber",
  },
];

const howToPlaySteps = [
  {
    number: "1",
    title: "Draw 2 Cards",
    description: "Start your turn by drawing 2 cards from the central deck to replenish your hand.",
  },
  {
    number: "2",
    title: "Play up to 3 Actions",
    description: "Lay down properties, bank cash, or play action cards to disrupt your opponents.",
  },
  {
    number: "3",
    title: "Complete 3 Sets",
    description: "Be the first player to complete 3 full property sets to instantly win the match.",
  },
];

export default function MonodealPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isBotsOpen, setIsBotsOpen] = useState(false);
  const [stats, setStats] = useState<ServerStats | null>(null);

  useEffect(() => {
    fetchStatsApi().then(setStats).catch(() => {});
    const interval = setInterval(() => {
      fetchStatsApi().then(setStats).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const heroStats = getHeroStatsCopy(stats);

  return (
    <div className="marketing-page">
      {/* Top Navigation for Monodeal */}
      <MarketingNav game="monodeal" activeTab="home" />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="hero-section shell hero-pattern" aria-labelledby="page-title">
          {/* Hero Copy & 3 Actions */}
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="badge-dot" style={{ background: "#10b981" }} />
              <span className="badge-text">{heroStats.badgeText}</span>
            </div>

            <h1 id="page-title" className="text-glow">
              Deal Your Way to <span className="glow-word">Victory</span>
            </h1>

            <p className="lede">
              Experience the ruthless, fast-paced property trading card game where properties change hands,
              debt collectors knock, and sly deals win the day. No setup required.
            </p>

            {/* 3 Hero Action Buttons */}
            <div className="hero-actions">
              {/* Action 1: Create Room */}
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="button button--primary"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "22px" }}>
                  add_circle
                </span>
                Create Room
              </button>

              {/* Action 2: Join Room */}
              <button
                type="button"
                onClick={() => setIsJoinOpen(true)}
                className="button button--secondary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                  login
                </span>
                Join Room
              </button>

              {/* Action 3: Practice */}
              <button
                type="button"
                onClick={() => setIsBotsOpen(true)}
                className="button button--ghost"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                  smart_toy
                </span>
                Practice
              </button>
            </div>

            <p className="availability">
              <span className="online-dot" /> No account needed. Start playing in seconds.
            </p>
          </div>

          {/* Hero Interactive 3D Card Showcase */}
          <HeroCardShowcase />
        </section>

        {/* Features Section */}
        <section id="features" className="features-section" aria-label="Game highlights">
          <div className="shell">
            <div className="features-grid">
              {monodealFeatures.map((f) => (
                <article className={`feature-card ${f.themeClass}`} key={f.title}>
                  <div className="feature-card-header">
                    <div className={`feature-icon-box ${f.boxModifier}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: "26px", fontVariationSettings: "'FILL' 1" }}>
                        {f.icon}
                      </span>
                    </div>
                    <span className="feature-card-tag">{f.tag}</span>
                  </div>
                  <div className="feature-card-content">
                    <h3>{f.title}</h3>
                    <p>{f.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How to Play Section with Skyscraper Architectural Backdrop */}
        <section id="how-to-play" className="how-to-play-section" aria-labelledby="how-title">
          <SkyscraperBackdrop />

          <div className="shell how-to-play-content">
            <div className="section-header">
              <p className="kicker">QUICK TO LEARN</p>
              <h2 id="how-title">How to Play Monodeal</h2>
              <p>Three simple steps to dominate the board.</p>
            </div>

            <div className="steps-grid">
              <div className="steps-connector" aria-hidden="true" />
              {howToPlaySteps.map((step) => (
                <article className="step-card" key={step.number}>
                  <div className="step-number-box">{step.number}</div>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MarketingFooter game="monodeal" />

      {/* Create Room Modal */}
      <CreateRoomDialog game="monodeal" isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Join Room Modal */}
      <JoinRoomDialog isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />

      {/* Play With Bots Modal */}
      <PlayBotsDialog isOpen={isBotsOpen} onClose={() => setIsBotsOpen(false)} defaultGame="monodeal" />
    </div>
  );
}
