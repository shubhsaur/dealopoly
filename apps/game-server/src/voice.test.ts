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

  it(
    "supports full 5-player mesh WebRTC voice signaling across all 10 peer pairs",
    async () => {
      const server = await createGameServer();
      const roomManager = (server as any).roomManager;

      // 1. Create room with Host (Player 1)
      const createRes = await server.inject({
        method: "POST",
        url: "/api/rooms",
        payload: { hostName: "Player 1" },
      });
      const { roomCode, hostPlayerId, sessionToken: hostToken } = createRes.json();

      // 2. Join 4 more players (Players 2-5)
      const players = [{ id: hostPlayerId, token: hostToken, name: "Player 1", messages: [] as any[] }];

      for (let i = 2; i <= 5; i++) {
        const joinRes = await server.inject({
          method: "POST",
          url: "/api/rooms/join",
          payload: { roomCode, playerName: `Player ${i}` },
        });
        const { playerId, sessionToken } = joinRes.json();
        players.push({ id: playerId, token: sessionToken, name: `Player ${i}`, messages: [] });
      }

      // 3. Attach sockets for all 5 players
      for (const p of players) {
        const socket = {
          readyState: 1,
          send: (data: string) => {
            p.messages.push(JSON.parse(data));
          },
        } as any;
        await roomManager.attachSocket(roomCode, p.id, p.token, socket);
      }

      // Clear initial room/game state sync messages
      for (const p of players) p.messages.length = 0;

      // 4. Verify all 10 peer pairs can exchange signals bidirectionally (5 * 4 = 20 directional links)
      let successfulRelays = 0;
      for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < players.length; j++) {
          if (i === j) continue;
          const sender = players[i]!;
          const receiver = players[j]!;

          const testSignal = {
            type: "offer",
            sdp: `sdp-from-${sender.id}-to-${receiver.id}`,
          };

          await roomManager.relayVoiceSignal(roomCode, sender.id, receiver.id, testSignal);

          const receivedMsg = receiver.messages.find(
            (m) =>
              m.type === "VOICE_SIGNAL" &&
              m.fromPlayerId === sender.id &&
              m.signal?.sdp === testSignal.sdp,
          );

          expect(receivedMsg).toBeDefined();
          expect(receivedMsg.targetPlayerId).toBe(receiver.id);

          // Sender should NOT have received their own signal
          const senderEcho = sender.messages.find(
            (m) => m.type === "VOICE_SIGNAL" && m.signal?.sdp === testSignal.sdp,
          );
          expect(senderEcho).toBeUndefined();

          successfulRelays++;
        }
      }

      expect(successfulRelays).toBe(20); // All 20 directed links (10 peer pairs) verified!

      // 5. Verify voice state broadcasts reach all 4 other players
      players[0]!.messages.length = 0;
      for (let k = 1; k < players.length; k++) players[k]!.messages.length = 0;

      await roomManager.broadcastVoiceState(roomCode, players[0]!.id, true, false);

      for (let k = 1; k < players.length; k++) {
        const stateMsg = players[k]!.messages.find(
          (m) => m.type === "VOICE_STATE" && m.playerId === players[0]!.id,
        );
        expect(stateMsg).toBeDefined();
        expect(stateMsg.isMuted).toBe(true);
      }

      await server.close();
    },
    30_000,
  );
});
