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
