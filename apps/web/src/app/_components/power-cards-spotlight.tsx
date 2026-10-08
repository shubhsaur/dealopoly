"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "./card";
import { CARD_CATALOGUE, type CardDefinition } from "@dealopoly/shared";

interface SpotlightCardItem {
  id: string;
  badge: string;
  badgeColor: string;
  role: string;
  title: string;
  valueText: string;
  powerDescription: string;
  tacticalTip: string;
  bgGlow: string;
  counteredBy: string;
}

const SPOTLIGHT_CARDS: SpotlightCardItem[] = [
  {
    id: "action-deal-breaker",
    badge: "GAME CHANGER",
    badgeColor: "#ef4444",
    role: "The Ultimate Heist",
    title: "Deal Breaker",
    valueText: "$5M Bank Value",
    powerDescription:
      "Steal an entire completed property set from any rival player, including attached Houses and Hotels. Can instantly turn a loss into victory!",
    tacticalTip:
      "Wait until an opponent thinks they have secured their 3rd set. Swoop in with Deal Breaker on your turn to steal the winning set for yourself.",
    bgGlow: "rgba(239, 68, 68, 0.18)",
    counteredBy: "Blocked by: Just Say No",
  },
  {
    id: "action-just-say-no",
    badge: "IMMUNITY",
    badgeColor: "#10b981",
    role: "The Shield of Defiance",
    title: "Just Say No",
    valueText: "$4M Bank Value",
    powerDescription:
      "Play at any time—even during an opponent's turn—to cancel any action card used against you. Can even be played to cancel another Just Say No!",
    tacticalTip:
      "Always save at least one Just Say No in your hand to defend your completed sets from Deal Breakers or crushing Double Rent claims.",
    bgGlow: "rgba(16, 185, 129, 0.18)",
    counteredBy: "Blocked by: Another Just Say No!",
  },
  {
    id: "action-double-the-rent",
    badge: "MULTIPLIER",
    badgeColor: "#eab308",
    role: "The Bank Buster",
    title: "Double the Rent",
    valueText: "$1M Bank Value",
    powerDescription:
      "Play alongside any Rent card to multiply the demanded rent by 2x. Combine with complete sets or houses to wipe out an opponent's entire bank.",
    tacticalTip:
      "Stack two Double the Rent cards on a single Rent play for a 4x multiplier, forcing opponents to hand over valuable table properties to pay you.",
    bgGlow: "rgba(234, 179, 8, 0.18)",
    counteredBy: "Blocked by: Just Say No",
  },
  {
    id: "action-sly-deal",
    badge: "TACTICAL THEFT",
    badgeColor: "#38bdf8",
    role: "The Property Snatch",
    title: "Sly Deal",
    valueText: "$3M Bank Value",
    powerDescription:
      "Steal any single property card from an opponent's collection that is not part of a full completed set. Perfect for breaking up their plans.",
    tacticalTip:
      "Target rival wildcards or key 2-card sets (like Dark Blue or Brown) right before they complete them.",
    bgGlow: "rgba(56, 189, 248, 0.18)",
    counteredBy: "Blocked by: Just Say No",
  },
];

export function PowerCardsSpotlight() {
  const [selectedId, setSelectedId] = useState<string>("action-deal-breaker");

  const activeCardConfig =
    SPOTLIGHT_CARDS.find((c) => c.id === selectedId) ?? SPOTLIGHT_CARDS[0]!;
  const activeCardDefinition = CARD_CATALOGUE.find((c) => c.id === activeCardConfig.id);

  return (
    <section
      id="cards"
      className="power-cards-section shell"
      aria-label="Dealopoly power cards arsenal"
    >
      <div
        className="section-header"
        style={{ textAlign: "center", marginBottom: "36px" }}
      >
        <p className="kicker" style={{ color: "#ef4444", letterSpacing: "0.12em" }}>
          THE ARSENAL
        </p>
        <h2
          style={{
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            fontWeight: 900,
            margin: "8px 0 14px",
          }}
        >
          Master the{" "}
          <span
            className="glow-word"
            style={{ color: "#ef4444", textShadow: "0 0 30px rgba(239,68,68,0.5)" }}
          >
            Power Cards
          </span>
        </h2>
        <p
          style={{
            color: "#94a3b8",
            maxWidth: "660px",
            margin: "0 auto",
            fontSize: "1.05rem",
            lineHeight: 1.6,
          }}
        >
          Dealopoly isn't just about buying properties—it's about ruthless counter-play,
          tactical heists, and devastating multiplier strikes.
        </p>
      </div>

      {/* Interactive Tabs / Selector */}
      <div className="power-cards-selector">
        {SPOTLIGHT_CARDS.map((card) => {
          const isSelected = card.id === selectedId;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedId(card.id)}
              className={`power-card-tab ${isSelected ? "power-card-tab--active" : ""}`}
              style={{
                borderColor: isSelected ? card.badgeColor : "rgba(255, 255, 255, 0.08)",
                boxShadow: isSelected ? `0 0 20px ${card.badgeColor}33` : "none",
              }}
            >
              <span
                className="power-card-tab-dot"
                style={{ background: card.badgeColor }}
              />
              <span className="power-card-tab-title">{card.title}</span>
              <span className="power-card-tab-role" style={{ color: card.badgeColor }}>
                {card.role}
              </span>
            </button>
          );
        })}
      </div>

      {/* Featured Card Stage */}
      <div
        className="power-card-stage"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${activeCardConfig.bgGlow} 0%, rgba(17, 20, 21, 0.85) 70%)`,
          borderColor: `${activeCardConfig.badgeColor}40`,
        }}
      >
        {/* Left: Card Render */}
        <div className="power-card-visual-wrap">
          <div className="power-card-card-box">
            {activeCardDefinition ? (
              <Card card={activeCardDefinition} size="md" className="power-card-item" />
            ) : (
              <div className="power-card-placeholder">Card Art</div>
            )}
          </div>
          <div className="power-card-counter-tag">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px", color: "#10b981" }}
            >
              shield
            </span>
            <span>{activeCardConfig.counteredBy}</span>
          </div>
        </div>

        {/* Right: Card Details & Tactical Analysis */}
        <div className="power-card-content">
          <div className="power-card-meta-top">
            <span
              className="power-card-badge"
              style={{
                color: activeCardConfig.badgeColor,
                background: `${activeCardConfig.badgeColor}18`,
                borderColor: `${activeCardConfig.badgeColor}40`,
              }}
            >
              {activeCardConfig.badge}
            </span>
            <span className="power-card-value">{activeCardConfig.valueText}</span>
          </div>

          <h3 className="power-card-headline">{activeCardConfig.title}</h3>
          <p className="power-card-role" style={{ color: activeCardConfig.badgeColor }}>
            {activeCardConfig.role}
          </p>

          <p className="power-card-description">{activeCardConfig.powerDescription}</p>

          {/* Tactical Advice Box */}
          <div
            className="power-card-tactics-box"
            style={{ borderLeftColor: activeCardConfig.badgeColor }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", color: activeCardConfig.badgeColor }}
              >
                psychology
              </span>
              <strong
                style={{
                  color: activeCardConfig.badgeColor,
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Winning Strategy
              </strong>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                color: "#e2e8f0",
                lineHeight: 1.55,
              }}
            >
              {activeCardConfig.tacticalTip}
            </p>
          </div>

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              href="/cards"
              className="button button--secondary"
              style={{
                padding: "10px 18px",
                fontSize: "0.95rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                style
              </span>
              Browse Complete 110 Card Catalogue ➔
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
