import { beforeAll, describe, expect, it } from "vitest";
import { createGameServer } from "./server.js";

/** Simulates the timer firing for the room's current decision. */
async function fireTurnTimer(roomManager: any, roomCode: string) {
  const stored = roomManager.memoryRooms.get(String(roomCode));
  await roomManager.handleTurnTimeout(roomCode, stored.turnTimerEpoch);
}

describe("P1 — Server-side turn timers", () => {
  beforeAll(() => {
    delete process.env.DATABASE_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_URL;
  });

  it("stamps a deadline + blockers for the active human on game start", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", botCount: 1 },
    });
    const { roomCode, hostPlayerId } = createRes.json();

    await roomManager.startGame(roomCode, hostPlayerId);

    const stored = roomManager.memoryRooms.get(String(roomCode));
    expect(stored.turnDeadline).toBeGreaterThan(Date.now());
    expect(stored.turnBlockers).toEqual([hostPlayerId]);
    expect(stored.turnTimerEpoch).toBeGreaterThanOrEqual(1);

    await server.close();
  });

  it("auto-draws for an idle player in the draw phase", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", botCount: 1 },
    });
    const { roomCode, hostPlayerId } = createRes.json();
    await roomManager.startGame(roomCode, hostPlayerId);

    const before = roomManager.getRoom(roomCode).gameState;
    const handBefore = before.players[hostPlayerId].hand.length;
    expect(before.turn.phase).toBe("draw");

    await fireTurnTimer(roomManager, roomCode);

    const after = roomManager.getRoom(roomCode).gameState;
    // The engine's draw phase deals cards, then the turn moves to the action phase.
    expect(after.players[hostPlayerId].hand.length).toBeGreaterThan(handBefore);
    expect(after.turn.phase).toBe("action");

    await server.close();
  });

  it("auto-ends the turn for an idle player in the action phase", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", botCount: 1 },
    });
    const { roomCode, hostPlayerId } = createRes.json();
    await roomManager.startGame(roomCode, hostPlayerId);

    await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "draw_cards",
      playerId: hostPlayerId,
    });

    const before = roomManager.getRoom(roomCode).gameState;
    expect(before.turn.phase).toBe("action");
    expect(before.turn.activePlayerId).toBe(hostPlayerId);

    await fireTurnTimer(roomManager, roomCode);

    const after = roomManager.getRoom(roomCode).gameState;
    // The turn must have moved on — the idle player can no longer stall it.
    expect(after.turn.activePlayerId).not.toBe(hostPlayerId);

    await server.close();
  });

  it("does not arm a timer when only bots are blocking", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", botCount: 1 },
    });
    const { roomCode, hostPlayerId } = createRes.json();
    await roomManager.startGame(roomCode, hostPlayerId);

    await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "draw_cards",
      playerId: hostPlayerId,
    });
    await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "end_turn",
      playerId: hostPlayerId,
    });

    const stored = roomManager.memoryRooms.get(String(roomCode));
    const botSeat = stored.seats.find((s: any) => s.isBot);
    expect(stored.gameState.turn.activePlayerId).toBe(botSeat.playerId);

    // No human is blocking → no deadline is stamped.
    expect(stored.turnDeadline).toBeUndefined();
    expect(stored.turnBlockers).toBeUndefined();

    await server.close();
  });

  it("ignores a stale timer fire (epoch mismatch)", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", botCount: 1 },
    });
    const { roomCode, hostPlayerId } = createRes.json();
    await roomManager.startGame(roomCode, hostPlayerId);

    const stored = roomManager.memoryRooms.get(String(roomCode));
    const handBefore = stored.gameState.players[hostPlayerId].hand.length;
    const staleEpoch = (stored.turnTimerEpoch ?? 0) - 1;

    await roomManager.handleTurnTimeout(roomCode, staleEpoch);

    const after = roomManager.getRoom(roomCode).gameState;
    expect(after.players[hostPlayerId].hand.length).toBe(handBefore);
    expect(after.turn.phase).toBe("draw");

    await server.close();
  });

  it("rejects a command whose playerId does not match the authenticated player", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice" },
    });
    const { roomCode, hostPlayerId } = createRes.json();

    const joinRes = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode, playerName: "Bob" },
    });
    const { playerId: bobPlayerId } = joinRes.json();

    await roomManager.startGame(roomCode, hostPlayerId);

    // Bob tries to act as Alice (impersonation).
    await expect(
      roomManager.applyCommand(roomCode, bobPlayerId, {
        type: "end_turn",
        playerId: hostPlayerId,
      }),
    ).rejects.toThrow(/does not match the authenticated player/);

    await expect(
      roomManager.applyCommand(roomCode, bobPlayerId, {
        type: "end_turn",
        playerId: "some-fake-id",
      }),
    ).rejects.toThrow(/does not match the authenticated player/);

    await server.close();
  });

  it("clears local turn timers when the room is abandoned", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", botCount: 1 },
    });
    const { roomCode, hostPlayerId } = createRes.json();
    await roomManager.startGame(roomCode, hostPlayerId);

    const stored = roomManager.memoryRooms.get(String(roomCode));
    expect(stored.turnDeadline).toBeDefined();

    await roomManager.abandonRoom(String(roomCode), "host_left");

    expect(roomManager.turnTimers.has(String(roomCode))).toBe(false);

    await server.close();
  });
});

describe("P1 — Idle reaction-window auto-pass", () => {
  beforeAll(() => {
    delete process.env.DATABASE_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_URL;
  });

  it("auto-passes an idle player in a reaction window and notifies the room", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice" },
    });
    const { roomCode, hostPlayerId, sessionToken: hostToken } = createRes.json();

    const joinRes = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode, playerName: "Bob" },
    });
    const { playerId: bobId } = joinRes.json();

    await roomManager.startGame(roomCode, hostPlayerId);

    const hostMessages: any[] = [];
    const hostSocket = {
      readyState: 1,
      send: (data: string) => hostMessages.push(JSON.parse(data)),
    } as any;
    await roomManager.attachSocket(roomCode, hostPlayerId, hostToken, hostSocket);

    const stored = roomManager.memoryRooms.get(String(roomCode));

    await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "draw_cards",
      playerId: hostPlayerId,
    });
    stored.gameState.players[hostPlayerId].hand = [
      {
        instanceId: "host-db",
        defId: "action-deal-breaker",
        name: "Deal Breaker",
        type: "action",
        value: 5,
      },
    ];
    stored.gameState.players[bobId].propertySets = [
      {
        setId: "bob-set-blue",
        color: "dark-blue",
        cards: [
          { instanceId: "b1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4 },
          { instanceId: "b2", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4 },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];

    hostMessages.length = 0;

    await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "play_action",
      playerId: hostPlayerId,
      cardInstanceId: "host-db",
      targetPlayerId: bobId,
      targetSetId: "bob-set-blue",
    });

    const pending = roomManager.getRoom(roomCode).gameState.pendingResolution;
    expect(pending?.type).toBe("reaction_window");
    hostMessages.length = 0;

    // Bob never responds — the timer must auto-pass him.
    await fireTurnTimer(roomManager, roomCode);

    const after = roomManager.getRoom(roomCode).gameState;
    expect(after.pendingResolution).toBeNull();
    // Deal Breaker resolved: Bob lost his set.
    expect(after.players[bobId].propertySets.length).toBe(0);
    expect(after.players[hostPlayerId].propertySets.length).toBe(1);

    const notified = hostMessages.find((m) => m.type === "IDLE_TIMEOUT");
    expect(notified).toBeDefined();
    expect(notified.message).toContain("ran out of time");

    await server.close();
  });
});