"use client";

import React from "react";
import { COLOR_CONFIG } from "@dealopoly/shared";
import type { CardProps } from "./types";
import { MonopolyMSymbol, HasbroChevronBackground, HasbroActionHeaderGlyph, HasbroGoWordGlyph, HasbroPassGoArrowGlyph, HasbroBirthdayCakeGlyph, HasbroHouseGlyph, HasbroHotelGlyph, HasbroMoneySacksGlyph, HasbroJustSayNoGlyph, HasbroSlyDealGlyph, HasbroDebtCollectorGlyph, HasbroDealBreakerGlyph, HasbroForcedDealGlyph } from "./glyphs";

export const HasbroPassGoCard = React.memo(function HasbroPassGoCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 1;

  return (
    <div
      className={`hasbro-passgo-card hasbro-passgo-card--${size} ${
        isInteractive ? "hasbro-passgo-card--interactive" : ""
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      {/* Inner Black Frame with Subtle Iridescent Pastel Guilloche */}
      <div className="hasbro-passgo-frame">
        {/* Pastel Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-passgo-guilloche"
          strokeColor="#B8A7BF"
        />

        {/* Top-Left Circular Coin Badge: ₥1 */}
        <div className="hasbro-passgo-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-passgo-header-row">
          <HasbroActionHeaderGlyph className="hasbro-passgo-action-svg" />
        </div>

        {/* Central White Circular Feature Badge */}
        <div className="hasbro-passgo-circle-badge">
          <span className="hasbro-passgo-pass-text">PASS</span>
          <div className="hasbro-passgo-go-wrap">
            <HasbroGoWordGlyph className="hasbro-passgo-go-svg" />
          </div>
          <div className="hasbro-passgo-arrow-wrap">
            <HasbroPassGoArrowGlyph className="hasbro-passgo-arrow-svg" />
          </div>
        </div>

        {/* Bottom Rules Description ("Draw 2 cards.") */}
        <div className="hasbro-passgo-desc">
          <span>Draw 2 cards.</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal It's Your Birthday Action Card
 * Faithfully matches official Hasbro reference photo (vibrant pink cardstock, ₥2 coin, 3D ACTION, IT'S YOUR BIRTHDAY badge with cake, Collect ₥2 from each player.)
 */

export const HasbroBirthdayCard = React.memo(function HasbroBirthdayCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 2;

  return (
    <div
      className={`hasbro-birthday-card hasbro-birthday-card--${size} ${
        isInteractive ? "hasbro-birthday-card--interactive" : ""
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      {/* Inner Black Frame with Subtle Pink Herringbone Guilloche */}
      <div className="hasbro-birthday-frame">
        {/* Pink Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-birthday-guilloche"
          strokeColor="rgba(200, 20, 80, 0.2)"
        />

        {/* Top-Left Circular Coin Badge: ₥2 */}
        <div className="hasbro-birthday-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-birthday-header-row">
          <HasbroActionHeaderGlyph className="hasbro-birthday-action-svg" />
        </div>

        {/* Central Circular Pink Feature Badge */}
        <div className="hasbro-birthday-circle-badge">
          <span className="hasbro-birthday-title-top">IT'S YOUR</span>
          <span className="hasbro-birthday-title-bottom">BIRTHDAY</span>
          <div className="hasbro-birthday-cake-wrap">
            <HasbroBirthdayCakeGlyph className="hasbro-birthday-cake-svg" />
          </div>
        </div>

        {/* Bottom Rules Description ("Collect ₥2 from each player.") */}
        <div className="hasbro-birthday-desc">
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <span>Collect</span>
            <MonopolyMSymbol size="0.82em" style={{ margin: "0 0.04em 0 0.16em" }} />
            <span>2 from</span>
          </span>
          <br />
          <span>each player.</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal House Action Card
 * Faithfully matches official Hasbro House reference photo (cyan cardstock, ₥3 coin, 3D ACTION, HOUSE badge with green house, Place on a complete property set to add ₥3 to rent. May not be placed on railroads or utilities.)
 */

export const HasbroHouseCard = React.memo(function HasbroHouseCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 3;

  return (
    <div
      className={`hasbro-house-card hasbro-house-card--${size} ${
        isInteractive ? "hasbro-house-card--interactive" : ""
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      {/* Inner Black Frame with Subtle Cyan Herringbone Guilloche */}
      <div className="hasbro-house-frame">
        {/* Cyan Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-house-guilloche"
          strokeColor="rgba(0, 140, 200, 0.2)"
        />

        {/* Top-Left Circular Coin Badge: ₥3 */}
        <div className="hasbro-house-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-house-header-row">
          <HasbroActionHeaderGlyph className="hasbro-house-action-svg" />
        </div>

        {/* Central Circular Cyan Feature Badge */}
        <div className="hasbro-house-circle-badge">
          <div className="hasbro-house-glyph-wrap">
            <HasbroHouseGlyph className="hasbro-house-glyph-svg" />
          </div>
          <span className="hasbro-house-title">HOUSE</span>
        </div>

        {/* Bottom Rules Description */}
        <div className="hasbro-house-desc">
          <div className="hasbro-house-desc-primary">
            <span>Place on a complete</span>
            <br />
            <span>property set to</span>
            <br />
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <span>add</span>
              <MonopolyMSymbol size="0.82em" style={{ margin: "0 0.04em 0 0.16em" }} />
              <span>3 to rent.</span>
            </span>
          </div>
          <div className="hasbro-house-desc-secondary">
            <span>May not be placed on</span>
            <br />
            <span>railroads or utilities.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Hotel Action Card
 * Faithfully matches official Hasbro Hotel reference photo (lime green cardstock, ₥4 coin, 3D ACTION, HOTEL badge with red hotel, Place on a complete property set that has a house to add ₥4 to rent. The house stays.)
 */

export const HasbroHotelCard = React.memo(function HasbroHotelCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 4;

  return (
    <div
      className={`hasbro-hotel-card hasbro-hotel-card--${size} ${
        isInteractive ? "hasbro-hotel-card--interactive" : ""
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      {/* Inner Black Frame with Subtle Lime Herringbone Guilloche */}
      <div className="hasbro-hotel-frame">
        {/* Lime Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-hotel-guilloche"
          strokeColor="rgba(80, 140, 20, 0.25)"
        />

        {/* Top-Left Circular Coin Badge: ₥4 */}
        <div className="hasbro-hotel-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-hotel-header-row">
          <HasbroActionHeaderGlyph className="hasbro-hotel-action-svg" />
        </div>

        {/* Central Circular Lime Feature Badge */}
        <div className="hasbro-hotel-circle-badge">
          <div className="hasbro-hotel-glyph-wrap">
            <HasbroHotelGlyph className="hasbro-hotel-glyph-svg" />
          </div>
          <span className="hasbro-hotel-title">HOTEL</span>
        </div>

        {/* Bottom Rules Description */}
        <div className="hasbro-hotel-desc">
          <div className="hasbro-hotel-desc-primary">
            <span>Place on a complete</span>
            <br />
            <span>property set that has a</span>
            <br />
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <span>house to add</span>
              <MonopolyMSymbol size="0.82em" style={{ margin: "0 0.04em 0 0.16em" }} />
              <span>4 to rent.</span>
            </span>
          </div>
          <div className="hasbro-hotel-desc-secondary">
            <span>The house stays.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Double The Rent Action Card
 * Faithfully matches official Hasbro reference photo (cream cardstock, ₥1 coin, 3D ACTION, DOUBLE THE RENT badge with money sacks, Play with a rent card. Collect double the rent!)
 */

export const HasbroDoubleTheRentCard = React.memo(function HasbroDoubleTheRentCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 1;

  return (
    <div
      className={`hasbro-double-rent-card hasbro-double-rent-card--${size} ${
        isInteractive ? "hasbro-double-rent-card--interactive" : "hasbro-double-rent-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-double-rent-frame">
        {/* Iridescent Pastel Chevron Security Guilloche Pattern */}
        <HasbroChevronBackground
          id="hasbro-double-rent-guilloche"
          strokeColor="rgba(30, 120, 80, 0.12)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥1 */}
        <div className="hasbro-double-rent-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-double-rent-header-row">
          <HasbroActionHeaderGlyph className="hasbro-double-rent-action-svg" />
        </div>

        {/* Central Circular White Badge with Money Sacks */}
        <div className="hasbro-double-rent-circle-badge">
          <HasbroMoneySacksGlyph style={{ width: "6.6em", height: "4.8em", marginTop: "0.2em" }} />
          <div className="hasbro-double-rent-title-wrap">
            <span className="hasbro-double-rent-line1">DOUBLE</span>
            <span className="hasbro-double-rent-line2">THE RENT</span>
          </div>
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-double-rent-desc">
          <span>Play with a rent card.</span>
          <br />
          <span>Collect double the rent!</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Just Say No Action Card
 * Faithfully matches official Hasbro reference photo (vibrant grass green cardstock, ₥4 coin, 3D ACTION, JUST SAY NO badge with folded-arms Pennybags, Cancel an action card played against you.)
 */

export const HasbroJustSayNoCard = React.memo(function HasbroJustSayNoCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 4;

  return (
    <div
      className={`hasbro-justsayno-card hasbro-justsayno-card--${size} ${
        isInteractive ? "hasbro-justsayno-card--interactive" : "hasbro-justsayno-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-justsayno-frame">
        {/* Subtle Spring Green Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-justsayno-guilloche"
          strokeColor="rgba(40, 110, 15, 0.22)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥4 */}
        <div className="hasbro-justsayno-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title (White letters with green extrusion) */}
        <div className="hasbro-justsayno-header-row">
          <HasbroActionHeaderGlyph
            className="hasbro-justsayno-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#509C12"
            strokeColor="#44860E"
            strokeWidth={2.4}
          />
        </div>

        {/* Central Circular Green Feature Badge */}
        <div className="hasbro-justsayno-circle-badge">
          <HasbroJustSayNoGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-justsayno-desc">
          <span>Cancel an action card</span>
          <br />
          <span>played against you.</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Sly Deal Action Card
 * Faithfully matches official Hasbro reference photo (sky blue cardstock, ₥3 coin, 3D ACTION, SLY DEAL circular badge with burglar Uncle Pennybags, Steal one property from any player & place it in front of you. You may not steal a property that's part of a complete set.)
 */

export const HasbroSlyDealCard = React.memo(function HasbroSlyDealCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 3;

  return (
    <div
      className={`hasbro-slydeal-card hasbro-slydeal-card--${size} ${
        isInteractive ? "hasbro-slydeal-card--interactive" : "hasbro-slydeal-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-slydeal-frame">
        {/* Subtle Sky Blue Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-slydeal-guilloche"
          strokeColor="rgba(40, 130, 180, 0.18)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥3 */}
        <div className="hasbro-slydeal-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-slydeal-header-row">
          <HasbroActionHeaderGlyph
            className="hasbro-slydeal-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#72C4ED"
            strokeColor="#56B2E0"
            strokeWidth={2.4}
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        {/* Central Circular Baby-Blue Feature Badge */}
        <div className="hasbro-slydeal-circle-badge">
          <HasbroSlyDealGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-slydeal-desc">
          <div className="hasbro-slydeal-desc-primary">
            <span>Steal one property</span>
            <br />
            <span>from any player &amp; place</span>
            <br />
            <span>it in front of you.</span>
          </div>
          <div className="hasbro-slydeal-desc-secondary">
            <span>You may not steal a property</span>
            <br />
            <span>that&apos;s part of a complete set.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Debt Collector Action Card
 * Faithfully matches official Hasbro reference photo (sky blue cardstock, ₥3 coin, 3D ACTION, DEBT COLLECTOR circular badge with Uncle Pennybags holding walking cane and money wad, Collect ₥5 from any player.)
 */

export const HasbroDebtCollectorCard = React.memo(function HasbroDebtCollectorCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 3;

  return (
    <div
      className={`hasbro-debtcollector-card hasbro-debtcollector-card--${size} ${
        isInteractive ? "hasbro-debtcollector-card--interactive" : "hasbro-debtcollector-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-debtcollector-frame">
        {/* Subtle Sky Blue Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-debtcollector-guilloche"
          strokeColor="rgba(40, 130, 180, 0.18)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥3 */}
        <div className="hasbro-debtcollector-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-debtcollector-header-row">
          <HasbroActionHeaderGlyph
            className="hasbro-debtcollector-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#72C4ED"
            strokeColor="#56B2E0"
            strokeWidth={2.4}
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        {/* Central Circular Baby-Blue Feature Badge */}
        <div className="hasbro-debtcollector-circle-badge">
          <HasbroDebtCollectorGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text: Collect ₥5 from any player.) */}
        <div className="hasbro-debtcollector-desc">
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <span>Collect</span>
            <MonopolyMSymbol size="0.82em" style={{ margin: "0 0.04em 0 0.16em" }} />
            <span>5 from</span>
          </span>
          <br />
          <span>any player.</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Deal Breaker Action Card
 * Faithfully matches official Hasbro reference photo (orchid lavender cardstock, ₥5 coin, 3D ACTION with purple extrusion, DEAL BREAKER circular badge with sneaky runner Uncle Pennybags and flying money deeds, and 4-line rules text)
 */

export const HasbroDealBreakerCard = React.memo(function HasbroDealBreakerCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 5;

  return (
    <div
      className={`hasbro-dealbreaker-card hasbro-dealbreaker-card--${size} ${
        isInteractive ? "hasbro-dealbreaker-card--interactive" : "hasbro-dealbreaker-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-dealbreaker-frame">
        {/* Subtle Lavender / Orchid Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-dealbreaker-guilloche"
          strokeColor="rgba(120, 50, 140, 0.16)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥5 */}
        <div className="hasbro-dealbreaker-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-dealbreaker-header-row">
          <HasbroActionHeaderGlyph
            className="hasbro-dealbreaker-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#A478C8"
            strokeColor="#8E5EB6"
            strokeWidth={2.4}
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        {/* Central Circular Lavender Feature Badge */}
        <div className="hasbro-dealbreaker-circle-badge">
          <HasbroDealBreakerGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-dealbreaker-desc">
          <div className="hasbro-dealbreaker-desc-primary">
            <span>Steal a complete property</span>
            <br />
            <span>set from any player,</span>
            <br />
            <span>including any buildings.</span>
          </div>
          <div className="hasbro-dealbreaker-desc-secondary">
            <span>Place it in front of you.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Authentic Hasbro Monopoly Deal Forced Deal Action Card
 * Faithfully matches official Hasbro reference photo (sky blue cardstock, ₥3 coin, 3D ACTION, FORCED DEAL circular badge with distressed Uncle Pennybags & property swap, Swap any one of your properties with any one of another player's. You may not take a property that's part of a complete set.)
 */

export const HasbroForcedDealCard = React.memo(function HasbroForcedDealCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const value = card.value ?? 3;

  return (
    <div
      className={`hasbro-forceddeal-card hasbro-forceddeal-card--${size} ${
        isInteractive ? "hasbro-forceddeal-card--interactive" : "hasbro-forceddeal-card--disabled"
      } ${className}`}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`${card.name}, Action card, Value $${value}M`}
    >
      <div className="hasbro-forceddeal-frame">
        {/* Subtle Sky Blue Chevron Security Guilloche Background */}
        <HasbroChevronBackground
          id="hasbro-forceddeal-guilloche"
          strokeColor="rgba(40, 130, 180, 0.18)"
        />

        {/* Top-Left Circular Coin Value Badge: ₥3 */}
        <div className="hasbro-forceddeal-coin">
          <span style={{ display: "inline-flex", alignItems: "flex-start", lineHeight: 1 }}>
            <MonopolyMSymbol size="0.72em" style={{ marginTop: "0.22em", marginRight: "-0.05em" }} />
            <span style={{ fontSize: "1.68em", fontWeight: 900, fontFamily: "-apple-system, BlinkMacSystemFont, 'Arial Black', Impact, sans-serif" }}>
              {value}
            </span>
          </span>
        </div>

        {/* Header Row: 3D "ACTION" Title */}
        <div className="hasbro-forceddeal-header-row">
          <HasbroActionHeaderGlyph
            className="hasbro-forceddeal-action-svg"
            frontFill="#FFFFFF"
            shadowColor="#72C4ED"
            strokeColor="#56B2E0"
            strokeWidth={2.4}
            style={{ position: "relative", zIndex: 2 }}
          />
        </div>

        {/* Central Circular Baby-Blue Feature Badge */}
        <div className="hasbro-forceddeal-circle-badge">
          <HasbroForcedDealGlyph style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Bottom Rules Description (Exact Hasbro Text) */}
        <div className="hasbro-forceddeal-desc">
          <div className="hasbro-forceddeal-desc-primary">
            <span>Swap any one of your</span>
            <br />
            <span>properties with any one</span>
            <br />
            <span>of another player&apos;s.</span>
          </div>
          <div className="hasbro-forceddeal-desc-secondary">
            <span>You may not take a property</span>
            <br />
            <span>that&apos;s part of a complete set.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

function getHasbroRentColorHex(color?: string): string {
  switch (color) {
    case "red":
      return "#ED1B24";
    case "yellow":
      return "#FFDE00";
    case "green":
      return "#00A651";
    case "dark-blue":
      return "#0071BC";
    case "brown":
      return "#8B4513";
    case "light-blue":
      return "#5BC8E8";
    case "pink":
      return "#D83A8F";
    case "orange":
      return "#F28C28";
    case "railroad":
      return "#1F2327";
    case "utility":
      return "#B8DBBE";
    default:
      return color && COLOR_CONFIG[color as keyof typeof COLOR_CONFIG]?.hex
        ? COLOR_CONFIG[color as keyof typeof COLOR_CONFIG].hex
        : "#ED1B24";
  }
}

