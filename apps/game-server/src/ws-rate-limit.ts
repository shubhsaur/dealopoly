import type { WebSocket } from "ws";

/**
 * Per-socket WebSocket rate limiting (token bucket).
 *
 * A legitimate player issuing game commands stays well under these limits even
 * when clicking fast. A scripted flood trips the bucket quickly. When a socket
 * exceeds its budget we warn once (RATE_LIMITED) and, on repeated violations,
 * close the connection (1008 = policy violation).
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
  strikes: number;
}

export interface SocketRateLimitOptions {
  /** Maximum burst of messages allowed at once. */
  burst: number;
  /** Tokens refilled per second. */
  refillPerSecond: number;
  /** How many consecutive over-limit messages before closing the socket. */
  maxStrikes: number;
  /** Maximum allowed raw message size in bytes (guards memory abuse). */
  maxMessageBytes: number;
}

export const DEFAULT_SOCKET_RATE_LIMIT: SocketRateLimitOptions = {
  burst: 30,
  refillPerSecond: 10,
  maxStrikes: 3,
  maxMessageBytes: 16 * 1024, // 16 KB — a COMMAND never needs to be larger
};

const buckets = new Map<WebSocket, Bucket>();

/**
 * Consume one token for a message on this socket.
 * Returns true if the message is allowed, false if the budget is exhausted.
 * Also enforces the max raw message size.
 */
export function checkSocketBudget(
  socket: WebSocket,
  rawLength: number,
  options: SocketRateLimitOptions = DEFAULT_SOCKET_RATE_LIMIT,
): boolean {
  // Hard size guard — reject before parsing.
  if (rawLength > options.maxMessageBytes) {
    return false;
  }

  const now = Date.now();
  let bucket = buckets.get(socket);
  if (!bucket) {
    bucket = { tokens: options.burst, lastRefill: now, strikes: 0 };
    buckets.set(socket, bucket);
  }

  // Refill based on elapsed time.
  const elapsedSec = (now - bucket.lastRefill) / 1000;
  if (elapsedSec > 0) {
    bucket.tokens = Math.min(
      options.burst,
      bucket.tokens + elapsedSec * options.refillPerSecond,
    );
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    bucket.strikes += 1;
    return false;
  }

  bucket.tokens -= 1;
  bucket.strikes = 0; // a successful message resets the strike counter
  return true;
}

/** Returns true once a socket has accumulated too many violations and should be closed. */
export function shouldCloseSocket(
  socket: WebSocket,
  options: SocketRateLimitOptions = DEFAULT_SOCKET_RATE_LIMIT,
): boolean {
  const bucket = buckets.get(socket);
  return !!bucket && bucket.strikes >= options.maxStrikes;
}

/** Clean up the bucket when a socket closes to avoid leaking memory. */
export function clearSocketBudget(socket: WebSocket): void {
  buckets.delete(socket);
}
