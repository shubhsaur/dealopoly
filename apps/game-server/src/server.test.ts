import { beforeAll, describe, expect, it } from "vitest";
import { createGameServer } from "./server.js";

describe("Dealopoly Real-Time Game Server", () => {
  beforeAll(() => {
    delete process.env.DATABASE_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_URL;
  });
  it("reports that it is healthy", async () => {
    const server = await createGameServer();
    const response = await server.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("ok");
    expect(response.json().service).toBe("dealopoly-game-server");

    await server.close();
  });

  it("should create a private room and return a room code, session token, and seat", async () => {
    const server = await createGameServer();
    const response = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", botCount: 2 },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.roomCode).toBeDefined();
    expect(body.hostPlayerId).toBeDefined();
    expect(body.sessionToken).toBeDefined();
    expect(body.room.seats.length).toBe(3); // 1 host + 2 bots
    expect(body.room.seats[0].name).toBe("Alice");
    expect(body.room.seats[1].isBot).toBe(true);
    expect(body.room.seats[1].difficulty).toBe("medium");

    await server.close();
  });

  it("should allow another player to join an existing room by code", async () => {
    const server = await createGameServer();

    // 1. Create Room
    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice" },
    });
    const { roomCode } = createRes.json();

    // 2. Join Room
    const joinRes = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode, playerName: "Bob" },
    });

    expect(joinRes.statusCode).toBe(200);
    const joinBody = joinRes.json();
    expect(joinBody.playerId).toBeDefined();
    expect(joinBody.sessionToken).toBeDefined();
    expect(joinBody.room.seats.length).toBe(2);
    expect(joinBody.room.seats[1].name).toBe("Bob");

    // 3. Get Public Room Info
    const getRes = await server.inject({
      method: "GET",
      url: `/api/rooms/${roomCode}`,
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().room.seats.length).toBe(2);

    await server.close();
  });

  it("should reject joining a non-existent room", async () => {
    const server = await createGameServer();
    const response = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode: "999999", playerName: "Ghost" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain("not found");

    await server.close();
  });

  it("should reclaim existing seat and prevent duplicate seats when joining with same userId or sessionToken", async () => {
    const server = await createGameServer();

    // 1. Create Room with Alice (userId: 'user-alice')
    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", userId: "user-alice" },
    });
    const { roomCode, hostPlayerId, sessionToken: hostToken } = createRes.json();

    // 2. Re-joining as Alice with same userId should reclaim seat, not create duplicate
    const aliceRejoinRes = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode, playerName: "Alice", userId: "user-alice" },
    });
    expect(aliceRejoinRes.statusCode).toBe(200);
    const aliceBody = aliceRejoinRes.json();
    expect(aliceBody.playerId).toBe(hostPlayerId);
    expect(aliceBody.sessionToken).toBeDefined();
    expect(aliceBody.room.seats.length).toBe(1);

    // 3. Bob joins without userId initially
    const bobJoinRes = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode, playerName: "Bob" },
    });
    expect(bobJoinRes.statusCode).toBe(200);
    const bobBody = bobJoinRes.json();
    const bobPlayerId = bobBody.playerId;
    const bobToken = bobBody.sessionToken;
    expect(bobBody.room.seats.length).toBe(2);

    // 4. Bob joins again with sessionToken AND now includes userId: 'user-bob'
    const bobRejoinRes = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode, playerName: "Bob", sessionToken: bobToken, userId: "user-bob" },
    });
    expect(bobRejoinRes.statusCode).toBe(200);
    const bobRejoinBody = bobRejoinRes.json();
    expect(bobRejoinBody.playerId).toBe(bobPlayerId);
    expect(bobRejoinBody.sessionToken).toBeDefined();
    expect(bobRejoinBody.room.seats.length).toBe(2); // Still 2 seats, NOT 3!
    const internalRoom = (server as any).roomManager.getRoom(roomCode);
    const bobSeat = internalRoom.seats.find((s: any) => s.playerId === bobPlayerId);
    expect(bobSeat.userId).toBe("user-bob");

    await server.close();
  });

  it("should execute bot turns to completion without freezing when human turn ends", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;
    const triggerBotTurns = (server as any).triggerBotTurns;

    // 1. Create room with 1 human host (Alice) + 1 Bot
    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", botCount: 1 },
    });
    const { roomCode, hostPlayerId } = createRes.json();
    expect(roomCode).toBeDefined();

    // 2. Start Game
    await roomManager.startGame(roomCode, hostPlayerId);
    let room = roomManager.getRoom(roomCode);
    expect(room.status).toBe("in_progress");
    expect(room.gameState).toBeDefined();

    // Turn 1 is Alice's turn
    expect(room.gameState.turn.activePlayerId).toBe(hostPlayerId);

    // Alice draws cards
    await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "draw_cards",
      playerId: hostPlayerId,
    });

    // Alice ends turn -> Next turn is Bot's turn
    await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "end_turn",
      playerId: hostPlayerId,
    });

    room = roomManager.getRoom(roomCode);
    const botSeat = room.seats.find((s: any) => s.isBot);
    expect(botSeat).toBeDefined();
    expect(room.gameState.turn.activePlayerId).toBe(botSeat.playerId);

    // Trigger bot turn (as done in server.ts handleSocketMessage)
    triggerBotTurns(roomCode);

    // Poll until bot completes its turn and turn switches back to Alice or max timeout
    const startTime = Date.now();
    let botFinished = false;

    while (Date.now() - startTime < 18000) {
      await new Promise((r) => setTimeout(r, 200));
      room = roomManager.getRoom(roomCode);
      if (room.gameState.turn.activePlayerId === hostPlayerId) {
        botFinished = true;
        break;
      }
      // If a bot played an action card targeting Alice (e.g. rent/sly deal), auto-pass so bot can finish turn
      const pending = room.gameState.pendingResolution;
      if (
        pending?.type === "reaction_window" &&
        (pending.waitingForPlayerId === hostPlayerId ||
          pending.waitingForPlayerIds?.includes(hostPlayerId) ||
          pending.jsnSubResolution?.waitingForPlayerId === hostPlayerId)
      ) {
        await roomManager.applyCommand(roomCode, hostPlayerId, { type: "submit_reaction", playerId: hostPlayerId, action: "pass" });
        triggerBotTurns(roomCode);
      } else if (
        pending?.type === "payment" &&
        (pending.debtorPlayerId === hostPlayerId ||
          pending.debtorPlayerIds?.includes(hostPlayerId)) &&
        !(pending.paidDebtorIds || []).includes(hostPlayerId)
      ) {
        await roomManager.applyCommand(roomCode, hostPlayerId, { type: "submit_payment", playerId: hostPlayerId, paymentCardInstanceIds: [] });
        triggerBotTurns(roomCode);
      }
    }

    expect(botFinished).toBe(true);
    expect(room.gameState.turn.activePlayerId).toBe(hostPlayerId);
    expect(room.gameState.turn.turnNumber).toBeGreaterThanOrEqual(3);

    await server.close();
  }, 20000);

  it("should initialize and atomically advance event sequence numbers without collisions", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    // 1. Create human 2-player room
    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice", userId: "alice-123" },
    });
    const { roomCode, hostPlayerId } = createRes.json();

    const joinRes = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode, playerName: "Bob", userId: "bob-456" },
    });
    const { playerId: bobPlayerId } = joinRes.json();

    // 2. Start Game
    await roomManager.startGame(roomCode, hostPlayerId);
    const room = roomManager.getRoom(roomCode);
    expect(room.status).toBe("in_progress");

    const internalRoom = roomManager.memoryRooms.get(roomCode);
    expect(internalRoom).toBeDefined();
    // Seq 1 is reserved for game_started event, so nextSequenceNum should be 2
    expect(internalRoom.nextSequenceNum).toBe(2);

    // 3. Alice draws cards
    const initialSeq = internalRoom.nextSequenceNum;
    const { events } = await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "draw_cards",
      playerId: hostPlayerId,
    });
    expect(events.length).toBeGreaterThan(0);
    // sequence number must have synchronously advanced by (1 + events.length)
    expect(internalRoom.nextSequenceNum).toBe(initialSeq + 1 + events.length);

    // Verify bots flag
    expect(internalRoom.seats.some((s: any) => s.isBot)).toBe(false);

    await server.close();
  });
});

describe("HTTP rate limiting", () => {
  it("returns 429 after exceeding the room-creation limit", async () => {
    const server = await createGameServer();

    let lastStatus = 0;
    // The /api/rooms route allows 20 requests/minute per IP.
    // All inject() calls share the same source IP, so the 21st should be limited.
    for (let i = 0; i < 21; i++) {
      const response = await server.inject({
        method: "POST",
        url: "/api/rooms",
        payload: { hostName: `Host${i}`, botCount: 1 },
      });
      lastStatus = response.statusCode;
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
    await server.close();
  });

  it("does not rate-limit the first batch of health checks", async () => {
    const server = await createGameServer();
    for (let i = 0; i < 5; i++) {
      const response = await server.inject({ method: "GET", url: "/health" });
      expect(response.statusCode).toBe(200);
    }
    await server.close();
  });
});

describe("Spectator masking", () => {
  it("sends a redacted resolution to spectators while players receive the full one", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    // 1. Create a 2-human room and start the game
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
    const { playerId: bobPlayerId } = joinRes.json();

    await roomManager.startGame(roomCode, hostPlayerId);

    // 2. Attach a host socket that captures broadcasts
    const hostMessages: any[] = [];
    const hostSocket = {
      readyState: 1,
      send: (data: string) => hostMessages.push(JSON.parse(data)),
    } as any;
    await roomManager.attachSocket(roomCode, hostPlayerId, hostToken, hostSocket);

    // 3. Register + attach a spectator that captures broadcasts
    const { spectatorId } = await roomManager.joinAsSpectator(roomCode, "Spectator Sue");
    const spectatorMessages: any[] = [];
    const spectatorSocket = {
      readyState: 1,
      send: (data: string) => spectatorMessages.push(JSON.parse(data)),
    } as any;
    await roomManager.attachSpectatorSocket(roomCode, spectatorId, spectatorSocket);

    // Move the game into the host's action phase (draw first)
    await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "draw_cards",
      playerId: hostPlayerId,
    });

    // 4. Inject a Deal Breaker reaction window into the in-progress game state.
    //    Deal Breaker steals a complete set -> actionCard + targetPropertySetCards
    //    reference real card instances that must not reach spectators.
    const stored = (roomManager as any).memoryRooms.get(String(roomCode));
    const bobId = bobPlayerId as string;

    // Give the host a Deal Breaker card so the play is legal
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
    spectatorMessages.length = 0;

    await roomManager.applyCommand(roomCode, hostPlayerId, {
      type: "play_action",
      playerId: hostPlayerId,
      cardInstanceId: "host-db",
      targetPlayerId: bobId,
      targetSetId: "bob-set-blue",
    });

    // Sanity: a reaction window opened
    const room = roomManager.getRoom(roomCode);
    expect(room.gameState.pendingResolution?.type).toBe("reaction_window");

    // 5. Inspect the latest GAME_STATE pushed to each
    const lastHostState = hostMessages.filter((m) => m.type === "GAME_STATE").pop();
    const lastSpectatorState = spectatorMessages.filter((m) => m.type === "GAME_STATE").pop();
    expect(lastHostState).toBeDefined();
    expect(lastSpectatorState).toBeDefined();

    // Host (a player) still receives the full resolution payload
    expect(JSON.stringify(lastHostState.state.pendingResolution)).toContain("host-db");

    // Spectator receives a redacted resolution: no card payloads leak.
    // (Structural check — substring matching would false-positive against the
    // random player UUIDs, e.g. an id ending in "…b2".)
    const specPending = lastSpectatorState.state.pendingResolution;
    expect(specPending?.type).toBe("reaction_window");

    function containsCardInstance(value: unknown): boolean {
      if (Array.isArray(value)) return value.some(containsCardInstance);
      if (value && typeof value === "object") {
        return Object.entries(value as Record<string, unknown>).some(
          ([key, val]) =>
            key === "instanceId" || key === "defId" || containsCardInstance(val),
        );
      }
      return false;
    }
    expect(containsCardInstance(specPending)).toBe(false);

    const specRaw = JSON.stringify(specPending);
    expect(specRaw).not.toContain("host-db");
    expect(specRaw).not.toContain("Deal Breaker");
    expect(specRaw).not.toContain("Park Lane");
    expect(specRaw).not.toContain("Mayfair");

    // Spectator view is explicitly marked as read-only
    expect(lastSpectatorState.state.viewerKind).toBe("spectator");

    // Spectator never sees any player's hand
    for (const pid of Object.keys(lastSpectatorState.state.players)) {
      expect(lastSpectatorState.state.players[pid].hand).toBeUndefined();
    }

    await server.close();
  });
});
