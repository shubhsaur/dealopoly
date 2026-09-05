import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyWebsocket from "@fastify/websocket";
import type { WebSocket } from "ws";
import type { GameCommand } from "@dealopoly/game-engine";
import { getGameEngine } from "@dealopoly/game-engine";
import { parseBotDifficulty } from "@dealopoly/shared";
import { pingRedis, isRedisConfigured, isPubSubConfigured, closePubSub } from "@dealopoly/redis";
import { RoomManager } from "./rooms/manager.js";

export function createGameServer() {
  const server = Fastify({ logger: true });
  const roomManager = new RoomManager();
  (server as any).roomManager = roomManager;

  // Register plugins with permissive CORS for all origins
  server.register(cors, {
    origin: (origin, cb) => {
      // Allow any origin (Vercel frontend, local dev, custom domains)
      cb(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  });
  server.register(fastifyWebsocket);

  // Hook to hydrate active rooms on server start (Redis first, Postgres fallback)
  server.addHook("onReady", async () => {
    try {
      await roomManager.hydrateOnBoot();
    } catch (err: unknown) {
      server.log.warn({ err }, "Could not hydrate active rooms on boot");
    }
  });

  // Gracefully close pub/sub ioredis connections on server shutdown
  server.addHook("onClose", async () => {
    if (isPubSubConfigured()) {
      server.log.info("Closing Redis pub/sub connections...");
      await closePubSub();
    }
  });

  // Health endpoint
  server.get("/health", async () => ({
    service: "dealopoly-game-server",
    status: "ok",
    timestamp: Date.now(),
  }));

  // Redis health endpoint
  server.get("/api/redis-health", async (_request, reply) => {
    if (!isRedisConfigured()) {
      return reply.code(200).send({
        service: "dealopoly-game-server",
        redis: "not_configured",
        message: "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. Running in memory-only mode.",
        timestamp: Date.now(),
      });
    }

    const ping = await pingRedis();
    if (!ping) {
      return reply.code(503).send({
        service: "dealopoly-game-server",
        redis: "error",
        message: "Redis ping failed. Check your Upstash credentials.",
        timestamp: Date.now(),
      });
    }

    return reply.code(200).send({
      service: "dealopoly-game-server",
      redis: "ok",
      latencyMs: ping.latencyMs,
      pubSub: isPubSubConfigured() ? "configured" : "not_configured",
      timestamp: Date.now(),
    });
  });

  // Stats endpoint
  server.get("/api/stats", async () => {
    const stats = await roomManager.getStats();
    return {
      service: "dealopoly-game-server",
      status: "ok",
      onlinePlayers: stats.onlinePlayers,
      activeRooms: stats.activeRooms,
      totalRooms: stats.totalRooms,
      redis: {
        configured: isRedisConfigured(),
        pubSub: isPubSubConfigured(),
      },
      timestamp: Date.now(),
    };
  });

  // REST: Create Room
  server.post<{
    Body: { hostName?: string; botCount?: number; botDifficulty?: string; userId?: string; gameType?: string };
  }>("/api/rooms", async (request, reply) => {
    const { hostName = "Host", botCount = 0, botDifficulty, userId, gameType } = request.body || {};
    try {
      const { room, hostPlayerId, sessionToken } = await roomManager.createRoom(hostName, {
        botCount,
        botDifficulty: parseBotDifficulty(botDifficulty),
        userId,
        gameType,
      });
      return reply.code(201).send({
        roomCode: room.code,
        hostPlayerId,
        sessionToken,
        room: roomManager.getPublicRoomInfo(room),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create room";
      return reply.code(400).send({ error: message });
    }
  });

  // REST: Join Room
  server.post<{
    Body: { roomCode: string; playerName?: string; userId?: string };
  }>("/api/rooms/join", async (request, reply) => {
    const { roomCode, playerName = "Player", userId } = request.body || {};
    if (!roomCode) {
      return reply.code(400).send({ error: "Room code is required" });
    }

    try {
      const { room, playerId, sessionToken } = await roomManager.joinRoom(roomCode, playerName, {
        userId,
      });
      return reply.code(200).send({
        roomCode: room.code,
        playerId,
        sessionToken,
        room: roomManager.getPublicRoomInfo(room),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join room";
      return reply.code(400).send({ error: message });
    }
  });

  // REST: Get Room Info
  server.get<{
    Params: { code: string };
  }>("/api/rooms/:code", async (request, reply) => {
    const { code } = request.params;
    const room = roomManager.getRoom(code);
    if (!room) {
      return reply.code(404).send({ error: "Room not found" });
    }
    return reply.code(200).send({
      room: roomManager.getPublicRoomInfo(room),
    });
  });

  // WebSocket Server Handler
  server.register(async (instance) => {
    instance.get(
      "/ws",
      { websocket: true },
      (socket: WebSocket, req) => {
        const query = req.query as Record<string, string | undefined>;
        const roomCode = query["room"];
        const playerId = query["player"];
        const token = query["token"];

        if (!roomCode || !playerId || !token) {
          socket.send(
            JSON.stringify({
              type: "ERROR",
              code: "MISSING_CREDENTIALS",
              message: "WebSocket connection requires room, player, and token parameters",
            }),
          );
          socket.close(1008, "Missing credentials");
          return;
        }

        // attachSocket is async (Redis lookup) — run in background, reject on error
        void roomManager
          .attachSocket(roomCode, playerId, token, socket)
          .then(() => {
            triggerBotTurns(roomCode);
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : "Failed to attach socket";
            socket.send(JSON.stringify({ type: "ERROR", code: "AUTH_FAILED", message }));
            socket.close(1008, message);
          });

        socket.on("message", async (raw) => {
          try {
            const data = JSON.parse(raw.toString());
            await handleSocketMessage(roomCode, playerId, data, socket);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Invalid message format";
            socket.send(
              JSON.stringify({
                type: "ERROR",
                code: "INVALID_MESSAGE",
                message,
              }),
            );
          }
        });

        socket.on("close", () => {
          roomManager.detachSocket(roomCode, playerId, socket);
        });
      },
    );
  });

  async function handleSocketMessage(
    roomCode: string,
    playerId: string,
    data: Record<string, unknown>,
    socket: WebSocket,
  ) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    switch (data["type"]) {
      case "PING":
        socket.send(JSON.stringify({ type: "PONG" }));
        break;

      case "LEAVE_GAME":
        roomManager.explicitLeave(roomCode, playerId);
        triggerBotTurns(roomCode);
        break;

      case "START_GAME":
        try {
          await roomManager.startGame(roomCode, playerId);
          triggerBotTurns(roomCode);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to start game";
          socket.send(JSON.stringify({ type: "ERROR", code: "START_FAILED", message }));
        }
        break;

      case "ADD_BOT":
        try {
          await roomManager.addBot(
            roomCode,
            playerId,
            parseBotDifficulty(data["difficulty"]),
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to add bot";
          socket.send(JSON.stringify({ type: "ERROR", code: "ADD_BOT_FAILED", message }));
        }
        break;

      case "REMOVE_PLAYER":
        try {
          await roomManager.removePlayer(roomCode, playerId, data["targetPlayerId"] as string);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to remove player";
          socket.send(JSON.stringify({ type: "ERROR", code: "REMOVE_FAILED", message }));
        }
        break;

      case "COMMAND":
        try {
          await roomManager.applyCommand(roomCode, playerId, data["command"] as GameCommand);
          triggerBotTurns(roomCode);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Command rejected";
          socket.send(JSON.stringify({ type: "ERROR", code: "COMMAND_REJECTED", message }));
        }
        break;

      default:
        socket.send(
          JSON.stringify({
            type: "ERROR",
            code: "UNKNOWN_TYPE",
            message: `Unknown message type: ${data["type"]}`,
          }),
        );
    }
  }

  const activeBotLoops = new Set<string>();

  function triggerBotTurns(roomCode: string) {
    if (activeBotLoops.has(roomCode)) {
      return;
    }

    const initialRoom = roomManager.getRoom(roomCode);
    if (!initialRoom || !initialRoom.gameState || initialRoom.status !== "in_progress") {
      return;
    }

    activeBotLoops.add(roomCode);
    let iterations = 0;
    const maxIterations = 60;

    const runNextBotStep = async () => {
      try {
        const room = roomManager.getRoom(roomCode);
        if (!room || !room.gameState || room.status !== "in_progress" || iterations++ > maxIterations) {
          activeBotLoops.delete(roomCode);
          return;
        }

        // Check if reaction or payment is waiting for a bot
        let targetBotId: string | null = null;

        const isPlayerBot = (pId: string): boolean => {
          return Boolean(
            room.gameState?.players[pId]?.isBot ||
            room.seats.find((s) => s.playerId === pId)?.isBot,
          );
        };

        if (room.gameState.pendingResolution?.type === "reaction_window") {
          const waitingId = room.gameState.pendingResolution.waitingForPlayerId;
          if (isPlayerBot(waitingId)) {
            targetBotId = waitingId;
          }
        } else if (room.gameState.pendingResolution?.type === "payment") {
          const debtorId = room.gameState.pendingResolution.debtorPlayerId;
          if (isPlayerBot(debtorId)) {
            targetBotId = debtorId;
          }
        } else if (room.gameState.pendingResolution?.type === "discard") {
          const pId = room.gameState.pendingResolution.playerId;
          if (isPlayerBot(pId)) {
            targetBotId = pId;
          }
        } else if (
          room.gameState.turn?.activePlayerId &&
          isPlayerBot(room.gameState.turn.activePlayerId)
        ) {
          targetBotId = room.gameState.turn.activePlayerId;
        } else if (
          room.gameState.activePlayerId &&
          isPlayerBot(room.gameState.activePlayerId)
        ) {
          targetBotId = room.gameState.activePlayerId;
        } else if (room.gameState.status === "round_end") {
          const activeBotSeat = room.seats.find(
            (s) => s.isBot && !room.gameState?.players[s.playerId]?.isEliminated,
          );
          if (activeBotSeat) {
            targetBotId = activeBotSeat.playerId;
          }
        }

        if (!targetBotId) {
          activeBotLoops.delete(roomCode);
          return;
        }

        const engine = getGameEngine(room.gameType || "monodeal");
        const seatDifficulty = room.seats.find((s) => s.playerId === targetBotId)?.difficulty;
        let botCommand = engine.computeBotAction(
          room.gameState,
          targetBotId,
          parseBotDifficulty(seatDifficulty),
        );

        if (!botCommand) {
          // If computeBotAction returns null during bot's active turn, end turn as fail-safe
          if (room.gameState.turn?.activePlayerId === targetBotId) {
            botCommand = { type: "end_turn", playerId: targetBotId } as any;
          }
        }

        if (botCommand) {
          try {
            await roomManager.applyCommand(roomCode, targetBotId, botCommand as GameCommand);
            // Chain next step if bot is still active or another bot needs to act
            setTimeout(runNextBotStep, 450);
          } catch (err: unknown) {
            server.log.warn({ err, roomCode, targetBotId, botCommand }, "Bot command execution failed");
            // If action failed during active turn and wasn't already end_turn, force end_turn to avoid deadlock
            if (room.gameState.turn?.activePlayerId === targetBotId && (botCommand as any).type !== "end_turn") {
              try {
                await roomManager.applyCommand(roomCode, targetBotId, {
                  type: "end_turn",
                  playerId: targetBotId,
                } as any);
                setTimeout(runNextBotStep, 450);
                return;
              } catch {
                // Ignore fallback end_turn failure
              }
            }
            activeBotLoops.delete(roomCode);
          }
        } else {
          activeBotLoops.delete(roomCode);
        }
      } catch (err: unknown) {
        server.log.error({ err, roomCode }, "Unhandled error in bot execution loop");
        activeBotLoops.delete(roomCode);
      }
    };

    setTimeout(runNextBotStep, 450);
  }

  (server as any).triggerBotTurns = triggerBotTurns;

  roomManager.onBotConverted = (code: string) => {
    triggerBotTurns(code);
  };

  return server;
}
