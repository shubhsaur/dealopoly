"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchStatsApi, type ServerStats } from "../../lib/api";
import { MarketingNav } from "../_components/marketing-nav";
import { MarketingFooter } from "../_components/marketing-footer";
import { JoinRoomDialog } from "../_components/join-room-dialog";
import { PlayBotsDialog } from "../_components/play-bots-dialog";
import { LeastCountHeroShowcase } from "../_components/least-count-hero-showcase";
import { LowdeckHeroBackdrop } from "../_components/lowdeck-hero-backdrop";

const lowdeckFeatures = [
  {
    icon: "workspace_premium",
    tag: "GOLDEN KINGS",
    title: "King = 0 Points",
    description: "Hold onto Kings to slash your hand count to zero and guarantee a winning Show declaration.",
    themeClass: "feature-card--amber",
    boxModifier: "feature-icon-box--amber",
  },
  {
    icon: "style",
    tag: "COMBO DROPS",
    title: "Pairs & 3-Card Runs",
    description: "Shed high-point Queens (12) and Jacks (11) rapidly using pairs of identical rank or same-suit sequences.",
    themeClass: "feature-card--blue",
    boxModifier: "feature-icon-box--blue",
  },
  {
    icon: "bolt",
    tag: "HIGH STAKES",
    title: "Show & +40 Penalty",
    description: "Call SHOW at ≤ 7 points. Score 0 on success, or take a brutal +40 penalty if an opponent counters you!",
    themeClass: "feature-card--green",
    boxModifier: "feature-icon-box--green",
  },
];

const howToPlaySteps = [
  {
    number: "1",
    title: "Shed Points",
    description: "Discard a single card, a matching rank pair (e.g. K-K), or a 3-card same-suit run (e.g. 5♥-6♥-7♥).",
  },
  {
    number: "2",
    title: "Draw 1 Card",
    description: "Take 1 card from the closed draw deck or snatch the top open card from the discard pile.",
  },
  {
    number: "3",
    title: "Declare SHOW (≤ 7 pts)",
    description: "When your hand total is 7 or less, call SHOW at the start of your turn to win the round with 0 points!",
  },
];

export default function LowdeckPage() {
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

  const serversOnline = stats ? stats.serversOnline : true;
  const statusText = serversOnline ? "Servers Online" : "Instant Play Ready";
  const playerLabel = stats
    ? stats.onlinePlayers > 0
      ? `${stats.onlinePlayers.toLocaleString()} ${stats.onlinePlayers === 1 ? "Player" : "Players"} Online`
      : `${Math.max(stats.totalPlayers, 1).toLocaleString()} ${Math.max(stats.totalPlayers, 1) === 1 ? "Player" : "Players"}`
    : "1 Player Online";

  return (
    <div className="marketing-page">
      {/* Top Navigation for Lowdeck */}
      <MarketingNav game="lowdeck" activeTab="home" />

      {/* Main Content */}
      <main>
        {/* Hero Section - 100% Full Width Edge-to-Edge */}
        <section
          className="hero-section hero-section--fullwidth hero-pattern"
          style={{
            position: "relative",
            overflow: "hidden",
            width: "100%",
            maxWidth: "100%",
          }}
          aria-labelledby="page-title"
        >
          {/* Atmospheric Casino Felt & Floating Glyphs Backdrop */}
          <LowdeckHeroBackdrop />

          {/* Hero Copy */}
          <div className="hero-copy">
            <div className="hero-badge hero-badge--gold">
              <span className="badge-dot badge-dot--gold" />
              <span className="badge-text badge-text--gold">
                👑 LOWDECK ROYALE • {statusText} • {playerLabel}
              </span>
            </div>

            <h1 id="page-title" className="text-glow">
              Less Points. <span className="glow-word glow-word--gold">More Glory.</span>
            </h1>

            <p className="lede">
              The ultimate point-shedding and bluffing card showdown. Drop matching pairs and sequences,
              hoard 0-point Kings, and call SHOW when your hand total is 7 or less to conquer the table.
            </p>

            {/* 3 Hero Action Buttons */}
            <div className="hero-actions">
              {/* Action 1: Create Room */}
              <Link className="button button--primary" href="/lobby?game=least_count">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "22px" }}>
                  add_circle
                </span>
                Create Room
              </Link>

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

              {/* Action 3: Play with Bots */}
              <button
                type="button"
                onClick={() => setIsBotsOpen(true)}
                className="button button--ghost"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                  smart_toy
                </span>
                Play with Bots
              </button>
            </div>

            {/* Strategy Value Micro-Chips */}
            <div className="lowdeck-hero-chips" aria-label="Game highlights">
              <div className="lowdeck-hero-chip lowdeck-hero-chip--gold" title="Kings count as 0 points toward your total">
                <span className="material-symbols-outlined lowdeck-hero-chip-icon">workspace_premium</span>
                <span>King = 0 Pts</span>
              </div>
              <div className="lowdeck-hero-chip lowdeck-hero-chip--emerald" title="Declare SHOW at 7 points or less to win 0 points">
                <span className="material-symbols-outlined lowdeck-hero-chip-icon">bolt</span>
                <span>≤ 7 Pts Show</span>
              </div>
              <div className="lowdeck-hero-chip lowdeck-hero-chip--cyan" title="Discard pairs of identical rank or 3-card same-suit runs">
                <span className="material-symbols-outlined lowdeck-hero-chip-icon">style</span>
                <span>Combo Drops</span>
              </div>
              <div className="lowdeck-hero-chip lowdeck-hero-chip--amber" title="Practice anytime with smart heuristic AI bots">
                <span className="material-symbols-outlined lowdeck-hero-chip-icon">smart_toy</span>
                <span>Solo AI Ready</span>
              </div>
            </div>

            <p className="availability">
              <span className="online-dot" /> Instant play in browser. No download or registration needed.
            </p>
          </div>

          {/* Hero Interactive 3D Card Showcase */}
          <LeastCountHeroShowcase />
        </section>

        {/* Features Section */}
        <section id="features" className="features-section" aria-label="Game highlights">
          <div className="shell">
            <div className="features-grid">
              {lowdeckFeatures.map((f) => (
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

        {/* How to Play Section */}
        <section id="how-to-play" className="how-to-play-section" aria-labelledby="how-title">
          <div className="shell how-to-play-content">
            <div className="section-header">
              <p className="kicker">QUICK TO LEARN</p>
              <h2 id="how-title">How to Play Lowdeck</h2>
              <p>Three simple rules to conquer the table.</p>
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
      <MarketingFooter game="lowdeck" />

      {/* Join Room Modal */}
      <JoinRoomDialog isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />

      {/* Play With Bots Modal */}
      <PlayBotsDialog isOpen={isBotsOpen} onClose={() => setIsBotsOpen(false)} defaultGame="least_count" />
    </div>
  );
}
