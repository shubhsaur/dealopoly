import { beforeAll, describe, expect, it } from "vitest";
import { createGameServer } from "./server.js";

describe("Voice Chat Signaling", () => {
  beforeAll(() => {
    delete process.env.DATABASE_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_URL;
  });

  it(
    "relays voice signals between peers",
    async () => {
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

      // Alice sends WebRTC offer to Bob
      await roomManager.relayVoiceSignal(roomCode, hostPlayerId, guestPlayerId, {
        type: "offer",
        sdp: "fake-sdp-offer",
      });

      // Bob should receive the signal
      const bobSignal = guestMessages.find((m) => m.type === "VOICE_SIGNAL");
      expect(bobSignal).toBeDefined();
      expect(bobSignal.fromPlayerId).toBe(hostPlayerId);
      expect(bobSignal.signal).toEqual({ type: "offer", sdp: "fake-sdp-offer" });

      // Alice should NOT receive her own signal
      expect(hostMessages.find((m) => m.type === "VOICE_SIGNAL")).toBeUndefined();

      // Bob sends WebRTC answer back to Alice
      await roomManager.relayVoiceSignal(roomCode, guestPlayerId, hostPlayerId, {
        type: "answer",
        sdp: "fake-sdp-answer",
      });

      const aliceSignal = hostMessages.find((m) => m.type === "VOICE_SIGNAL");
      expect(aliceSignal).toBeDefined();
      expect(aliceSignal.fromPlayerId).toBe(guestPlayerId);
      expect(aliceSignal.signal).toEqual({ type: "answer", sdp: "fake-sdp-answer" });

      await server.close();
    },
    30_000,
  );

  it(
    "broadcasts voice state changes (mute/deafen) to the room",
    async () => {
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

      await roomManager.broadcastVoiceState(roomCode, hostPlayerId, true, false);

      const hostVoiceState = hostMessages.find((m) => m.type === "VOICE_STATE");
      const guestVoiceState = guestMessages.find((m) => m.type === "VOICE_STATE");

      expect(hostVoiceState).toBeDefined();
      expect(guestVoiceState).toBeDefined();
      expect(guestVoiceState.playerId).toBe(hostPlayerId);
      expect(guestVoiceState.isMuted).toBe(true);
      expect(guestVoiceState.isDeafened).toBe(false);

      await server.close();
    },
    30_000,
  );

  it(
    "notifies peers with VOICE_PEER_LEFT when a socket detaches",
    async () => {
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

      roomManager.detachSocket(roomCode, guestPlayerId, guestSocket);

      const peerLeft = hostMessages.find((m) => m.type === "VOICE_PEER_LEFT");
      expect(peerLeft).toBeDefined();
      expect(peerLeft.playerId).toBe(guestPlayerId);

      await server.close();
    },
    30_000,
  );
});
