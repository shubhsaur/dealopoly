import React from "react";
import Link from "next/link";
import { MarketingNav } from "../_components/marketing-nav";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, users, eq } from "@dealopoly/db";
import { UserNav } from "../_components/user-nav";
import { BackButton } from "../_components/back-button";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch full user record from Neon Postgres
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const dbUser = userRows[0];
  const name = dbUser?.name ?? session.user.name ?? "Player";
  const email = dbUser?.email ?? session.user.email ?? "";
  const image = dbUser?.image ?? session.user.image ?? null;
  const gamesPlayed: number = Number(dbUser?.gamesPlayed ?? 0);
  const gamesWon: number = Number(dbUser?.gamesWon ?? 0);
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const customTag: string = dbUser?.customTag ?? `@${name}`;

  const memberSince = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div className="marketing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <MarketingNav activeTab="profile" />

      {/* Main Content */}
      <main className="profile-page-main">
        <div className="shell" style={{ maxWidth: "880px", margin: "0 auto" }}>
          <BackButton fallbackUrl="/" label="Back to Home" variant="subtle" style={{ marginBottom: "16px" }} />
          {/* Profile Header Card */}
          <div className="glass-panel profile-hero-card">
            <div className="profile-user-info">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="profile-avatar-img"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="user-avatar-badge profile-avatar-badge">
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="profile-user-details">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h1>{name}</h1>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.7rem",
                      background: "rgba(102, 223, 117, 0.15)",
                      color: "var(--green)",
                      border: "1px solid rgba(102, 223, 117, 0.3)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    PRO PLAYER
                  </span>
                </div>
                <p style={{ fontFamily: "var(--mono)", fontSize: "0.84rem", color: "var(--primary)", margin: "0 0 4px", overflowWrap: "break-word" }}>
                  {customTag}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--muted)" }}>
                  <span style={{ overflowWrap: "break-word", wordBreak: "break-all" }}>{email}</span>
                  {memberSince && <span>• Member since {memberSince}</span>}
                </div>
              </div>
            </div>

            <div className="profile-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/settings" className="button button--secondary" style={{ padding: "10px 18px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  settings
                </span>
                Game Settings
              </Link>
              <Link href="/lobby" className="button button--primary" style={{ padding: "10px 20px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
                Play Now
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="profile-stats-grid">
            {/* Games Played */}
            <div className="glass-panel profile-stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.78rem", fontFamily: "var(--mono)", color: "var(--muted)", fontWeight: 600 }}>
                  MATCHES PLAYED
                </span>
                <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "22px" }}>
                  sports_esports
                </span>
              </div>
              <div className="profile-stat-value">
                {gamesPlayed}
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--subtle)", marginTop: "6px" }}>
                Lifetime matches recorded
              </div>
            </div>

            {/* Games Won */}
            <div className="glass-panel profile-stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.78rem", fontFamily: "var(--mono)", color: "var(--muted)", fontWeight: 600 }}>
                  VICTORIES
                </span>
                <span className="material-symbols-outlined" style={{ color: "var(--green)", fontSize: "22px", fontVariationSettings: "'FILL' 1" }}>
                  emoji_events
                </span>
              </div>
              <div className="profile-stat-value" style={{ color: "var(--green)" }}>
                {gamesWon}
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--subtle)", marginTop: "6px" }}>
                Total 3-set Dealopoly wins
              </div>
            </div>

            {/* Win Rate */}
            <div className="glass-panel profile-stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.78rem", fontFamily: "var(--mono)", color: "var(--muted)", fontWeight: 600 }}>
                  WIN RATE
                </span>
                <span className="material-symbols-outlined" style={{ color: "var(--tertiary)", fontSize: "22px" }}>
                  percent
                </span>
              </div>
              <div className="profile-stat-value" style={{ color: "var(--tertiary)" }}>
                {winRate}%
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--subtle)", marginTop: "6px" }}>
                Performance across all rooms
              </div>
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="glass-panel profile-banner-card">
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 700 }}>Looking for past match logs?</h3>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.4 }}>
                View complete move-by-move histories and stats from previous games.
              </p>
            </div>
            <Link href="/history" className="button button--secondary" style={{ whiteSpace: "nowrap" }}>
              View Match History →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
