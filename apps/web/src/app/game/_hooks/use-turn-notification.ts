"use client";

import { useEffect, useRef } from "react";
import {
  playYourTurnSound,
  playTimerWarningSound,
  triggerHaptic,
} from "../../../lib/sound-effects";
import type { PendingResolution } from "@dealopoly/game-engine";

/**
 * Plays chime + haptic when it becomes your turn,
 * and a warning sound + haptic when a reaction window targets you.
 */
export function useTurnNotification(
  isYourTurn: boolean,
  gameStatus: string | undefined,
  actualPlayerId: string,
  pendingResolution: PendingResolution | null | undefined,
) {
  // "Your Turn" notification chime and haptic pulse
  const prevIsYourTurnRef = useRef(isYourTurn);
  useEffect(() => {
    if (!prevIsYourTurnRef.current && isYourTurn && gameStatus === "in_progress") {
      playYourTurnSound();
      triggerHaptic("medium");
    }
    prevIsYourTurnRef.current = isYourTurn;
  }, [isYourTurn, gameStatus]);

  // Reaction Window auditory alert when targeted by an action
  const prevWaitingReactionRef = useRef(false);
  useEffect(() => {
    const isWaitingForYou =
      pendingResolution?.type === "reaction_window" &&
      pendingResolution.waitingForPlayerId === actualPlayerId;

    if (!prevWaitingReactionRef.current && isWaitingForYou) {
      playTimerWarningSound();
      triggerHaptic("warning");
    }
    prevWaitingReactionRef.current = Boolean(isWaitingForYou);
  }, [pendingResolution, actualPlayerId]);
}
