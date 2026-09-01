import { safeRedis, isRedisConfigured, getRedis } from "./client.js";

/**
 * TTL for room keys in Redis — 4 hours (matches DB expiresAt default).
 * Every mutation resets this via roomTtlRefresh().
 */
export const ROOM_TTL_SECONDS = 4 * 60 * 60; // 4 hours

/**
 * Redis key for a room's serialised state.
 * e.g. "room:123456"
 */
export function roomKey(code: string): string {
  return `room:${code}`;
}

/**
 * Redis key used as a lightweight index of all active room codes.
 * We store codes in a Redis Set so getStats() / getAllRoomCodes() can
 * enumerate rooms without a KEYS scan (which is O(N) and blocked in
 * production Upstash plans).
 */
export const ROOM_INDEX_KEY = "rooms:active";

// ---------------------------------------------------------------------------
// Core CRUD helpers
// ---------------------------------------------------------------------------

/**
 * Persist a serialisable room snapshot to Redis.
 * Automatically refreshes the TTL and updates the active-room index.
 */
export async function setRoom<T>(code: string, room: T): Promise<void> {
  await safeRedis(async (r) => {
    const key = roomKey(code);
    await r.set(key, JSON.stringify(room), { ex: ROOM_TTL_SECONDS });
    await r.sadd(ROOM_INDEX_KEY, code);
  }, `setRoom(${code})`);
}

/**
 * Retrieve a room snapshot from Redis.
 * Returns null when Redis is unavailable or the key doesn't exist.
 */
export async function getRoom<T>(code: string): Promise<T | null> {
  const raw = await safeRedis(async (r) => {
    return r.get<string>(roomKey(code));
  }, `getRoom(${code})`);

  if (!raw) return null;

  try {
    // Upstash REST client auto-parses JSON — handle both cases
    if (typeof raw === "string") {
      return JSON.parse(raw) as T;
    }
    return raw as T;
  } catch {
    return null;
  }
}

/**
 * Delete a room from Redis and remove it from the active-room index.
 */
export async function deleteRoom(code: string): Promise<void> {
  await safeRedis(async (r) => {
    await r.del(roomKey(code));
    await r.srem(ROOM_INDEX_KEY, code);
  }, `deleteRoom(${code})`);
}

/**
 * Refresh the TTL on an existing room key (called on every activity).
 */
export async function refreshRoomTtl(code: string): Promise<void> {
  await safeRedis(
    (r) => r.expire(roomKey(code), ROOM_TTL_SECONDS),
    `refreshRoomTtl(${code})`,
  );
}

/**
 * Returns all active room codes from the index set.
 * Used by getStats() and hydrateRoomsFromRedis().
 */
export async function getAllRoomCodes(): Promise<string[]> {
  const codes = await safeRedis(
    (r) => r.smembers(ROOM_INDEX_KEY),
    "getAllRoomCodes",
  );
  return codes ?? [];
}

/**
 * Returns true if Redis is configured AND the room key exists.
 */
export async function roomExistsInRedis(code: string): Promise<boolean> {
  if (!isRedisConfigured()) return false;
  const exists = await safeRedis(
    (r) => r.exists(roomKey(code)),
    `roomExistsInRedis(${code})`,
  );
  return exists === 1;
}

/**
 * Returns the total number of tracked room codes in the index.
 */
export async function getRoomCount(): Promise<number> {
  const count = await safeRedis(
    (r) => r.scard(ROOM_INDEX_KEY),
    "getRoomCount",
  );
  return count ?? 0;
}
