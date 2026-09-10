"use client";

import React from "react";
import type { CardProps } from "./types";
import { HasbroChevronBackground } from "./glyphs";

export const HasbroRulesCard = React.memo(function HasbroRulesCard({
  card,
  size = "md",
  isInteractive = true,
  className = "",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`hasbro-reference-card hasbro-reference-card--${size} ${
        isInteractive ? "hasbro-reference-card--interactive" : "hasbro-reference-card--disabled"
      } ${className}`}
      role="img"
      aria-label="Monopoly Deal Quick Start Rules Reference Card"
    >
      <div className="hasbro-reference-frame">
        {/* Authentic Golden-Tan Chevron Guilloche Pattern */}
        <HasbroChevronBackground
          strokeColor="rgba(180, 160, 100, 0.28)"
          id="hasbroRulesChevron"
        />

        {/* Top Header Plaque */}
        <div className="hasbro-reference-plaque-wrap">
          <div className="hasbro-reference-plaque">
            <span>REFERENCE</span>
          </div>
        </div>

        {/* Rules Content Container */}
        <div className="hasbro-reference-content">
          {/* HOW TO WIN */}
          <div className="hasbro-reference-section">
            <div className="hasbro-reference-heading">HOW TO WIN</div>
            <div className="hasbro-reference-text">
              Collect 3 complete property sets,
              <br />
              each in a different color.
            </div>
          </div>

          {/* SET UP */}
          <div className="hasbro-reference-section">
            <div className="hasbro-reference-heading">SET UP</div>
            <div className="hasbro-reference-text">
              Each player starts with 5 cards.
            </div>
          </div>

          {/* ON YOUR TURN */}
          <div className="hasbro-reference-section">
            <div className="hasbro-reference-heading">ON YOUR TURN</div>
            <div className="hasbro-reference-list">
              <div className="hasbro-reference-item">
                <span className="hasbro-reference-num">1.</span>
                <span className="hasbro-reference-item-text">Draw 2 cards.</span>
              </div>
              <div className="hasbro-reference-item">
                <span className="hasbro-reference-num">2.</span>
                <div className="hasbro-reference-item-text">
                  Play up to 3 cards. You may:
                  <div className="hasbro-reference-sublist">
                    <div className="hasbro-reference-subitem">
                      <span className="hasbro-reference-letter">a.</span>
                      <span>
                        Add money/action cards to
                        <br />
                        your Bank.
                      </span>
                    </div>
                    <div className="hasbro-reference-subitem">
                      <span className="hasbro-reference-letter">b.</span>
                      <span>
                        Add properties to your
                        <br />
                        collection.
                      </span>
                    </div>
                    <div className="hasbro-reference-subitem">
                      <span className="hasbro-reference-letter">c.</span>
                      <span>Play an action card to the center.</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hasbro-reference-item">
                <span className="hasbro-reference-num">3.</span>
                <span className="hasbro-reference-item-text">
                  End your turn with up to 7 cards. If you have more than 7, discard the extra.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Note */}
        <div className="hasbro-reference-footer">
          <span>&copy; 1935, 2026 Dealopoly.</span>
        </div>
      </div>
    </div>
  );
});

