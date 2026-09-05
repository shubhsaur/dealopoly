"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Brand } from "./brand";
import { UserNav } from "./user-nav";

export interface MarketingNavProps {
  game?: "arcade" | "monodeal" | "lowdeck";
  activeTab?: "cards" | "lobby" | "home" | "history" | "profile" | "rules" | "how-to-play" | "games" | "settings";
}

export function MarketingNav({ game = "arcade", activeTab }: MarketingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const isGameHub = game === "monodeal" || game === "lowdeck";

  const cardsHref = game === "monodeal" ? "/monodeal/cards" : game === "lowdeck" ? "/lowdeck/cards" : "/cards";
  const howToPlayHref = game === "monodeal" ? "/monodeal/how-to-play" : game === "lowdeck" ? "/lowdeck/how-to-play" : "/how-to-play";
  const rulesHref = game === "monodeal" ? "/monodeal/rules" : game === "lowdeck" ? "/lowdeck/rules" : "/rules";
  const lobbyHref = game === "lowdeck" ? "/lobby?game=least_count" : game === "monodeal" ? "/lobby?game=monodeal" : "/lobby";

  const primaryBrandColor = game === "lowdeck" ? "#facc15" : "var(--primary)";

  return (
    <>
      <header className="marketing-nav">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Brand game={game} />

        </div>

        {/* Desktop Center Links */}
        <nav className="marketing-nav-center" aria-label="Main navigation">
          {game === "arcade" ? (
            <></>
          ) : (
            <>
              <Link
                href={cardsHref}
                className={activeTab === "cards" ? "active" : ""}
                style={activeTab === "cards" ? { color: primaryBrandColor } : undefined}
              >
                {game === "lowdeck" ? "Deck Cards (52)" : "Card Catalogue (110)"}
              </Link>
              <Link
                href={howToPlayHref}
                className={activeTab === "how-to-play" ? "active" : ""}
                style={activeTab === "how-to-play" ? { color: primaryBrandColor } : undefined}
              >
                How to Play
              </Link>
              <Link
                href={rulesHref}
                className={activeTab === "rules" ? "active" : ""}
                style={activeTab === "rules" ? { color: primaryBrandColor } : undefined}
              >
                Official Rules
              </Link>
              <Link href={lobbyHref} style={{ color: primaryBrandColor, fontWeight: 700 }}>
                Play Game ➔
              </Link>
            </>
          )}
        </nav>

        {/* Actions (Desktop & Mobile) */}
        <div className="marketing-nav-actions">
          {/* Desktop-only Quick Icons */}
          <Link
            href={howToPlayHref}
            className="nav-action-btn desktop-only-action"
            aria-label="Help & Rules"
            title="How to Play & Rules"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              help
            </span>
          </Link>
          {/* Settings Icon (Desktop) */}
          <Link
            href="/settings"
            className={`nav-action-btn desktop-only-action ${activeTab === "settings" ? "active" : ""}`}
            aria-label="Settings"
            title="Game Settings"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              settings
            </span>
          </Link>

          {/* User Profile Avatar / Sign In */}
          <UserNav />

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className={`app-mobile-menu-btn marketing-mobile-menu-btn ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle mobile menu"
          >
            <div className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="app-mobile-overlay"
          style={{ display: "block" }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside
        className={`app-sidebar marketing-mobile-drawer ${
          mobileMenuOpen ? "app-sidebar--open" : ""
        }`}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <Brand game={game} className="brand brand--app" />
          <button
            type="button"
            className="app-mobile-menu-btn open"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{ width: "32px", height: "32px" }}
          >
            <div className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        {/* Profile Card if signed in */}
        {session?.user ? (
          <Link
            href="/profile"
            className="profile"
            style={{ textDecoration: "none", margin: "12px 0 20px" }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                referrerPolicy="no-referrer"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1.5px solid var(--primary)",
                }}
              />
            ) : (
              <span className="avatar avatar--you">
                {(session.user.name || session.user.email || "U")[0]?.toUpperCase()}
              </span>
            )}
            <div style={{ overflow: "hidden" }}>
              <strong
                style={{
                  display: "block",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {session.user.name || "Player"}
              </strong>
              <small
                style={{
                  color: "var(--muted)",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {session.user.email || "Signed In"}
              </small>
            </div>
            <span className="status-dot" style={{ background: "#10b981" }} />
          </Link>
        ) : (
          <Link
            href="/login"
            className="profile"
            style={{ textDecoration: "none", margin: "12px 0 20px" }}
            title="Sign in to your account"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="avatar avatar--you">GP</span>
            <div>
              <strong>Guest</strong>
              <small style={{ color: "var(--primary)" }}>Sign In →</small>
            </div>
            <span className="status-dot" />
          </Link>
        )}

        <Link
          className="new-game"
          href="/lobby"
          onClick={() => setMobileMenuOpen(false)}
        >
          ＋ New game
        </Link>

        {/* Mobile Navigation Links */}
        <nav className="app-nav" aria-label="Marketing mobile navigation">
          <Link
            href="/"
            className={activeTab === "home" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>⌂</span> Home
          </Link>
          <Link
            href="/cards"
            className={activeTab === "cards" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>🂠</span> Card Catalogue
          </Link>
          <Link
            href="/lobby"
            className={activeTab === "lobby" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>▦</span> Rooms & Lobby
          </Link>
          <Link
            href="/history"
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>◷</span> Match History
          </Link>
          <Link
            href="/how-to-play"
            className={activeTab === "how-to-play" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>📖</span> How to Play
          </Link>
          <Link
            href="/rules"
            className={activeTab === "rules" ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>⚖</span> Game Rules
          </Link>
          <a href="/#features" onClick={() => setMobileMenuOpen(false)}>
            <span>ℹ</span> About
          </a>
        </nav>

        <Link
          className={`settings-link ${activeTab === "settings" ? "active" : ""}`}
          href="/settings"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            settings
          </span>{" "}
          Game Settings
        </Link>
      </aside>
    </>
  );
}
