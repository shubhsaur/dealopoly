import { COLOR_CONFIG } from "@dealopoly/shared";
import type { CardColor } from "@dealopoly/shared";

// ---------------------------------------------------------------------------
// Bot Roster
// ---------------------------------------------------------------------------

export const DEFAULT_BOT_ROSTER = [
  { id: "bot-atlas", name: "Bot Atlas" },
  { id: "bot-nova", name: "Bot Nova" },
  { id: "bot-orion", name: "Bot Orion" },
  { id: "bot-luna", name: "Bot Luna" },
];

// ---------------------------------------------------------------------------
// Opponent Palettes
// ---------------------------------------------------------------------------

export const OPPONENT_PALETTES = [
  { class: "avatar-theme--purple", badge: "🟣", hex: "#c084fc" },
  { class: "avatar-theme--orange", badge: "🟠", hex: "#fb923c" },
  { class: "avatar-theme--emerald", badge: "🟢", hex: "#34d399" },
  { class: "avatar-theme--amber", badge: "🟡", hex: "#fbbf24" },
] as const;

// ---------------------------------------------------------------------------
// Game Type Helpers
// ---------------------------------------------------------------------------

/** Returns the landing page path for a game type. */
export function getLandingPath(gameType?: string): string {
  return gameType === "least_count" || gameType === "lowdeck" ? "/lowdeck" : "/monodeal";
}

/** Returns the display label for a game type. */
export function getGameLabel(gameType?: string): string {
  return gameType === "least_count" || gameType === "lowdeck" ? "Lowdeck" : "Monodeal";
}

/** Returns the cards page path for a game type. */
export function getCardsPath(gameType?: string): string {
  return gameType === "least_count" || gameType === "lowdeck" ? "/lowdeck/cards" : "/monodeal/cards";
}

// ---------------------------------------------------------------------------
// Color Config Helpers
// ---------------------------------------------------------------------------

const FALLBACK_HEX = "#0055A4";
const FALLBACK_TEXT_HEX = "#FFFFFF";

/** Returns the hex color for a card color, with a consistent fallback. */
export function getColorHex(color: string | undefined): string {
  if (!color) return FALLBACK_HEX;
  return (COLOR_CONFIG as Record<string, { hex?: string }>)[color]?.hex || FALLBACK_HEX;
}

/** Returns the text hex color for a card color, with a consistent fallback. */
export function getColorTextHex(color: string | undefined): string {
  if (!color) return FALLBACK_TEXT_HEX;
  return (COLOR_CONFIG as Record<string, { textHex?: string }>)[color]?.textHex || FALLBACK_TEXT_HEX;
}

// ---------------------------------------------------------------------------
// WebSocket Base URL
// ---------------------------------------------------------------------------

/** Derives the WebSocket base URL from environment variables or window location. */
export function getWsBase(): string {
  const serverUrl =
    process.env.NEXT_PUBLIC_WS_BASE ||
    (process.env.NEXT_PUBLIC_GAME_SERVER_URL
      ? process.env.NEXT_PUBLIC_GAME_SERVER_URL.replace(/^http/, "ws") + "/ws"
      : null);

  return (
    serverUrl ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "ws://localhost:4000/ws"
      : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`)
  );
}
