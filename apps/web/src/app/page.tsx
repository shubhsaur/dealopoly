"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchStatsApi, type ServerStats } from "../lib/api";
import { MarketingNav } from "./_components/marketing-nav";
import { MarketingFooter } from "./_components/marketing-footer";
import { JoinRoomDialog } from "./_components/join-room-dialog";
import { PlayBotsDialog } from "./_components/play-bots-dialog";
import { FloatingCardsBackdrop } from "./_components/floating-cards-backdrop";

const platformFeatures = [
  {
    icon: "bolt",
    tag: "INSTANT SYNC",
    title: "Zero-Lag Multiplayer",
    description: "Seamless real-time WebSocket sync. Play on desktop, tablet, or phone with instant response.",
    themeClass: "feature-card--blue",
    boxModifier: "feature-icon-box--blue",
  },
  {
    icon: "smart_toy",
    tag: "SMART AI",
    title: "Instant Solo Play",
    description: "Practice your tactics against heuristic AI bots anytime with zero setup or waiting.",
    themeClass: "feature-card--green",
    boxModifier: "feature-icon-box--green",
  },
  {
    icon: "style",
    tag: "MULTIPLE GAMES",
    title: "Expanding Arcade",
    description: "Switch seamlessly between Monodeal property trading and Lowdeck point-shedding bluffing.",
    themeClass: "feature-card--amber",
    boxModifier: "feature-icon-box--amber",
  },
];

export default function ArcadeLauncherPage() {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isBotsOpen, setIsBotsOpen] = useState(false);
  const [defaultGameForBots, setDefaultGameForBots] = useState<"monodeal" | "least_count">("monodeal");
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

  const handleOpenBots = (game: "monodeal" | "least_count") => {
    setDefaultGameForBots(game);
    setIsBotsOpen(true);
  };

  return (
    <div className="marketing-page">
      {/* Top Arcade Navigation */}
      <MarketingNav game="arcade" activeTab="home" />

      {/* Main Content */}
      <main>
        {/* Hero Section - Full Width Edge-to-Edge Canvas */}
        <section
          className="hero-section hero-section--launcher hero-pattern"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            width: "100%",
            maxWidth: "100vw",
          }}
        >
          {/* 3D Floating Cards Interactive Backdrop */}
          <FloatingCardsBackdrop />

          <div
            className="hero-content-box"
            style={{
              maxWidth: "860px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              zIndex: 5,
            }}
          >
            <div className="hero-badge" style={{ margin: "0 auto 18px" }}>
              <span className="badge-dot" style={{ background: "#10b981" }} />
              <span className="badge-text">{statusText} • {playerLabel}</span>
            </div>

            <h1 className="text-glow" style={{ fontSize: "clamp(2.4rem, 6vw, 3.8rem)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 18px", textAlign: "center" }}>
              The Real-Time <span className="glow-word">Card Arcade</span>
            </h1>

            <p className="lede" style={{ maxWidth: "680px", margin: "0 auto 28px", fontSize: "1.1rem", color: "#cbd5e1", textAlign: "center" }}>
              Instant-play multiplayer card battles with friends and smart AI bots. No downloads or sign-ups required. Select a game below to jump straight in!
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", width: "100%" }}>
              <a href="#games" className="button button--primary" style={{ padding: "12px 28px", fontSize: "1rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>sports_esports</span>
                Browse Games
              </a>
              <button
                type="button"
                onClick={() => setIsJoinOpen(true)}
                className="button button--secondary"
                style={{ padding: "12px 24px", fontSize: "1rem" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>login</span>
                Join by Room Code
              </button>
            </div>
          </div>
        </section>

        {/* Multi-Game Launcher Showcase Grid */}
        <section id="games" className="shell" style={{ padding: "32px 16px 56px" }}>
          <div className="section-header" style={{ textAlign: "center", marginBottom: "40px" }}>
            <p className="kicker">SELECT YOUR GAME</p>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 900 }}>Arcade Game Launcher</h2>
            <p style={{ color: "#94a3b8", maxWidth: "600px", margin: "0 auto" }}>
              Choose a card game below to jump straight into live bot matches, multiplayer rooms, or explore official rules and card catalogues.
            </p>
          </div>

          <div className="arcade-launcher-grid">
            {/* Game Card 1: Monodeal */}
            <div className="arcade-launcher-card arcade-launcher-card--monodeal">
              {/* Media Header with Game Table Preview */}
              <div className="arcade-card-media">
                <img
                  src="/games/monodeal-preview.png"
                  alt="Monodeal Game Table Preview"
                  className="arcade-card-img"
                />
                <div className="arcade-card-media-overlay" />

                {/* Top Floating Badges */}
                <div className="arcade-card-top-badges">
                  <span className="arcade-player-badge arcade-player-badge--blue">
                    <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>group</span>
                    2–5 PLAYERS
                  </span>
                  <span className="arcade-status-badge">
                    <span className="badge-dot" style={{ background: "#10b981", width: "6px", height: "6px" }} />
                    LIVE MATCH
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="arcade-card-body">
                <div>
                  <div className="arcade-card-header">
                    <div className="arcade-card-title-wrap">
                      <div className="arcade-card-icon-bubble arcade-card-icon-bubble--blue">
                        <span>🃏</span>
                      </div>
                      <div>
                        <h3 className="arcade-card-title">Monodeal</h3>
                        <div className="arcade-card-tagline arcade-card-tagline--blue">
                          Deal Your Way to Victory
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="arcade-card-desc">
                    The authentic real-estate card trading game. Collect 3 full property sets, charge ruthless rent, and steal monopolies with Deal Breakers!
                  </p>

                  <div className="arcade-card-specs">
                    <span className="arcade-spec-chip">⏱️ 10–15 Mins</span>
                    <span className="arcade-spec-chip">🎴 110 Cards</span>
                    <span className="arcade-spec-chip">🏆 3 Property Sets</span>
                    <span className="arcade-spec-chip">🏢 Real Estate Strategy</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="arcade-card-actions">
                  <Link
                    href="/monodeal"
                    className="arcade-primary-btn arcade-primary-btn--blue"
                  >
                    <span>Enter Monodeal Hub</span>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_forward</span>
                  </Link>

                  <div className="arcade-sub-actions-grid">
                    <button
                      type="button"
                      onClick={() => handleOpenBots("monodeal")}
                      className="button button--ghost arcade-sub-btn"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#38bdf8" }}>smart_toy</span>
                      Play Solo Bots
                    </button>
                    <Link
                      href="/lobby?game=monodeal"
                      className="button button--secondary arcade-sub-btn"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_circle</span>
                      Create Room
                    </Link>
                  </div>

                  <div className="arcade-quick-links">
                    <Link href="/monodeal/how-to-play" className="arcade-quick-link">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>menu_book</span>
                      How to Play
                    </Link>
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.8rem" }}>•</span>
                    <Link href="/monodeal/cards" className="arcade-quick-link">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>style</span>
                      Card Catalogue
                    </Link>
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.8rem" }}>•</span>
                    <Link href="/monodeal/rules" className="arcade-quick-link">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>gavel</span>
                      Rules
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Card 2: Lowdeck */}
            <div className="arcade-launcher-card arcade-launcher-card--lowdeck">
              {/* Media Header with Game Table Preview */}
              <div className="arcade-card-media">
                <img
                  src="/games/lowdeck-preview.png"
                  alt="Lowdeck Game Table Preview"
                  className="arcade-card-img"
                />
                <div className="arcade-card-media-overlay" />

                {/* Top Floating Badges */}
                <div className="arcade-card-top-badges">
                  <span className="arcade-player-badge arcade-player-badge--gold">
                    <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>group</span>
                    2–6 PLAYERS
                  </span>
                  <span className="arcade-status-badge" style={{ color: "#facc15", background: "rgba(234, 179, 8, 0.15)", borderColor: "rgba(234, 179, 8, 0.35)" }}>
                    <span className="badge-dot" style={{ background: "#facc15", width: "6px", height: "6px" }} />
                    LIVE MATCH
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="arcade-card-body">
                <div>
                  <div className="arcade-card-header">
                    <div className="arcade-card-title-wrap">
                      <div className="arcade-card-icon-bubble arcade-card-icon-bubble--gold">
                        <span>🎯</span>
                      </div>
                      <div>
                        <h3 className="arcade-card-title">Lowdeck</h3>
                        <div className="arcade-card-tagline arcade-card-tagline--gold">
                          Less Points. More Glory.
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="arcade-card-desc">
                    The ultimate point-shedding and bluffing showdown. Discard pairs & runs, hold 0-point Kings, and call SHOW when hand total ≤ 7!
                  </p>

                  <div className="arcade-card-specs">
                    <span className="arcade-spec-chip">⏱️ 5–10 Mins</span>
                    <span className="arcade-spec-chip">🎴 52 Standard Cards</span>
                    <span className="arcade-spec-chip">👑 King = 0 Pts</span>
                    <span className="arcade-spec-chip">💥 +40 Penalty</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="arcade-card-actions">
                  <Link
                    href="/lowdeck"
                    className="arcade-primary-btn arcade-primary-btn--gold"
                  >
                    <span>Enter Lowdeck Hub</span>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_forward</span>
                  </Link>

                  <div className="arcade-sub-actions-grid">
                    <button
                      type="button"
                      onClick={() => handleOpenBots("least_count")}
                      className="button button--ghost arcade-sub-btn"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#facc15" }}>smart_toy</span>
                      Play Solo Bots
                    </button>
                    <Link
                      href="/lobby?game=least_count"
                      className="button button--secondary arcade-sub-btn"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_circle</span>
                      Create Room
                    </Link>
                  </div>

                  <div className="arcade-quick-links">
                    <Link href="/lowdeck/how-to-play" className="arcade-quick-link arcade-quick-link--gold">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>menu_book</span>
                      How to Play
                    </Link>
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.8rem" }}>•</span>
                    <Link href="/lowdeck/cards" className="arcade-quick-link arcade-quick-link--gold">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>style</span>
                      Deck Cards
                    </Link>
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.8rem" }}>•</span>
                    <Link href="/lowdeck/rules" className="arcade-quick-link arcade-quick-link--gold">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>gavel</span>
                      Rules
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Platform Features */}
        <section id="features" className="features-section" aria-label="Arcade features">
          <div className="shell">
            <div className="features-grid">
              {platformFeatures.map((f) => (
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
      </main>

      {/* Footer with Skyline Vector */}
      <MarketingFooter game="arcade" />

      {/* Join Room Modal Dialog */}
      <JoinRoomDialog isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />

      {/* Play With Bots Modal Dialog */}
      <PlayBotsDialog
        isOpen={isBotsOpen}
        onClose={() => setIsBotsOpen(false)}
        defaultGame={defaultGameForBots}
      />
    </div>
  );
}
