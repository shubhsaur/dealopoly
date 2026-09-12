"use client";

import Link from "next/link";
import { MarketingNav } from "../../_components/marketing-nav";
import { MarketingFooter } from "../../_components/marketing-footer";
import { useState, useMemo, useEffect } from "react";
import { createLeastCountDeck, type LeastCountCard, type Suit } from "@dealopoly/game-engine";
import { StandardCard } from "../../_components/standard-card";
import { BackButton } from "../../_components/back-button";

const SUIT_NAMES: Record<Suit, string> = {
  spades: "Spades",
  hearts: "Hearts",
  diamonds: "Diamonds",
  clubs: "Clubs",
};

const SUIT_ICONS: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

function getRankDescription(rank: string, points: number) {
  if (rank === "K") {
    return {
      title: "King (The 0-Point Crown Jewel)",
      badge: "👑 0 PTS • ULTIMATE WINNER",
      strategy:
        "The King is the most powerful card in Lowdeck. Contributing 0 points to your total hand count, holding Kings allows you to declare a winning SHOW with minimal risk.",
      comboTip: "Can be discarded as a single card or as a matching pair (e.g., Two Kings).",
    };
  }
  if (rank === "A") {
    return {
      title: "Ace (1-Point Anchor)",
      badge: "⭐ 1 PT • ULTRA LOW",
      strategy:
        "Aces are critical for lowering your total hand points to the ≤ 5 SHOW threshold. Pair with Kings to stay nearly untouchable.",
      comboTip: "Can be combined in same-suit sequences (e.g. A-2-3) or dropped as multi-card rank pairs.",
    };
  }
  if (rank === "Q") {
    return {
      title: "Queen (12-Point Heavyweight)",
      badge: "⚠️ 12 PTS • HIGH PENALTY",
      strategy:
        "The highest point card in the deck (12 points). Discard or pair Queens early in the game to avoid catching a heavy penalty when an opponent calls SHOW.",
      comboTip: "Pair two Queens together to drop 24 points in a single turn!",
    };
  }
  if (rank === "J") {
    return {
      title: "Jack (11-Point Danger)",
      badge: "⚠️ 11 PTS • HIGH DANGER",
      strategy:
        "Holding 11 points, Jacks are second only to Queens in penalty weight. Prioritize discarding them or building runs.",
      comboTip: "Look to create sequence runs (e.g. 10-J-Q of same suit) to clear multiple high cards at once.",
    };
  }
  return {
    title: `${rank} of Lowdeck (${points} Points)`,
    badge: `${points} PTS • STANDARD PIP`,
    strategy: `Adds ${points} points to your hand total. Aim to pair matching ${rank}s or form consecutive same-suit runs to shed them efficiently.`,
    comboTip: `Pairs of ${rank}s or 3+ consecutive suited cards drop your hand count fast.`,
  };
}

export default function LowdeckCardCataloguePage() {
  const [selectedSuit, setSelectedSuit] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectedCard, setInspectedCard] = useState<LeastCountCard | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInspectedCard(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Single 52-card standard deck (unique cards)
  const uniqueDeck = useMemo(() => {
    const doubleDeck = createLeastCountDeck(1);
    const seen = new Set<string>();
    return doubleDeck.filter((c) => {
      const key = `${c.rank}-${c.suit}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const filteredCards = useMemo(() => {
    return uniqueDeck.filter((c) => {
      // Suit filter
      if (selectedSuit !== "all" && c.suit !== selectedSuit) return false;

      // Category filter
      if (selectedCategory === "kings" && c.rank !== "K") return false;
      if (selectedCategory === "aces" && c.rank !== "A") return false;
      if (selectedCategory === "face" && !["K", "Q", "J"].includes(c.rank)) return false;
      if (selectedCategory === "high" && c.points < 10) return false;
      if (selectedCategory === "low" && c.points > 5) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const suitName = SUIT_NAMES[c.suit].toLowerCase();
        const rankStr = c.rank.toLowerCase();
        return rankStr.includes(query) || suitName.includes(query) || `${c.points}`.includes(query);
      }
      return true;
    });
  }, [uniqueDeck, selectedSuit, selectedCategory, searchQuery]);


  return (
    <div className="catalogue-page">
      {/* Lowdeck Navigation */}
      <MarketingNav game="lowdeck" activeTab="cards" />

      {/* Main Container */}
      <main className="catalogue-container">
        {/* Page Title & Stats */}
        <section className="catalogue-header">
          <div className="catalogue-header-copy">
            <BackButton fallbackUrl="/lowdeck" label="Back to Lowdeck" variant="subtle" style={{ marginBottom: "10px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "1.4rem" }}>👑</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "0.85rem", fontWeight: 700, color: "#facc15", letterSpacing: "0.08em" }}>
                OFFICIAL 52-CARD DECK • LUXURY OBSIDIAN &amp; NEON HOLOGRAPHIC
              </span>
            </div>
            <h1>Lowdeck Card Catalogue</h1>
            <p>
              Inspect the complete 52-card suit deck with luxury obsidian cardstock, multi-hued holographic neon rim, precision Art-Deco royalty vectors, and official Lowdeck scoring: <strong>King = 0 pts</strong> (the golden jackpot), <strong>Ace = 1 pt</strong>, <strong>Jack = 11 pts</strong>, <strong>Queen = 12 pts</strong>. Click any card to inspect its full stats and strategy.
            </p>
          </div>

          <div className="catalogue-stats-box">
            <div>
              <div className="catalogue-stat-val catalogue-stat-val--blue">
                {filteredCards.length}
              </div>
              <div className="catalogue-stat-lbl">Cards Shown</div>
            </div>
            <div className="catalogue-stat-divider" />
            <div>
              <div className="catalogue-stat-val catalogue-stat-val--green">
                {selectedSuit === "all" ? "4 Suits" : SUIT_NAMES[selectedSuit as Suit]}
              </div>
              <div className="catalogue-stat-lbl">Active Suit</div>
            </div>
            <div className="catalogue-stat-divider" />
            <div>
              <div className="catalogue-stat-val" style={{ color: "#facc15" }}>
                0 PTS
              </div>
              <div className="catalogue-stat-lbl">King Value</div>
            </div>
          </div>
        </section>

        {/* Filter Toolbars */}
        <div className="catalogue-toolbar" style={{ margin: "16px 0 20px" }}>
          {/* Suit Filter Buttons */}
          <div className="catalogue-colors">
            {[
              { id: "all", label: "All Suits (52)" },
              { id: "spades", label: "♠ Spades (13)" },
              { id: "hearts", label: "♥ Hearts (13)" },
              { id: "diamonds", label: "♦ Diamonds (13)" },
              { id: "clubs", label: "♣ Clubs (13)" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSuit(s.id)}
                className={`catalogue-color-chip ${selectedSuit === s.id ? "catalogue-color-chip--active" : ""}`}
                style={{ padding: "6px 14px" }}
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="catalogue-search-wrap">
            <span className="material-symbols-outlined catalogue-search-icon">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rank (K, Q, A, 7) or suit..."
              className="catalogue-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="catalogue-search-clear"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  close
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
          {[
            { id: "all", label: "All Cards" },
            { id: "kings", label: "👑 Kings (0 Pts)" },
            { id: "aces", label: "⭐ Aces (1 Pt)" },
            { id: "face", label: "🎭 Face Cards (K, Q, J)" },
            { id: "low", label: "🟢 Low Range (≤ 5 Pts)" },
            { id: "high", label: "🔴 High Danger (10–12 Pts)" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`button ${selectedCategory === cat.id ? "button--primary" : "button--secondary"}`}
              style={{ padding: "6px 14px", fontSize: "0.82rem", borderRadius: "999px" }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Card Gallery Grid */}
        <div
          className="catalogue-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "24px",
            justifyItems: "center",
          }}
        >
          {filteredCards.map((card) => {
            const isKing = card.rank === "K";
            return (
              <article
                key={`${card.rank}-${card.suit}`}
                className="catalogue-card-container"
                onClick={() => setInspectedCard(card)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "12px",
                  background: "rgba(18, 24, 38, 0.6)",
                  border: isKing ? "1px solid rgba(250, 204, 21, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                <StandardCard
                  card={card}
                  size="md"
                  showPointsBadge={true}
                />
                <div className="catalogue-card-footer" style={{ marginTop: "12px", textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#f8fafc", marginBottom: "2px" }}>
                    {card.rank} of {SUIT_NAMES[card.suit]}
                  </div>
                  <span
                    className="catalogue-value-badge"
                    style={{
                      color: isKing ? "#facc15" : card.points <= 5 ? "#4ade80" : "#fb7185",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                    }}
                  >
                    {isKing ? "👑 0 POINTS" : `${card.points} POINTS`}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {filteredCards.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--muted)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "48px", opacity: 0.5, marginBottom: "12px" }}>
              search_off
            </span>
            <h3>No matching Lowdeck cards found</h3>
            <p>Try adjusting your search query or suit filters above.</p>
          </div>
        )}

        {/* Interactive High-Res Card Inspector Modal */}
        {inspectedCard && (() => {
          const desc = getRankDescription(inspectedCard.rank, inspectedCard.points);
          const isKing = inspectedCard.rank === "K";
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(4, 6, 12, 0.85)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
              onClick={() => setInspectedCard(null)}
            >
              <div
                style={{
                  position: "relative",
                  maxWidth: "680px",
                  width: "100%",
                  background: "radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 70%, #090d16 100%)",
                  border: isKing ? "2px solid #facc15" : "1px solid rgba(56, 189, 248, 0.4)",
                  boxShadow: isKing
                    ? "0 0 40px rgba(250, 204, 21, 0.35), 0 25px 50px -12px rgba(0, 0, 0, 0.9)"
                    : "0 0 35px rgba(56, 189, 248, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.9)",
                  borderRadius: "28px",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "32px",
                  flexWrap: "wrap",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setInspectedCard(null)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  aria-label="Close inspector"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
                </button>

                {/* Left: Large High-Res Card */}
                <div style={{ flexShrink: 0, display: "flex", justifyContent: "center" }}>
                  <StandardCard card={inspectedCard} size="lg" showPointsBadge={true} />
                </div>

                {/* Right: Detailed Card Stats & Strategy */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      background: isKing ? "rgba(250, 204, 21, 0.2)" : "rgba(56, 189, 248, 0.15)",
                      color: isKing ? "#facc15" : "#38bdf8",
                      fontSize: "0.76rem",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      marginBottom: "10px",
                    }}
                  >
                    {desc.badge}
                  </span>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#ffffff", marginBottom: "4px" }}>
                    {inspectedCard.rank} of {SUIT_NAMES[inspectedCard.suit]}
                  </h2>
                  <div style={{ fontSize: "0.95rem", color: "#cbd5e1", marginBottom: "16px" }}>
                    Lowdeck Value:{" "}
                    <strong style={{ color: isKing ? "#facc15" : inspectedCard.points <= 5 ? "#4ade80" : "#fb7185" }}>
                      {inspectedCard.points} Points
                    </strong>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "16px" }}>
                    {desc.strategy}
                  </p>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: "rgba(11, 15, 25, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      fontSize: "0.82rem",
                      color: "#cbd5e1",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: "#facc15", display: "block", marginBottom: "4px" }}>
                      💡 Strategy &amp; Combo Tip:
                    </strong>
                    {desc.comboTip}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      {/* Footer */}
      <MarketingFooter game="lowdeck" />
    </div>
  );
}
