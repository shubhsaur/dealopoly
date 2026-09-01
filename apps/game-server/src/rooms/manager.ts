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
  refreshRoomTtl,
  getAllRoomCodes,
  getRoomCount,
} from "@dealopoly/redis";
import type { Room, RoomSeat, PublicRoomInfo, RoomStatus } from "./types.js";

// ---------------------------------------------------------------------------
// StoredRoom — the Redis-serialisable subset of Room.
// WebSocket objects are NOT included; they live in socketRegistry below.
// ---------------------------------------------------------------------------
type StoredRoom = Omit<Room, never> & { seats: StoredSeat[] };

type StoredSeat = Omit<RoomSeat, "socket">;

// ---------------------------------------------------------------------------
// In-memory socket registry (survives only for this process lifetime).
// Key: roomCode → Map<playerId, WebSocket>
// ---------------------------------------------------------------------------
type SocketRegistry = Map<string, Map<string, WebSocket>>;

// ---------------------------------------------------------------------------

export class RoomManager {
  /**
   * Fallback in-memory store used when Redis is not configured.
   * When Redis IS configured this map is only used as a write-through
   * cache for the current process's live rooms (avoids a Redis round-trip
   * on every broadcastGameState call during an active turn sequence).
   */
  private memoryRooms = new Map<string, StoredRoom>();

  /**
   * Holds live WebSocket references — never persisted to Redis.
   */
  private socketRegistry: SocketRegistry = new Map();

  /**
   * Disconnect timers — migrated to Redis TTL keys in Phase 3.
   * Kept in memory for now.
   */
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  private hasAttemptedHydration = false;

  constructor() {
    // 2-hour periodic sweep — only needed when Redis is off (Redis TTL handles it otherwise).
    setInterval(() => {
      if (!isRedisConfigured()) {
        this.sweepIdleRooms();
      }
    }, 30 * 60 * 1000);
  }

  // -------------------------------------------------------------------------
  // Private Redis-backed storage helpers
  // -------------------------------------------------------------------------

  /**
   * Persist room to Redis (and write-through to memoryRooms).
   * Strips socket refs before serialising.
   */
  private async persistRoom(room: StoredRoom): Promise<void> {
    this.memoryRooms.set(room.code, room);
    await redisSetRoom(room.code, room);
  }

  /**
   * Remove room from Redis and memoryRooms.
   */
  private async removeRoom(code: string): Promise<void> {
    this.memoryRooms.delete(code);
    await redisDeleteRoom(code);
  }

  /**
   * Load a room — checks memoryRooms first (fast path), then Redis.
   * Returns undefined if not found anywhere.
   */
  private async loadRoom(code: string): Promise<StoredRoom | undefined> {
    // Fast path: already in this process's memory
    const cached = this.memoryRooms.get(code);
    if (cached) return cached;

    // Slow path: fetch from Redis (another instance may have created it)
    const stored = await redisGetRoom<StoredRoom>(code);
    if (stored) {
      // Warm the local cache
      this.memoryRooms.set(code, stored);
      return stored;
    }

    return undefined;
  }

  /**
   * Convert StoredRoom back to a full Room by re-attaching socket refs
   * from the socket registry.
   */
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

  /**
   * Strip socket from a Room before storing — produces a StoredRoom.
   */
  private stripSockets(room: Room): StoredRoom {
    return {
      ...room,
      seats: room.seats.map(({ socket: _socket, ...rest }) => rest),
    };
  }

  // -------------------------------------------------------------------------
  // Socket registry helpers
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
  // Idle sweep (memory-only mode fallback)
  // -------------------------------------------------------------------------

  private sweepIdleRooms() {
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    for (const [code, room] of this.memoryRooms.entries()) {
      if (now - room.lastActivityAt > TWO_HOURS) {
        console.log(`[Room Sweeper] Room ${code} idle 2h+, abandoning.`);
        if (room.status === "in_progress" || room.status === "lobby") {
          this.abandonRoom(code, "idle_timeout");
        } else {
          this.memoryRooms.delete(code);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  public async getStats(): Promise<{ activeRooms: number; onlinePlayers: number; totalRooms: number }> {
    let onlinePlayers = 0;
    let activeRooms = 0;

    if (isRedisConfigured()) {
      // Enumerate via Redis index
      const codes = await getAllRoomCodes();
      const totalRooms = codes.length;

      for (const code of codes) {
        const stored = await this.loadRoom(code);
        if (!stored) continue;
        if (stored.status === "in_progress" || stored.status === "lobby") {
          activeRooms++;
          // Count online human players using socket registry
          const sockets = this.socketRegistry.get(code);
          for (const seat of stored.seats) {
            if (!seat.isBot && sockets?.has(seat.playerId)) {
              onlinePlayers++;
            }
          }
        }
      }
      return { activeRooms, onlinePlayers, totalRooms };
    }

    // Memory-only mode
    for (const room of this.memoryRooms.values()) {
      if (room.status === "in_progress" || room.status === "lobby") {
        activeRooms++;
        const sockets = this.socketRegistry.get(room.code);
        for (const seat of room.seats) {
          if (!seat.isBot && sockets?.has(seat.playerId)) {
            onlinePlayers++;
          }
        }
      }
    }
    return {
      activeRooms,
      onlinePlayers,
      totalRooms: this.memoryRooms.size,
    };
  }

  // -------------------------------------------------------------------------
  // Room code generation
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

  // -------------------------------------------------------------------------
  // Safe DB helper (unchanged)
  // -------------------------------------------------------------------------

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
    options?: { botCount?: number; userId?: string; gameType?: string; config?: Record<string, unknown> },
  ): Promise<{ room: Room; hostPlayerId: string; sessionToken: string }> {
    const roomId = randomUUID();
    const code = await this.generateRoomCode();
    const hostPlayerId = randomUUID();
    const hostSessionToken = this.generateSessionToken();
    const displayName = hostName.trim() || "Host";
    const gameType = options?.gameType || "monodeal";

    const hostSeat: StoredSeat = {
      seatIndex: 0,
      playerId: hostPlayerId,
      name: displayName,
      isBot: false,
      sessionToken: hostSessionToken,
      isConnected: false,
    };

    const seats: StoredSeat[] = [hostSeat];

    const botCount = Math.min(Math.max(0, options?.botCount ?? 0), 4);
    const botPlayersToInsert: { id: string; displayName: string; sessionToken: string; isBot: boolean }[] = [];
    const botNames = ["Atlas", "Nova", "Cipher", "Vortex"];

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
      });

      botPlayersToInsert.push({ id: botId, displayName: botName, sessionToken: botToken, isBot: true });
    }

    const stored: StoredRoom = {
      id: roomId,
      code,
      gameType,
      config: options?.config,
      hostPlayerId,
      status: "lobby",
      seats,
      maxSeats: 5,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    await this.persistRoom(stored);

    // Persist to Neon Postgres asynchronously
    void this.safeDb(async () => {
      await db.insert(players).values([
        { id: hostPlayerId, userId: options?.userId ?? null, displayName, sessionToken: hostSessionToken, isBot: false },
        ...botPlayersToInsert,
      ]);
      await db.insert(rooms).values({ id: roomId, code, gameType, config: options?.config, hostPlayerId, status: "lobby", maxSeats: 5 });
      await db.insert(roomSeats).values(seats.map((s) => ({ roomId, playerId: s.playerId, seatIndex: s.seatIndex, sessionToken: s.sessionToken })));
    }, `createRoom (${code})`);

    return { room: this.hydrateRoom(stored), hostPlayerId, sessionToken: hostSessionToken };
  }

  // -------------------------------------------------------------------------
  // getRoom (public — used by server.ts)
  // -------------------------------------------------------------------------

  public getRoom(code: string): Room | undefined {
    // Synchronous fast-path for callers that need a Room right now.
    // Works because persistRoom() always writes to memoryRooms as well.
    const stored = this.memoryRooms.get(code);
    return stored ? this.hydrateRoom(stored) : undefined;
  }

  /**
   * Async version — used internally when we need to check Redis too.
   */
  private async getRoomAsync(code: string): Promise<Room | undefined> {
    const stored = await this.loadRoom(code);
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
    this.broadcastRoomInfo(this.hydrateRoom(stored));

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

  public async addBot(code: string, requesterPlayerId: string): Promise<Room> {
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

    stored.seats.push({ seatIndex, playerId: botPlayerId, name: botName, isBot: true, sessionToken, isConnected: true });
    stored.lastActivityAt = Date.now();

    await this.persistRoom(stored);
    this.broadcastRoomInfo(this.hydrateRoom(stored));

    void this.safeDb(async () => {
      await db.insert(players).values({ id: botPlayerId, displayName: botName, sessionToken, isBot: true });
      if (stored.id) {
        await db.insert(roomSeats).values({ roomId: stored.id, playerId: botPlayerId, seatIndex, sessionToken });
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

    // Close the target's socket if open
    const targetSocket = this.getSocket(code, targetPlayerId);
    if (targetSocket) {
      targetSocket.close(1000, "Removed from room");
      this.removeSocket(code, targetPlayerId);
    }

    stored.seats = stored.seats.filter((s) => s.playerId !== targetPlayerId);
    stored.seats.forEach((s, idx) => { s.seatIndex = idx; });
    stored.lastActivityAt = Date.now();

    await this.persistRoom(stored);
    this.broadcastRoomInfo(this.hydrateRoom(stored));

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
    this.broadcastRoomInfo(room);
    this.broadcastGameState(room);

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
    this.broadcastGameState(room, result.events);

    void this.safeDb(async () => {
      const dbGameId = stored.dbGameId;
      if (!dbGameId) return;

      let currentSeq = stored.nextSequenceNum ?? 1;

      await db.insert(gameCommands).values({ gameId: dbGameId, sequenceNum: currentSeq, playerId, commandType: command.type, payload: command, accepted: true });

      if (result.events && result.events.length > 0) {
        for (const evt of result.events) {
          currentSeq++;
          await db.insert(gameEvents).values({ gameId: dbGameId, sequenceNum: currentSeq, eventType: evt.type, playerId: evt.playerId ?? playerId, payload: evt });
        }
      }

      stored.nextSequenceNum = currentSeq + 1;
      // Sync sequence number back to Redis after DB write
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
                await db.update(users).set({ gamesPlayed: sql`${users.gamesPlayed} + 1`, ...(isWinner ? { gamesWon: sql`${users.gamesWon} + 1` } : {}) }).where(eq(users.id, p.userId));
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
    // Use async load so cross-instance rooms (from Redis) are found
    const stored = await this.loadRoom(code);
    if (!stored) throw new Error("Room not found");

    const seat = stored.seats.find((s) => s.playerId === playerId);
    if (!seat) throw new Error("Player seat not found in this room");
    if (seat.sessionToken !== token) throw new Error("Invalid session token for this seat");

    // Register the socket
    this.setSocket(code, playerId, socket);
    seat.isConnected = true;

    // Bot-to-player handoff
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

    // Cancel any pending disconnect timer
    const timerKey = `${code}_${playerId}`;
    if (this.disconnectTimers.has(timerKey)) {
      clearTimeout(this.disconnectTimers.get(timerKey)!);
      this.disconnectTimers.delete(timerKey);
    }

    // Build the live RoomSeat for the caller (with socket attached)
    const liveSeat: RoomSeat = { ...seat, socket };

    // Send initial sync to this player
    this.sendToSeat(liveSeat, { type: "ROOM_STATE", room: this.getPublicRoomInfo(this.hydrateRoom(stored)) });

    if (stored.gameState) {
      const masked = getMaskedView(stored.gameState, playerId);
      this.sendToSeat(liveSeat, { type: "GAME_STATE", state: masked });

      // Broadcast reconnect event if this was a bot handoff
      if (!stored.seats.find((s) => s.playerId === playerId)?.isBot) {
        // seat.isBot was just set to false above — broadcast updated state
        this.broadcastGameState(this.hydrateRoom(stored), [{
          id: `bot-reverted-${Date.now()}`,
          type: "player_joined",
          playerId,
          timestamp: Date.now(),
          message: `${seat.name} reconnected and took back their seat.`,
        } as any]);
      }
    }

    this.broadcastRoomInfo(this.hydrateRoom(stored));

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

    const seat = stored.seats.find((s) => s.playerId === playerId);
    const registeredSocket = this.getSocket(code, playerId);

    if (seat && registeredSocket === socket) {
      seat.isConnected = false;
      this.removeSocket(code, playerId);
      stored.lastActivityAt = Date.now();

      // Fire-and-forget persist
      void this.persistRoom(stored);
      this.broadcastRoomInfo(this.hydrateRoom(stored));

      const timerKey = `${code}_${playerId}`;
      const timer = setTimeout(() => {
        this.handleDisconnectTimeout(code, playerId);
      }, 5 * 60 * 1000);
      this.disconnectTimers.set(timerKey, timer);
    }
  }

  // -------------------------------------------------------------------------
  // Disconnect timeout handler
  // -------------------------------------------------------------------------

  private handleDisconnectTimeout(code: string, playerId: string): void {
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
      this.removeSocket(code, playerId);

      if (stored.gameState && stored.gameState.players?.[playerId]) {
        stored.gameState.players[playerId]!.isBot = true;
      }

      void this.persistRoom(stored);

      const room = this.hydrateRoom(stored);
      this.broadcastRoomInfo(room);

      if (stored.gameState) {
        this.broadcastGameState(room, [{
          id: `bot-converted-${Date.now()}`,
          type: "player_left",
          playerId,
          timestamp: Date.now(),
          message: `${seat.name} left the game and was replaced by a bot.`,
        } as any]);
      }

      void this.safeDb(async () => {
        await db.update(players).set({ isBot: true }).where(eq(players.id, playerId));
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

    this.broadcastToRoom(this.hydrateRoom(stored), {
      type: "ERROR",
      code: "ROOM_DESTROYED",
      message: reason === "host_left"
        ? "The host has ended the game."
        : "The game was abandoned due to host inactivity.",
    });

    void this.removeRoom(code);
    this.clearSocketsForRoom(code);

    void this.safeDb(async () => {
      if (stored.id) await db.update(rooms).set({ status: "abandoned" }).where(eq(rooms.id, stored.id));
      if (stored.dbGameId) await db.update(games).set({ status: "abandoned" }).where(eq(games.id, stored.dbGameId));
    }, `abandonRoom (${code})`);
  }

  // -------------------------------------------------------------------------
  // Broadcast helpers
  // -------------------------------------------------------------------------

  private broadcastToRoom(room: Room, message: unknown): void {
    for (const seat of room.seats) {
      this.sendToSeat(seat, message);
    }
  }

  public broadcastRoomInfo(room: Room): void {
    const payload = { type: "ROOM_STATE", room: this.getPublicRoomInfo(room) };
    for (const seat of room.seats) {
      this.sendToSeat(seat, payload);
    }
  }

  public broadcastGameState(room: Room, events?: GameEvent[]): void {
    if (!room.gameState) return;
    const engine = getGameEngine(room.gameType || "monodeal");

    for (const seat of room.seats) {
      const masked = engine.getMaskedView(room.gameState, seat.playerId);
      this.sendToSeat(seat, { type: "GAME_STATE", state: masked });

      if (events && events.length > 0) {
        for (const evt of events) {
          this.sendToSeat(seat, { type: "GAME_EVENT", event: evt });
        }
      }
    }
  }

  private sendToSeat(seat: RoomSeat, data: unknown): void {
    if (seat.socket && seat.isConnected && seat.socket.readyState === 1 /* OPEN */) {
      try {
        seat.socket.send(JSON.stringify(data));
      } catch {
        // Socket send failed — ignore
      }
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
      })),
    };
  }

  // -------------------------------------------------------------------------
  // hydrateRoomsFromDb — runs on server boot if Redis is cold
  // -------------------------------------------------------------------------

  public async hydrateRoomsFromDb(): Promise<number> {
    if (this.hasAttemptedHydration) return 0;
    this.hasAttemptedHydration = true;

    // If Redis is configured and already has rooms, skip DB hydration
    if (isRedisConfigured()) {
      const codes = await getAllRoomCodes();
      if (codes.length > 0) {
        // Warm memoryRooms from Redis
        for (const code of codes) {
          await this.loadRoom(code); // populates memoryRooms via cache
        }
        console.log(`[Hydration] Restored ${codes.length} room(s) from Redis`);
        return codes.length;
      }
      console.log("[Hydration] Redis is empty — falling back to Neon Postgres hydration");
    }

    return (
      (await this.safeDb(async () => {
        const activeRooms = await db
          .select()
          .from(rooms)
          .where(sql`${rooms.status} IN ('lobby', 'in_progress')`);

        if (!activeRooms || activeRooms.length === 0) return 0;

        let restoredCount = 0;
        for (const r of activeRooms) {
          const seatsData = await db
            .select({ seatIndex: roomSeats.seatIndex, playerId: roomSeats.playerId, sessionToken: roomSeats.sessionToken, displayName: players.displayName, isBot: players.isBot })
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
            isConnected: s.isBot,
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

          if (r.status === "in_progress") {
            const gameRow = await db.select().from(games).where(eq(games.roomId, r.id)).limit(1);
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
              }
            }
          }

          await this.persistRoom(stored); // writes to both memoryRooms + Redis
          restoredCount++;
        }

        console.log(`[Hydration] Restored ${restoredCount} room(s) from Neon Postgres → Redis`);
        return restoredCount;
      }, "hydrateRoomsFromDb")) ?? 0
    );
  }
}
