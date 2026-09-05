"use client";

import Link from "next/link";
import { MarketingNav } from "../_components/marketing-nav";
import { useState, useMemo } from "react";
import {
  CARD_CATALOGUE,
  TOTAL_CARDS_IN_DECK,
  COLOR_CONFIG,
  type CardColor,
  type CardType,
  type CardDefinition,
} from "@dealopoly/shared";
import { Card } from "../_components/card";

const TYPE_TABS: { label: string; value: CardType | "all"; count: number }[] = [
  { label: "All Cards", value: "all", count: TOTAL_CARDS_IN_DECK },
  {
    label: "Properties",
    value: "property",
    count: CARD_CATALOGUE.filter((c) => c.type === "property").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
  {
    label: "Wilds",
    value: "property-wild",
    count: CARD_CATALOGUE.filter((c) => c.type === "property-wild").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
  {
    label: "Actions",
    value: "action",
    count: CARD_CATALOGUE.filter((c) => c.type === "action").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
  {
    label: "Rent",
    value: "rent",
    count: CARD_CATALOGUE.filter((c) => c.type === "rent").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
  {
    label: "Money",
    value: "money",
    count: CARD_CATALOGUE.filter((c) => c.type === "money").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
];

const COLOR_FILTERS: { label: string; color: CardColor | "all" }[] = [
  { label: "All Colors", color: "all" },
  { label: "Brown", color: "brown" },
  { label: "Light Blue", color: "light-blue" },
  { label: "Pink", color: "pink" },
  { label: "Orange", color: "orange" },
  { label: "Red", color: "red" },
  { label: "Yellow", color: "yellow" },
  { label: "Green", color: "green" },
  { label: "Dark Blue", color: "dark-blue" },
  { label: "Railroad", color: "railroad" },
  { label: "Utility", color: "utility" },
];

import { UserNav } from "../_components/user-nav";
import { BackButton } from "../_components/back-button";
import { StandardCard } from "../_components/standard-card";
import { createLeastCountDeck, type LeastCountCard } from "@dealopoly/game-engine";

export default function CardCataloguePage() {
  const [selectedGame, setSelectedGame] = useState<"monodeal" | "least_count">("monodeal");
  const [selectedType, setSelectedType] = useState<CardType | "all">("all");
  const [selectedColor, setSelectedColor] = useState<CardColor | "all">("all");
  const [selectedSuit, setSelectedSuit] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const leastCountDeck = useMemo(() => createLeastCountDeck(2), []);

  const filteredLeastCountCards = useMemo(() => {
    return leastCountDeck.filter((c) => {
      if (selectedSuit !== "all" && c.suit !== selectedSuit) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return c.rank.toLowerCase().includes(query) || c.suit.toLowerCase().includes(query);
      }
      return true;
    });
  }, [leastCountDeck, selectedSuit, searchQuery]);

  const filteredCards = useMemo(() => {
    return CARD_CATALOGUE.filter((card) => {
      // Type filter
      if (selectedType !== "all" && card.type !== selectedType) {
        return false;
      }
      // Color filter
      if (selectedColor !== "all") {
        const isExactColor = card.primaryColor === selectedColor;
        const isSecondaryColor =
          "secondaryColor" in card && card.secondaryColor === selectedColor;
        if (!isExactColor && !isSecondaryColor) {
          return false;
        }
      }
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(query);
        const matchesDesc = card.description?.toLowerCase().includes(query);
        const matchesColor = card.primaryColor?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesColor) {
          return false;
        }
      }
      return true;
    });
  }, [selectedType, selectedColor, searchQuery]);

  const totalFilteredCopies = useMemo(() => {
    return filteredCards.reduce((acc, c) => acc + c.count, 0);
  }, [filteredCards]);

  return (
    <div className="catalogue-page">
      {/* Top Header Navigation */}
      <MarketingNav activeTab="cards" />

      {/* Main Container */}
      <main className="catalogue-container">
        {/* Page Title & Stats */}
        <section className="catalogue-header">
          <div className="catalogue-header-copy">
            <BackButton fallbackUrl="/" label="Back to Home" variant="subtle" style={{ marginBottom: "10px" }} />

            {/* Game Selector Switcher */}
            <div
              style={{
                display: "inline-flex",
                gap: "8px",
                margin: "0 0 14px",
                background: "rgba(15, 23, 42, 0.85)",
                padding: "4px",
                borderRadius: "999px",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedGame("monodeal")}
                className={`button button--sm ${selectedGame === "monodeal" ? "button--primary" : "button--ghost"}`}
                style={{ borderRadius: "999px", padding: "6px 16px", fontSize: "0.80rem" }}
              >
                🃏 Monodeal (110 Cards)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGame("least_count")}
                className={`button button--sm ${selectedGame === "least_count" ? "button--primary" : "button--ghost"}`}
                style={{ borderRadius: "999px", padding: "6px 16px", fontSize: "0.80rem" }}
              >
                🎯 Least Count (52 Cards)
              </button>
            </div>

            <h1>{selectedGame === "monodeal" ? "Monodeal Card Catalogue" : "Least Count Deck Catalogue"}</h1>
            <p>
              {selectedGame === "monodeal"
                ? "Explore the complete 110-card deck with authentic color schemes, rent multipliers, and action mechanics."
                : "Browse the full standard 52-card suit deck with King=0 pts, Ace=1 pt, Jack=11 pts, Queen=12 pts."}
            </p>
          </div>

          <div className="catalogue-stats-box">
            <div>
              <div className="catalogue-stat-val catalogue-stat-val--blue">
                {selectedGame === "monodeal" ? totalFilteredCopies : filteredLeastCountCards.length}
              </div>
              <div className="catalogue-stat-lbl">Cards Shown</div>
            </div>
            <div className="catalogue-stat-divider" />
            <div>
              <div className="catalogue-stat-val catalogue-stat-val--green">
                {selectedGame === "monodeal" ? filteredCards.length : filteredLeastCountCards.length}
              </div>
              <div className="catalogue-stat-lbl">Unique Types</div>
            </div>
            <div className="catalogue-stat-divider" />
            <div>
              <div className="catalogue-stat-val" style={{ color: "var(--tertiary)" }}>
                {selectedGame === "monodeal" ? 110 : 52}
              </div>
              <div className="catalogue-stat-lbl">Total Deck</div>
            </div>
          </div>
        </section>

        {/* Category Tabs / Filters */}
        {selectedGame === "monodeal" ? (
          <>
            <div className="catalogue-tabs" role="tablist">
              {TYPE_TABS.map((tab) => {
                const isActive = selectedType === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedType(tab.value)}
                    className={`catalogue-tab-btn ${
                      isActive ? "catalogue-tab-btn--active" : ""
                    }`}
                    role="tab"
                    aria-selected={isActive}
                  >
                    <span>{tab.label}</span>
                    <span className="catalogue-tab-count">{tab.count}</span>
                  </button>
                );
              })}
            </div>

            {/* Filters Toolbar */}
            <div className="catalogue-toolbar">
              {/* Color Chips */}
              <div className="catalogue-colors">
                {COLOR_FILTERS.map((f) => {
                  const isSelected = selectedColor === f.color;
                  const config =
                    f.color !== "all" ? COLOR_CONFIG[f.color] : undefined;
                  return (
                    <button
                      key={f.color}
                      onClick={() => setSelectedColor(f.color)}
                      className={`catalogue-color-chip ${
                        isSelected ? "catalogue-color-chip--active" : ""
                      }`}
                    >
                      {config && (
                        <span
                          className="color-dot"
                          style={{ backgroundColor: config.hex }}
                        />
                      )}
                      <span>{f.label}</span>
                    </button>
                  );
                })}
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
                  placeholder="Search cards, rent, effects..."
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
          </>
        ) : (
          /* Least Count Suit Filter Toolbar */
          <div className="catalogue-toolbar" style={{ margin: "16px 0 24px" }}>
            <div className="catalogue-colors">
              {[
                { id: "all", label: "All Suits (52)", icon: "🎴" },
                { id: "spades", label: "♠ Spades (13)", icon: "♠" },
                { id: "hearts", label: "♥ Hearts (13)", icon: "♥" },
                { id: "diamonds", label: "♦ Diamonds (13)", icon: "♦" },
                { id: "clubs", label: "♣ Clubs (13)", icon: "♣" },
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
                placeholder="Search rank (K, Q, A, 7)..."
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
        )}

        {/* Card Gallery Grid */}
        {selectedGame === "least_count" ? (
          <div className="catalogue-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "20px" }}>
            {filteredLeastCountCards.map((card) => (
              <article key={card.instanceId} className="catalogue-card-container" style={{ alignItems: "center" }}>
                <StandardCard
                  card={card}
                  size="md"
                  showPointsBadge
                />
                <div className="catalogue-card-footer" style={{ marginTop: "8px" }}>
                  <span className="catalogue-value-badge" style={{ color: card.rank === "K" ? "#facc15" : "#38bdf8" }}>
                    {card.rank === "K" ? "👑 0 PTS" : `${card.points} PTS`}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="catalogue-empty">
            <span className="material-symbols-outlined catalogue-empty-icon">
              sentiment_dissatisfied
            </span>
            <h3>No cards matched your filter</h3>
            <p style={{ color: "var(--muted)", marginTop: "4px" }}>
              Try clearing your search query or choosing another color/category.
            </p>
          </div>
        ) : (
          <div className="catalogue-grid">
            {filteredCards.map((card) => (
              <article key={card.id} className="catalogue-card-container">
                {/* Visual Dealopoly Card */}
                <Card
                  card={card}
                  size="md"
                  isInteractive={false}
                />

                {/* Card Meta Footer */}
                <div className="catalogue-card-footer">
                  <span className="catalogue-copy-badge">
                    {card.count} {card.count === 1 ? "copy" : "copies"}
                  </span>
                  <span className="catalogue-value-badge">
                    {card.value > 0 ? `$${card.value}M Bank` : "No $ Value"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
