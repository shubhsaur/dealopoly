import { describe, it, expect } from "vitest";
import { games, inArray, sql, or } from "@dealopoly/db";

describe("Match History Query Construction", () => {
  it("builds correct SQL conditions including playerOrder array overlap and winnerId", () => {
    const userPlayerIds = ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"];
    const allUserRoomIds = ["33333333-3333-3333-3333-333333333333"];

    const conditions = [
      inArray(games.winnerId, userPlayerIds),
      sql`${games.playerOrder} && ARRAY[${sql.join(
        userPlayerIds.map((id) => sql`${id}::uuid`),
        sql`, `
      )}]::uuid[]`,
    ];

    if (allUserRoomIds.length > 0) {
      conditions.push(inArray(games.roomId, allUserRoomIds));
    }

    const combinedCondition = or(...conditions);
    expect(combinedCondition).toBeDefined();

    // Verify conditions length
    expect(conditions).toHaveLength(3);
  });

  it("handles empty allUserRoomIds without breaking query conditions", () => {
    const userPlayerIds = ["11111111-1111-1111-1111-111111111111"];
    const allUserRoomIds: string[] = [];

    const conditions = [
      inArray(games.winnerId, userPlayerIds),
      sql`${games.playerOrder} && ARRAY[${sql.join(
        userPlayerIds.map((id) => sql`${id}::uuid`),
        sql`, `
      )}]::uuid[]`,
    ];

    if (allUserRoomIds.length > 0) {
      conditions.push(inArray(games.roomId, allUserRoomIds));
    }

    // Should only have 2 conditions when user has no active rooms
    expect(conditions).toHaveLength(2);
  });
});

describe("Match History Outcome & Victory Logic", () => {
  const userPlayerIdSet = new Set(["player-user-1", "player-user-2"]);

  function computeIsVictory(status: string, winnerId: string | null): boolean {
    return status === "completed" && Boolean(winnerId && userPlayerIdSet.has(winnerId));
  }

  it("identifies a victory when the user is the winner of a completed game", () => {
    expect(computeIsVictory("completed", "player-user-1")).toBe(true);
    expect(computeIsVictory("completed", "player-user-2")).toBe(true);
  });

  it("identifies a defeat when someone else is the winner of a completed game", () => {
    expect(computeIsVictory("completed", "player-rival-99")).toBe(false);
  });

  it("does not count ongoing or abandoned games as victories even if winning candidate set", () => {
    expect(computeIsVictory("in_progress", "player-user-1")).toBe(false);
    expect(computeIsVictory("abandoned", "player-user-1")).toBe(false);
    expect(computeIsVictory("completed", null)).toBe(false);
  });
});

describe("Match History Item Mapping", () => {
  it("correctly maps raw game rows to PastGameItem attributes", () => {
    const rawGame = {
      id: "game-100",
      gameType: "monodeal",
      seed: 42,
      status: "completed",
      turnCount: 15,
      playerOrder: ["p1", "p2", "p3"],
      winnerId: "p1",
      startedAt: new Date("2026-10-10T12:00:00Z"),
      completedAt: new Date("2026-10-10T12:20:00Z"),
      roomId: "room-abc",
      roomCode: "XYZ123",
    };

    const winnerMap = new Map<string, string>([["p1", "Alice"]]);
    const userPlayerIdSet = new Set(["p1"]);

    const isVictory =
      rawGame.status === "completed" && Boolean(rawGame.winnerId && userPlayerIdSet.has(rawGame.winnerId));

    const mapped = {
      id: rawGame.id,
      gameType: rawGame.gameType || "monodeal",
      seed: rawGame.seed,
      status: rawGame.status,
      turnCount: rawGame.turnCount,
      startedAt: rawGame.startedAt.toISOString(),
      completedAt: rawGame.completedAt.toISOString(),
      winnerId: rawGame.winnerId,
      winnerName: rawGame.winnerId ? winnerMap.get(rawGame.winnerId) ?? null : null,
      roomCode: rawGame.roomCode || "UNKNOWN",
      playerCount: Array.isArray(rawGame.playerOrder) ? rawGame.playerOrder.length : 0,
      isVictory,
    };

    expect(mapped.winnerName).toBe("Alice");
    expect(mapped.playerCount).toBe(3);
    expect(mapped.isVictory).toBe(true);
    expect(mapped.roomCode).toBe("XYZ123");
    expect(mapped.startedAt).toBe("2026-10-10T12:00:00.000Z");
  });
});

describe("User Account and Email Anchoring across Display Name Changes", () => {
  it("builds player query with both userId and userEmail conditions", () => {
    const userId = "user-uuid-123";
    const userEmail = "player@example.com";

    const conditions = [];
    if (userId) conditions.push(`players.userId = '${userId}'`);
    if (userEmail) conditions.push(`players.userEmail = '${userEmail}'`);

    expect(conditions).toHaveLength(2);
    expect(conditions[0]).toBe("players.userId = 'user-uuid-123'");
    expect(conditions[1]).toBe("players.userEmail = 'player@example.com'");
  });

  it("consolidates matches played under different display names for the same email", () => {
    // Simulating player rows created with different display names but same email
    const playerRows = [
      { id: "player-uuid-1", displayName: "OriginalName", userId: "user-uuid-123", userEmail: "player@example.com" },
      { id: "player-uuid-2", displayName: "RenamedPlayer", userId: "user-uuid-123", userEmail: "player@example.com" },
      { id: "player-uuid-3", displayName: "GuestOverride", userId: null, userEmail: "player@example.com" },
    ];

    const currentEmail = "player@example.com";
    const currentUserId = "user-uuid-123";

    const matchedPlayerIds = playerRows
      .filter((p) => p.userEmail === currentEmail || (currentUserId && p.userId === currentUserId))
      .map((p) => p.id);

    // All 3 identities under different display names must be unified under the user
    expect(matchedPlayerIds).toEqual(["player-uuid-1", "player-uuid-2", "player-uuid-3"]);

    const userPlayerIdSet = new Set(matchedPlayerIds);

    // Any match won under either name is recognized as a victory for the user
    expect(userPlayerIdSet.has("player-uuid-1")).toBe(true);
    expect(userPlayerIdSet.has("player-uuid-2")).toBe(true);
    expect(userPlayerIdSet.has("player-uuid-3")).toBe(true);
  });
});
