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

        socket.on("close", (code: number) => {
          if (code === 4000) {
            roomManager.explicitLeave(roomCode, playerId);
            triggerBotTurns(roomCode);
          } else {
            roomManager.detachSocket(roomCode, playerId, socket);
          }
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
          const command = data["command"] as GameCommand;
          if ((command as any)?.type === "LEAVE_GAME") {
            roomManager.explicitLeave(roomCode, playerId);
            triggerBotTurns(roomCode);
            break;
          }
          await roomManager.applyCommand(roomCode, playerId, command);
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

        // Check if reaction, payment, or discard is waiting for a bot
        let targetBotId: string | null = null;

        const isPlayerBot = (pId: string): boolean => {
          return Boolean(
            room.gameState?.players[pId]?.isBot ||
            room.seats.find((s) => s.playerId === pId)?.isBot,
          );
        };

        if (room.gameState.pendingResolution) {
          const pending = room.gameState.pendingResolution;
          if (pending.type === "reaction_window") {
            if (isPlayerBot(pending.waitingForPlayerId)) {
              targetBotId = pending.waitingForPlayerId;
            } else {
              // Waiting for a human player to react; do not let the active bot move
              activeBotLoops.delete(roomCode);
              return;
            }
          } else if (pending.type === "payment") {
            if (isPlayerBot(pending.debtorPlayerId)) {
              targetBotId = pending.debtorPlayerId;
            } else {
              // Waiting for a human player to pay; do not let the active bot move
              activeBotLoops.delete(roomCode);
              return;
            }
          } else if (pending.type === "discard") {
            if (isPlayerBot(pending.playerId)) {
              targetBotId = pending.playerId;
            } else {
              // Waiting for a human player to discard; do not let the active bot move
              activeBotLoops.delete(roomCode);
              return;
            }
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
          // Phase-aware and pending-resolution-aware fail-safe
          const targetPlayer = room.gameState.players[targetBotId];
          if (room.gameState.pendingResolution?.type === "reaction_window" && room.gameState.pendingResolution.waitingForPlayerId === targetBotId) {
            botCommand = { type: "submit_reaction", playerId: targetBotId, action: "pass" } as any;
          } else if (room.gameState.pendingResolution?.type === "payment" && room.gameState.pendingResolution.debtorPlayerId === targetBotId) {
            const fallbackCards = targetPlayer ? [...targetPlayer.bank, ...targetPlayer.propertySets.flatMap((s: any) => s.cards)].filter((c: any) => c.value > 0).map((c: any) => c.instanceId) : [];
            botCommand = { type: "submit_payment", playerId: targetBotId, paymentCardInstanceIds: fallbackCards } as any;
          } else if (room.gameState.pendingResolution?.type === "discard" && room.gameState.pendingResolution.playerId === targetBotId) {
            const count = room.gameState.pendingResolution.requiredDiscardCount;
            botCommand = { type: "discard_cards", playerId: targetBotId, cardInstanceIds: (targetPlayer?.hand || []).slice(0, count).map((c: any) => c.instanceId) } as any;
          } else if (room.gameState.turn?.activePlayerId === targetBotId) {
            if (room.gameState.turn.phase === "draw") {
              botCommand = { type: "draw_cards", playerId: targetBotId } as any;
            } else {
              botCommand = { type: "end_turn", playerId: targetBotId } as any;
            }
          }
        }

        if (botCommand) {
          try {
            await roomManager.applyCommand(roomCode, targetBotId, botCommand as GameCommand);
            // Chain next step if bot is still active or another bot needs to act
            setTimeout(runNextBotStep, 450);
          } catch (err: unknown) {
            server.log.warn({ err, roomCode, targetBotId, botCommand }, "Bot command execution failed");
            // Attempt robust phase-aware recovery if active player or debtor/waiting player is this bot
            try {
              let recoveryCmd: GameCommand | null = null;
              const targetPlayer = room.gameState.players[targetBotId];
              if (room.gameState.pendingResolution?.type === "reaction_window" && room.gameState.pendingResolution.waitingForPlayerId === targetBotId) {
                recoveryCmd = { type: "submit_reaction", playerId: targetBotId, action: "pass" } as any;
              } else if (room.gameState.pendingResolution?.type === "payment" && room.gameState.pendingResolution.debtorPlayerId === targetBotId) {
                const fallbackCards = targetPlayer ? [...targetPlayer.bank, ...targetPlayer.propertySets.flatMap((s: any) => s.cards)].filter((c: any) => c.value > 0).map((c: any) => c.instanceId) : [];
                recoveryCmd = { type: "submit_payment", playerId: targetBotId, paymentCardInstanceIds: fallbackCards } as any;
              } else if (room.gameState.pendingResolution?.type === "discard" && room.gameState.pendingResolution.playerId === targetBotId) {
                const count = room.gameState.pendingResolution.requiredDiscardCount;
                recoveryCmd = { type: "discard_cards", playerId: targetBotId, cardInstanceIds: (targetPlayer?.hand || []).slice(0, count).map((c: any) => c.instanceId) } as any;
              } else if (room.gameState.turn?.activePlayerId === targetBotId) {
                if (room.gameState.turn.phase === "draw") {
                  recoveryCmd = { type: "draw_cards", playerId: targetBotId } as any;
                } else {
                  recoveryCmd = { type: "end_turn", playerId: targetBotId } as any;
                }
              }

              if (recoveryCmd && (botCommand as any)?.type !== (recoveryCmd as any)?.type) {
                await roomManager.applyCommand(roomCode, targetBotId, recoveryCmd);
                setTimeout(runNextBotStep, 450);
                return;
              }
            } catch (recoveryErr) {
              server.log.error({ recoveryErr, roomCode, targetBotId }, "Bot recovery command execution failed");
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
