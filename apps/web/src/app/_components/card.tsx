import React from "react";
import type { CardDefinition } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";

export interface CardProps {
  card: CardDefinition;
  size?: "xs" | "sm" | "md" | "lg";
  isInteractive?: boolean;
  className?: string;
  onClick?: () => void;
  designVariant?: "classic" | "hasbro";
}

/**
 * Authentic Double-Barred Monopoly M Currency Symbol
 * Matches the official Hasbro Monopoly Deal currency symbol on cards
 */
export function MonopolyMSymbol({
  size = "1em",
  className = "",
  style = {},
}: {
  size?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className={`monopoly-currency-symbol ${className}`}
      style={{
        display: "inline-block",
        verticalAlign: "-0.08em",
        flexShrink: 0,
        ...style,
      }}
      fill="currentColor"
    >
      {/* Letter M glyph */}
      <path d="M2.5 17.5V2.5h3.6l3.9 6.8 3.9-6.8h3.6v15h-3.2V7.2L10.8 13.2h-1.6L5.7 7.2v10.3H2.5z" />
      {/* Upper horizontal strike bar */}
      <rect x="0.5" y="7.5" width="19" height="1.6" rx="0.5" />
      {/* Lower horizontal strike bar */}
      <rect x="0.5" y="11.2" width="19" height="1.6" rx="0.5" />
    </svg>
  );
}

/**
 * Authentic Mini Property Card Glyphs for Properties Owned Column
 * Faithfully matches single card and stacked cards with radiating burst dashes from Hasbro photo
 */
function HasbroPropertyCountGlyph({
  count,
  color,
}: {
  count: number;
  color: string;
}) {
  if (count === 1) {
    return (
      <svg
        viewBox="0 0 40 50"
        style={{
          width: "2.1em",
          height: "2.6em",
          display: "block",
          margin: "0 auto",
        }}
      >
        {/* Main Card Body */}
        <rect
          x="5"
          y="4"
          width="30"
          height="42"
          rx="4"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
        />
        {/* Colored Top Stripe */}
        <path
          d="M5 8a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v7H5V8z"
          fill={color}
          stroke="#111111"
          strokeWidth="2.4"
        />
        {/* Digit 1 in matching color */}
        <text
          x="20"
          y="37.5"
          fill={color}
          fontSize="18"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
        >
          1
        </text>
      </svg>
    );
  }

  // Count >= 2: Stacked Cards with Radiating Action Dashes from photo
  return (
    <svg
      viewBox="0 0 58 52"
      style={{
        width: "3.0em",
        height: "2.7em",
        display: "block",
        margin: "0 auto",
      }}
    >
      {/* Left Radiating Action Dashes */}
      <line
        x1="3"
        y1="20"
        x2="9"
        y2="23"
        stroke="#111111"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="34"
        x2="9"
        y2="30"
        stroke="#111111"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Right Radiating Action Dashes */}
      <line
        x1="55"
        y1="20"
        x2="49"
        y2="23"
        stroke="#111111"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <line
        x1="54"
        y1="34"
        x2="49"
        y2="30"
        stroke="#111111"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Back Card (Shifted left and tilted -10deg) */}
      <g transform="translate(13, 5) rotate(-10 13 19)">
        <rect
          x="0"
          y="0"
          width="26"
          height="37"
          rx="3.5"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
        />
        <path
          d="M0 3.5a3.5 3.5 0 0 1 3.5-3.5h19a3.5 3.5 0 0 1 3.5 3.5v7H0v-7z"
          fill={color}
          stroke="#111111"
          strokeWidth="2.4"
        />
      </g>

      {/* Front Card with Digit in matching color */}
      <g transform="translate(18, 7)">
        <rect
          x="0"
          y="0"
          width="26"
          height="37"
          rx="3.5"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="2.4"
        />
        <path
          d="M0 3.5a3.5 3.5 0 0 1 3.5-3.5h19a3.5 3.5 0 0 1 3.5 3.5v7H0v-7z"
          fill={color}
          stroke="#111111"
          strokeWidth="2.4"
        />
        <text
          x="13"
          y="29.5"
          fill={color}
          fontSize="16"
          fontWeight="900"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          textAnchor="middle"
        >
          {count}
        </text>
      </g>
    </svg>
  );
}

/**
 * Authentic Hasbro Monopoly Deal Property Card (Prototype / Verification)
 * Faithfully matches the official Hasbro card design from the reference photo
 */
export const HasbroPropertyCard = React.memo(function HasbroPropertyCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  const primaryConfig = card.primaryColor
    ? COLOR_CONFIG[card.primaryColor]
    : undefined;
  // Match the exact royal/dark blue from the reference photo
  const primaryHex =
    card.primaryColor === "dark-blue" ? "#0071BC" : primaryConfig?.hex ?? "#0071BC";
  const isDarkText =
    primaryConfig?.textHex === "#111415" ||
    card.primaryColor === "yellow" ||
    card.primaryColor === "light-blue";

  // For Park Lane (prop-park-lane), display the iconic name from the Hasbro reference card: "PARK PLACE"
  const isParkLane = card.id === "prop-park-lane";
  const displayName = isParkLane ? "PARK PLACE" : card.name;

  const effectiveRentTiers =
    card.rentTiers && card.rentTiers.length > 0
      ? card.rentTiers
      : primaryConfig?.rentTiers
      ? primaryConfig.rentTiers.map((rent, idx) => ({
          setCount: idx + 1,
          rent,
          isComplete: idx + 1 === (primaryConfig.setSize || card.setSize || 3),
        }))
      : [];

  return (
    <div
      onClick={onClick}
      style={{ "--card-color": primaryHex } as React.CSSProperties}
      className={`hasbro-card hasbro-card--${size} ${
        isInteractive ? "hasbro-card--interactive" : "hasbro-card--disabled"
      } ${className}`}
      role="img"
      aria-label={`${displayName} (Hasbro Monopoly Deal Edition)`}
    >
      <div className="hasbro-card-frame">
        {/* Top Color Banner */}
        <div
          className={`hasbro-card-banner ${
            isDarkText ? "hasbro-card-banner--dark-text" : ""
          }`}
          style={{ background: primaryHex }}
        >
          <h3 className="hasbro-card-title">{displayName}</h3>
        </div>

        {/* Top-Left Circular Coin Value Badge Straddling Header/Body Line */}
        {card.value > 0 && (
          <div className="hasbro-card-coin">
            <span className="hasbro-coin-val">
              <MonopolyMSymbol
                size="0.65em"
                style={{ marginRight: "1.5px", marginTop: "0.12em" }}
              />
              <span className="hasbro-coin-num">{card.value}</span>
            </span>
          </div>
        )}

        {/* Card Body with Rent Table */}
        <div className="hasbro-card-body">
          {/* Table Header: PROPERTIES OWNED / RENT */}
          <div className="hasbro-table-header">
            <div className="hasbro-header-left">
              <span>PROPERTIES</span>
              <span>OWNED</span>
            </div>
            <div className="hasbro-header-right">
              <span>RENT</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="hasbro-table-rows">
            {effectiveRentTiers.map((tier) => (
              <div key={tier.setCount} className="hasbro-table-row">
                <div className="hasbro-mini-card-col">
                  <HasbroPropertyCountGlyph count={tier.setCount} color={primaryHex} />
                  {tier.isComplete && (
                    <div className="hasbro-complete-tag">
                      <span>COMPLETE</span>
                      <span>SET</span>
                    </div>
                  )}
                </div>

                <div className="hasbro-rent-col">
                  <div className="hasbro-rent-amount">
                    <MonopolyMSymbol
                      size="0.52em"
                      style={{
                        marginRight: "2px",
                        marginTop: "0.16em",
                      }}
                    />
                    <span className="hasbro-rent-digit">{tier.rent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hasbro-card-bottom-spacer" />
        </div>
      </div>
    </div>
  );
});

export interface CardBackProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "classic" | "gold" | "carbon";
  isInteractive?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CardBack = React.memo(function CardBack({
  size = "md",
  variant = "classic",
  isInteractive = false,
  className = "",
  onClick,
}: CardBackProps) {
  return (
    <div
      onClick={onClick}
      className={`monopoly-card monopoly-card--${size} dealopoly-card-back dealopoly-card-back--${variant} ${
        isInteractive ? "monopoly-card--interactive" : ""
      } ${className}`}
      role="img"
      aria-label="Dealopoly Card Back"
    >
      <div className={`card-back-image-fill card-back-image-fill--${variant}`} />
    </div>
  );
});

export const Card = React.memo(function Card({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
  designVariant,
}: CardProps) {
  // Check if this card should use the new authentic Hasbro design:
  // For prototype/verification phase: enabled for Park Lane (prop-park-lane) or when explicitly requested
  const isParkLane =
    card.id === "prop-park-lane" || card.name.toLowerCase() === "park place";
  const useHasbroDesign =
    designVariant === "hasbro" ||
    (designVariant !== "classic" && isParkLane);

  if (useHasbroDesign) {
    return (
      <HasbroPropertyCard
        card={card}
        size={size}
        isInteractive={isInteractive}
        className={className}
        onClick={onClick}
      />
    );
  }

  const primaryConfig = card.primaryColor
    ? COLOR_CONFIG[card.primaryColor]
    : undefined;
  const secondaryConfig = card.secondaryColor
    ? COLOR_CONFIG[card.secondaryColor]
    : undefined;

  const primaryHex = primaryConfig?.hex ?? (card.type === "money" ? "#1F8A4C" : "#0055A4");
  const darkHex = primaryConfig?.darkHex ?? (card.type === "money" ? "#0E522B" : "#002F5E");
  const secondaryHex = secondaryConfig?.hex;
  const isDarkText =
    primaryConfig?.textHex === "#111415" ||
    card.primaryColor === "yellow" ||
    card.primaryColor === "light-blue";

  // Category label for the header
  const categoryLabel =
    card.tagline ||
    (card.type === "property"
      ? "PROPERTY"
      : card.type === "property-wild"
      ? "WILD PROPERTY"
      : card.type === "action"
      ? "ACTION"
      : card.type === "rent"
      ? "RENT"
      : card.type === "money"
      ? "MONEY"
      : "RULES");

  // Default icons for top-left coin
  const coinIcon =
    card.icon ||
    (card.type === "property"
      ? card.primaryColor === "railroad"
        ? "train"
        : card.primaryColor === "utility"
        ? "bolt"
        : "location_city"
      : card.type === "property-wild"
      ? "auto_awesome"
      : card.type === "action"
      ? "bolt"
      : card.type === "rent"
      ? "payments"
      : card.type === "money"
      ? "attach_money"
      : "help");

  // Resolve rent tiers from card or fallback to COLOR_CONFIG
  const effectiveRentTiers =
    card.rentTiers && card.rentTiers.length > 0
      ? card.rentTiers
      : primaryConfig?.rentTiers
      ? primaryConfig.rentTiers.map((rent, idx) => ({
          setCount: idx + 1,
          rent,
          isComplete: idx + 1 === (primaryConfig.setSize || card.setSize || 3),
        }))
      : [];

  return (
    <div
      onClick={onClick}
      style={
        {
          "--card-color": primaryHex,
          "--card-color-dark": darkHex,
          "--card-color-secondary": secondaryHex,
          "--card-text-color": isDarkText ? "#111415" : "#FFFFFF",
        } as React.CSSProperties
      }
      className={`monopoly-card monopoly-card--${size} monopoly-card--${card.type} ${
        isInteractive ? "monopoly-card--interactive" : "monopoly-card--disabled"
      } ${className}`}
      role="img"
      aria-label={card.name}
    >
      {/* Texture Noise Overlay */}
      <div className="texture-overlay" />

      {/* Inner Card Frame */}
      <div className="card-inner-frame">
        {/* ============================================================ */}
        {/* 1. TOP HEADER BANNER (Matching Shared Reference Design)      */}
        {/* ============================================================ */}
        <div
          className={`card-arched-header ${
            isDarkText ? "card-arched-header--dark-text" : "card-arched-header--light-text"
          }`}
          style={
            card.primaryColor === "all"
              ? {
                  background:
                    "linear-gradient(135deg, #8B4513 0%, #87CEEB 15%, #D83A8F 30%, #F28C28 45%, #ED1B24 60%, #FFDE00 75%, #008000 90%, #0055A4 100%)",
                  color: "#FFFFFF",
                }
              : secondaryHex
              ? {
                  background: `linear-gradient(135deg, ${primaryHex} 50%, ${secondaryHex} 50%)`,
                  color: "#FFFFFF",
                }
              : undefined
          }
        >
          {/* Top-Left Circular Badge with Solid White Background & Card-Color Skyline */}
          <div className="card-header-badge-circle">
            {card.type === "property" ? (
              <svg
                viewBox="0 0 36 36"
                className="card-header-city-svg"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Left Building with 45-deg angled pitched roof */}
                <path d="M4 31V15l5-5v21H4z" fill={primaryHex} />
                {/* Left-mid building */}
                <path d="M9 31V12.5h4v18.5H9z" fill={primaryHex} />
                {/* Center Tall Skyscraper with Spire Needle & Stepped Tiers */}
                <path d="M13 31V9.5h10V31H13z" fill={primaryHex} />
                <path d="M15 9.5V5.5h6v4h-6z" fill={primaryHex} />
                <path d="M17 5.5V1.5h2v4h-2z" fill={primaryHex} />
                {/* Window Cutouts in Center Skyscraper */}
                <rect x="14.8" y="11.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="11.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="14.8" y="15.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="15.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="14.8" y="19.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="19.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="14.8" y="23.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="23.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="14.8" y="27.5" width="2" height="2.5" fill="#FFFFFF" />
                <rect x="19.2" y="27.5" width="2" height="2.5" fill="#FFFFFF" />
                {/* Right Mid Building with Spire Antenna */}
                <path d="M23 31V13.5h4.5V31H23z" fill={primaryHex} />
                <path d="M24.8 13.5V7.5h1.2v6h-1.2z" fill={primaryHex} />
                {/* Far Right Stepped Building with Window Dots */}
                <path d="M27.5 31V17h4.5v14h-4.5z" fill={primaryHex} />
                <rect x="29" y="19.5" width="1.6" height="2.2" fill="#FFFFFF" />
                <rect x="29" y="23.5" width="1.6" height="2.2" fill="#FFFFFF" />
                <rect x="29" y="27.5" width="1.6" height="2.2" fill="#FFFFFF" />
                {/* Horizontal Ground Line */}
                <rect x="3" y="30.5" width="30" height="2" fill={primaryHex} />
              </svg>
            ) : (
              <span
                className="material-symbols-outlined"
                style={{ color: primaryHex, fontVariationSettings: "'FILL' 1", fontSize: "1.25em" }}
              >
                {coinIcon}
              </span>
            )}
          </div>

          {/* Top-Right Circular Badge with Right-Half Color Value Text */}
          {card.value > 0 && (
            <div className="card-header-badge-circle card-header-badge-circle--right">
              <span
                className="card-header-value-text"
                style={{ color: secondaryHex || primaryHex }}
              >
                ${card.value}M
              </span>
            </div>
          )}

          {/* Category Tag with Dash Accents (e.g. — PROPERTY —) */}
          <span className="card-header-category">{categoryLabel}</span>

          {/* Main Card Title in Bold High-Contrast Black Typography */}
          <h3 className="card-header-title">{card.name}</h3>

          {/* Bottom Center Point Star Shield */}
          <div className="card-header-star-shield">
            <span className="card-star-glyph">★</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. CARD BODY SECTION (Dynamic Sizing Based on Tiers)         */}
        {/* ============================================================ */}
        <div
          className={`card-body-section card-body-section--${card.type} ${
            effectiveRentTiers.length > 0
              ? `card-body-section--tiers-${effectiveRentTiers.length}`
              : ""
          }`}
        >
          {/* Property Card Body (Matching Shared Reference) */}
          {card.type === "property" && (
            <>
              <div className="card-body-heading">
                <span className="card-body-heading-dash">—</span>
                <span>RENT</span>
                <span className="card-body-heading-dash">—</span>
              </div>
              <p className="card-body-subtitle">
                Collect rent from the player who has this card in their hand.
              </p>
              <div className="card-rent-table-box">
                <div className="card-rent-table-rows">
                  {effectiveRentTiers.map((tier) => (
                    <div key={tier.setCount} className="card-rent-row">
                      <div className="card-rent-set-col">
                        <span className="card-rent-set-label">
                          {tier.setCount} {tier.setCount === 1 ? "SET" : "SETS"}
                        </span>
                        {tier.isComplete && (
                          <span className="card-rent-complete-tag">(COMPLETE)</span>
                        )}
                      </div>

                      {/* Center Money Bag Icon in Card Color */}
                      <div className="card-rent-moneybag-col">
                        <svg
                          viewBox="0 0 24 24"
                          className="card-rent-moneybag-svg"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.5 5.5c0-.8.7-1.5 1.5-1.5h2c.8 0 1.5.7 1.5 1.5 0 .4-.2.8-.5 1h-4c-.3-.2-.5-.6-.5-1z"
                            fill={primaryHex}
                          />
                          <rect
                            x="8.5"
                            y="6"
                            width="7"
                            height="1.2"
                            rx="0.6"
                            fill={primaryHex}
                          />
                          <path
                            d="M5.5 10c0-2 2-2.8 4-2.8h5c2 0 4 .8 4 2.8 0 4.5 1 9.5-3 10.5-1.5.4-5.5.4-7 0-4-1-3-6-3-10.5z"
                            fill={primaryHex}
                          />
                          <text
                            x="12"
                            y="15.8"
                            fill="#FFFFFF"
                            fontSize="6.5"
                            fontWeight="900"
                            textAnchor="middle"
                            fontFamily="system-ui, -apple-system, sans-serif"
                          >
                            $
                          </text>
                        </svg>
                      </div>

                      <div className="card-rent-amount-col">
                        <span className="card-rent-amount">M{tier.rent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Property Wild Card Body */}
          {card.type === "property-wild" && (
            <>
              <div className="card-body-heading">WILD PROPERTY</div>
              <p className="card-body-subtitle">
                {card.description || "Can be part of either matching color set. Swap colors freely on your turn."}
              </p>
              <div className="card-wild-indicator-box">
                {card.primaryColor === "all" ? (
                  <div className="card-wild-rainbow-text">★ 10-COLOR MULTI-WILD ★</div>
                ) : (
                  <div className="card-wild-dual-tags">
                    <span
                      className="card-wild-dual-pill"
                      style={{ background: primaryHex, color: isDarkText ? "#111" : "#FFF" }}
                    >
                      {primaryConfig?.name || "Color 1"}
                    </span>
                    <span className="card-wild-dual-divider">⇄</span>
                    <span
                      className="card-wild-dual-pill"
                      style={{ background: secondaryHex || primaryHex, color: "#FFF" }}
                    >
                      {secondaryConfig?.name || "Color 2"}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Card Body */}
          {card.type === "action" && (
            <>
              <div className="card-action-icon-badge">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {coinIcon}
                </span>
              </div>
              <div className="card-action-desc-box">
                <p className="card-action-description-text">{card.description}</p>
              </div>
              <div className="card-action-bank-val">
                <span>BANK VALUE: ${card.value}M</span>
              </div>
            </>
          )}

          {/* Rent Card Body */}
          {card.type === "rent" && (
            <>
              <div className="card-body-heading">RENT ACTION</div>
              <div className="card-rent-icon-badge">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  payments
                </span>
              </div>
              <div className="card-action-desc-box">
                <p className="card-action-description-text">{card.description}</p>
              </div>
            </>
          )}

          {/* Money Card Body */}
          {card.type === "money" && (
            <div className="card-money-banknote">
              <div className="card-money-banknote-inner">
                <div className="card-money-banknote-corner-tl">${card.value}M</div>
                <div className="card-money-banknote-corner-tr">${card.value}M</div>
                <div className="card-money-banknote-center">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "1.4em", fontVariationSettings: "'FILL' 1" }}
                  >
                    attach_money
                  </span>
                  <span className="card-money-banknote-amount">${card.value}M</span>
                  <span className="card-money-banknote-label">DEALOPOLY CASH</span>
                </div>
                <div className="card-money-banknote-corner-bl">${card.value}M</div>
                <div className="card-money-banknote-corner-br">${card.value}M</div>
              </div>
            </div>
          )}

          {/* Rule Card Body */}
          {card.type === "rule" && (
            <div className="card-rule-body">
              <div className="card-body-heading">RULES OF PLAY</div>
              <ul className="card-rule-list">
                <li><strong>1. Draw:</strong> 2 cards from deck.</li>
                <li><strong>2. Play:</strong> Up to 3 cards per turn.</li>
                <li><strong>3. Bank:</strong> Action & Money go to bank.</li>
                <li><strong>4. Win:</strong> 3 full property sets!</li>
              </ul>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 3. CARD FOOTER WITH SKYLINE & PLINTH & BRAND TAB             */}
        {/* ============================================================ */}
        <div className="card-footer-zone">
          {/* Skyline Silhouette Watermark (Spanning Full Left to Right) */}
          <div
            className="card-skyline-vector"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 50' fill='%239E9284'%3E%3Cpath d='M0,50 L0,32 L8,32 L8,24 L14,24 L14,14 L20,14 L20,50 L28,50 L28,20 L34,10 L40,20 L40,50 L48,50 L48,34 L56,34 L56,50 L66,50 L66,16 L72,6 L78,16 L78,50 L90,50 L90,26 L100,26 L100,50 L112,50 L112,22 L118,12 L124,22 L124,50 L136,50 L136,30 L146,30 L146,50 L158,50 L158,18 L164,8 L170,18 L170,50 L182,50 L182,24 L192,24 L192,50 L204,50 L204,14 L210,4 L216,14 L216,50 L226,50 L226,30 L234,30 L234,50 L240,50 L240,50 Z'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Center Plinth / Emblem */}
          <div className="card-bottom-plinth">
            <div className="card-plinth-circle">
              <span>{card.setSize ?? (card.value > 0 ? card.value : "★")}</span>
            </div>
          </div>

          {/* Bottom Brand Pill Tab */}
          <div className="card-bottom-brand-pill">
            DEALOPOLY
          </div>
        </div>
      </div>
    </div>
  );
});
