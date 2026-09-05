import { beforeAll, describe, expect, it } from "vitest";
import { createGameServer } from "./server.js";

describe("Host Disconnect Flow", () => {
  beforeAll(() => {
    delete process.env.DATABASE_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_URL;
  });

  it("should broadcast host disconnected status and deadline when host detaches", async () => {
    const server = createGameServer();
    const roomManager = (server as any).roomManager;

    // 1. Create room
    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice" },
    });
    const { roomCode, hostPlayerId, sessionToken: hostToken } = createRes.json();

    // 2. Join guest
    const joinRes = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode, playerName: "Bob" },
    });
    const { playerId: guestPlayerId, sessionToken: guestToken } = joinRes.json();

    // 3. Start game
    await roomManager.startGame(roomCode, hostPlayerId);

    // 4. Mock sockets
    const guestMessages: any[] = [];
    const guestSocket = {
      readyState: 1,
      send: (data: string) => {
        guestMessages.push(JSON.parse(data));
      },
    } as any;

    const hostSocket = {
      readyState: 1,
      send: () => {},
    } as any;

    await roomManager.attachSocket(roomCode, hostPlayerId, hostToken, hostSocket);
    await roomManager.attachSocket(roomCode, guestPlayerId, guestToken, guestSocket);

    // Clear initial messages
    guestMessages.length = 0;

    // 5. Host detaches
    roomManager.detachSocket(roomCode, hostPlayerId, hostSocket);

    // 6. Check Guest received ROOM_STATE with host disconnected and deadline
    expect(guestMessages.length).toBeGreaterThan(0);
    const lastRoomState = guestMessages.filter((m) => m.type === "ROOM_STATE").pop();
    expect(lastRoomState).toBeDefined();
    console.log("lastRoomState:", JSON.stringify(lastRoomState, null, 2));

    expect(lastRoomState.room.hostDisconnectedUntil).toBeDefined();
    expect(lastRoomState.room.hostDisconnectedUntil).toBeGreaterThan(Date.now());

    const hostSeat = lastRoomState.room.seats.find((s: any) => s.playerId === hostPlayerId);
    expect(hostSeat.isConnected).toBe(false);
    expect(hostSeat.disconnectDeadline).toBeDefined();

    // 7. Fast-forward timer: trigger timeout directly
    guestMessages.length = 0;
    await (roomManager as any).handleDisconnectTimeout(roomCode, hostPlayerId);

    // Guest should receive ROOM_DESTROYED
    const errorMsg = guestMessages.find((m) => m.type === "ERROR" && m.code === "ROOM_DESTROYED");
    expect(errorMsg).toBeDefined();
    expect(errorMsg.message).toBe("The game was abandoned due to host inactivity.");

    await server.close();
  });

  it("should start 5-minute disconnect timer when host explicitly leaves during game, and abandon upon timeout", async () => {
    const server = createGameServer();
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
    const { playerId: guestPlayerId, sessionToken: guestToken } = joinRes.json();

    await roomManager.startGame(roomCode, hostPlayerId);

    const guestMessages: any[] = [];
    const guestSocket = {
      readyState: 1,
      send: (data: string) => {
        guestMessages.push(JSON.parse(data));
      },
    } as any;

    const hostSocket = { readyState: 1, send: () => {} } as any;

    await roomManager.attachSocket(roomCode, hostPlayerId, hostToken, hostSocket);
    await roomManager.attachSocket(roomCode, guestPlayerId, guestToken, guestSocket);
    guestMessages.length = 0;

    // Host explicitly leaves during active match
    roomManager.explicitLeave(roomCode, hostPlayerId);

    // Guest receives ROOM_STATE with host disconnected and deadline
    const lastRoomState = guestMessages.filter((m) => m.type === "ROOM_STATE").pop();
    expect(lastRoomState).toBeDefined();
    expect(lastRoomState.room.hostDisconnectedUntil).toBeDefined();
    expect(lastRoomState.room.hostDisconnectedUntil).toBeGreaterThan(Date.now());

    const hostSeat = lastRoomState.room.seats.find((s: any) => s.playerId === hostPlayerId);
    expect(hostSeat.isConnected).toBe(false);
    expect(hostSeat.disconnectDeadline).toBeDefined();

    // Fast forward to timeout: room is destroyed after 5 minutes
    guestMessages.length = 0;
    await (roomManager as any).handleDisconnectTimeout(roomCode, hostPlayerId);

    const errorMsg = guestMessages.find((m) => m.type === "ERROR" && m.code === "ROOM_DESTROYED");
    expect(errorMsg).toBeDefined();
    expect(errorMsg.message).toBe("The game was abandoned due to host inactivity.");

    await server.close();
  });

  it("should abandon room when host leaves the lobby", async () => {
    const server = createGameServer();
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
    const { playerId: guestPlayerId, sessionToken: guestToken } = joinRes.json();

    const guestMessages: any[] = [];
    const guestSocket = {
      readyState: 1,
      send: (data: string) => {
        guestMessages.push(JSON.parse(data));
      },
    } as any;

    const hostSocket = { readyState: 1, send: () => {} } as any;

    await roomManager.attachSocket(roomCode, hostPlayerId, hostToken, hostSocket);
    await roomManager.attachSocket(roomCode, guestPlayerId, guestToken, guestSocket);
    guestMessages.length = 0;

    // Host explicitly leaves lobby (status is "lobby")
    roomManager.explicitLeave(roomCode, hostPlayerId);

    const errorMsg = guestMessages.find((m) => m.type === "ERROR" && m.code === "ROOM_DESTROYED");
    expect(errorMsg).toBeDefined();
    expect(errorMsg.message).toBe("The host has ended the game.");

    await server.close();
  });

  it("should start disconnect timer when guest explicitly leaves during game and convert to bot upon timeout", async () => {
    const server = createGameServer();
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
    const { playerId: guestPlayerId, sessionToken: guestToken } = joinRes.json();

    await roomManager.startGame(roomCode, hostPlayerId);

    const hostMessages: any[] = [];
    const hostSocket = {
      readyState: 1,
      send: (data: string) => {
        hostMessages.push(JSON.parse(data));
      },
    } as any;

    const guestSocket = { readyState: 1, send: () => {} } as any;

    await roomManager.attachSocket(roomCode, hostPlayerId, hostToken, hostSocket);
    await roomManager.attachSocket(roomCode, guestPlayerId, guestToken, guestSocket);
    hostMessages.length = 0;

    // Guest explicitly leaves during game
    roomManager.explicitLeave(roomCode, guestPlayerId);

    const lastRoomState = hostMessages.filter((m) => m.type === "ROOM_STATE").pop();
    expect(lastRoomState).toBeDefined();
    const guestSeat = lastRoomState.room.seats.find((s: any) => s.playerId === guestPlayerId);
    expect(guestSeat.isConnected).toBe(false);
    expect(guestSeat.disconnectDeadline).toBeDefined();

    // Fast-forward timeout: converts to bot
    await (roomManager as any).handleDisconnectTimeout(roomCode, guestPlayerId);
    const postTimeoutState = hostMessages.filter((m) => m.type === "ROOM_STATE").pop();
    const convertedSeat = postTimeoutState.room.seats.find((s: any) => s.playerId === guestPlayerId);
    expect(convertedSeat.isBot).toBe(true);

    await server.close();
  });
});
