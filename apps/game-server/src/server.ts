import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyWebsocket from "@fastify/websocket";
import type { WebSocket } from "ws";
import type { GameCommand } from "@dealopoly/game-engine";
import { getGameEngine } from "@dealopoly/game-engine";
import { parseBotDifficulty } from "@dealopoly/shared";
import {
  pingRedis,
  isRedisConfigured,
  isPubSubConfigured,
  closePubSub,
} from "@dealopoly/redis";
import { db, users, leaderboardEntries, eq, and, sql } from "@dealopoly/db";
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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
        message:
          "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. Running in memory-only mode.",
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

  // Public lobbies endpoint
  server.get<{ Querystring: { game?: string } }>("/api/lobbies", async (request) => {
    const lobbies = await roomManager.getPublicRooms(request.query.game);
    return { lobbies };
  });

  // REST: Update Room Settings (host only, lobby status only)
  server.patch<{
    Params: { code: string };
    Body: { sessionToken?: string; name?: string; isPrivate?: boolean };
  }>("/api/rooms/:code", async (request, reply) => {
    const { code } = request.params;
    const { sessionToken, name, isPrivate } = request.body || {};
    if (!sessionToken) {
      return reply.code(400).send({ error: "sessionToken is required" });
    }
    try {
      await roomManager.updateRoomSettings(code, sessionToken, { name, isPrivate });
      return reply.code(200).send({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update room";
      return reply.code(400).send({ error: message });
    }
  });

  // REST: Create Room
  server.post<{
    Body: {
      hostName?: string;
      botCount?: number;
      botDifficulty?: string;
      userId?: string;
      gameType?: string;
      isPrivate?: boolean;
      name?: string;
    };
  }>("/api/rooms", async (request, reply) => {
    const {
      hostName = "Host",
      botCount = 0,
      botDifficulty,
      userId,
      gameType,
      isPrivate,
      name,
    } = request.body || {};
    try {
      const { room, hostPlayerId, sessionToken } = await roomManager.createRoom(
        hostName,
        {
          botCount,
          botDifficulty: parseBotDifficulty(botDifficulty),
          userId,
          gameType,
          isPrivate,
          name,
        },
      );
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
    Body: { roomCode: string; playerName?: string; userId?: string; sessionToken?: string };
  }>("/api/rooms/join", async (request, reply) => {
    const { roomCode, playerName = "Player", userId, sessionToken } = request.body || {};
    if (!roomCode) {
      return reply.code(400).send({ error: "Room code is required" });
    }

    try {
      const { room, playerId, sessionToken: newToken } = await roomManager.joinRoom(
        roomCode,
        playerName,
        {
          userId,
          sessionToken,
        },
      );
      return reply.code(200).send({
        roomCode: room.code,
        playerId,
        sessionToken: newToken,
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

  // REST: Join as Spectator
  server.post<{
    Params: { code: string };
    Body: { spectatorName?: string };
  }>("/api/rooms/:code/spectate", async (request, reply) => {
    const { code } = request.params;
    const { spectatorName = "" } = request.body || {};

    try {
      const { spectatorId, room } = await roomManager.joinAsSpectator(
        code,
        spectatorName,
      );
      return reply.code(200).send({
        spectatorId,
        roomCode: code,
        room: roomManager.getPublicRoomInfo(room),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to join as spectator";
      const status = message.includes("not found") ? 404 : 400;
      return reply.code(status).send({ error: message });
    }
  });

  // Leaderboard endpoints
  server.get<{ Querystring: { game?: string; limit?: string } }>(
    "/api/leaderboard",
    async (request) => {
      const gameType = request.query.game || "monodeal";
      const limit = Math.min(Math.max(Number(request.query.limit) || 100, 1), 500);

      const rows = await db
        .select({
          id: leaderboardEntries.id,
          userId: leaderboardEntries.userId,
          matches: leaderboardEntries.matches,
          wins: leaderboardEntries.wins,
          avgFinish: leaderboardEntries.avgFinish,
          completedSets: leaderboardEntries.completedSets,
          score: leaderboardEntries.score,
          displayName: users.name,
          image: users.image,
        })
        .from(leaderboardEntries)
        .innerJoin(users, eq(leaderboardEntries.userId, users.id))
        .where(eq(leaderboardEntries.gameType, gameType))
        .orderBy(sql`${leaderboardEntries.score} DESC`)
        .limit(limit);

      return { leaderboard: rows };
    },
  );

  server.get<{ Querystring: { game?: string } }>(
    "/api/leaderboard/profile",
    async (request) => {
      const gameType = request.query.game || "monodeal";
      const userId = request.headers["x-user-id"] as string | undefined;

      if (!userId) {
        return { entry: null };
      }

      const rows = await db
        .select()
        .from(leaderboardEntries)
        .where(
          and(
            eq(leaderboardEntries.userId, userId),
            eq(leaderboardEntries.gameType, gameType),
          ),
        )
        .limit(1);

      return { entry: rows[0] ?? null };
    },
  );

  // WebSocket Server Handler
  server.register(async (instance) => {
    instance.get("/ws", { websocket: true }, (socket: WebSocket, req) => {
      const query = req.query as Record<string, string | undefined>;
      const roomCode = query["room"];

      if (!roomCode) {
        socket.send(
          JSON.stringify({
            type: "ERROR",
            code: "MISSING_ROOM",
            message: "WebSocket connection requires a room parameter",
          }),
        );
        socket.close(1008, "Missing room");
        return;
      }

      // --- First-message auth: wait for AUTH message before processing anything ---
      let authenticated = false;
      let authRole: "player" | "spectator" | null = null;
      let authId: string | null = null;

      // Close unauthenticated sockets after 5 seconds
      const authTimeout = setTimeout(() => {
        if (!authenticated) {
          socket.send(
            JSON.stringify({
              type: "ERROR",
              code: "AUTH_TIMEOUT",
              message: "Authentication required",
            }),
          );
          socket.close(1008, "Auth timeout");
        }
      }, 5000);

      socket.on("message", async (raw) => {
        try {
          const data = JSON.parse(raw.toString());

          // --- Pre-auth: only AUTH message accepted ---
          if (!authenticated) {
            if (data["type"] !== "AUTH") {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  code: "AUTH_REQUIRED",
                  message: "Send AUTH message first",
                }),
              );
              return;
            }

            // Spectator auth
            if (data["spectator"]) {
              try {
                socket.send(JSON.stringify({ type: "PONG" }));
                await roomManager.attachSpectatorSocket(
                  roomCode,
                  data["spectator"],
                  socket,
                );
                authRole = "spectator";
                authId = data["spectator"];
                authenticated = true;
                clearTimeout(authTimeout);
              } catch (err: unknown) {
                const message =
                  err instanceof Error
                    ? err.message
                    : "Failed to authenticate spectator";
                socket.send(
                  JSON.stringify({ type: "ERROR", code: "AUTH_FAILED", message }),
                );
                socket.close(1008, message);
              }
              return;
            }

            // Player auth
            if (data["player"] && data["token"]) {
              try {
                socket.send(JSON.stringify({ type: "PONG" }));
                await roomManager.attachSocket(
                  roomCode,
                  data["player"],
                  data["token"],
                  socket,
                );
                authRole = "player";
                authId = data["player"];
                authenticated = true;
                clearTimeout(authTimeout);
                triggerBotTurns(roomCode);
              } catch (err: unknown) {
                const message =
                  err instanceof Error ? err.message : "Failed to authenticate";
                socket.send(
                  JSON.stringify({ type: "ERROR", code: "AUTH_FAILED", message }),
                );
                socket.close(1008, message);
              }
              return;
            }

            // Invalid AUTH message
            socket.send(
              JSON.stringify({
                type: "ERROR",
                code: "INVALID_AUTH",
                message: "AUTH message requires player+token or spectator",
              }),
            );
            socket.close(1008, "Invalid auth");
            return;
          }

          // --- Post-auth: route to handler ---
          if (authRole === "spectator") {
            handleSpectatorMessage(roomCode, authId!, data, socket);
          } else {
            await handleSocketMessage(roomCode, authId!, data, socket);
          }
        } catch (err: unknown) {
          if (!authenticated) return; // ignore errors during auth
          const message = err instanceof Error ? err.message : "Invalid message format";
          socket.send(
            JSON.stringify({ type: "ERROR", code: "INVALID_MESSAGE", message }),
          );
        }
      });

      socket.on("close", (code: number) => {
        clearTimeout(authTimeout);
        if (!authenticated) return;

        if (authRole === "spectator") {
          roomManager.detachSpectatorSocket(roomCode, authId!);
        } else if (code === 4000) {
          roomManager.explicitLeave(roomCode, authId!);
          triggerBotTurns(roomCode);
        } else {
          roomManager.detachSocket(roomCode, authId!, socket);
        }
      });
    });
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
        // Piggyback a fresh ROOM_STATE on every heartbeat so clients
        // self-heal any missed broadcast (e.g. player joining while host
        // had a momentary socket hiccup).
        socket.send(
          JSON.stringify({
            type: "ROOM_STATE",
            room: roomManager.getPublicRoomInfo(room),
          }),
        );
        // Also resync masked game state during active matches
        if (room.gameState) {
          const engine = getGameEngine(room.gameType || "monodeal");
          socket.send(
            JSON.stringify({
              type: "GAME_STATE",
              state: engine.getMaskedView(room.gameState, playerId),
            }),
          );
        }
        break;

      case "REACTION": {
        const emoji = typeof data["emoji"] === "string" ? data["emoji"] : "🃏";
        void roomManager.broadcastReaction(roomCode, playerId, emoji);
        break;
      }

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
          socket.send(
            JSON.stringify({ type: "ERROR", code: "ADD_BOT_FAILED", message }),
          );
        }
        break;

      case "REMOVE_PLAYER":
        try {
          await roomManager.removePlayer(
            roomCode,
            playerId,
            data["targetPlayerId"] as string,
          );
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Failed to remove player";
          socket.send(
            JSON.stringify({ type: "ERROR", code: "REMOVE_FAILED", message }),
          );
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
          socket.send(
            JSON.stringify({ type: "ERROR", code: "COMMAND_REJECTED", message }),
          );
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

  function handleSpectatorMessage(
    roomCode: string,
    spectatorId: string,
    data: Record<string, unknown>,
    socket: WebSocket,
  ) {
    if (data["type"] === "PING") {
      socket.send(JSON.stringify({ type: "PONG" }));
      const room = roomManager.getRoom(roomCode);
      if (room) {
        socket.send(
          JSON.stringify({
            type: "ROOM_STATE",
            room: roomManager.getPublicRoomInfo(room),
          }),
        );
        if (room.gameState) {
          const engine = getGameEngine(room.gameType || "monodeal");
          socket.send(
            JSON.stringify({
              type: "GAME_STATE",
              state: engine.getMaskedView(room.gameState, "__spectator__"),
            }),
          );
        }
      }
    } else if (data["type"] === "LEAVE_GAME") {
      socket.close(4000, "LEAVE_SPECTATE");
    }
    // Spectators cannot send commands, start game, add bot, etc.
  }

  const activeBotLoops = new Set<string>();

  function triggerBotTurns(roomCode: string) {
    if (activeBotLoops.has(roomCode)) {
      return;
    }

    const initialRoom = roomManager.getRoom(roomCode);
    if (
      !initialRoom ||
      !initialRoom.gameState ||
      initialRoom.status !== "in_progress"
    ) {
      return;
    }

    activeBotLoops.add(roomCode);
    let iterations = 0;
    const maxIterations = 60;

    const runNextBotStep = async () => {
      try {
        const room = roomManager.getRoom(roomCode);
        if (
          !room ||
          !room.gameState ||
          room.status !== "in_progress" ||
          iterations++ > maxIterations
        ) {
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
            // Check JSN sub-resolution first
            const jsnWaiting = pending.jsnSubResolution?.waitingForPlayerId;
            if (jsnWaiting && isPlayerBot(jsnWaiting)) {
              targetBotId = jsnWaiting;
            } else {
              // Check concurrent waiting list
              const concurrentIds = pending.waitingForPlayerIds || [];
              const botId = concurrentIds.find((id: string) => isPlayerBot(id));
              if (botId) {
                targetBotId = botId;
              } else if (
                pending.waitingForPlayerId &&
                isPlayerBot(pending.waitingForPlayerId)
              ) {
                targetBotId = pending.waitingForPlayerId;
              } else {
                // Waiting for a human player to react
                activeBotLoops.delete(roomCode);
                return;
              }
            }
          } else if (pending.type === "payment") {
            // Check JSN sub-resolution within payment
            const jsnWaiting = pending.jsnSubResolution?.waitingForPlayerId;
            if (jsnWaiting && isPlayerBot(jsnWaiting)) {
              targetBotId = jsnWaiting;
            } else {
              // Concurrent payment: find any unpaid bot debtor
              const paidIds = pending.paidDebtorIds || [];
              const allDebtorIds = pending.debtorPlayerIds || [];
              const botDebtor = allDebtorIds.find(
                (id: string) => isPlayerBot(id) && !paidIds.includes(id),
              );
              if (botDebtor) {
                targetBotId = botDebtor;
              } else if (
                !allDebtorIds.length &&
                pending.debtorPlayerId &&
                isPlayerBot(pending.debtorPlayerId) &&
                !paidIds.includes(pending.debtorPlayerId)
              ) {
                targetBotId = pending.debtorPlayerId;
              } else {
                // Waiting for human player(s) to pay
                activeBotLoops.delete(roomCode);
                return;
              }
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
        const seatDifficulty = room.seats.find(
          (s) => s.playerId === targetBotId,
        )?.difficulty;
        let botCommand = engine.computeBotAction(
          room.gameState,
          targetBotId,
          parseBotDifficulty(seatDifficulty),
        );

        if (!botCommand) {
          // Phase-aware and pending-resolution-aware fail-safe
          const targetPlayer = room.gameState.players[targetBotId];
          const pending = room.gameState.pendingResolution;
          if (pending?.type === "reaction_window") {
            const isWaitingForBot =
              pending.waitingForPlayerId === targetBotId ||
              pending.waitingForPlayerIds?.includes(targetBotId) ||
              pending.jsnSubResolution?.waitingForPlayerId === targetBotId;
            if (isWaitingForBot) {
              botCommand = {
                type: "submit_reaction",
                playerId: targetBotId,
                action: "pass",
              } as any;
            }
          } else if (pending?.type === "payment") {
            const isDebtor =
              (pending.debtorPlayerId === targetBotId ||
                pending.debtorPlayerIds?.includes(targetBotId)) &&
              !(pending.paidDebtorIds || []).includes(targetBotId);
            const isJsnWaiting =
              pending.jsnSubResolution?.waitingForPlayerId === targetBotId;
            if (isJsnWaiting) {
              botCommand = {
                type: "submit_reaction",
                playerId: targetBotId,
                action: "pass",
              } as any;
            } else if (isDebtor) {
              const fallbackCards = targetPlayer
                ? [
                    ...targetPlayer.bank,
                    ...targetPlayer.propertySets.flatMap((s: any) => s.cards),
                  ]
                    .filter((c: any) => c.value > 0)
                    .map((c: any) => c.instanceId)
                : [];
              botCommand = {
                type: "submit_payment",
                playerId: targetBotId,
                paymentCardInstanceIds: fallbackCards,
              } as any;
            }
          } else if (pending?.type === "discard" && pending.playerId === targetBotId) {
            const count = room.gameState.pendingResolution.requiredDiscardCount;
            botCommand = {
              type: "discard_cards",
              playerId: targetBotId,
              cardInstanceIds: (targetPlayer?.hand || [])
                .slice(0, count)
                .map((c: any) => c.instanceId),
            } as any;
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
            await roomManager.applyCommand(
              roomCode,
              targetBotId,
              botCommand as GameCommand,
            );
            // Chain next step if bot is still active or another bot needs to act
            setTimeout(runNextBotStep, 450);
          } catch (err: unknown) {
            server.log.warn(
              { err, roomCode, targetBotId, botCommand },
              "Bot command execution failed",
            );
            // Attempt robust phase-aware recovery if active player or debtor/waiting player is this bot
            try {
              let recoveryCmd: GameCommand | null = null;
              const targetPlayer = room.gameState.players[targetBotId];
              const pending = room.gameState.pendingResolution;
              if (pending?.type === "reaction_window") {
                const isWaitingForBot =
                  pending.waitingForPlayerId === targetBotId ||
                  pending.waitingForPlayerIds?.includes(targetBotId) ||
                  pending.jsnSubResolution?.waitingForPlayerId === targetBotId;
                if (isWaitingForBot) {
                  recoveryCmd = {
                    type: "submit_reaction",
                    playerId: targetBotId,
                    action: "pass",
                  } as any;
                }
              } else if (pending?.type === "payment") {
                const isDebtor =
                  (pending.debtorPlayerId === targetBotId ||
                    pending.debtorPlayerIds?.includes(targetBotId)) &&
                  !(pending.paidDebtorIds || []).includes(targetBotId);
                const isJsnWaiting =
                  pending.jsnSubResolution?.waitingForPlayerId === targetBotId;
                if (isJsnWaiting) {
                  recoveryCmd = {
                    type: "submit_reaction",
                    playerId: targetBotId,
                    action: "pass",
                  } as any;
                } else if (isDebtor) {
                  const fallbackCards = targetPlayer
                    ? [
                        ...targetPlayer.bank,
                        ...targetPlayer.propertySets.flatMap((s: any) => s.cards),
                      ]
                        .filter((c: any) => c.value > 0)
                        .map((c: any) => c.instanceId)
                    : [];
                  recoveryCmd = {
                    type: "submit_payment",
                    playerId: targetBotId,
                    paymentCardInstanceIds: fallbackCards,
                  } as any;
                }
              } else if (
                pending?.type === "discard" &&
                pending.playerId === targetBotId
              ) {
                const count = room.gameState.pendingResolution.requiredDiscardCount;
                recoveryCmd = {
                  type: "discard_cards",
                  playerId: targetBotId,
                  cardInstanceIds: (targetPlayer?.hand || [])
                    .slice(0, count)
                    .map((c: any) => c.instanceId),
                } as any;
              } else if (room.gameState.turn?.activePlayerId === targetBotId) {
                if (room.gameState.turn.phase === "draw") {
                  recoveryCmd = { type: "draw_cards", playerId: targetBotId } as any;
                } else {
                  recoveryCmd = { type: "end_turn", playerId: targetBotId } as any;
                }
              }

              if (
                recoveryCmd &&
                (botCommand as any)?.type !== (recoveryCmd as any)?.type
              ) {
                await roomManager.applyCommand(roomCode, targetBotId, recoveryCmd);
                setTimeout(runNextBotStep, 450);
                return;
              }
            } catch (recoveryErr) {
              server.log.error(
                { recoveryErr, roomCode, targetBotId },
                "Bot recovery command execution failed",
              );
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
