"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { BackButton } from "./back-button";

import { Brand } from "./brand";

export function AppShell({
  active,
  children,
}: {
  active: "lobby" | "play";
  children: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="app-shell">
      {/* Mobile Top Bar */}
      <header className="app-mobile-topbar">
        <Brand className="brand brand--app" />
        <button
          type="button"
          className={`app-mobile-menu-btn ${mobileMenuOpen ? "open" : ""}`}
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <div className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="app-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${mobileMenuOpen ? "app-sidebar--open" : ""}`}>
        <Brand className="brand brand--app" />
        {session?.user ? (
          <Link href="/profile" className="profile" style={{ textDecoration: "none" }} onClick={() => setMobileMenuOpen(false)}>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                referrerPolicy="no-referrer"
                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--primary)" }}
              />
            ) : (
              <span className="avatar avatar--you">
                {(session.user.name || session.user.email || "U")[0]?.toUpperCase()}
              </span>
            )}
            <div style={{ overflow: "hidden" }}>
              <strong style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {session.user.name || "Player"}
              </strong>
              <small style={{ color: "var(--muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", display: "block" }}>
                {session.user.email || "Signed In"}
              </small>
            </div>
            <span className="status-dot" style={{ background: "#10b981" }} />
          </Link>
        ) : (
          <Link href="/login" className="profile" style={{ textDecoration: "none" }} title="Sign in to your account" onClick={() => setMobileMenuOpen(false)}>
            <span className="avatar avatar--you">GP</span>
            <div>
              <strong>Guest</strong>
              <small style={{ color: "var(--primary)" }}>Sign In →</small>
            </div>
            <span className="status-dot" />
          </Link>
        )}
        <Link className="new-game" href="/lobby" onClick={() => setMobileMenuOpen(false)}>
          ＋ New game
        </Link>
        <nav className="app-nav" aria-label="Game navigation">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <span>⌂</span> Home
          </Link>
          <Link
            className={active === "lobby" ? "active" : ""}
            href="/lobby"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>▦</span> Rooms
          </Link>
          <Link
            className={active === "play" ? "active" : ""}
            href="/game"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>♠</span> Play
          </Link>
          <Link href="/cards" onClick={() => setMobileMenuOpen(false)}>
            <span>🂠</span> Cards
          </Link>
          <Link href="/history" onClick={() => setMobileMenuOpen(false)}>
            <span>◷</span> History
          </Link>
        </nav>
        <Link
          className="settings-link"
          href="/settings"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            settings
          </span>
          Settings
        </Link>
      </aside>

      <section className="app-stage">{children}</section>
    </div>
  );
}
