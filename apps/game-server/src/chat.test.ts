import { beforeAll, describe, expect, it } from "vitest";
import { createGameServer } from "./server.js";

describe("In-Game Chat", () => {
  beforeAll(() => {
    delete process.env.DATABASE_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_URL;
  });

  it("broadcasts a chat message to all connected seats", async () => {
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
    const { playerId: guestPlayerId, sessionToken: guestToken } = joinRes.json();

    const hostMessages: any[] = [];
    const guestMessages: any[] = [];

    const hostSocket = {
      readyState: 1,
      send: (data: string) => {
        hostMessages.push(JSON.parse(data));
      },
    } as any;

    const guestSocket = {
      readyState: 1,
      send: (data: string) => {
        guestMessages.push(JSON.parse(data));
      },
    } as any;

    await roomManager.attachSocket(roomCode, hostPlayerId, hostToken, hostSocket);
    await roomManager.attachSocket(roomCode, guestPlayerId, guestToken, guestSocket);

    hostMessages.length = 0;
    guestMessages.length = 0;

    await roomManager.broadcastChat(roomCode, hostPlayerId, "Hello @Bob!");

    expect(hostMessages.length).toBeGreaterThan(0);
    expect(guestMessages.length).toBeGreaterThan(0);

    const hostChat = hostMessages.find((m) => m.type === "CHAT");
    const guestChat = guestMessages.find((m) => m.type === "CHAT");

    expect(hostChat).toBeDefined();
    expect(guestChat).toBeDefined();
    expect(hostChat.text).toBe("Hello @Bob!");
    expect(hostChat.playerName).toBe("Alice");
    expect(hostChat.mentions).toContain(guestPlayerId);

    await server.close();
  });

  it("rate-limits chat messages", async () => {
    const server = await createGameServer();
    const roomManager = (server as any).roomManager;

    const createRes = await server.inject({
      method: "POST",
      url: "/api/rooms",
      payload: { hostName: "Alice" },
    });
    const { roomCode, hostPlayerId, sessionToken: hostToken } = createRes.json();

    const hostSocket = {
      readyState: 1,
      send: () => {},
    } as any;

    await roomManager.attachSocket(roomCode, hostPlayerId, hostToken, hostSocket);

    const messages: any[] = [];
    const originalSend = hostSocket.send;
    hostSocket.send = (data: string) => {
      messages.push(JSON.parse(data));
      originalSend(data);
    };

    await roomManager.broadcastChat(roomCode, hostPlayerId, "first");
    await roomManager.broadcastChat(roomCode, hostPlayerId, "second");

    const chatMessages = messages.filter((m) => m.type === "CHAT");
    expect(chatMessages.length).toBe(1);

    await server.close();
  });
});
