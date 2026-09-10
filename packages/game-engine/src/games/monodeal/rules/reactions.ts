import type { GameState, PropertySet, CardInstance, ReactionResolution } from "../types/state.js";
import { GameEngineError } from "../types/errors.js";
import { createNewPropertySet } from "./property.js";
import { COLOR_CONFIG } from "@dealopoly/shared";
import type {
  ReactionSubmittedEvent,
  ActionCancelledEvent,
  ActionResolvedEvent,
  GameEvent,
} from "../types/events.js";

// ==========================================
// JSN Sub-resolution handler
// ==========================================

/**
 * Handle a command targeted at an active jsnSubResolution.
 * This is a 1v1 JSN counter-chain between the initiator and a specific target.
 * When the chain resolves, the result is merged back into the parent resolution.
 */
function handleJsnSubResolution(
  state: GameState,
  playerId: string,
  action: "just_say_no" | "pass" | "extend_timer",
  justSayNoCardInstanceId?: string,
): { nextState: GameState; events: GameEvent[] } {
  // jsnSubResolution only exists on ReactionResolution | PaymentResolution
  const raw = state.pendingResolution!;
  const parent = (raw.type === "reaction_window" || raw.type === "payment") ? raw : null;
  if (!parent) {
    throw new GameEngineError("MUST_RESOLVE_PENDING_ACTION", "No active concurrent resolution for JSN sub-chain");
  }
  const sub = parent.jsnSubResolution!;

  if (playerId !== sub.waitingForPlayerId) {
    throw new GameEngineError(
      "NOT_WAITING_FOR_YOUR_REACTION",
      `JSN chain: waiting for ${sub.waitingForPlayerId}, not ${playerId}`,
    );
  }

  const player = state.players[playerId];
  if (!player) {
    throw new GameEngineError("NOT_YOUR_TURN", "Player not found");
  }

  const events: GameEvent[] = [];

  // +5s time extension
  if (action === "extend_timer") {
    if (sub.canExtend === false) {
      throw new GameEngineError("TIME_EXTENSION_ALREADY_USED", "Time extension already used for this JSN chain");
    }
    const currentDeadline = sub.deadline ?? Date.now() + 7000;
    const newDeadline = currentDeadline + 5000;
    const extendEvent: ReactionSubmittedEvent = {
      id: `event-${Date.now()}-extend`,
      timestamp: Date.now(),
      type: "reaction_submitted",
      playerId,
      passed: false,
      message: `${player.name} extended JSN chain time (+5s).`,
    };
    events.push(extendEvent);
    return {
      nextState: {
        ...state,
        pendingResolution: {
          ...parent,
          jsnSubResolution: {
            ...sub,
            deadline: newDeadline,
            canExtend: false,
          },
        },
        history: [...state.history, extendEvent],
      },
      events,
    };
  }

  // Just Say No played in the counter-chain
  if (action === "just_say_no") {
    if (!justSayNoCardInstanceId) {
      throw new GameEngineError("CARD_NOT_IN_HAND", "Must provide card instance ID for Just Say No");
    }
    const cardIndex = player.hand.findIndex((c) => c.instanceId === justSayNoCardInstanceId);
    if (cardIndex === -1) {
      throw new GameEngineError("CARD_NOT_IN_HAND", "Just Say No card not in hand");
    }
    const jsnCard = player.hand[cardIndex]!;
    if (jsnCard.defId !== "action-just-say-no") {
      throw new GameEngineError("INVALID_CARD_TYPE", "Specified card is not a Just Say No card");
    }

    const updatedHand = player.hand.filter((_, idx) => idx !== cardIndex);
    const chainCount = sub.justSayNoChainCount + 1;
    const nextWaitingPlayerId =
      playerId === sub.targetPlayerId ? sub.initiatorPlayerId : sub.targetPlayerId;

    const jsnEvent: ReactionSubmittedEvent = {
      id: `event-${Date.now()}-jsn`,
      timestamp: Date.now(),
      type: "reaction_submitted",
      playerId,
      passed: false,
      justSayNoCard: jsnCard,
      message: `${player.name} played JUST SAY NO!`,
    };
    events.push(jsnEvent);

    return {
      nextState: {
        ...state,
        players: {
          ...state.players,
          [playerId]: { ...player, hand: updatedHand },
        },
        discardPile: [...state.discardPile, jsnCard],
        pendingResolution: {
          ...parent,
          jsnSubResolution: {
            ...sub,
            waitingForPlayerId: nextWaitingPlayerId,
            justSayNoChainCount: chainCount,
            deadline: Date.now() + 7000,
            durationMs: 7000,
            canExtend: true,
          },
        },
        history: [...state.history, jsnEvent],
      },
      events,
    };
  }

  // "pass" in the JSN counter-chain
  const passEvent: ReactionSubmittedEvent = {
    id: `event-${Date.now()}-pass-jsn`,
    timestamp: Date.now(),
    type: "reaction_submitted",
    playerId,
    passed: true,
    message: `${player.name} passed on JSN counter.`,
  };
  events.push(passEvent);

  // The person whose outcome is determined is the one who played JSN (initiator of the sub-chain)
  const jsnPlayerId = sub.initiatorPlayerId;
  const isBlocked = sub.justSayNoChainCount % 2 === 1;

  if (parent.type === "reaction_window") {
    // Concurrent parent: resolve the JSN chain back into the concurrent flow
    // (jsnSubResolution only exists on concurrent reactions, even if waitingForPlayerIds is empty)
    return resolveJsnBackToConcurrentReaction(state, parent, jsnPlayerId, isBlocked, events);
  }

  if (parent.type === "payment") {
    // JSN during payment: resolve back into the concurrent payment flow
    return resolveJsnBackToConcurrentPayment(state, parent, jsnPlayerId, isBlocked, events);
  }

  // Fallback: shouldn't reach here
  throw new GameEngineError("UNKNOWN_ERROR", "JSN sub-resolution parent is not a concurrent reaction or payment");
}

/**
 * After a JSN chain resolves within a concurrent reaction_window,
 * merge the result back: if blocked, remove that target from debtors;
 * if not blocked, mark them as "passed".
 */
function resolveJsnBackToConcurrentReaction(
  state: GameState,
  parent: ReactionResolution,
  jsnPlayerId: string,
  isBlocked: boolean,
  events: GameEvent[],
): { nextState: GameState; events: GameEvent[] } {
  if (isBlocked) {
    const cancelEvent: ActionCancelledEvent = {
      id: `event-${Date.now()}-cancelled`,
      timestamp: Date.now(),
      type: "action_cancelled",
      actionCard: parent.actionCard,
      cancelledByPlayerId: jsnPlayerId,
      message: `${parent.actionCard.name} was blocked for ${state.players[jsnPlayerId]?.name}!`,
    };
    events.push(cancelEvent);
  }

  // Update responses and remove the JSN player from waitingForPlayerIds
  const responses = { ...(parent.responses || {}) };
  const waitingIds = (parent.waitingForPlayerIds || []).filter((id) => id !== jsnPlayerId);

  if (isBlocked) {
    responses[jsnPlayerId] = "just_say_no";
  } else {
    responses[jsnPlayerId] = "pass";
  }

  // Remove jsnSubResolution now that it's resolved
  const updatedParent: ReactionResolution = {
    ...parent,
    waitingForPlayerIds: waitingIds.length > 0 ? waitingIds : undefined,
    responses,
    jsnSubResolution: undefined,
  };

  // If all concurrent players have responded, transition to next phase
  if (waitingIds.length === 0) {
    return finishConcurrentReaction(state, updatedParent, events);
  }

  return {
    nextState: {
      ...state,
      pendingResolution: updatedParent,
      history: [...state.history, ...events],
    },
    events,
  };
}

/**
 * After a JSN chain resolves within a concurrent payment,
 * merge the result back: if blocked, remove that debtor; if not blocked, they still owe.
 */
function resolveJsnBackToConcurrentPayment(
  state: GameState,
  parent: Extract<GameState["pendingResolution"], { type: "payment" }>,
  jsnPlayerId: string,
  isBlocked: boolean,
  events: GameEvent[],
): { nextState: GameState; events: GameEvent[] } {
  if (isBlocked) {
    const cancelEvent: ActionCancelledEvent = {
      id: `event-${Date.now()}-cancelled`,
      timestamp: Date.now(),
      type: "action_cancelled",
      actionCard: parent.actionCard ?? { instanceId: "inst-payment", defId: "payment-obligation", name: parent.reason, type: "action", value: 0 },
      cancelledByPlayerId: jsnPlayerId,
      message: `Payment was blocked by ${state.players[jsnPlayerId]?.name}!`,
    };
    events.push(cancelEvent);
  }

  const paidDebtorIds = [...(parent.paidDebtorIds || [])];
  const debtorPlayerIds = [...(parent.debtorPlayerIds || [parent.debtorPlayerId])];

  if (isBlocked) {
    // Remove this debtor entirely — they're off the hook
    const remainingDebtors = debtorPlayerIds.filter((id) => id !== jsnPlayerId);
    if (remainingDebtors.length === 0) {
      // All debtors blocked or paid — resolution complete
      return {
        nextState: {
          ...state,
          pendingResolution: null,
          history: [...state.history, ...events],
        },
        events,
      };
    }
    return {
      nextState: {
        ...state,
        pendingResolution: {
          ...parent,
          debtorPlayerIds: remainingDebtors,
          debtorPlayerId: remainingDebtors[0]!,
          remainingDebtors: remainingDebtors.slice(1),
          paidDebtorIds,
          jsnSubResolution: undefined,
        },
        history: [...state.history, ...events],
      },
      events,
    };
  }

  // Not blocked — debtor still owes, JSN chain just delayed them
  // Mark them as having "paid" the JSN phase so they can now submit actual payment
  return {
    nextState: {
      ...state,
      pendingResolution: {
        ...parent,
        jsnSubResolution: undefined,
      },
      history: [...state.history, ...events],
    },
    events,
  };
}

/**
 * When all concurrent reaction responses are collected, determine the outcome:
 * - If rent/birthday: transition to payment for all targets who passed
 * - If other action types (shouldn't normally be concurrent): execute resolution
 */
function finishConcurrentReaction(
  state: GameState,
  parent: ReactionResolution,
  events: GameEvent[],
): { nextState: GameState; events: GameEvent[] } {
  const responses = parent.responses || {};
  const passedTargetIds = Object.entries(responses)
    .filter(([, v]) => v === "pass")
    .map(([k]) => k);

  // For rent/birthday: create payment for all passed targets
  if (parent.rentAmount && passedTargetIds.length > 0) {
    const resolvedEvent: ActionResolvedEvent = {
      id: `event-${Date.now()}-resolved`,
      timestamp: Date.now(),
      type: "action_resolved",
      actionCard: parent.actionCard,
      message: `${parent.actionCard.name} resolved against ${passedTargetIds.length} player(s).`,
    };
    events.push(resolvedEvent);

    return {
      nextState: {
        ...state,
        pendingResolution: {
          type: "payment",
          creditorPlayerId: parent.initiatorPlayerId,
          debtorPlayerId: passedTargetIds[0]!,
          debtorPlayerIds: passedTargetIds,
          amountDue: parent.rentAmount,
          remainingDebtors: passedTargetIds.slice(1),
          reason: `${parent.actionCard.name} ($${parent.rentAmount}M)`,
          actionCard: parent.actionCard,
          paidDebtorIds: [],
        },
        history: [...state.history, ...events],
      },
      events,
    };
  }

  // All targets blocked or no rent — action is done
  if (passedTargetIds.length === 0) {
    return {
      nextState: {
        ...state,
        pendingResolution: null,
        history: [...state.history, ...events],
      },
      events,
    };
  }

  // For non-rent concurrent actions (shouldn't normally happen, but handle gracefully)
  return {
    nextState: {
      ...state,
      pendingResolution: null,
      history: [...state.history, ...events],
    },
    events,
  };
}

// ==========================================
// Main reaction handler
// ==========================================

export function handleReaction(
  state: GameState,
  playerId: string,
  action: "just_say_no" | "pass" | "extend_timer",
  justSayNoCardInstanceId?: string,
): { nextState: GameState; events: GameEvent[] } {
  if (!state.pendingResolution) {
    throw new GameEngineError("MUST_RESOLVE_PENDING_ACTION", "No active reaction window");
  }

  // If a JSN sub-resolution is active, delegate to the sub-resolution handler
  const parent = state.pendingResolution;
  if (parent.type === "reaction_window" && parent.jsnSubResolution) {
    return handleJsnSubResolution(state, playerId, action, justSayNoCardInstanceId);
  }
  if (parent.type === "payment" && parent.jsnSubResolution) {
    return handleJsnSubResolution(state, playerId, action, justSayNoCardInstanceId);
  }

  if (parent.type !== "reaction_window") {
    throw new GameEngineError("MUST_RESOLVE_PENDING_ACTION", "No active reaction window");
  }

  const reaction = parent;

  // ==========================================
  // CONCURRENT MULTI-TARGET PATH
  // ==========================================
  if (reaction.waitingForPlayerIds && reaction.waitingForPlayerIds.length > 0) {
    if (!reaction.waitingForPlayerIds.includes(playerId)) {
      throw new GameEngineError(
        "NOT_WAITING_FOR_YOUR_REACTION",
        `Waiting for players ${reaction.waitingForPlayerIds.join(", ")}, not ${playerId}`,
      );
    }

    const player = state.players[playerId];
    if (!player) {
      throw new GameEngineError("NOT_YOUR_TURN", "Player not found");
    }

    const events: GameEvent[] = [];

    // +5s time extension (extends the shared deadline for everyone)
    if (action === "extend_timer") {
      if (reaction.canExtend === false) {
        throw new GameEngineError("TIME_EXTENSION_ALREADY_USED", "Time extension already used");
      }
      const currentDeadline = reaction.deadline ?? Date.now() + 7000;
      const newDeadline = currentDeadline + 5000;
      const extendEvent: ReactionSubmittedEvent = {
        id: `event-${Date.now()}-extend`,
        timestamp: Date.now(),
        type: "reaction_submitted",
        playerId,
        passed: false,
        message: `${player.name} extended reaction time (+5s).`,
      };
      events.push(extendEvent);
      return {
        nextState: {
          ...state,
          pendingResolution: {
            ...reaction,
            deadline: newDeadline,
            canExtend: false,
          },
          history: [...state.history, extendEvent],
        },
        events,
      };
    }

    // Just Say No in concurrent mode: create a JSN sub-resolution
    if (action === "just_say_no") {
      if (!justSayNoCardInstanceId) {
        throw new GameEngineError("CARD_NOT_IN_HAND", "Must provide card instance ID for Just Say No");
      }
      const cardIndex = player.hand.findIndex((c) => c.instanceId === justSayNoCardInstanceId);
      if (cardIndex === -1) {
        throw new GameEngineError("CARD_NOT_IN_HAND", "Just Say No card not in hand");
      }
      const jsnCard = player.hand[cardIndex]!;
      if (jsnCard.defId !== "action-just-say-no") {
        throw new GameEngineError("INVALID_CARD_TYPE", "Specified card is not a Just Say No card");
      }

      const updatedHand = player.hand.filter((_, idx) => idx !== cardIndex);
      const jsnEvent: ReactionSubmittedEvent = {
        id: `event-${Date.now()}-jsn`,
        timestamp: Date.now(),
        type: "reaction_submitted",
        playerId,
        passed: false,
        justSayNoCard: jsnCard,
        message: `${player.name} played JUST SAY NO!`,
      };
      events.push(jsnEvent);

      // Create JSN sub-resolution: 1v1 between initiator and this target
      const jsnSub: ReactionResolution = {
        type: "reaction_window",
        initiatorPlayerId: playerId, // the target who played JSN
        targetPlayerId: reaction.initiatorPlayerId, // the initiator who must counter
        actionCard: reaction.actionCard,
        rentAmount: reaction.rentAmount,
        doubleRent: reaction.doubleRent,
        waitingForPlayerId: reaction.initiatorPlayerId, // initiator gets first chance to counter
        justSayNoChainCount: 1,
        isCancelled: false,
        deadline: Date.now() + 7000,
        durationMs: 7000,
        canExtend: true,
      };

      // Remove this player from active waiting (they're in the JSN sub-dialog now)
      const remainingWaiting = reaction.waitingForPlayerIds.filter((id) => id !== playerId);

      return {
        nextState: {
          ...state,
          players: {
            ...state.players,
            [playerId]: { ...player, hand: updatedHand },
          },
          discardPile: [...state.discardPile, jsnCard],
          pendingResolution: {
            ...reaction,
            waitingForPlayerIds: remainingWaiting.length > 0 ? remainingWaiting : undefined,
            jsnSubResolution: jsnSub,
          },
          history: [...state.history, jsnEvent],
        },
        events,
      };
    }

    // "pass" in concurrent mode
    const passEvent: ReactionSubmittedEvent = {
      id: `event-${Date.now()}-pass`,
      timestamp: Date.now(),
      type: "reaction_submitted",
      playerId,
      passed: true,
      message: `${player.name} passed on reaction.`,
    };
    events.push(passEvent);

    // Record response and remove from waiting list
    const responses = { ...(reaction.responses || {}), [playerId]: "pass" as const };
    const remainingWaiting = reaction.waitingForPlayerIds.filter((id) => id !== playerId);

    const updatedReaction: ReactionResolution = {
      ...reaction,
      waitingForPlayerIds: remainingWaiting.length > 0 ? remainingWaiting : undefined,
      responses,
    };

    // If all concurrent players have responded, transition to payment
    if (remainingWaiting.length === 0) {
      return finishConcurrentReaction(state, updatedReaction, events);
    }

    return {
      nextState: {
        ...state,
        pendingResolution: updatedReaction,
        history: [...state.history, passEvent],
      },
      events,
    };
  }

  // ==========================================
  // SINGLE-TARGET PATH (existing logic)
  // ==========================================
  if (playerId !== reaction.waitingForPlayerId) {
    throw new GameEngineError(
      "NOT_WAITING_FOR_YOUR_REACTION",
      `Waiting for player ${reaction.waitingForPlayerId}, not ${playerId}`,
    );
  }

  const player = state.players[playerId];
  if (!player) {
    throw new GameEngineError("NOT_YOUR_TURN", "Player not found");
  }

  const events: GameEvent[] = [];

  // Handle +5s time extension
  if (action === "extend_timer") {
    if (reaction.canExtend === false) {
      throw new GameEngineError("TIME_EXTENSION_ALREADY_USED", "Time extension already used for this reaction window");
    }

    const currentDeadline = reaction.deadline ?? Date.now() + 7000;
    const newDeadline = currentDeadline + 5000;

    const extendEvent: ReactionSubmittedEvent = {
      id: `event-${Date.now()}-extend`,
      timestamp: Date.now(),
      type: "reaction_submitted",
      playerId,
      passed: false,
      message: `${player.name} extended reaction time (+5s).`,
    };
    events.push(extendEvent);

    const nextState: GameState = {
      ...state,
      pendingResolution: {
        ...reaction,
        deadline: newDeadline,
        canExtend: false,
      },
      history: [...state.history, extendEvent],
    };

    return { nextState, events };
  }

  if (action === "just_say_no") {
    if (!justSayNoCardInstanceId) {
      throw new GameEngineError("CARD_NOT_IN_HAND", "Must provide card instance ID for Just Say No");
    }
    const cardIndex = player.hand.findIndex((c) => c.instanceId === justSayNoCardInstanceId);
    if (cardIndex === -1) {
      throw new GameEngineError("CARD_NOT_IN_HAND", "Just Say No card not in hand");
    }
    const jsnCard = player.hand[cardIndex]!;
    if (jsnCard.defId !== "action-just-say-no") {
      throw new GameEngineError("INVALID_CARD_TYPE", "Specified card is not a Just Say No card");
    }

    const updatedHand = player.hand.filter((_, idx) => idx !== cardIndex);
    const chainCount = reaction.justSayNoChainCount + 1;

    // Switch waiting player
    const nextWaitingPlayerId =
      playerId === reaction.targetPlayerId
        ? reaction.initiatorPlayerId
        : reaction.targetPlayerId;

    const jsnEvent: ReactionSubmittedEvent = {
      id: `event-${Date.now()}-jsn`,
      timestamp: Date.now(),
      type: "reaction_submitted",
      playerId,
      passed: false,
      justSayNoCard: jsnCard,
      message: `${player.name} played JUST SAY NO!`,
    };
    events.push(jsnEvent);

    const nextState: GameState = {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          hand: updatedHand,
        },
      },
      discardPile: [...state.discardPile, jsnCard],
      pendingResolution: {
        ...reaction,
        waitingForPlayerId: nextWaitingPlayerId,
        justSayNoChainCount: chainCount,
        deadline: Date.now() + 7000,
        durationMs: 7000,
        canExtend: true,
      },
      history: [...state.history, jsnEvent],
    };

    return { nextState, events };
  }

  // Action is "pass"
  const passEvent: ReactionSubmittedEvent = {
    id: `event-${Date.now()}-pass`,
    timestamp: Date.now(),
    type: "reaction_submitted",
    playerId,
    passed: true,
    message: `${player.name} passed on reaction.`,
  };
  events.push(passEvent);

  const isActionBlocked = reaction.justSayNoChainCount % 2 === 1;

  if (isActionBlocked) {
    // Action was blocked by Just Say No for this target
    const cancelEvent: ActionCancelledEvent = {
      id: `event-${Date.now()}-cancelled`,
      timestamp: Date.now(),
      type: "action_cancelled",
      actionCard: reaction.actionCard,
      cancelledByPlayerId: reaction.targetPlayerId,
      message: `${reaction.actionCard.name} was successfully blocked by ${
        state.players[reaction.targetPlayerId]?.name
      }!`,
    };
    events.push(cancelEvent);

    // If multi-target exists (old sequential flow), move to next target
    if (reaction.remainingTargets && reaction.remainingTargets.length > 0) {
      const nextTargetId = reaction.remainingTargets[0]!;
      const remaining = reaction.remainingTargets.slice(1);

      const nextPending: GameState["pendingResolution"] = {
        ...reaction,
        targetPlayerId: nextTargetId,
        waitingForPlayerId: nextTargetId,
        justSayNoChainCount: 0,
        remainingTargets: remaining,
        deadline: Date.now() + 7000,
        durationMs: 7000,
        canExtend: true,
      };

      return {
        nextState: {
          ...state,
          pendingResolution: nextPending,
          history: [...state.history, ...events],
        },
        events,
      };
    }

    // No more remaining targets — check if earlier targets passed and still need to pay
    const passedTargets = reaction.passedTargetIds || [];
    if (passedTargets.length > 0 && reaction.rentAmount) {
      return {
        nextState: {
          ...state,
          pendingResolution: {
            type: "payment",
            creditorPlayerId: reaction.initiatorPlayerId,
            debtorPlayerId: passedTargets[0]!,
            debtorPlayerIds: passedTargets,
            amountDue: reaction.rentAmount,
            remainingDebtors: passedTargets.slice(1),
            reason: `${reaction.actionCard.name} ($${reaction.rentAmount}M)`,
            actionCard: reaction.actionCard,
            paidDebtorIds: [],
          },
          history: [...state.history, ...events],
        },
        events,
      };
    }

    return {
      nextState: {
        ...state,
        pendingResolution: null,
        history: [...state.history, ...events],
      },
      events,
    };
  }

  // Action is NOT blocked -> target passed, action applies to them
  const allPassedTargets = [...(reaction.passedTargetIds || []), reaction.targetPlayerId];

  // If multi-target exists (old sequential flow), move to next target's reaction window before resolving
  if (reaction.remainingTargets && reaction.remainingTargets.length > 0) {
    const nextTargetId = reaction.remainingTargets[0]!;
    const remaining = reaction.remainingTargets.slice(1);

    const nextPending: GameState["pendingResolution"] = {
      ...reaction,
      targetPlayerId: nextTargetId,
      waitingForPlayerId: nextTargetId,
      justSayNoChainCount: 0,
      remainingTargets: remaining,
      passedTargetIds: allPassedTargets,
      deadline: Date.now() + 7000,
      durationMs: 7000,
      canExtend: true,
    };

    return {
      nextState: {
        ...state,
        pendingResolution: nextPending,
        history: [...state.history, ...events],
      },
      events,
    };
  }

  // All targets processed — execute original effect
  const resolvedEvent: ActionResolvedEvent = {
    id: `event-${Date.now()}-resolved`,
    timestamp: Date.now(),
    type: "action_resolved",
    actionCard: reaction.actionCard,
    message: `${reaction.actionCard.name} resolved successfully against ${
      state.players[reaction.targetPlayerId]?.name
    }.`,
  };
  events.push(resolvedEvent);

  const nextPendingState: GameState = {
    ...state,
    pendingResolution: null,
  };

  // Execute resolution by action type
  if (reaction.rentAmount) {
    nextPendingState.pendingResolution = {
      type: "payment",
      creditorPlayerId: reaction.initiatorPlayerId,
      debtorPlayerId: allPassedTargets[0]!,
      debtorPlayerIds: allPassedTargets,
      amountDue: reaction.rentAmount,
      remainingDebtors: allPassedTargets.slice(1),
      reason: `${reaction.actionCard.name} ($${reaction.rentAmount}M)`,
      actionCard: reaction.actionCard,
      paidDebtorIds: [],
    };
  } else if (reaction.actionCard.defId === "action-deal-breaker") {
    // Steal full set
    const targetPlayer = state.players[reaction.targetPlayerId]!;
    const initiator = state.players[reaction.initiatorPlayerId]!;
    const targetSet = targetPlayer.propertySets.find((s) => s.setId === reaction.targetPropertySetId);

    if (targetSet) {
      const stolenCards = [...targetSet.cards];
      if (targetSet.houseCard) stolenCards.push(targetSet.houseCard);
      if (targetSet.hotelCard) stolenCards.push(targetSet.hotelCard);
      resolvedEvent.stolenCards = stolenCards;
      resolvedEvent.initiatorPlayerId = reaction.initiatorPlayerId;
      resolvedEvent.targetPlayerId = reaction.targetPlayerId;

      const remainingSets = targetPlayer.propertySets.filter((s) => s.setId !== reaction.targetPropertySetId);
      const newSets = [...initiator.propertySets, targetSet];

      nextPendingState.players = {
        ...nextPendingState.players,
        [reaction.targetPlayerId]: { ...targetPlayer, propertySets: remainingSets },
        [reaction.initiatorPlayerId]: { ...initiator, propertySets: newSets },
      };
    }
  } else if (reaction.actionCard.defId === "action-sly-deal") {
    // Steal single card
    const targetPlayer = state.players[reaction.targetPlayerId]!;
    const initiator = state.players[reaction.initiatorPlayerId]!;
    const setWithCard = targetPlayer.propertySets.find((s) =>
      s.cards.some((c) => c.instanceId === reaction.targetCardInstanceId) ||
      s.houseCard?.instanceId === reaction.targetCardInstanceId ||
      s.hotelCard?.instanceId === reaction.targetCardInstanceId
    );

    if (setWithCard) {
      let stolenCard: CardInstance;
      let setRemainingCards = setWithCard.cards;
      let keptHouse = setWithCard.houseCard;
      let keptHotel = setWithCard.hotelCard;

      if (setWithCard.houseCard?.instanceId === reaction.targetCardInstanceId) {
          stolenCard = setWithCard.houseCard!;
          keptHouse = undefined;
      } else if (setWithCard.hotelCard?.instanceId === reaction.targetCardInstanceId) {
          stolenCard = setWithCard.hotelCard!;
          keptHotel = undefined;
      } else {
          stolenCard = setWithCard.cards.find((c) => c.instanceId === reaction.targetCardInstanceId)!;
          setRemainingCards = setWithCard.cards.filter((c) => c.instanceId !== reaction.targetCardInstanceId);
      }

      resolvedEvent.stolenCards = [stolenCard];
      resolvedEvent.initiatorPlayerId = reaction.initiatorPlayerId;
      resolvedEvent.targetPlayerId = reaction.targetPlayerId;

      let opponentSets = [...targetPlayer.propertySets];
      if (setRemainingCards.length === 0 && !keptHouse && !keptHotel) {
        opponentSets = opponentSets.filter((s) => s.setId !== setWithCard.setId);
      } else {
        const idx = opponentSets.findIndex((s) => s.setId === setWithCard.setId);
        opponentSets[idx] = {
          ...setWithCard,
          cards: setRemainingCards,
          isComplete: setRemainingCards.length >= setWithCard.setSize,
          hasHouse: !!keptHouse,
          hasHotel: !!keptHotel,
          houseCard: keptHouse,
          hotelCard: keptHotel,
        };
      }

      const pSets = [...initiator.propertySets];
      if (stolenCard.type === "action") {
          initiator.bank.push(stolenCard);
      } else {
          const color = stolenCard.currentColor ?? stolenCard.primaryColor ?? "brown";
          const mIdx = pSets.findIndex((s) => s.color === color && !s.isComplete);

          if (mIdx !== -1) {
            const targetSet = pSets[mIdx]!;
            const config = COLOR_CONFIG[color];
            const setSize = config?.setSize ?? targetSet.setSize;
            pSets[mIdx] = {
              ...targetSet,
              cards: [...targetSet.cards, stolenCard],
              isComplete: targetSet.cards.length + 1 >= setSize,
              setSize,
              rentTiers: config?.rentTiers ?? targetSet.rentTiers,
            };
          } else {
            pSets.push(createNewPropertySet(color, stolenCard));
          }
      }

      nextPendingState.players = {
        ...nextPendingState.players,
        [reaction.targetPlayerId]: { ...targetPlayer, propertySets: opponentSets },
        [reaction.initiatorPlayerId]: { ...initiator, propertySets: pSets },
      };
    }
  } else if (reaction.actionCard.defId === "action-force-deal" || reaction.actionCard.defId === "action-forced-deal") {
    // Swap cards
    const targetPlayer = state.players[reaction.targetPlayerId]!;
    const initiator = state.players[reaction.initiatorPlayerId]!;
    const offeredSet = initiator.propertySets.find((s) =>
      s.cards.some((c) => c.instanceId === reaction.swappedCardInstanceId) ||
      s.houseCard?.instanceId === reaction.swappedCardInstanceId ||
      s.hotelCard?.instanceId === reaction.swappedCardInstanceId
    );
    const targetSet = targetPlayer.propertySets.find((s) =>
      s.cards.some((c) => c.instanceId === reaction.targetCardInstanceId) ||
      s.houseCard?.instanceId === reaction.targetCardInstanceId ||
      s.hotelCard?.instanceId === reaction.targetCardInstanceId
    );

    if (offeredSet && targetSet) {
      let offeredCard: CardInstance;
      let offeredRemainingCards = offeredSet.cards;
      let keptOfferedHouse = offeredSet.houseCard;
      let keptOfferedHotel = offeredSet.hotelCard;

      if (offeredSet.houseCard?.instanceId === reaction.swappedCardInstanceId) {
          offeredCard = offeredSet.houseCard!;
          keptOfferedHouse = undefined;
      } else if (offeredSet.hotelCard?.instanceId === reaction.swappedCardInstanceId) {
          offeredCard = offeredSet.hotelCard!;
          keptOfferedHotel = undefined;
      } else {
          offeredCard = offeredSet.cards.find((c) => c.instanceId === reaction.swappedCardInstanceId)!;
          offeredRemainingCards = offeredSet.cards.filter((c) => c.instanceId !== reaction.swappedCardInstanceId);
      }

      let targetCard: CardInstance;
      let targetRemainingCards = targetSet.cards;
      let keptTargetHouse = targetSet.houseCard;
      let keptTargetHotel = targetSet.hotelCard;

      if (targetSet.houseCard?.instanceId === reaction.targetCardInstanceId) {
          targetCard = targetSet.houseCard!;
          keptTargetHouse = undefined;
      } else if (targetSet.hotelCard?.instanceId === reaction.targetCardInstanceId) {
          targetCard = targetSet.hotelCard!;
          keptTargetHotel = undefined;
      } else {
          targetCard = targetSet.cards.find((c) => c.instanceId === reaction.targetCardInstanceId)!;
          targetRemainingCards = targetSet.cards.filter((c) => c.instanceId !== reaction.targetCardInstanceId);
      }

      resolvedEvent.stolenCards = [targetCard];
      resolvedEvent.swappedCard = offeredCard;
      resolvedEvent.initiatorPlayerId = reaction.initiatorPlayerId;
      resolvedEvent.targetPlayerId = reaction.targetPlayerId;

      const newPlayerSets = initiator.propertySets
        .map((s) => {
          if (s.setId === offeredSet.setId) {
            if (offeredRemainingCards.length === 0 && !keptOfferedHouse && !keptOfferedHotel) return null;
            return {
                ...s,
                cards: offeredRemainingCards,
                isComplete: offeredRemainingCards.length >= s.setSize,
                hasHouse: !!keptOfferedHouse,
                hasHotel: !!keptOfferedHotel,
                houseCard: keptOfferedHouse,
                hotelCard: keptOfferedHotel,
            };
          }
          return s;
        })
        .filter(Boolean) as PropertySet[];

      const newOpponentSets = targetPlayer.propertySets
        .map((s) => {
          if (s.setId === targetSet.setId) {
            if (targetRemainingCards.length === 0 && !keptTargetHouse && !keptTargetHotel) return null;
            return {
                ...s,
                cards: targetRemainingCards,
                isComplete: targetRemainingCards.length >= s.setSize,
                hasHouse: !!keptTargetHouse,
                hasHotel: !!keptTargetHotel,
                houseCard: keptTargetHouse,
                hotelCard: keptTargetHotel,
            };
          }
          return s;
        })
        .filter(Boolean) as PropertySet[];

      if (targetCard.type === "action") {
          initiator.bank.push(targetCard);
      } else {
          const pColor = targetCard.currentColor ?? targetCard.primaryColor ?? "brown";
          const pIdx = newPlayerSets.findIndex((s) => s.color === pColor && !s.isComplete);
          if (pIdx !== -1) {
            const targetSet = newPlayerSets[pIdx]!;
            const config = COLOR_CONFIG[pColor];
            const setSize = config?.setSize ?? targetSet.setSize;
            newPlayerSets[pIdx] = {
              ...targetSet,
              cards: [...targetSet.cards, targetCard],
              isComplete: targetSet.cards.length + 1 >= setSize,
              setSize,
              rentTiers: config?.rentTiers ?? targetSet.rentTiers,
            };
          } else {
            newPlayerSets.push(createNewPropertySet(pColor, targetCard));
          }
      }

      if (offeredCard.type === "action") {
          targetPlayer.bank.push(offeredCard);
      } else {
          const oColor = offeredCard.currentColor ?? offeredCard.primaryColor ?? "brown";
          const oIdx = newOpponentSets.findIndex((s) => s.color === oColor && !s.isComplete);
          if (oIdx !== -1) {
            const targetSet = newOpponentSets[oIdx]!;
            const config = COLOR_CONFIG[oColor];
            const setSize = config?.setSize ?? targetSet.setSize;
            newOpponentSets[oIdx] = {
              ...targetSet,
              cards: [...targetSet.cards, offeredCard],
              isComplete: targetSet.cards.length + 1 >= setSize,
              setSize,
              rentTiers: config?.rentTiers ?? targetSet.rentTiers,
            };
          } else {
            newOpponentSets.push(createNewPropertySet(oColor, offeredCard));
          }
      }

      nextPendingState.players = {
        ...nextPendingState.players,
        [reaction.initiatorPlayerId]: { ...initiator, propertySets: newPlayerSets },
        [reaction.targetPlayerId]: { ...targetPlayer, propertySets: newOpponentSets },
      };
    }
  }

  return {
    nextState: {
      ...nextPendingState,
      history: [...nextPendingState.history, ...events],
    },
    events,
  };
}
