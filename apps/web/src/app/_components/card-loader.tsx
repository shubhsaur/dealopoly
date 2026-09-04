"use client";

import React from "react";

export type CardLoaderVariant = "arcade" | "monodeal" | "lowdeck";

export interface CardLoaderProps {
  /** Game variant for the loader */
  game?: CardLoaderVariant;
  /** Size scale of the loader stage */
  size?: "sm" | "md" | "lg" | "full";
  /** Explicit orientation override (defaults to "auto" which detects via media queries) */
  orientation?: "auto" | "portrait" | "landscape";
  /** Whether the loader should render as a full-screen fixed takeover covering the entire viewport */
  fullScreen?: boolean;
  /** Optional loading message displayed beneath the progress bar (defaults to "SHUFFLING...") */
  text?: string;
  /** Optional explicit progress percentage (0 - 100). If omitted, runs in a continuous live shuffle loop */
  progress?: number;
  /** Explicitly mark progress as complete (adds 100% full neon glow flash) */
  isComplete?: boolean;
  /** When true, pauses animation for still inspection */
  paused?: boolean;
  /** Whether to render the glossy table reflection of the progress bar */
  showReflection?: boolean;
  /** Additional className on the root container */
  className?: string;
}

/**
 * Dealopoly Illustrated Card Loader
 * Features the official Dealopoly hand-shuffling illustration with an
 * authentic animated glowing neon live progress bar and table reflection.
 */
export function CardLoader({
  game = "arcade",
  size = "md",
  orientation = "auto",
  fullScreen = false,
  text = "SHUFFLING...",
  progress,
  isComplete = false,
  paused = false,
  showReflection = true,
  className = "",
}: CardLoaderProps) {
  const isDeterminate = typeof progress === "number";
  const clampedProgress = isDeterminate ? Math.min(100, Math.max(0, progress)) : undefined;
  const completed = isComplete || (isDeterminate && clampedProgress === 100);

  const orientationClass =
    orientation === "portrait"
      ? "dealopoly-loader--portrait"
      : orientation === "landscape"
        ? "dealopoly-loader--landscape"
        : "";

  return (
    <div
      className={`dealopoly-loader card-loader dealopoly-loader--${size} card-loader--${size} card-loader--${game} ${orientationClass} ${
        fullScreen ? "dealopoly-loader--fullscreen" : ""
      } ${completed ? "dealopoly-loader--complete" : ""} ${
        paused ? "animation-paused" : ""
      } ${className}`}
      role="progressbar"
      aria-label={text || "Loading..."}
      aria-valuenow={isDeterminate ? clampedProgress : undefined}
      aria-valuemin={isDeterminate ? 0 : undefined}
      aria-valuemax={isDeterminate ? 100 : undefined}
    >
      {/* Cinematic Ambient Blurred Backdrop for Fullscreen Edge-to-Edge */}
      {fullScreen && (
        <div className="dealopoly-loader__ambient" aria-hidden="true">
          <picture>
            {orientation !== "landscape" && (
              <source
                media={orientation === "portrait" ? undefined : "(max-width: 640px), (orientation: portrait)"}
                srcSet="/dealopoly-shuffler-mobile@2x.jpg 2x, /dealopoly-shuffler-mobile.jpg 1x"
              />
            )}
            {orientation !== "portrait" && (
              <source
                srcSet="/dealopoly-shuffler-clean@2x.jpg 2048w, /dealopoly-shuffler-clean@3x.jpg 3072w"
                sizes="100vw"
              />
            )}
            <img
              src={orientation === "portrait" ? "/dealopoly-shuffler-mobile.jpg" : "/dealopoly-shuffler-clean@2x.jpg"}
              alt=""
              className="dealopoly-loader__ambient-image"
              draggable={false}
            />
          </picture>
          <div className="dealopoly-loader__ambient-overlay" />
        </div>
      )}

      <div className="dealopoly-loader__stage">
        {/* Responsive Shuffler Artwork: Mobile (Portrait) vs Desktop (Landscape) */}
        <picture>
          {orientation !== "landscape" && (
            <source
              media={orientation === "portrait" ? undefined : "(max-width: 640px), (orientation: portrait)"}
              srcSet="/dealopoly-shuffler-mobile@2x.jpg 2x, /dealopoly-shuffler-mobile.jpg 1x"
            />
          )}

          {orientation !== "portrait" && (
            <>
              <source
                type="image/avif"
                srcSet="/dealopoly-shuffler-clean@2x.avif 2048w"
                sizes="100vw"
              />
              <source
                srcSet="/dealopoly-shuffler-clean@2x.jpg 2048w, /dealopoly-shuffler-clean@3x.jpg 3072w"
                sizes="100vw"
              />
            </>
          )}

          <img
            src={orientation === "portrait" ? "/dealopoly-shuffler-mobile.jpg" : "/dealopoly-shuffler-clean@2x.jpg"}
            srcSet={
              orientation === "portrait"
                ? "/dealopoly-shuffler-mobile.jpg 1x, /dealopoly-shuffler-mobile@2x.jpg 2x"
                : "/dealopoly-shuffler-clean.webp 1024w, /dealopoly-shuffler-clean@2x.jpg 2048w, /dealopoly-shuffler-clean@3x.jpg 3072w"
            }
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 100vw"
            alt="Dealopoly Hands Shuffling Cards"
            className="dealopoly-loader__image"
            draggable={false}
          />
        </picture>

        {/* Live Animated Progress Bar Track */}
        <div className="dealopoly-loader__track" aria-hidden="true">
          <div
            className={`dealopoly-loader__fill ${isDeterminate ? "" : "dealopoly-loader__fill--loop"} ${
              completed ? "dealopoly-loader__fill--complete" : ""
            }`}
            style={isDeterminate ? { width: `${clampedProgress}%` } : undefined}
          >
            {/* White leading glow point */}
            <span className="dealopoly-loader__glow-head" />
          </div>
        </div>

        {/* Table Surface Reflection */}
        {showReflection && (
          <div className="dealopoly-loader__reflection" aria-hidden="true">
            <div
              className={`dealopoly-loader__fill ${isDeterminate ? "" : "dealopoly-loader__fill--loop"} ${
                completed ? "dealopoly-loader__fill--complete" : ""
              }`}
              style={isDeterminate ? { width: `${clampedProgress}%` } : undefined}
            />
          </div>
        )}

        {/* Dynamic Loading Message */}
        {text && <p className="dealopoly-loader__text">{text}</p>}
      </div>
    </div>
  );
}

/** Shortcut for Arcade Hub Loader */
export function ArcadeCardLoader(props: Omit<CardLoaderProps, "game">) {
  return <CardLoader {...props} game="arcade" />;
}

/** Shortcut for Monodeal Loader */
export function MonodealCardLoader(props: Omit<CardLoaderProps, "game">) {
  return <CardLoader {...props} game="monodeal" />;
}

/** Shortcut for Lowdeck Loader */
export function LowdeckCardLoader(props: Omit<CardLoaderProps, "game">) {
  return <CardLoader {...props} game="lowdeck" />;
}

