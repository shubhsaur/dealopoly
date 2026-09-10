"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Runs a callback on a fixed interval. Cleans up automatically on unmount.
 * Pass `null` as delay to pause.
 */
export function useInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}

/**
 * Fires a callback once after a delay. Cleans up automatically on unmount.
 * Pass `null` as delay to disable. Reset by bumping the `key` param.
 */
export function useTimeout(callback: () => void, delayMs: number | null, key?: unknown) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = setTimeout(() => savedCallback.current(), delayMs);
    return () => clearTimeout(id);
  }, [delayMs, key]);
}

/**
 * Debounces a value by the given delay. Returns the latest value
 * only after `delayMs` has elapsed since the last change.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Returns the current time, updated every `intervalMs` (default 1000).
 * Useful for driving UI that depends on relative time (countdowns, "time ago", etc.).
 */
export function useClock(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useInterval(() => setNow(Date.now()), intervalMs);

  return now;
}

/**
 * Returns a callback and a `ready` boolean. After calling `reset`,
 * `ready` becomes true for `durationMs` then flips back to false.
 * Useful for copy-to-clipboard feedback, toast dismissals, etc.
 */
export function usePulse(durationMs: number): { ready: boolean; pulse: () => void } {
  const [ready, setReady] = useState(false);

  const pulse = useCallback(() => {
    setReady(true);
    const id = setTimeout(() => setReady(false), durationMs);
    // Store so cleanup can cancel — but simpler: just use the state guard
    return () => clearTimeout(id);
  }, [durationMs]);

  return { ready, pulse };
}
