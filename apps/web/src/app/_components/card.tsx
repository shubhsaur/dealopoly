import React from "react";
import type { CardDefinition } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";

export interface CardProps {
  card: CardDefinition;
  size?: "xs" | "sm" | "md" | "lg";
  isInteractive?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface CardBackProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "classic" | "gold" | "carbon";
  isInteractive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function CardBack({
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
}

export function Card({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
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
        isInteractive ? "monopoly-card--interactive" : ""
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
}
