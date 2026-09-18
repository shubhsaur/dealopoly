import { describe, expect, it } from "vitest";
import type { WebSocket } from "ws";
import {
  checkSocketBudget,
  shouldCloseSocket,
  clearSocketBudget,
  DEFAULT_SOCKET_RATE_LIMIT,
} from "./ws-rate-limit.js";

// Minimal WebSocket stand-in (only identity matters — the socket is a Map key).
function fakeSocket(): WebSocket {
  return {} as unknown as WebSocket;
}

const smallMessage = 100; // bytes

describe("checkSocketBudget", () => {
  it("allows messages within the burst limit", () => {
    const socket = fakeSocket();
    for (let i = 0; i < DEFAULT_SOCKET_RATE_LIMIT.burst; i++) {
      expect(checkSocketBudget(socket, smallMessage)).toBe(true);
    }
    clearSocketBudget(socket);
  });

  it("rejects once the burst is exhausted", () => {
    const socket = fakeSocket();
    for (let i = 0; i < DEFAULT_SOCKET_RATE_LIMIT.burst; i++) {
      checkSocketBudget(socket, smallMessage);
    }
    expect(checkSocketBudget(socket, smallMessage)).toBe(false);
    clearSocketBudget(socket);
  });

  it("rejects oversized messages regardless of token balance", () => {
    const socket = fakeSocket();
    expect(
      checkSocketBudget(socket, DEFAULT_SOCKET_RATE_LIMIT.maxMessageBytes + 1),
    ).toBe(false);
    clearSocketBudget(socket);
  });

  it("tracks strikes and signals close after maxStrikes consecutive rejections", () => {
    const socket = fakeSocket();
    // Drain the bucket.
    for (let i = 0; i < DEFAULT_SOCKET_RATE_LIMIT.burst; i++) {
      checkSocketBudget(socket, smallMessage);
    }
    expect(shouldCloseSocket(socket)).toBe(false);
    // Accumulate strikes (each over-limit message adds one).
    for (let i = 0; i < DEFAULT_SOCKET_RATE_LIMIT.maxStrikes; i++) {
      expect(checkSocketBudget(socket, smallMessage)).toBe(false);
    }
    expect(shouldCloseSocket(socket)).toBe(true);
    clearSocketBudget(socket);
  });

  it("uses independent budgets per socket", () => {
    const a = fakeSocket();
    const b = fakeSocket();
    for (let i = 0; i < DEFAULT_SOCKET_RATE_LIMIT.burst; i++) {
      checkSocketBudget(a, smallMessage);
    }
    expect(checkSocketBudget(a, smallMessage)).toBe(false);
    expect(checkSocketBudget(b, smallMessage)).toBe(true);
    clearSocketBudget(a);
    clearSocketBudget(b);
  });
});
