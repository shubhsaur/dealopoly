import { Redis } from "ioredis";
import { config } from "dotenv";
import { resolve } from "node:path";

// Attempt to load .env if UPSTASH_REDIS_URL is not set
if (!process.env["UPSTASH_REDIS_URL"]) {
  config({ path: resolve(process.cwd(), "../../.env") });
  config({ path: resolve(process.cwd(), ".env") });
}

// ---------------------------------------------------------------------------
// Pub/Sub channel naming
// ---------------------------------------------------------------------------

/**
 * The channel name all instances subscribe to for a given room.
 * e.g. "room:123456:events"
 */
export function roomChannel(code: string): string {
  return `room:${code}:events`;
}

// ---------------------------------------------------------------------------
// Pub/Sub message types
// ---------------------------------------------------------------------------

export type RoomUpdateType = "GAME_STATE" | "ROOM_STATE" | "GAME_EVENT" | "ERROR";

export interface RoomUpdateMessage {
  type: RoomUpdateType;
  roomCode: string;
  /** playerId this message is addressed to. null = broadcast to all seats. */
  targetPlayerId: string | null;
  payload: unknown;
  senderInstanceId?: string;
}

// ---------------------------------------------------------------------------
// ioredis singleton helpers
//
// Pub/Sub requires TWO separate connections:
//   - publisher:  regular ioredis client used for PUBLISH commands
//   - subscriber: dedicated client in subscribe mode (cannot run other cmds)
//
// Both are lazy-initialised and reused across the process lifetime.
// ---------------------------------------------------------------------------

let _publisher: Redis | null = null;
let _subscriber: Redis | null = null;

/**
 * Returns true if UPSTASH_REDIS_URL is present (required for ioredis pub/sub).
 */
export function isPubSubConfigured(): boolean {
  return !!process.env["UPSTASH_REDIS_URL"];
}

/**
 * Builds an ioredis client connected to Upstash over TLS.
 * The URL must be in rediss:// format, e.g.:
 *   rediss://default:<TOKEN>@<ENDPOINT>:<PORT>
 */
function createIoRedisClient(name: string): Redis {
  const url = process.env["UPSTASH_REDIS_URL"];
  if (!url) {
    throw new Error(
      "[Redis Pub/Sub] UPSTASH_REDIS_URL is not set. " +
        "Add it to your .env file. Format: rediss://default:<TOKEN>@<ENDPOINT>:<PORT>"
    );
  }

  const client = new Redis(url, {
    tls: { rejectUnauthorized: false },
    // Upstash closes idle connections — auto-reconnect
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
    // Give each client a label for easier debugging
    connectionName: `dealopoly-${name}`,
    // Disable offline queue for the subscriber to avoid backpressure buildup
    enableOfflineQueue: name !== "subscriber",
    lazyConnect: false,
    maxRetriesPerRequest: name === "subscriber" ? null : 3,
  });

  client.on("error", (err: Error) =>
    console.error(`[Redis ${name}] Connection error:`, err.message)
  );
  client.on("connect", () =>
    console.log(`[Redis ${name}] Connected`)
  );
  client.on("reconnecting", () =>
    console.log(`[Redis ${name}] Reconnecting...`)
  );

  return client;
}

/**
 * Lazily initialised publisher client.
 * Used only for PUBLISH — never for subscribe.
 */
export function getPublisher(): Redis {
  if (!_publisher) {
    _publisher = createIoRedisClient("publisher");
  }
  return _publisher;
}

/**
 * Lazily initialised subscriber client.
 * Used only for SUBSCRIBE/PSUBSCRIBE — cannot run other Redis commands.
 */
export function getSubscriber(): Redis {
  if (!_subscriber) {
    _subscriber = createIoRedisClient("subscriber");
  }
  return _subscriber;
}

/**
 * Gracefully closes both ioredis connections.
 * Call on process exit / server shutdown.
 */
export async function closePubSub(): Promise<void> {
  await Promise.all([
    _publisher?.quit().catch(() => {}),
    _subscriber?.quit().catch(() => {}),
  ]);
  _publisher = null;
  _subscriber = null;
}

// ---------------------------------------------------------------------------
// publish helper
// ---------------------------------------------------------------------------

/**
 * Publish a room update message to all server instances subscribed to this room.
 *
 * When targetPlayerId is null → all instances broadcast to all seats.
 * When targetPlayerId is set  → only the instance that owns that socket delivers it.
 *
 * Falls back silently if UPSTASH_REDIS_URL is not configured (single-instance mode).
 */
export async function publishRoomUpdate(message: RoomUpdateMessage): Promise<void> {
  if (!isPubSubConfigured()) return;

  try {
    const channel = roomChannel(message.roomCode);
    await getPublisher().publish(channel, JSON.stringify(message));
  } catch (err: unknown) {
    console.error(
      "[Redis Pub/Sub] publish error:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Subscribe this server instance to a room's event channel.
 *
 * @param code       The 6-digit room code
 * @param onMessage  Called with each received RoomUpdateMessage
 * @returns          Cleanup function to unsubscribe
 */
export function subscribeToRoomChannel(
  code: string,
  onMessage: (msg: RoomUpdateMessage) => void
): () => void {
  if (!isPubSubConfigured()) return () => {};

  const channel = roomChannel(code);
  const sub = getSubscriber();

  sub.subscribe(channel, (err: Error | null | undefined) => {
    if (err) {
      console.error(`[Redis Pub/Sub] Failed to subscribe to ${channel}:`, err.message);
    }
  });

  const handler = (receivedChannel: string, raw: string) => {
    if (receivedChannel !== channel) return;
    try {
      const msg = JSON.parse(raw) as RoomUpdateMessage;
      onMessage(msg);
    } catch {
      // malformed message — ignore
    }
  };

  sub.on("message", handler);

  // Return an unsubscribe cleanup function
  return () => {
    sub.unsubscribe(channel).catch(() => {});
    sub.removeListener("message", handler);
  };
}
