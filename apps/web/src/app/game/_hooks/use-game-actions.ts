"use client";

import { useState, useEffect, useCallback } from "react";
import type { CardColor } from "@dealopoly/shared";
import type { CardInstance, PropertySet, MaskedGameState, GameCommand } from "@dealopoly/game-engine";
import type { TargetingActionState } from "../_components/types";
import { playCardSlam, playCoinChime, triggerHaptic } from "../../../lib/sound-effects";

interface PendingConfirmAction {
  card: CardInstance;
  targetPlayerId?: string;
  targetSetId?: string;
  targetCardInstanceId?: string;
  offeredCardInstanceId?: string;
}

interface UseGameActionsParams {
  gameState: MaskedGameState | null;
  actualPlayerId: string;
  isYourTurn: boolean;
  sendCommand: (cmd: GameCommand) => void;
  setSelectedCard: (card: CardInstance | null) => void;
  confirmPlayAction: boolean;
  autoPassTimer: boolean;
}

/**
 * Encapsulates all action-related state and handlers for the game page:
 * targeting, payment, discard, reorganize, move-building, confirm-action,
 * plus the auto-end-turn and clear-selection effects.
 */
export function useGameActions({
  gameState,
  actualPlayerId,
  isYourTurn,
  sendCommand,
  setSelectedCard,
  confirmPlayAction,
  autoPassTimer,
}: UseGameActionsParams) {
  const [targetingAction, setTargetingAction] = useState<TargetingActionState | null>(null);
  const [selectedForcedDealOfferedId, setSelectedForcedDealOfferedId] = useState<string | null>(null);
  const [selectedWildRentColor, setSelectedWildRentColor] = useState<CardColor | null>(null);
  const [paymentSelectedIds, setPaymentSelectedIds] = useState<string[]>([]);
  const [discardSelectedIds, setDiscardSelectedIds] = useState<string[]>([]);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<PendingConfirmAction | null>(null);
  const [reorganizeTarget, setReorganizeTarget] = useState<{
    card: CardInstance;
    fromSet: PropertySet;
  } | null>(null);
  const [moveBuildingTarget, setMoveBuildingTarget] = useState<{
    buildingType: "house" | "hotel";
    fromSet: PropertySet;
  } | null>(null);

  // Clear any active card selection when it is not your turn
  useEffect(() => {
    if (!isYourTurn) {
      setSelectedCard(null);
    }
  }, [isYourTurn, setSelectedCard]);

  // Automatically end turn when player has played all 3 actions and no pending resolution is in flight
  useEffect(() => {
    if (!autoPassTimer) return;
    if (!gameState) return;
    if (gameState.status !== "in_progress") return;

    const isCurrentActive = isYourTurn && gameState.turn?.activePlayerId === actualPlayerId;
    const isActionPhase = gameState.turn?.phase === "action";
    const allActionsUsed = gameState.turn?.actionsRemaining === 0;
    const noPendingAction = !gameState.pendingResolution;

    if (isCurrentActive && isActionPhase && allActionsUsed && noPendingAction) {
      const timer = setTimeout(() => {
        if (
          gameState.status === "in_progress" &&
          gameState.turn?.activePlayerId === actualPlayerId &&
          gameState.turn?.phase === "action" &&
          gameState.turn?.actionsRemaining === 0 &&
          !gameState.pendingResolution
        ) {
          triggerHaptic("light");
          sendCommand({ type: "end_turn", playerId: actualPlayerId } as GameCommand);
          setSelectedCard(null);
        }
      }, 550);

      return () => clearTimeout(timer);
    }
  }, [
    gameState?.status,
    gameState?.turn?.activePlayerId,
    gameState?.turn?.phase,
    gameState?.turn?.actionsRemaining,
    gameState?.pendingResolution,
    isYourTurn,
    actualPlayerId,
    sendCommand,
    setSelectedCard,
    autoPassTimer,
  ]);

  const handleBankCard = useCallback(
    (card: CardInstance) => {
      if (gameState?.pendingResolution) return;
      playCoinChime();
      triggerHaptic("medium");
      sendCommand({ type: "bank_card", playerId: actualPlayerId, cardInstanceId: card.instanceId } as GameCommand);
      setSelectedCard(null);
    },
    [gameState?.pendingResolution, actualPlayerId, sendCommand, setSelectedCard],
  );

  const handlePlayProperty = useCallback(
    (card: CardInstance, chosenColor?: CardColor, targetSetId?: string) => {
      if (gameState?.pendingResolution) return;
      playCardSlam();
      triggerHaptic("medium");
      sendCommand({
        type: "play_property",
        playerId: actualPlayerId,
        cardInstanceId: card.instanceId,
        chosenColor,
        targetSetId,
      } as GameCommand);
      setSelectedCard(null);
    },
    [gameState?.pendingResolution, actualPlayerId, sendCommand, setSelectedCard],
  );

  const executePlayAction = useCallback(
    (
      card: CardInstance,
      targetPlayerId?: string,
      targetSetId?: string,
      targetCardInstanceId?: string,
      offeredCardInstanceId?: string,
    ) => {
      if (gameState?.pendingResolution) return;
      playCardSlam();
      triggerHaptic("medium");
      sendCommand({
        type: "play_action",
        playerId: actualPlayerId,
        cardInstanceId: card.instanceId,
        targetPlayerId,
        targetSetId,
        targetCardInstanceId,
        offeredCardInstanceId,
      } as GameCommand);
      setSelectedCard(null);
      setTargetingAction(null);
      setSelectedForcedDealOfferedId(null);
      setPendingConfirmAction(null);
    },
    [gameState?.pendingResolution, actualPlayerId, sendCommand, setSelectedCard],
  );

  const handlePlayAction = useCallback(
    (
      card: CardInstance,
      targetPlayerId?: string,
      targetSetId?: string,
      targetCardInstanceId?: string,
      offeredCardInstanceId?: string,
    ) => {
      if (gameState?.pendingResolution) return;
      if (confirmPlayAction) {
        setPendingConfirmAction({
          card,
          targetPlayerId,
          targetSetId,
          targetCardInstanceId,
          offeredCardInstanceId,
        });
        return;
      }
      executePlayAction(card, targetPlayerId, targetSetId, targetCardInstanceId, offeredCardInstanceId);
    },
    [gameState?.pendingResolution, confirmPlayAction, executePlayAction],
  );

  const handlePlayRent = useCallback(
    (
      card: CardInstance,
      chosenColor: CardColor,
      targetPlayerId?: string,
      doubleRentCardInstanceId?: string,
    ) => {
      if (gameState?.pendingResolution) return;
      playCardSlam();
      triggerHaptic("medium");
      sendCommand({
        type: "play_rent",
        playerId: actualPlayerId,
        rentCardInstanceId: card.instanceId,
        chosenColor,
        targetPlayerId,
        doubleRentCardInstanceId,
      } as GameCommand);
      setSelectedCard(null);
      setTargetingAction(null);
      setSelectedWildRentColor(null);
    },
    [gameState?.pendingResolution, actualPlayerId, sendCommand, setSelectedCard],
  );

  const handleEndTurn = useCallback(() => {
    if (gameState?.pendingResolution) return;
    triggerHaptic("light");
    sendCommand({ type: "end_turn", playerId: actualPlayerId } as GameCommand);
    setSelectedCard(null);
  }, [gameState?.pendingResolution, actualPlayerId, sendCommand, setSelectedCard]);

  const handleReaction = useCallback(
    (action: "just_say_no" | "pass" | "extend_timer", jsnCardId?: string) => {
      if (action === "just_say_no") {
        playCardSlam();
        triggerHaptic("medium");
      } else {
        triggerHaptic("light");
      }
      sendCommand({
        type: "submit_reaction",
        playerId: actualPlayerId,
        action,
        justSayNoCardInstanceId: jsnCardId,
      } as GameCommand);
    },
    [actualPlayerId, sendCommand],
  );

  const handlePaymentSubmit = useCallback(
    (justSayNoCardInstanceId?: string) => {
      sendCommand({
        type: "submit_payment",
        playerId: actualPlayerId,
        paymentCardInstanceIds: justSayNoCardInstanceId ? [] : paymentSelectedIds,
        justSayNoCardInstanceId,
      } as GameCommand);
      setPaymentSelectedIds([]);
    },
    [actualPlayerId, sendCommand, paymentSelectedIds],
  );

  const handleDiscardSubmit = useCallback(() => {
    triggerHaptic("medium");
    sendCommand({
      type: "discard_cards",
      playerId: actualPlayerId,
      cardInstanceIds: discardSelectedIds,
    } as GameCommand);
    setDiscardSelectedIds([]);
  }, [actualPlayerId, sendCommand, discardSelectedIds]);

  const handleReorganizeWild = useCallback(
    (cardInstanceId: string, fromSetId: string, newColor: CardColor) => {
      sendCommand({
        type: "reorganize_wild",
        playerId: actualPlayerId,
        cardInstanceId,
        fromSetId,
        newColor,
      } as GameCommand);
    },
    [actualPlayerId, sendCommand],
  );

  const handleMoveBuilding = useCallback(
    (buildingType: "house" | "hotel", fromSetId: string, toSetId: string) => {
      sendCommand({
        type: "move_building",
        playerId: actualPlayerId,
        buildingType,
        fromSetId,
        toSetId,
      } as GameCommand);
    },
    [actualPlayerId, sendCommand],
  );

  return {
    // Action UI state
    targetingAction,
    setTargetingAction,
    selectedForcedDealOfferedId,
    setSelectedForcedDealOfferedId,
    selectedWildRentColor,
    setSelectedWildRentColor,
    paymentSelectedIds,
    setPaymentSelectedIds,
    discardSelectedIds,
    setDiscardSelectedIds,
    pendingConfirmAction,
    setPendingConfirmAction,
    reorganizeTarget,
    setReorganizeTarget,
    moveBuildingTarget,
    setMoveBuildingTarget,

    // Action handlers
    handleBankCard,
    handlePlayProperty,
    executePlayAction,
    handlePlayAction,
    handlePlayRent,
    handleEndTurn,
    handleReaction,
    handlePaymentSubmit,
    handleDiscardSubmit,
    handleReorganizeWild,
    handleMoveBuilding,
  };
}
