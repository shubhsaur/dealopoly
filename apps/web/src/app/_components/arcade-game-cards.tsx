"use client";

import Link from "next/link";
import { useState } from "react";
import { CreateRoomDialog } from "./create-room-dialog";

interface ArcadeGameCardsProps {
  onOpenBots: (game: "monodeal" | "least_count") => void;
}

export function ArcadeGameCards({ onOpenBots }: ArcadeGameCardsProps) {
  const [createGame, setCreateGame] = useState<"monodeal" | "least_count" | null>(null);

  return (
    <>
      {/* Game Card 1: Monodeal */}
      <div className="arcade-launcher-card arcade-launcher-card--monodeal">
        {/* Media Header with Game Table Preview */}
        <div className="arcade-card-media">
          <picture>
            <source srcSet="/games/monodeal-preview.avif" type="image/avif" />
            <img
              src="/games/monodeal-preview.jpg"
              alt="Monodeal Game Table Preview"
              className="arcade-card-img"
              width={580}
              height={330}
              loading="eager"
              decoding="async"
            />
          </picture>
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
                onClick={() => onOpenBots("monodeal")}
                className="button button--ghost arcade-sub-btn"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#38bdf8" }}>smart_toy</span>
                Play Solo Bots
              </button>
              <button
                type="button"
                onClick={() => setCreateGame("monodeal")}
                className="button button--secondary arcade-sub-btn"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_circle</span>
                Create Room
              </button>
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

      {/* Game Card 2: Lowdeck (Coming Soon) */}
      <div className="arcade-launcher-card arcade-launcher-card--lowdeck arcade-launcher-card--coming-soon">
        {/* Media Header with Game Table Preview */}
        <div className="arcade-card-media">
          <picture>
            <source srcSet="/games/lowdeck-preview.avif" type="image/avif" />
            <img
              src="/games/lowdeck-preview.jpg"
              alt="Lowdeck Game Table Preview"
              className="arcade-card-img"
              width={580}
              height={330}
              loading="lazy"
              decoding="async"
            />
          </picture>
          <div className="arcade-card-media-overlay" />

          {/* Top Floating Badges */}
          <div className="arcade-card-top-badges">
            <span className="arcade-player-badge arcade-player-badge--gold">
              <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>group</span>
              2–6 PLAYERS
            </span>
            <span className="arcade-status-badge arcade-status-badge--coming-soon">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>hourglass_top</span>
              COMING SOON
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
            <button
              type="button"
              disabled
              className="arcade-primary-btn arcade-primary-btn--disabled"
              title="Lowdeck is currently in development. Launching soon!"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>lock</span>
              <span>Coming Soon</span>
            </button>

            <div className="arcade-coming-soon-pill">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#facc15" }}>construction</span>
              <span>Currently in Development • Launching Soon</span>
            </div>
          </div>
        </div>
      </div>

      <CreateRoomDialog
        game={createGame ?? "monodeal"}
        isOpen={createGame !== null}
        onClose={() => setCreateGame(null)}
      />
    </>
  );
}
