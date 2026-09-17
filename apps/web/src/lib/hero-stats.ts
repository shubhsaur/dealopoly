import type { ServerStats } from "./api";

export interface HeroStatsCopy {
  /** "Servers Online" when the game server answers, otherwise "Instant Play Ready". */
  statusText: string;
  /** Live player count when someone is online, else the real games-played total ("" when unknown). */
  activityLabel: string;
  /** Ready-to-render badge string, e.g. "Servers Online • 8 Games Played". */
  badgeText: string;
}

function countLabel(value: number, singular: string, plural: string): string {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

/**
 * Builds the marketing hero badge copy ("Servers Online • 8 Games Played").
 *
 * NOTE: `ServerStats.totalPlayers` is NOT a player total — the `players` table gets a new
 * row every time someone creates or joins a room (one row per browser identity *per room*),
 * so it grows with activity instead of with people. `totalGames` is the only trustworthy
 * activity figure the stats API exposes, which is why it backs the "Games Played" label.
 */
export function getHeroStatsCopy(stats: ServerStats | null): HeroStatsCopy {
  const statusText =
    !stats || stats.serversOnline ? "Servers Online" : "Instant Play Ready";

  let activityLabel = "";
  if (stats) {
    if (stats.onlinePlayers > 0) {
      activityLabel = `${countLabel(stats.onlinePlayers, "Player", "Players")} Online`;
    } else if (stats.totalGames > 0) {
      activityLabel = `${countLabel(stats.totalGames, "Game", "Games")} Played`;
    }
  }

  return {
    statusText,
    activityLabel,
    badgeText: activityLabel ? `${statusText} • ${activityLabel}` : statusText,
  };
}
