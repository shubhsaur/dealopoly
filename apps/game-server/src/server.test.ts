import { beforeAll, describe, expect, it } from "vitest";
import { createGameServer } from "./server.js";

describe("Dealopoly Real-Time Game Server", () => {
  beforeAll(() => {
    delete process.env.DATABASE_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_URL;
  });
  it("reports that it is healthy", async () => {
    const server = createGameServer();
    const response = await server.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("ok");
    expect(response.json().service).toBe("dealopoly-game-server");

    await server.close();
  });

  it("should create a private room and return a room code, session token, and seat", async () => {
    const server = createGameServer();
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
    const server = createGameServer();

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
    const server = createGameServer();
    const response = await server.inject({
      method: "POST",
      url: "/api/rooms/join",
      payload: { roomCode: "999999", playerName: "Ghost" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain("not found");

    await server.close();
  });
});
