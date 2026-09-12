"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MaskedGameState, PaymentCompletedEvent } from "@dealopoly/game-engine";

interface UseRentSummaryOptions {
  gameState: MaskedGameState | null | undefined;
  actualPlayerId: string;
}

interface UseRentSummaryResult {
  summaryEvent: PaymentCompletedEvent | null;
  dismissSummary: () => void;
}

/**
 * Watches for new payment_completed events where the current player is the creditor.
 * Returns the next unacknowledged event and a dismiss function. Multiple back-to-back
 * collections are queued and shown one at a time.
 */
export function useRentSummary({ gameState, actualPlayerId }: UseRentSummaryOptions): UseRentSummaryResult {
  const [queue, setQueue] = useState<PaymentCompletedEvent[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const lastSeenHistoryLengthRef = useRef(0);

  useEffect(() => {
    if (!gameState?.history || gameState.history.length === 0) return;

    const historyLen = gameState.history.length;
    if (historyLen <= lastSeenHistoryLengthRef.current) return;

    const newEvents = gameState.history.slice(lastSeenHistoryLengthRef.current);
    lastSeenHistoryLengthRef.current = historyLen;

    const unacknowledged = newEvents.filter((evt) => {
      if (evt.type !== "payment_completed") return false;
      const completed = evt as PaymentCompletedEvent;
      return (
        completed.creditorPlayerId === actualPlayerId &&
        !acknowledgedIds.has(completed.id)
      );
    }) as PaymentCompletedEvent[];

    if (unacknowledged.length === 0) return;

    setQueue((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const toAdd = unacknowledged.filter((e) => !existingIds.has(e.id));
      return [...prev, ...toAdd];
    });
  }, [gameState?.history, actualPlayerId, acknowledgedIds]);

  const dismissSummary = useCallback(() => {
    setQueue((prev) => {
      const [dismissed, ...rest] = prev;
      if (dismissed) {
        setAcknowledgedIds((ids) => new Set([...ids, dismissed.id]));
      }
      return rest;
    });
  }, []);

  return { summaryEvent: queue[0] || null, dismissSummary };
}
