"use client";

import { useRef, useState } from "react";
import { useInterval } from "./use-timers";

/**
 * Counts down from a deadline timestamp to zero.
 * Returns the remaining whole seconds, updating every `intervalMs` (default 200ms).
 * Returns 0 when the deadline has passed or if deadline is null.
 */
export function useCountdown(
  deadline: number | null | undefined,
  intervalMs = 200,
): number {
  const [remaining, setRemaining] = useState(() =>
    deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0,
  );

  useInterval(() => {
    if (!deadline) {
      setRemaining(0);
      return;
    }
    const secs = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    setRemaining(secs);
  }, deadline ? intervalMs : null);

  return remaining;
}

/**
 * Manages the host disconnect countdown timer with fallback deadlines.
 *
 * If the room reports a host disconnect (via `hostDisconnectedUntil` or seat connectivity),
 * this hook computes the remaining seconds and whether the room has ended for non-host clients.
 *
 * Returns `{ hostSecondsRemaining, isClientRoomEnded }`.
 */
export function useHostDisconnectTimer(
  roomInfo: {
    hostPlayerId?: string;
    hostDisconnectedUntil?: number;
    seats?: Array<{
      playerId: string;
      isConnected?: boolean;
      disconnectDeadline?: number;
    }>;
  } | null | undefined,
  isHost: boolean,
): { hostSecondsRemaining: number; isClientRoomEnded: boolean } {
  const fallbackDeadlineRef = useRef<number | null>(null);

  const hostSeat = roomInfo?.seats?.find((s) => s.playerId === roomInfo?.hostPlayerId);
  const isHostOffline = Boolean(
    roomInfo?.hostDisconnectedUntil || (hostSeat && hostSeat.isConnected === false),
  );

  // Determine the effective deadline
  let deadline: number | null = null;
  if (isHostOffline) {
    deadline =
      roomInfo?.hostDisconnectedUntil ??
      hostSeat?.disconnectDeadline ??
      null;

    if (!deadline) {
      if (!fallbackDeadlineRef.current) {
        fallbackDeadlineRef.current = Date.now() + 5 * 60 * 1000;
      }
      deadline = fallbackDeadlineRef.current;
    }
  } else {
    fallbackDeadlineRef.current = null;
  }

  const hostSecondsRemaining = useCountdown(isHostOffline ? deadline : null, 500);

  const isClientRoomEnded = Boolean(
    !isHost && isHostOffline && hostSecondsRemaining <= 0,
  );

  return { hostSecondsRemaining, isClientRoomEnded };
}
