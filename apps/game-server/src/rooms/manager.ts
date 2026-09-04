import { randomBytes, randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import {
  applyCommand,
  getMaskedView,
  getGameEngine,
  type GameCommand,
  type GameEvent,
  type GameState,
} from "@dealopoly/game-engine";
import {
  db,
  users,
  players,
  rooms,
  roomSeats,
  games,
  gameEvents,
  gameSnapshots,
  gameCommands,
  eq,
  inArray,
  sql,
} from "@dealopoly/db";
import {
  isRedisConfigured,
  setRoom as redisSetRoom,
  getRoom as redisGetRoom,
  deleteRoom as redisDeleteRoom,
  getAllRoomCodes,
  pruneStaleRoomCodes,
  setDisconnectTimer,
  clearDisconnectTimer,
  isPubSubConfigured,
  publishRoomUpdate,
  subscribeToRoomChannel,
  type RoomUpdateMessage,
} from "@dealopoly/redis";
import {
  DEFAULT_BOT_DIFFICULTY,
  parseBotDifficulty,
  type BotDifficulty,
} from "@dealopoly/shared";
import type { Room, RoomSeat, PublicRoomInfo, RoomStatus } from "./types.js";

// ---------------------------------------------------------------------------
// StoredRoom — Redis-serialisable Room (no WebSocket refs)
// ---------------------------------------------------------------------------
type StoredRoom = Omit<Room, never> & { seats: StoredSeat[] };
type StoredSeat = Omit<RoomSeat, "socket">;

// ---------------------------------------------------------------------------
// In-memory registries (process-local, never persisted)
// ---------------------------------------------------------------------------
type SocketRegistry = Map<string, Map<string, WebSocket>>;

// ---------------------------------------------------------------------------

export class RoomManager {
  /** Write-through cache / fallback store when Redis is off */
  private memoryRooms = new Map<string, StoredRoom>();

  /** roomCode → Map<playerId, WebSocket> */
  private socketRegistry: SocketRegistry = new Map();

  /**
   * roomCode → cleanup function returned by subscribeToRoomChannel().
   * One subscription per room per process instance.
   * Unsubscribing removes the listener and sends UNSUBSCRIBE to Redis.
   */
  private roomSubscriptions = new Map<string, () => void>();

  /**
   * Phase-3 hybrid disconnect timers.
   * Redis TTL key = durable signal; NodeJS.Timeout = local executor.
   */
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  private hasAttemptedHydration = false;

  // No setInterval sweep — Redis TTL handles 4h room expiry.

  // -------------------------------------------------------------------------
  // Redis storage helpers
  // -------------------------------------------------------------------------

  private async persistRoom(room: StoredRoom): Promise<void> {
    this.memoryRooms.set(room.code, room);
    await redisSetRoom(room.code, room);
  }

  private async removeRoom(code: string): Promise<void> {
    this.memoryRooms.delete(code);
    await redisDeleteRoom(code);
  }

  private async loadRoom(code: string): Promise<StoredRoom | undefined> {
    const cached = this.memoryRooms.get(code);
    if (cached) return cached;

    const stored = await redisGetRoom<StoredRoom>(code);
    if (stored) {
      this.memoryRooms.set(code, stored);
      return stored;
    }
    return undefined;
  }

  private hydrateRoom(stored: StoredRoom): Room {
    const sockets = this.socketRegistry.get(stored.code);
    return {
      ...stored,
      seats: stored.seats.map((s) => ({
        ...s,
        socket: sockets?.get(s.playerId),
      })),
    };
  }

  // -------------------------------------------------------------------------
  // Socket registry
  // -------------------------------------------------------------------------

  private setSocket(code: string, playerId: string, socket: WebSocket): void {
    if (!this.socketRegistry.has(code)) {
      this.socketRegistry.set(code, new Map());
    }
    this.socketRegistry.get(code)!.set(playerId, socket);
  }

  private removeSocket(code: string, playerId: string): void {
    this.socketRegistry.get(code)?.delete(playerId);
  }

  private clearSocketsForRoom(code: string): void {
    this.socketRegistry.delete(code);
  }

  private getSocket(code: string, playerId: string): WebSocket | undefined {
    return this.socketRegistry.get(code)?.get(playerId);
  }

  // -------------------------------------------------------------------------
  // Pub/Sub subscription lifecycle
  // -------------------------------------------------------------------------

  /**
   * Subscribe this instance to a room's Redis pub/sub channel.
   * Safe to call multiple times — subsequent calls for the same room are no-ops.
   *
   * The subscriber receives a RoomUpdateMessage and delivers it to locally
   * connected WebSocket clients only.
   */
  public subscribeToRoom(code: string): void {
    if (!isPubSubConfigured()) return;
    if (this.roomSubscriptions.has(code)) return; // already subscribed

    const cleanup = subscribeToRoomChannel(code, (msg) => {
      this.handleRoomUpdateMessage(msg);
    });

    this.roomSubscriptions.set(code, cleanup);
    console.log(`[PubSub] Subscribed to room:${code}:events`);
  }

  /**
   * Unsubscribe this instance from a room channel.
   * Called when a room is abandoned or completed and no local sockets remain.
   */
  public unsubscribeFromRoom(code: string): void {
    const cleanup = this.roomSubscriptions.get(code);
    if (cleanup) {
      cleanup();
      this.roomSubscriptions.delete(code);
      console.log(`[PubSub] Unsubscribed from room:${code}:events`);
    }
  }

  /**
   * Handle an inbound pub/sub message from Redis.
   * Delivers the payload to the correct local WebSocket clients.
   */
  private handleRoomUpdateMessage(msg: RoomUpdateMessage): void {
    const sockets = this.socketRegistry.get(msg.roomCode);
    if (!sockets || sockets.size === 0) return;

    const raw = JSON.stringify(msg.payload);

    if (msg.targetPlayerId === null) {
      // Broadcast to all locally connected seats
      for (const [, socket] of sockets) {
        if (socket.readyState === 1 /* OPEN */) {
          try { socket.send(raw); } catch { /* ignore */ }
        }
      }
    } else {
      // Unicast to a specific player
      const socket = sockets.get(msg.targetPlayerId);
      if (socket && socket.readyState === 1) {
        try { socket.send(raw); } catch { /* ignore */ }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Disconnect timers (Phase-3 hybrid)
  // -------------------------------------------------------------------------

  private startDisconnectTimer(code: string, playerId: string): void {
    void setDisconnectTimer(code, playerId);
    const timer = setTimeout(() => {
      void this.handleDisconnectTimeout(code, playerId);
    }, 5 * 60 * 1000);
    this.disconnectTimers.set(`${code}_${playerId}`, timer);
  }

  private cancelDisconnectTimer(code: string, playerId: string): void {
    void clearDisconnectTimer(code, playerId);
    const existing = this.disconnectTimers.get(`${code}_${playerId}`);
    if (existing) {
      clearTimeout(existing);
      this.disconnectTimers.delete(`${code}_${playerId}`);
    }
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  public async getStats(): Promise<{ activeRooms: number; onlinePlayers: number; totalRooms: number }> {
    let onlinePlayers = 0;
    let activeRooms = 0;

    if (isRedisConfigured()) {
      const codes = await getAllRoomCodes();
      for (const code of codes) {
        const stored = await this.loadRoom(code);
        if (!stored) continue;
        if (stored.status === "in_progress" || stored.status === "lobby") {
          activeRooms++;
          const sockets = this.socketRegistry.get(code);
          for (const seat of stored.seats) {
            if (!seat.isBot && sockets?.has(seat.playerId)) onlinePlayers++;
          }
        }
      }
      return { activeRooms, onlinePlayers, totalRooms: codes.length };
    }

    for (const room of this.memoryRooms.values()) {
      if (room.status === "in_progress" || room.status === "lobby") {
        activeRooms++;
        const sockets = this.socketRegistry.get(room.code);
        for (const seat of room.seats) {
          if (!seat.isBot && sockets?.has(seat.playerId)) onlinePlayers++;
        }
      }
    }
    return { activeRooms, onlinePlayers, totalRooms: this.memoryRooms.size };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async generateRoomCode(): Promise<string> {
    let code: string;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (await this.loadRoom(code));
    return code;
  }

  private generateSessionToken(): string {
    return randomBytes(16).toString("hex");
  }

  private async safeDb<T>(op: () => Promise<T>, desc: string): Promise<T | null> {
    if (!process.env["DATABASE_URL"]) return null;
    try {
      return await op();
    } catch (err: unknown) {
      console.error(`[DB Error: ${desc}]`, err instanceof Error ? err.message : err);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // createRoom
  // -------------------------------------------------------------------------

  public async createRoom(
    hostName: string,
    options?: {
      botCount?: number;
      botDifficulty?: BotDifficulty;
      userId?: string;
      gameType?: string;
      config?: Record<string, unknown>;
    },
  ): Promise<{ room: Room; hostPlayerId: string; sessionToken: string }> {
    const roomId = randomUUID();
    const code = await this.generateRoomCode();
    const hostPlayerId = randomUUID();
    const hostSessionToken = this.generateSessionToken();
    const displayName = hostName.trim() || "Host";
    const gameType = options?.gameType || "monodeal";

    const seats: StoredSeat[] = [{
      seatIndex: 0, playerId: hostPlayerId, name: displayName,
      isBot: false, sessionToken: hostSessionToken, isConnected: false,
    }];

    const botPlayersToInsert: { id: string; displayName: string; sessionToken: string; isBot: boolean }[] = [];
    const botNames = ["Atlas", "Nova", "Cipher", "Vortex"];
    const botCount = Math.min(Math.max(0, options?.botCount ?? 0), 4);
    const botDifficulty = parseBotDifficulty(options?.botDifficulty);

    for (let i = 0; i < botCount; i++) {
      const botId = randomUUID();
      const botToken = this.generateSessionToken();
      const botName = `Bot ${botNames[i] ?? i + 1}`;
      seats.push({
        seatIndex: seats.length,
        playerId: botId,
        name: botName,
        isBot: true,
        sessionToken: botToken,
        isConnected: true,
        difficulty: botDifficulty,
      });
      botPlayersToInsert.push({ id: botId, displayName: botName, sessionToken: botToken, isBot: true });
    }

    const stored: StoredRoom = {
      id: roomId, code, gameType, config: options?.config,
      hostPlayerId, status: "lobby", seats, maxSeats: 5,
      createdAt: Date.now(), lastActivityAt: Date.now(),
    };

    await this.persistRoom(stored);

    void this.safeDb(async () => {
      await db.insert(players).values([
        { id: hostPlayerId, userId: options?.userId ?? null, displayName, sessionToken: hostSessionToken, isBot: false },
        ...botPlayersToInsert,
      ]);
      await db.insert(rooms).values({ id: roomId, code, gameType, config: options?.config, hostPlayerId, status: "lobby", maxSeats: 5 });
      await db.insert(roomSeats).values(seats.map((s) => ({
        roomId,
        playerId: s.playerId,
        seatIndex: s.seatIndex,
        sessionToken: s.sessionToken,
        difficulty: s.difficulty ?? null,
      })));
    }, `createRoom (${code})`);

    return { room: this.hydrateRoom(stored), hostPlayerId, sessionToken: hostSessionToken };
  }

  // -------------------------------------------------------------------------
  // getRoom (sync fast-path for server.ts REST handlers)
  // -------------------------------------------------------------------------

  public getRoom(code: string): Room | undefined {
    const stored = this.memoryRooms.get(code);
    return stored ? this.hydrateRoom(stored) : undefined;
  }

  // -------------------------------------------------------------------------
  // joinRoom
  // -------------------------------------------------------------------------

  public async joinRoom(
    code: string,
    playerName: string,
    options?: { userId?: string },
  ): Promise<{ room: Room; playerId: string; sessionToken: string }> {
    const stored = await this.loadRoom(code);
    if (!stored) throw new Error(`Room with code ${code} not found`);
    if (stored.status !== "lobby") throw new Error("Game has already started in this room");
    if (stored.seats.length >= stored.maxSeats) throw new Error("Room is full (maximum 5 players)");

    const playerId = randomUUID();
    const sessionToken = this.generateSessionToken();
    const displayName = playerName.trim() || `Player ${stored.seats.length + 1}`;
    const seatIndex = stored.seats.length;

    stored.seats.push({ seatIndex, playerId, name: displayName, isBot: false, sessionToken, isConnected: false });
    stored.lastActivityAt = Date.now();

    await this.persistRoom(stored);
    await this.broadcastRoomInfo(this.hydrateRoom(stored));

    void this.safeDb(async () => {
      await db.insert(players).values({ id: playerId, userId: options?.userId ?? null, displayName, sessionToken, isBot: false });
      if (stored.id) {
        await db.insert(roomSeats).values({ roomId: stored.id, playerId, seatIndex, sessionToken });
        await db.update(rooms).set({ lastActivityAt: new Date() }).where(eq(rooms.id, stored.id));
      }
    }, `joinRoom (${code}, ${displayName})`);

    return { room: this.hydrateRoom(stored), playerId, sessionToken };
  }

  // -------------------------------------------------------------------------
  // addBot
  // -------------------------------------------------------------------------

  public async addBot(
    code: string,
    requesterPlayerId: string,
    difficulty?: BotDifficulty,
  ): Promise<Room> {
    const stored = await this.loadRoom(code);
    if (!stored) throw new Error("Room not found");
    if (stored.hostPlayerId !== requesterPlayerId) throw new Error("Only the room host can add bots");
    if (stored.status !== "lobby") throw new Error("Cannot add bots once game has started");
    if (stored.seats.length >= stored.maxSeats) throw new Error("Room is full");

    const botIndex = stored.seats.filter((s) => s.isBot).length;
    const botNames = ["Atlas", "Nova", "Cipher", "Vortex"];
    const botName = `Bot ${botNames[botIndex % botNames.length]}`;
    const botPlayerId = randomUUID();
    const sessionToken = this.generateSessionToken();
    const seatIndex = stored.seats.length;
    const botDifficulty = parseBotDifficulty(difficulty);

    stored.seats.push({
      seatIndex,
      playerId: botPlayerId,
      name: botName,
      isBot: true,
      sessionToken,
      isConnected: true,
      difficulty: botDifficulty,
    });
    stored.lastActivityAt = Date.now();

    await this.persistRoom(stored);
    await this.broadcastRoomInfo(this.hydrateRoom(stored));

    void this.safeDb(async () => {
      await db.insert(players).values({ id: botPlayerId, displayName: botName, sessionToken, isBot: true });
      if (stored.id) {
        await db.insert(roomSeats).values({
          roomId: stored.id,
          playerId: botPlayerId,
          seatIndex,
          sessionToken,
          difficulty: botDifficulty,
        });
        await db.update(rooms).set({ lastActivityAt: new Date() }).where(eq(rooms.id, stored.id));
      }
    }, `addBot (${code}, ${botName})`);

    return this.hydrateRoom(stored);
  }

  // -------------------------------------------------------------------------
  // removePlayer
  // -------------------------------------------------------------------------

  public async removePlayer(code: string, requesterPlayerId: string, targetPlayerId: string): Promise<Room> {
    const stored = await this.loadRoom(code);
    if (!stored) throw new Error("Room not found");
    if (stored.hostPlayerId !== requesterPlayerId && requesterPlayerId !== targetPlayerId) {
      throw new Error("Only the host can remove players");
    }
    if (stored.status !== "lobby") throw new Error("Cannot remove players during active match");

    const targetSocket = this.getSocket(code, targetPlayerId);
    if (targetSocket) {
      targetSocket.close(1000, "Removed from room");
      this.removeSocket(code, targetPlayerId);
    }
    this.cancelDisconnectTimer(code, targetPlayerId);

    stored.seats = stored.seats.filter((s) => s.playerId !== targetPlayerId);
    stored.seats.forEach((s, idx) => { s.seatIndex = idx; });
    stored.lastActivityAt = Date.now();

    await this.persistRoom(stored);
    await this.broadcastRoomInfo(this.hydrateRoom(stored));

    void this.safeDb(async () => {
      if (stored.id) {
        await db.delete(roomSeats).where(sql`${roomSeats.roomId} = ${stored.id} AND ${roomSeats.playerId} = ${targetPlayerId}`);
        for (const seat of stored.seats) {
          await db.update(roomSeats).set({ seatIndex: seat.seatIndex })
            .where(sql`${roomSeats.roomId} = ${stored.id} AND ${roomSeats.playerId} = ${seat.playerId}`);
        }
        await db.update(rooms).set({ lastActivityAt: new Date() }).where(eq(rooms.id, stored.id));
      }
    }, `removePlayer (${code}, ${targetPlayerId})`);

    return this.hydrateRoom(stored);
  }

  // -------------------------------------------------------------------------
  // startGame
  // -------------------------------------------------------------------------

  public async startGame(code: string, requesterPlayerId: string): Promise<Room> {
    const stored = await this.loadRoom(code);
    if (!stored) throw new Error("Room not found");
    if (stored.hostPlayerId !== requesterPlayerId) throw new Error("Only the room host can start the game");
    if (stored.status !== "lobby") throw new Error("Game has already started");
    if (stored.seats.length < 2) throw new Error("At least 2 players (human or bots) are required to start");

    const gamePlayers = stored.seats.map((s) => ({ id: s.playerId, name: s.name, isBot: s.isBot }));
    const gameId = randomUUID();
    const gameSeed = Math.floor(Math.random() * 1000000);
    const gameType = stored.gameType || "monodeal";
    const engine = getGameEngine(gameType);
    const gameState = engine.createGame({ gameId, players: gamePlayers, seed: gameSeed });

    stored.status = "in_progress";
    stored.gameState = gameState;
    stored.dbGameId = gameId;
    stored.nextSequenceNum = 1;
    stored.lastActivityAt = Date.now();

    await this.persistRoom(stored);

    const room = this.hydrateRoom(stored);
    await this.broadcastRoomInfo(room);
    await this.broadcastGameState(room);

    void this.safeDb(async () => {
      if (stored.id) {
        await db.insert(games).values({ id: gameId, roomId: stored.id, gameType, seed: gameSeed, status: "in_progress", playerOrder: gamePlayers.map((p) => p.id) });
        await db.update(rooms).set({ status: "in_progress", lastActivityAt: new Date() }).where(eq(rooms.id, stored.id));
        const seq = stored.nextSequenceNum ?? 1;
        await db.insert(gameEvents).values({
          gameId, sequenceNum: seq, eventType: "game_started", playerId: requesterPlayerId,
          payload: { id: `evt-${Date.now()}-${seq}`, type: "game_started", timestamp: Date.now(), playerOrder: gamePlayers.map((p) => p.id), message: `Game started with ${gamePlayers.length} players` },
        });
        await db.insert(gameSnapshots).values({ gameId, afterSequence: seq, stateJson: gameState });
      }
    }, `startGame (${code})`);

    return room;
  }

  // -------------------------------------------------------------------------
  // applyCommand
  // -------------------------------------------------------------------------

  public async applyCommand(
    code: string,
    playerId: string,
    command: GameCommand,
  ): Promise<{ room: Room; events: GameEvent[] }> {
    const stored = await this.loadRoom(code);
    if (!stored) throw new Error("Room not found");
    if (!stored.gameState) throw new Error("No active game in this room");

    const result = applyCommand(stored.gameState, command);
    stored.gameState = result.nextState;

    if (result.nextState.status === "completed") {
      stored.status = "completed";
    }

    stored.lastActivityAt = Date.now();
    await this.persistRoom(stored);

    const room = this.hydrateRoom(stored);
    await this.broadcastGameState(room, result.events);

    void this.safeDb(async () => {
      const dbGameId = stored.dbGameId;
      if (!dbGameId) return;

      let currentSeq = stored.nextSequenceNum ?? 1;
      await db.insert(gameCommands).values({ gameId: dbGameId, sequenceNum: currentSeq, playerId, commandType: command.type, payload: command, accepted: true });

      if (result.events?.length > 0) {
        for (const evt of result.events) {
          currentSeq++;
          await db.insert(gameEvents).values({ gameId: dbGameId, sequenceNum: currentSeq, eventType: evt.type, playerId: evt.playerId ?? playerId, payload: evt });
        }
      }

      stored.nextSequenceNum = currentSeq + 1;
      await this.persistRoom(stored);

      if (result.nextState.status === "completed") {
        await db.update(games).set({ status: "completed", winnerId: result.nextState.winnerId, completedAt: new Date() }).where(eq(games.id, dbGameId));
        if (stored.id) {
          await db.update(rooms).set({ status: "completed", lastActivityAt: new Date() }).where(eq(rooms.id, stored.id));
          const roomPlayerIds = stored.seats.map((s) => s.playerId);
          if (roomPlayerIds.length > 0) {
            const playerRows = await db.select({ id: players.id, userId: players.userId }).from(players).where(inArray(players.id, roomPlayerIds));
            for (const p of playerRows) {
              if (p.userId) {
                const isWinner = p.id === result.nextState.winnerId;
                await db.update(users).set({
                  gamesPlayed: sql`${users.gamesPlayed} + 1`,
                  ...(isWinner ? { gamesWon: sql`${users.gamesWon} + 1` } : {}),
                }).where(eq(users.id, p.userId));
              }
            }
          }
        }
      }

      if (command.type === "end_turn" || (result.nextState.turn.turnNumber % 5 === 0)) {
        await db.insert(gameSnapshots).values({ gameId: dbGameId, afterSequence: currentSeq, stateJson: result.nextState });
      }
    }, `applyCommand (${code}, ${command.type})`);

    return { room, events: result.events };
  }

  // -------------------------------------------------------------------------
  // attachSocket
  // -------------------------------------------------------------------------

  public async attachSocket(
    code: string,
    playerId: string,
    token: string,
    socket: WebSocket,
  ): Promise<RoomSeat> {
    const stored = await this.loadRoom(code);
    if (!stored) throw new Error("Room not found");

    const seat = stored.seats.find((s) => s.playerId === playerId);
    if (!seat) throw new Error("Player seat not found in this room");
    if (seat.sessionToken !== token) throw new Error("Invalid session token for this seat");

    this.setSocket(code, playerId, socket);
    seat.isConnected = true;
    this.cancelDisconnectTimer(code, playerId);

    // Subscribe this instance to the room channel (no-op if already subscribed)
    this.subscribeToRoom(code);

    const wasBotHandoff = seat.isBot;
    if (seat.isBot) {
      seat.isBot = false;
      if (stored.gameState && stored.gameState.players?.[playerId]) {
        stored.gameState.players[playerId]!.isBot = false;
      }
      void this.safeDb(async () => {
        await db.update(players).set({ isBot: false }).where(eq(players.id, playerId));
      }, `revertBotToPlayer (${playerId})`);
    }

    stored.lastActivityAt = Date.now();
    await this.persistRoom(stored);

    const liveSeat: RoomSeat = { ...seat, socket };

    // Initial state sync — sent directly (not via pub/sub) since only this player needs it
    this.sendDirect(socket, { type: "ROOM_STATE", room: this.getPublicRoomInfo(this.hydrateRoom(stored)) });

    if (stored.gameState) {
      const masked = getMaskedView(stored.gameState, playerId);
      this.sendDirect(socket, { type: "GAME_STATE", state: masked });

      if (wasBotHandoff) {
        await this.broadcastGameState(this.hydrateRoom(stored), [{
          id: `bot-reverted-${Date.now()}`,
          type: "player_joined",
          playerId,
          timestamp: Date.now(),
          message: `${seat.name} reconnected and took back their seat.`,
        } as any]);
      }
    }

    await this.broadcastRoomInfo(this.hydrateRoom(stored));

    void this.safeDb(async () => {
      await db.update(players).set({ lastSeenAt: new Date() }).where(eq(players.id, playerId));
    }, `attachSocket (${playerId})`);

    return liveSeat;
  }

  // -------------------------------------------------------------------------
  // detachSocket
  // -------------------------------------------------------------------------

  public detachSocket(code: string, playerId: string, socket: WebSocket): void {
    const stored = this.memoryRooms.get(code);
    if (!stored) return;

    const registeredSocket = this.getSocket(code, playerId);
    const seat = stored.seats.find((s) => s.playerId === playerId);

    if (seat && registeredSocket === socket) {
      seat.isConnected = false;
      this.removeSocket(code, playerId);
      stored.lastActivityAt = Date.now();

      void this.persistRoom(stored);
      void this.broadcastRoomInfo(this.hydrateRoom(stored));

      this.startDisconnectTimer(code, playerId);

      // If no local sockets remain for this room, unsubscribe from pub/sub
      // to avoid receiving messages we can't deliver.
      const socketsLeft = this.socketRegistry.get(code)?.size ?? 0;
      if (socketsLeft === 0) {
        this.unsubscribeFromRoom(code);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Disconnect timeout
  // -------------------------------------------------------------------------

  private async handleDisconnectTimeout(code: string, playerId: string): Promise<void> {
    this.disconnectTimers.delete(`${code}_${playerId}`);
    const stored = this.memoryRooms.get(code);
    if (!stored) return;

    if (stored.hostPlayerId === playerId) {
      this.abandonRoom(code, "host_disconnected");
    } else {
      this.convertPlayerToBot(code, playerId);
    }
  }

  // -------------------------------------------------------------------------
  // convertPlayerToBot
  // -------------------------------------------------------------------------

  public convertPlayerToBot(code: string, playerId: string): void {
    const stored = this.memoryRooms.get(code);
    if (!stored) return;

    const seat = stored.seats.find((s) => s.playerId === playerId);
    if (seat) {
      seat.isBot = true;
      seat.isConnected = false;
      seat.difficulty = seat.difficulty ?? DEFAULT_BOT_DIFFICULTY;
      this.removeSocket(code, playerId);

      if (stored.gameState && stored.gameState.players?.[playerId]) {
        stored.gameState.players[playerId]!.isBot = true;
      }

      void this.persistRoom(stored);

      const room = this.hydrateRoom(stored);
      void this.broadcastRoomInfo(room);

      if (stored.gameState) {
        void this.broadcastGameState(room, [{
          id: `bot-converted-${Date.now()}`,
          type: "player_left",
          playerId,
          timestamp: Date.now(),
          message: `${seat.name} left the game and was replaced by a bot.`,
        } as any]);
      }

      void this.safeDb(async () => {
        await db.update(players).set({ isBot: true }).where(eq(players.id, playerId));
        if (stored.id) {
          await db.update(roomSeats).set({ difficulty: DEFAULT_BOT_DIFFICULTY }).where(
            eq(roomSeats.playerId, playerId),
          );
        }
      }, `convertPlayerToBot (${playerId})`);
    }
  }

  // -------------------------------------------------------------------------
  // explicitLeave
  // -------------------------------------------------------------------------

  public explicitLeave(code: string, playerId: string): void {
    const stored = this.memoryRooms.get(code);
    if (!stored) return;

    if (stored.hostPlayerId === playerId) {
      this.abandonRoom(code, "host_left");
    } else {
      if (stored.status === "lobby") {
        this.removePlayer(code, playerId, playerId).catch(console.error);
      } else {
        this.convertPlayerToBot(code, playerId);
      }
    }
  }

  // -------------------------------------------------------------------------
  // abandonRoom
  // -------------------------------------------------------------------------

  public abandonRoom(code: string, reason: "idle_timeout" | "host_disconnected" | "host_left"): void {
    const stored = this.memoryRooms.get(code);
    if (!stored) return;

    stored.status = "abandoned" as any;

    void this.broadcastToRoom(this.hydrateRoom(stored), {
      type: "ERROR",
      code: "ROOM_DESTROYED",
      message: reason === "host_left"
        ? "The host has ended the game."
        : "The game was abandoned due to host inactivity.",
    });

    for (const seat of stored.seats) {
      this.cancelDisconnectTimer(code, seat.playerId);
    }

    void this.removeRoom(code);
    this.clearSocketsForRoom(code);
    this.unsubscribeFromRoom(code);

    void this.safeDb(async () => {
      if (stored.id) await db.update(rooms).set({ status: "abandoned" }).where(eq(rooms.id, stored.id));
      if (stored.dbGameId) await db.update(games).set({ status: "abandoned" }).where(eq(games.id, stored.dbGameId));
    }, `abandonRoom (${code})`);
  }

  // -------------------------------------------------------------------------
  // Broadcast helpers — pub/sub aware
  // -------------------------------------------------------------------------

  /**
   * Broadcast room state to all players in a room.
   *
   * When pub/sub is configured: publishes to the Redis channel so all instances deliver it.
   * When pub/sub is off (single-instance / local dev): sends directly to local sockets.
   */
  public async broadcastRoomInfo(room: Room): Promise<void> {
    const payload = { type: "ROOM_STATE" as const, room: this.getPublicRoomInfo(room) };

    if (isPubSubConfigured()) {
      await publishRoomUpdate({ type: "ROOM_STATE", roomCode: room.code, targetPlayerId: null, payload });
    } else {
      for (const seat of room.seats) {
        this.sendToSeat(seat, payload);
      }
    }
  }

  /**
   * Broadcast masked game state to every player individually.
   *
   * Each player gets their own masked view — so we publish one message
   * per player with targetPlayerId set. The receiving instance
   * delivers it only to the socket it owns for that player.
   */
  public async broadcastGameState(room: Room, events?: GameEvent[]): Promise<void> {
    if (!room.gameState) return;
    const engine = getGameEngine(room.gameType || "monodeal");

    for (const seat of room.seats) {
      const masked = engine.getMaskedView(room.gameState, seat.playerId);
      const statePayload = { type: "GAME_STATE" as const, state: masked };

      if (isPubSubConfigured()) {
        await publishRoomUpdate({ type: "GAME_STATE", roomCode: room.code, targetPlayerId: seat.playerId, payload: statePayload });
      } else {
        this.sendToSeat(seat, statePayload);
      }

      if (events?.length) {
        for (const evt of events) {
          const evtPayload = { type: "GAME_EVENT" as const, event: evt };
          if (isPubSubConfigured()) {
            await publishRoomUpdate({ type: "GAME_EVENT", roomCode: room.code, targetPlayerId: seat.playerId, payload: evtPayload });
          } else {
            this.sendToSeat(seat, evtPayload);
          }
        }
      }
    }
  }

  private async broadcastToRoom(room: Room, message: unknown): Promise<void> {
    if (isPubSubConfigured()) {
      await publishRoomUpdate({ type: "ERROR", roomCode: room.code, targetPlayerId: null, payload: message });
    } else {
      for (const seat of room.seats) {
        this.sendToSeat(seat, message);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Low-level send helpers
  // -------------------------------------------------------------------------

  /** Send directly to a seat's local socket (bypasses pub/sub). */
  private sendToSeat(seat: RoomSeat, data: unknown): void {
    if (seat.socket && seat.isConnected && seat.socket.readyState === 1) {
      try { seat.socket.send(JSON.stringify(data)); } catch { /* ignore */ }
    }
  }

  /** Send directly to a WebSocket (used for initial sync on connect). */
  private sendDirect(socket: WebSocket, data: unknown): void {
    if (socket.readyState === 1) {
      try { socket.send(JSON.stringify(data)); } catch { /* ignore */ }
    }
  }

  // -------------------------------------------------------------------------
  // getPublicRoomInfo
  // -------------------------------------------------------------------------

  public getPublicRoomInfo(room: Room): PublicRoomInfo {
    return {
      code: room.code,
      gameType: room.gameType || "monodeal",
      hostPlayerId: room.hostPlayerId,
      status: room.status,
      maxSeats: room.maxSeats,
      isStarted: room.status !== "lobby",
      seats: room.seats.map((s) => ({
        seatIndex: s.seatIndex,
        playerId: s.playerId,
        name: s.name,
        isBot: s.isBot,
        isConnected: s.isConnected,
        difficulty: s.isBot ? parseBotDifficulty(s.difficulty) : undefined,
      })),
    };
  }

  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // hydrateOnBoot — restores active rooms on server start
  //
  // Priority:
  //   1. Redis (source of truth for live state) — fast, no DB round-trips
  //   2. Neon Postgres (fallback when Redis is cold or not configured)
  //
  // Also prunes stale entries from the rooms:active Redis Set that were
  // left behind by TTL-expired room keys.
  // -------------------------------------------------------------------------

  public async hydrateOnBoot(): Promise<number> {
    if (this.hasAttemptedHydration) return 0;
    this.hasAttemptedHydration = true;

    console.log("[Hydration] Starting server boot hydration...");

    // ------------------------------------------------------------------
    // Step 1: Prune stale Redis index entries (TTL-expired room keys whose
    // codes are still in the rooms:active Set).
    // ------------------------------------------------------------------
    if (isRedisConfigured()) {
      const pruned = await pruneStaleRoomCodes();
      if (pruned > 0) {
        console.log(`[Hydration] Removed ${pruned} expired room(s) from Redis index`);
      }
    }

    // ------------------------------------------------------------------
    // Step 2: Hydrate from Redis if rooms exist there
    // ------------------------------------------------------------------
    if (isRedisConfigured()) {
      const codes = await getAllRoomCodes();

      if (codes.length > 0) {
        let restoredCount = 0;
        let skippedCount = 0;

        for (const code of codes) {
          const stored = await this.loadRoom(code); // warms memoryRooms
          if (!stored) {
            skippedCount++;
            continue;
          }
          // Skip rooms that are already terminal — they shouldn't be served
          if (stored.status === "completed" || (stored.status as string) === "abandoned") {
            await redisDeleteRoom(code);
            skippedCount++;
            continue;
          }
          restoredCount++;
        }

        console.log(
          `[Hydration] ✓ Restored ${restoredCount} room(s) from Redis` +
          (skippedCount > 0 ? ` (skipped ${skippedCount} terminal/expired)` : ""),
        );
        return restoredCount;
      }

      console.log("[Hydration] Redis is configured but empty — falling back to Neon Postgres");
    }

    // ------------------------------------------------------------------
    // Step 3: Fallback — hydrate from Neon Postgres
    // Writes each restored room back to Redis so subsequent restarts use Redis.
    // ------------------------------------------------------------------
    return (
      (await this.safeDb(async () => {
        const activeRooms = await db
          .select()
          .from(rooms)
          // Only restore rooms that are genuinely active — skip completed/abandoned
          .where(sql`${rooms.status} IN ('lobby', 'in_progress')`);

        if (!activeRooms || activeRooms.length === 0) {
          console.log("[Hydration] No active rooms found in Neon Postgres");
          return 0;
        }

        let restoredCount = 0;
        for (const r of activeRooms) {
          const seatsData = await db
            .select({
              seatIndex: roomSeats.seatIndex,
              playerId: roomSeats.playerId,
              sessionToken: roomSeats.sessionToken,
              displayName: players.displayName,
              isBot: players.isBot,
              difficulty: roomSeats.difficulty,
            })
            .from(roomSeats)
            .innerJoin(players, eq(roomSeats.playerId, players.id))
            .where(eq(roomSeats.roomId, r.id))
            .orderBy(roomSeats.seatIndex);

          const seats: StoredSeat[] = seatsData.map((s) => ({
            seatIndex: s.seatIndex,
            playerId: s.playerId,
            name: s.displayName,
            isBot: s.isBot,
            sessionToken: s.sessionToken,
            isConnected: s.isBot, // bots are always "connected"
            difficulty: s.isBot ? parseBotDifficulty(s.difficulty) : undefined,
          }));

          const stored: StoredRoom = {
            id: r.id,
            code: r.code,
            gameType: r.gameType || "monodeal",
            config: r.config as Record<string, unknown> | undefined,
            hostPlayerId: r.hostPlayerId,
            status: r.status as RoomStatus,
            seats,
            maxSeats: r.maxSeats,
            createdAt: r.createdAt.getTime(),
            lastActivityAt: r.lastActivityAt.getTime(),
          };

          // For in-progress games, restore the latest game state snapshot
          if (r.status === "in_progress") {
            const gameRow = await db
              .select()
              .from(games)
              .where(eq(games.roomId, r.id))
              .limit(1);

            if (gameRow?.[0]) {
              stored.dbGameId = gameRow[0].id;

              const latestSnapshot = await db
                .select()
                .from(gameSnapshots)
                .where(eq(gameSnapshots.gameId, gameRow[0].id))
                .orderBy(sql`${gameSnapshots.afterSequence} DESC`)
                .limit(1);

              if (latestSnapshot?.[0]) {
                stored.gameState = latestSnapshot[0].stateJson as GameState;
                stored.nextSequenceNum = latestSnapshot[0].afterSequence + 1;
                console.log(
                  `[Hydration]   ↳ Room ${r.code} — restored game state from snapshot #${latestSnapshot[0].afterSequence}`,
                );
              } else {
                console.log(`[Hydration]   ↳ Room ${r.code} — no snapshot found, game state unavailable`);
              }
            }
          }

          // persistRoom writes to both memoryRooms and Redis with fresh TTL
          await this.persistRoom(stored);
          restoredCount++;
        }

        console.log(
          `[Hydration] ✓ Restored ${restoredCount} room(s) from Neon Postgres → Redis`,
        );
        return restoredCount;
      }, "hydrateOnBoot")) ?? 0
    );
  }
}
