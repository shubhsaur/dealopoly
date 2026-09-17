import { describe, it, expect } from "vitest";
import type { ServerStats } from "./api";
import { getHeroStatsCopy } from "./hero-stats";

function stats(partial: Partial<ServerStats>): ServerStats {
  return {
    serversOnline: true,
    onlinePlayers: 0,
    activeRooms: 0,
    totalPlayers: 229,
    totalGames: 8,
    ...partial,
  };
}

describe("Marketing hero stats copy", () => {
  it("labels the cumulative activity total as Games Played, never as Players", () => {
    const copy = getHeroStatsCopy(stats({ onlinePlayers: 0, totalGames: 229 }));

    expect(copy.badgeText).toBe("Servers Online • 229 Games Played");
    expect(copy.activityLabel).toBe("229 Games Played");
    expect(copy.badgeText).not.toContain("Players");
  });

  it("never falls back to the inflated players-row count when nobody is online", () => {
    // totalPlayers counts one row per room seat, so it must not be surfaced as a player total
    const copy = getHeroStatsCopy(
      stats({ onlinePlayers: 0, totalPlayers: 229, totalGames: 8 }),
    );

    expect(copy.activityLabel).toBe("8 Games Played");
    expect(copy.badgeText).toBe("Servers Online • 8 Games Played");
  });

  it("shows the live online player count when people are actually connected", () => {
    expect(getHeroStatsCopy(stats({ onlinePlayers: 4 })).badgeText).toBe(
      "Servers Online • 4 Players Online",
    );
    expect(getHeroStatsCopy(stats({ onlinePlayers: 1 })).badgeText).toBe(
      "Servers Online • 1 Player Online",
    );
  });

  it("uses singular wording for a single game", () => {
    expect(getHeroStatsCopy(stats({ totalGames: 1 })).activityLabel).toBe(
      "1 Game Played",
    );
  });

  it("drops the activity segment instead of showing a zero or a dangling separator", () => {
    const copy = getHeroStatsCopy(stats({ onlinePlayers: 0, totalGames: 0 }));

    expect(copy.activityLabel).toBe("");
    expect(copy.badgeText).toBe("Servers Online");
  });

  it("shows only the status while stats are still loading", () => {
    const copy = getHeroStatsCopy(null);

    expect(copy.statusText).toBe("Servers Online");
    expect(copy.activityLabel).toBe("");
    expect(copy.badgeText).toBe("Servers Online");
  });

  it("switches the status wording when the game server is unreachable", () => {
    expect(getHeroStatsCopy(stats({ serversOnline: false })).badgeText).toBe(
      "Instant Play Ready • 8 Games Played",
    );
  });
});
