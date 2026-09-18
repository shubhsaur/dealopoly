import { safeRedis, isRedisConfigured } from "./client.js";

/**
 * Turn/decision timers.
 *
 * Mirrors the disconnect-timer design: a Redis key with a TTL acts as the
 * durable signal (survives a process restart and is visible to every instance),
 * while an in-process setTimeout in RoomManager is the local executor.
 */

/**
 * Redis key for a room's pending turn/decision timer.
 * e.g. "turntimer:123456"
 */
export function turnTimerKey(roomCode: string): string {
  return `turntimer:${roomCode}`;
}

/**
 * Arm (or re-arm) the turn timer for a room.
 * `ttlSeconds` is the remaining time until the idle player is auto-played.
 */
export async function setTurnTimer(roomCode: string, ttlSeconds: number): Promise<void> {
  await safeRedis(
    (r) => r.set(turnTimerKey(roomCode), "1", { ex: Math.max(1, Math.ceil(ttlSeconds)) }),
    `setTurnTimer(${roomCode})`,
  );
}

/** Cancel a room's pending turn timer (a player acted, or the game ended). */
export async function clearTurnTimer(roomCode: string): Promise<void> {
  await safeRedis(
    (r) => r.del(turnTimerKey(roomCode)),
    `clearTurnTimer(${roomCode})`,
  );
}

/** True if a turn timer key still exists (the room is awaiting an action). */
export async function turnTimerExists(roomCode: string): Promise<boolean> {
  if (!isRedisConfigured()) return false;
  const exists = await safeRedis(
    (r) => r.exists(turnTimerKey(roomCode)),
    `turnTimerExists(${roomCode})`,
  );
  return exists === 1;
}
