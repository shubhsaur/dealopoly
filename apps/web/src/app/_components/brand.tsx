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
      <span
        className="material-symbols-outlined brand-logo-icon"
        style={{
          fontVariationSettings: "'FILL' 1",
          color: logoColor,
          ...(isLowdeck ? { filter: "drop-shadow(0 0 10px rgba(250, 204, 21, 0.55))" } : {}),
        }}
      >
        playing_cards
      </span>
      <span style={{ fontWeight: 900 }}>
        dealopoly <span style={{ opacity: 0.7, fontSize: "0.85em", fontWeight: 700 }}>arcade</span>
      </span>
    </Link>
  );
}
