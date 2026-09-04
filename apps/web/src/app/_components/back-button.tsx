"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  variant?: "ghost" | "secondary" | "subtle" | "icon-only";
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function BackButton({
  fallbackUrl = "/",
  label = "Back",
  variant = "ghost",
  className,
  style,
  onClick,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  if (variant === "icon-only") {
    return (
      <button
        type="button"
        onClick={handleBack}
        className={className || "button button--ghost"}
        style={{
          width: "36px",
          height: "36px",
          padding: 0,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          ...style,
        }}
        aria-label={label || "Go back"}
        title={label || "Go back"}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
          arrow_back
        </span>
      </button>
    );
  }

  if (variant === "subtle") {
    return (
      <button
        type="button"
        onClick={handleBack}
        style={{
          background: "none",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "0.86rem",
          fontWeight: 500,
          padding: "4px 0",
          transition: "color 0.2s ease",
          ...style,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        aria-label={label}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
          arrow_back
        </span>
        <span>{label}</span>
      </button>
    );
  }

  const baseClass = variant === "secondary" ? "button button--secondary" : "button button--ghost";

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className || baseClass}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        fontSize: "0.85rem",
        cursor: "pointer",
        ...style,
      }}
      aria-label={label}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
        arrow_back
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}
