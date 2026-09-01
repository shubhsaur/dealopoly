import { safeRedis, isRedisConfigured } from "./client.js";

/**
 * TTL for disconnect timer keys — 5 minutes.
 * When this key expires the player is considered permanently disconnected.
 */
export const DISCONNECT_TTL_SECONDS = 5 * 60; // 5 minutes

/**
 * Redis key for a player's pending disconnect timer.
 * e.g. "disconnect:123456_abc-uuid"
 */
export function disconnectKey(roomCode: string, playerId: string): string {
  return `disconnect:${roomCode}_${playerId}`;
}

/**
 * Start a disconnect timer for a player by setting a Redis key with a 5-minute TTL.
 * When the key expires naturally, a polling loop in RoomManager triggers the timeout handler.
 * Replaces: setTimeout(() => handleDisconnectTimeout(...), 5 * 60 * 1000)
 */
export async function setDisconnectTimer(roomCode: string, playerId: string): Promise<void> {
  await safeRedis(
    (r) => r.set(disconnectKey(roomCode, playerId), "1", { ex: DISCONNECT_TTL_SECONDS }),
    `setDisconnectTimer(${roomCode}, ${playerId})`,
  );
}

/**
 * Cancel a pending disconnect timer (player reconnected).
 * Replaces: clearTimeout(disconnectTimers.get(key))
 */
export async function clearDisconnectTimer(roomCode: string, playerId: string): Promise<void> {
  await safeRedis(
    (r) => r.del(disconnectKey(roomCode, playerId)),
    `clearDisconnectTimer(${roomCode}, ${playerId})`,
  );
}

/**
 * Returns true if a disconnect timer key still exists in Redis
 * (i.e. the player is in the grace period — has not yet been converted to a bot).
 */
export async function disconnectTimerExists(roomCode: string, playerId: string): Promise<boolean> {
  if (!isRedisConfigured()) return false;
  const exists = await safeRedis(
    (r) => r.exists(disconnectKey(roomCode, playerId)),
    `disconnectTimerExists(${roomCode}, ${playerId})`,
  );
  return exists === 1;
}
