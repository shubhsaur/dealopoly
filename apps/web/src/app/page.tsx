"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { fetchStatsApi, type ServerStats } from "../lib/api";
import { getHeroStatsCopy } from "../lib/hero-stats";
import { MarketingNav } from "./_components/marketing-nav";
import { MarketingFooter } from "./_components/marketing-footer";
import { HeroCardShowcase } from "./_components/hero-card-showcase";
import { QuickHowToPlay } from "./_components/quick-how-to-play";
import { PowerCardsSpotlight } from "./_components/power-cards-spotlight";
import { ArcadeGameCards } from "./_components/arcade-game-cards";
import { LivePulseTicker } from "./_components/live-pulse-ticker";

const JoinRoomDialog = dynamic(
  () => import("./_components/join-room-dialog").then((m) => m.JoinRoomDialog),
  { ssr: false },
);

const CreateRoomDialog = dynamic(
  () => import("./_components/create-room-dialog").then((m) => m.CreateRoomDialog),
  { ssr: false },
);

const PlayBotsDialog = dynamic(
  () => import("./_components/play-bots-dialog").then((m) => m.PlayBotsDialog),
  { ssr: false },
);

const platformFeatures = [
  {
    icon: "bolt",
    tag: "INSTANT SYNC",
    title: "Zero-Lag Multiplayer",
    description:
      "Seamless real-time WebSocket sync. Play on desktop, tablet, or mobile phone with instant turn responsiveness.",
    themeClass: "feature-card--blue",
    boxModifier: "feature-icon-box--blue",
  },
  {
    icon: "smart_toy",
    tag: "TACTICAL AI",
    title: "Instant Solo Play",
    description:
      "Practice your tactics against heuristic AI bots across 4 difficulty tiers anytime with zero setup or waiting.",
    themeClass: "feature-card--green",
    boxModifier: "feature-icon-box--green",
  },
  {
    icon: "style",
    tag: "AUTHENTIC RULES",
    title: "Expanding Arcade",
    description:
      "Battle with full 110-card Monodeal real-estate action, or test your bluffing instincts in Lowdeck point-shedding.",
    themeClass: "feature-card--amber",
    boxModifier: "feature-icon-box--amber",
  },
];

export default function ArcadeLauncherPage() {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBotsOpen, setIsBotsOpen] = useState(false);
  const [botsGame, setBotsGame] = useState<"monodeal" | "least_count">("monodeal");
  const [stats, setStats] = useState<ServerStats | null>(null);

  useEffect(() => {
    fetchStatsApi()
      .then(setStats)
      .catch(() => {});
    const interval = setInterval(() => {
      fetchStatsApi()
        .then(setStats)
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const heroStats = getHeroStatsCopy(stats);

  const handleOpenBots = (game: "monodeal" | "least_count" = "monodeal") => {
    setBotsGame(game);
    setIsBotsOpen(true);
  };

  return (
    <div className="marketing-page">
      {/* Top Arcade Navigation */}
      <MarketingNav game="arcade" activeTab="home" />

      {/* Main Content */}
      <main>
        {/* ============================================================ */}
        {/* HERO SECTION - Split Layout with 3D Fanned Card Showcase     */}
        {/* ============================================================ */}
        <section
          className="hero-section hero-section--arcade-revamp hero-pattern"
          aria-labelledby="hero-title"
        >
          {/* Left: Headline & Instant Action Funnels */}
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="badge-dot" style={{ background: "#10b981" }} />
              <span className="badge-text">{heroStats.badgeText}</span>
            </div>

            <h1
              id="hero-title"
              className="text-glow"
              style={{
                fontSize: "clamp(2.4rem, 5.2vw, 3.8rem)",
                fontWeight: 900,
                lineHeight: 1.1,
                margin: "0 0 16px",
              }}
            >
              Deal, Steal & Dominate in{" "}
              <span className="glow-word">Real-Time Card Battles</span>
            </h1>

            <p
              className="lede"
              style={{
                maxWidth: "600px",
                margin: "0 0 28px",
                fontSize: "1.1rem",
                color: "#cbd5e1",
                lineHeight: 1.6,
              }}
            >
              The high-stakes property trading card game you love, reimagined for
              instant browser multiplayer. Build 3 full sets, steal your friends'
              fortunes with ruthless action cards, or hone your tactics against smart AI
              bots.
            </p>

            {/* Instant Action Cluster */}
            <div className="hero-actions-arcade">
              {/* Primary: 1-Click Bot Match */}
              <button
                type="button"
                onClick={() => handleOpenBots("monodeal")}
                className="button button--primary"
                title="Play instantly against AI bots with zero wait time"
                style={{ color: "#ffffff" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: "'FILL' 1",
                    fontSize: "20px",
                    color: "#ffffff",
                  }}
                >
                  smart_toy
                </span>
                Play Solo vs Bots
              </button>

              {/* Secondary: Create Room with Friends */}
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="button button--secondary"
                title="Create a multiplayer room and invite friends via link or code"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  group_add
                </span>
                Create Room
              </button>

              {/* Tertiary: Join Room Modal */}
              <button
                type="button"
                onClick={() => setIsJoinOpen(true)}
                className="button button--secondary hero-join-room"
                title="Join an existing match with a room code"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  login
                </span>
                Join Code
              </button>

              {/* Quaternary: Live Lobbies */}
              <Link
                href="/lobbies"
                className="button button--ghost"
                title="Browse public lobbies"
                style={{ padding: "10px 14px", fontSize: "0.95rem" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px", color: "#38bdf8" }}
                >
                  public
                </span>
                Public Lobby
              </Link>
            </div>

            {/* Micro-Trust Chips */}
            <div className="hero-trust-chips">
              <span className="hero-trust-chip">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px", color: "#38bdf8" }}
                >
                  bolt
                </span>
                0s Setup
              </span>
              <span className="hero-trust-chip">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px", color: "#facc15" }}
                >
                  schedule
                </span>
                10–15 Min Matches
              </span>
              <span className="hero-trust-chip">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px", color: "#10b981" }}
                >
                  devices
                </span>
                Desktop & Mobile
              </span>
              <span className="hero-trust-chip">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px", color: "#a855f7" }}
                >
                  verified_user
                </span>
                No Account Needed
              </span>
            </div>
          </div>

          {/* Right: Interactive 3D Card Showcase */}
          <HeroCardShowcase />
        </section>

        {/* ============================================================ */}
        {/* LIVE PULSE RIBBON TICKER                                     */}
        {/* ============================================================ */}
        <LivePulseTicker stats={stats} onOpenJoinModal={() => setIsJoinOpen(true)} />

        {/* ============================================================ */}
        {/* HOW TO PLAY IN 60 SECONDS (NEWBIE ONBOARDING)                */}
        {/* ============================================================ */}
        <QuickHowToPlay />

        {/* ============================================================ */}
        {/* FEATURED GAMES ARENA (DIRECT HOMEPAGE SELECTION)             */}
        {/* ============================================================ */}
        <section
          id="games"
          className="arcade-games-section"
          style={{ width: "100%", paddingBlock: "48px 56px" }}
        >
          <div className="shell">
            <div
              className="section-header"
              style={{ textAlign: "center", marginBottom: "36px" }}
            >
              <p
                className="kicker"
                style={{ color: "#38bdf8", letterSpacing: "0.12em" }}
              >
                SELECT YOUR ARENA
              </p>
              <h2
                style={{
                  fontSize: "clamp(2rem, 4vw, 2.8rem)",
                  fontWeight: 900,
                  margin: "8px 0 12px",
                }}
              >
                Featured <span className="glow-word">Card Games</span>
              </h2>
              <p
                style={{
                  color: "#94a3b8",
                  maxWidth: "620px",
                  margin: "0 auto",
                  fontSize: "1.05rem",
                  lineHeight: 1.6,
                }}
              >
                Jump straight into live games, practice your strategy against heuristic
                AI bots, or study card synergies and rules.
              </p>
            </div>

            <ArcadeGameCards onOpenBots={handleOpenBots} />
          </div>
        </section>

        {/* ============================================================ */}
        {/* THE POWER CARDS ARSENAL SPOTLIGHT                            */}
        {/* ============================================================ */}
        <PowerCardsSpotlight />

        {/* ============================================================ */}
        {/* PLATFORM HIGHLIGHTS                                          */}
        {/* ============================================================ */}
        <section
          id="features"
          className="features-section"
          aria-label="Arcade platform features"
          style={{ paddingBlock: "48px 56px" }}
        >
          <div className="shell">
            <div
              className="section-header"
              style={{ textAlign: "center", marginBottom: "36px" }}
            >
              <p className="kicker">ENGINEERED FOR SPEED</p>
              <h2 style={{ fontSize: "2.2rem", fontWeight: 900 }}>
                Why Players Love Dealopoly
              </h2>
            </div>
            <div className="features-grid">
              {platformFeatures.map((f) => (
                <article className={`feature-card ${f.themeClass}`} key={f.title}>
                  <div className="feature-card-header">
                    <div className={`feature-icon-box ${f.boxModifier}`}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "26px", fontVariationSettings: "'FILL' 1" }}
                      >
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

        {/* ============================================================ */}
        {/* FINAL CALL TO ACTION BANNER                                  */}
        {/* ============================================================ */}
        <section
          className="final-cta-section shell"
          aria-label="Ready to play call to action"
        >
          <div className="final-cta-card">
            <div className="final-cta-glow" />
            <p
              className="kicker"
              style={{
                color: "#38bdf8",
                marginBottom: "8px",
                position: "relative",
                zIndex: 2,
              }}
            >
              INSTANT ACTION • NO DOWNLOAD REQUIRED
            </p>
            <h2 className="final-cta-title">
              Ready to Deal Your <span className="glow-word">First Hand?</span>
            </h2>
            <p className="final-cta-desc">
              Challenge friends or test your wits against tactical AI bots in under 5
              seconds. Completely free to play in your browser.
            </p>
            <div className="final-cta-actions">
              <button
                type="button"
                onClick={() => handleOpenBots("monodeal")}
                className="button button--primary"
                style={{ padding: "12px 24px", fontSize: "1.05rem", color: "#ffffff" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: "'FILL' 1",
                    fontSize: "20px",
                    color: "#ffffff",
                  }}
                >
                  smart_toy
                </span>
                Play Solo vs Bots
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="button button--secondary"
                style={{ padding: "12px 24px", fontSize: "1.05rem" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  group_add
                </span>
                Create Multiplayer Room
              </button>
              <Link
                href="/leaderboard"
                className="button button--ghost"
                style={{ padding: "12px 20px", fontSize: "1rem" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  leaderboard
                </span>
                View Leaderboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MarketingFooter game="arcade" />

      {/* Dialog Modals */}
      <JoinRoomDialog isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
      <CreateRoomDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <PlayBotsDialog
        isOpen={isBotsOpen}
        onClose={() => setIsBotsOpen(false)}
        defaultGame={botsGame}
      />
    </div>
  );
}
