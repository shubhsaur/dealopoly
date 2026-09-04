"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export interface UseRealisticProgressOptions {
  /** If true, triggers the completion sequence (smooth rush to 100%) */
  isReady?: boolean;
  /** Starting progress percentage (default 15) */
  initialProgress?: number;
  /** Ceiling percentage before completion is triggered (default 85) */
  maxStallProgress?: number;
  /** Duration in ms to hold at 100% before `isFinished` becomes true (default 280ms) */
  completionDelayMs?: number;
  /** Step increment interval in ms during stall phase (default 120ms) */
  stepIntervalMs?: number;
  /** Callback fired when completion delay expires */
  onFinished?: () => void;
}

export interface RealisticProgressResult {
  /** Current progress percentage (0 - 100) */
  progress: number;
  /** True when progress has reached 100% */
  isComplete: boolean;
  /** True after holding at 100% for the completion buffer, indicating destination view can mount */
  isFinished: boolean;
  /** Manually trigger completion to 100% */
  completeNow: () => void;
  /** Reset back to initial state */
  reset: () => void;
}

/**
 * Hook to manage realistic, satisfying progress animations for network/socket events.
 * 
 * - Starts immediately at `initialProgress` (e.g. 15%) so the loader never feels frozen.
 * - Slowly creeps toward `maxStallProgress` (e.g. 85%) using asymptotic easing while waiting.
 * - When `isReady` becomes true, rapidly sweeps to 100%.
 * - Holds at 100% for `completionDelayMs` so the user registers the full glowing bar,
 *   then sets `isFinished = true`.
 */
export function useRealisticProgress({
  isReady = false,
  initialProgress = 16,
  maxStallProgress = 86,
  completionDelayMs = 280,
  stepIntervalMs = 120,
  onFinished,
}: UseRealisticProgressOptions = {}): RealisticProgressResult {
  const [progress, setProgress] = useState<number>(initialProgress);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  const completeNow = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setIsComplete(true);

    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    finishTimeoutRef.current = setTimeout(() => {
      setIsFinished(true);
      onFinishedRef.current?.();
    }, completionDelayMs);
  }, [completionDelayMs]);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    setProgress(initialProgress);
    setIsComplete(false);
    setIsFinished(false);
  }, [initialProgress]);

  // Handle completion trigger from isReady
  useEffect(() => {
    if (isReady && !isComplete) {
      completeNow();
    }
  }, [isReady, isComplete, completeNow]);

  // Incremental asymptotic crawl while waiting
  useEffect(() => {
    if (isReady || isComplete) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= maxStallProgress) return prev;
        // Asymptotic increment: larger steps early on, diminishing steps as it nears stall cap
        const delta = Math.max(0.4, (maxStallProgress - prev) * 0.08);
        return Math.min(maxStallProgress, +(prev + delta).toFixed(1));
      });
    }, stepIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isReady, isComplete, maxStallProgress, stepIntervalMs]);

  return {
    progress,
    isComplete,
    isFinished,
    completeNow,
    reset,
  };
}
