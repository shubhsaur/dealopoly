import { Redis } from "@upstash/redis";
import { config } from "dotenv";
import { resolve } from "node:path";

// Attempt to load .env if UPSTASH vars are not set (mirrors packages/db pattern)
if (!process.env["UPSTASH_REDIS_REST_URL"]) {
  config({ path: resolve(process.cwd(), "../../.env") });
  config({ path: resolve(process.cwd(), ".env") });
}

let _redis: Redis | null = null;

/**
 * Returns true if the required Upstash env vars are present.
 * When false, all safeRedis() calls will silently no-op.
 */
export function isRedisConfigured(): boolean {
  return (
    !!process.env["UPSTASH_REDIS_REST_URL"] &&
    !!process.env["UPSTASH_REDIS_REST_TOKEN"]
  );
}

/**
 * Lazily initialises and returns the Redis client.
 * Throws if UPSTASH env vars are missing — use isRedisConfigured() to guard.
 */
export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env["UPSTASH_REDIS_REST_URL"];
    const token = process.env["UPSTASH_REDIS_REST_TOKEN"];

    if (!url || !token) {
      throw new Error(
        "[Redis] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set. " +
          "Add them to your .env file. See .env.example for reference."
      );
    }

    _redis = new Redis({ url, token });
  }
  return _redis;
}

/**
 * Safe Redis helper — executes an operation only if Redis is configured.
 * Catches and logs errors without disrupting callers.
 * Mirrors the safeDb() pattern in packages/db.
 *
 * @example
 * await safeRedis(r => r.set("key", "value"), "set room state")
 */
export async function safeRedis<T>(
  op: (redis: Redis) => Promise<T>,
  desc: string
): Promise<T | null> {
  if (!isRedisConfigured()) {
    return null;
  }
  try {
    return await op(getRedis());
  } catch (err: unknown) {
    console.error(
      `[Redis Error: ${desc}]`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Pings Redis and returns latency in milliseconds.
 * Returns null if Redis is not configured or the ping fails.
 */
export async function pingRedis(): Promise<{ latencyMs: number } | null> {
  if (!isRedisConfigured()) return null;
  const start = Date.now();
  const result = await safeRedis((r) => r.ping(), "ping");
  if (result === null) return null;
  return { latencyMs: Date.now() - start };
}
