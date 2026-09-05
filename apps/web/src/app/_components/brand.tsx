"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Brand({
  className = "brand",
  game,
}: {
  className?: string;
  game?: "arcade" | "monodeal" | "lowdeck";
}) {
  const pathname = usePathname();
  const isLowdeck = game === "lowdeck" || pathname?.startsWith("/lowdeck");
  const logoColor = isLowdeck ? "#facc15" : "var(--primary)";

  return (
    <Link
      className={`${className} ${isLowdeck ? "brand--lowdeck" : ""}`}
      href="/"
      aria-label="Dealopoly Arcade home"
      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
    >
      <svg
        className="brand-logo-icon"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          width: "22px",
          height: "22px",
          color: logoColor,
          flexShrink: 0,
          ...(isLowdeck ? { filter: "drop-shadow(0 0 10px rgba(250, 204, 21, 0.55))" } : {}),
        }}
        aria-hidden="true"
      >
        <rect x="7" y="2.5" width="13" height="17" rx="2.5" fill="currentColor" opacity="0.45" />
        <rect x="3.5" y="4.5" width="13" height="17" rx="2.5" fill="currentColor" />
        <rect x="4.7" y="5.7" width="10.6" height="14.6" rx="1.6" fill="none" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.4" />
        <path d="M10 10.5L11.8 13L10 15.5L8.2 13Z" fill="#ffffff" />
      </svg>
      <span style={{ fontWeight: 900 }}>
        dealopoly <span style={{ opacity: 0.7, fontSize: "0.85em", fontWeight: 700 }}>arcade</span>
      </span>
    </Link>
  );
}
