"use client";

import { useState, useEffect, useRef } from "react";
import { playTimerWarningSound } from "../../../lib/sound-effects";
import type { PendingResolution, GameCommand } from "@dealopoly/game-engine";

/**
 * Manages the live countdown for reaction windows.
 * Returns remaining seconds (null when no active reaction window).
 * Auto-passes when the deadline expires.
 */
export function useReactionTimer(
  pendingResolution: PendingResolution | null | undefined,
  actualPlayerId: string,
  sendCommand: (cmd: GameCommand) => void,
): number | null {
  const [reactionRemainingSeconds, setReactionRemainingSeconds] = useState<number | null>(null);
  const hasAutoPassedReactionRef = useRef(false);
  const lastAlertSecondRef = useRef<number | null>(null);

  useEffect(() => {
    const isReactionWindow = pendingResolution?.type === "reaction_window";
    const isPaymentJsn = pendingResolution?.type === "payment" && Boolean(pendingResolution.jsnSubResolution);

    if (isReactionWindow || isPaymentJsn) {
      hasAutoPassedReactionRef.current = false;
      lastAlertSecondRef.current = null;
      const pending = pendingResolution;

      // Determine if this player is being waited on (concurrent, single, or JSN sub-chain)
      const isWaitingForYou = pending.jsnSubResolution
        ? pending.jsnSubResolution.waitingForPlayerId === actualPlayerId
        : (pending.type === "reaction_window" &&
           (pending.waitingForPlayerId === actualPlayerId ||
            pending.waitingForPlayerIds?.includes(actualPlayerId)));

      // Use JSN sub-resolution deadline if this player is in a JSN counter-chain
      const deadline = pending.jsnSubResolution
        ? (pending.jsnSubResolution.deadline ?? Date.now() + 7000)
        : (pending.type === "reaction_window"
            ? (pending.deadline ?? Date.now() + 7000)
            : Date.now() + 7000);

      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setReactionRemainingSeconds(remaining);

        if (
          isWaitingForYou &&
          remaining > 0 &&
          remaining <= 3 &&
          lastAlertSecondRef.current !== remaining
        ) {
          lastAlertSecondRef.current = remaining;
          playTimerWarningSound();
        }

        if (remaining <= 0 && isWaitingForYou && !hasAutoPassedReactionRef.current) {
          hasAutoPassedReactionRef.current = true;
          sendCommand({
            type: "submit_reaction",
            playerId: actualPlayerId,
            action: "pass",
          } as GameCommand);
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 200);
      return () => clearInterval(interval);
    } else {
      setReactionRemainingSeconds(null);
      hasAutoPassedReactionRef.current = false;
      lastAlertSecondRef.current = null;
    }
  }, [pendingResolution, actualPlayerId, sendCommand]);

  return reactionRemainingSeconds;
}
