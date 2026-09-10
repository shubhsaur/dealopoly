import type { GameState } from "./types/state.js";
import type { GameCommand } from "./types/commands.js";
import type { GameEvent } from "./types/events.js";
import { GameEngineError } from "./types/errors.js";

import { drawCardsForActivePlayer } from "./rules/draw.js";
import { playPropertyCard, reorganizeWildCard, moveBuilding } from "./rules/property.js";
import { bankCard, playActionCard } from "./rules/actions.js";
import { playRentCard } from "./rules/rent.js";
import { handleReaction } from "./rules/reactions.js";
import { handlePayment } from "./rules/payment.js";
import { endTurn, discardCards } from "./rules/discard.js";
import { evaluateGameWinner } from "./rules/win-condition.js";

export { createGame } from "./rules/setup.js";

export interface ApplyCommandResult {
  nextState: GameState;
  events: GameEvent[];
}

export function applyCommand(state: GameState, command: GameCommand): ApplyCommandResult {
  if (state.status === "completed") {
    throw new GameEngineError("GAME_ALREADY_COMPLETED", "Game has already concluded");
  }

  // Handle pending resolutions
  if (state.pendingResolution) {
    if (state.pendingResolution.type === "reaction_window") {
      // If a JSN sub-resolution is active, delegate to it
      if (state.pendingResolution.jsnSubResolution) {
        if (command.type !== "submit_reaction") {
          throw new GameEngineError(
            "MUST_RESOLVE_PENDING_ACTION",
            `JSN counter-chain active. Expected 'submit_reaction' from ${state.pendingResolution.jsnSubResolution.waitingForPlayerId}`,
          );
        }
        const reactionResult = handleReaction(state, command.playerId, command.action, command.justSayNoCardInstanceId);
        return evaluateWin(reactionResult);
      }

      if (command.type !== "submit_reaction") {
        throw new GameEngineError(
          "MUST_RESOLVE_PENDING_ACTION",
          `Reaction window active. Expected 'submit_reaction' command`,
        );
      }

      // Concurrent multi-target: accept from any player in waitingForPlayerIds
      const pending = state.pendingResolution;
      const isConcurrent = pending.waitingForPlayerIds && pending.waitingForPlayerIds.length > 0;
      if (isConcurrent && !pending.waitingForPlayerIds!.includes(command.playerId)) {
        throw new GameEngineError(
          "NOT_WAITING_FOR_YOUR_REACTION",
          `Waiting for players ${pending.waitingForPlayerIds!.join(", ")}, not ${command.playerId}`,
        );
      }
      // Single-target: only the designated player
      if (!isConcurrent && command.playerId !== pending.waitingForPlayerId) {
        throw new GameEngineError(
          "NOT_WAITING_FOR_YOUR_REACTION",
          `Waiting for player ${pending.waitingForPlayerId}, not ${command.playerId}`,
        );
      }

      const reactionResult = handleReaction(
        state,
        command.playerId,
        command.action,
        command.justSayNoCardInstanceId,
      );
      return evaluateWin(reactionResult);
    }

    if (state.pendingResolution.type === "payment") {
      // If a JSN sub-resolution is active during payment, delegate to reaction handler
      if (state.pendingResolution.jsnSubResolution) {
        if (command.type !== "submit_reaction") {
          throw new GameEngineError(
            "MUST_RESOLVE_PENDING_ACTION",
            `JSN counter-chain active during payment. Expected 'submit_reaction' from ${state.pendingResolution.jsnSubResolution.waitingForPlayerId}`,
          );
        }
        const reactionResult = handleReaction(state, command.playerId, command.action, command.justSayNoCardInstanceId);
        return evaluateWin(reactionResult);
      }

      if (command.type !== "submit_payment") {
        const paidIds = state.pendingResolution.paidDebtorIds || [];
        const allDebtors = state.pendingResolution.debtorPlayerIds || [state.pendingResolution.debtorPlayerId];
        const unpaidIds = allDebtors.filter((id) => !paidIds.includes(id));
        throw new GameEngineError(
          "MUST_RESOLVE_PENDING_ACTION",
          `Payment pending. Expected 'submit_payment' from ${unpaidIds.join(", ")}`,
        );
      }

      // Accept payment from any unpaid debtor
      const allDebtors = state.pendingResolution.debtorPlayerIds || [state.pendingResolution.debtorPlayerId];
      const paidIds = state.pendingResolution.paidDebtorIds || [];
      const isUnpaidDebtor =
        allDebtors.includes(command.playerId) &&
        !paidIds.includes(command.playerId);
      if (!isUnpaidDebtor) {
        throw new GameEngineError(
          "NOT_WAITING_FOR_YOUR_PAYMENT",
          `Not waiting for payment from ${command.playerId}`,
        );
      }

      const paymentResult = handlePayment(
        state,
        command.playerId,
        command.paymentCardInstanceIds,
        command.justSayNoCardInstanceId,
      );
      return evaluateWin(paymentResult);
    }

    if (state.pendingResolution.type === "discard") {
      if (command.type === "cancel_discard") {
        if (command.playerId !== state.pendingResolution.playerId) {
          throw new GameEngineError(
            "NOT_YOUR_TURN",
            `Not waiting for your discard. Expected discard from ${state.pendingResolution.playerId}`,
          );
        }
        const nextState: GameState = {
          ...state,
          turn: {
            ...state.turn,
            phase: "action",
          },
          pendingResolution: null,
        };
        return { nextState, events: [] };
      }
      if (command.type !== "discard_cards") {
        throw new GameEngineError(
          "MUST_RESOLVE_PENDING_ACTION",
          `Discard required. Expected 'discard_cards' command from ${state.pendingResolution.playerId}`,
        );
      }
      const discardResult = discardCards(state, command.playerId, command.cardInstanceIds);
      return evaluateWin(discardResult);
    }
  }

  // Regular turn actions
  if (command.type === "start_game") {
    return { nextState: state, events: [] };
  }

  if (command.playerId !== state.turn.activePlayerId) {
    throw new GameEngineError("NOT_YOUR_TURN", `It is ${state.turn.activePlayerId}'s turn, not ${command.playerId}`);
  }

  let result: ApplyCommandResult;

  switch (command.type) {
    case "draw_cards": {
      if (state.turn.phase !== "draw") {
        throw new GameEngineError("ALREADY_DRAWN_THIS_TURN", "Cards have already been drawn for this turn");
      }
      result = drawCardsForActivePlayer(state);
      break;
    }

    case "bank_card": {
      ensureActionPhaseAndLimit(state);
      result = bankCard(state, command.playerId, command.cardInstanceId);
      break;
    }

    case "play_property": {
      ensureActionPhaseAndLimit(state);
      result = playPropertyCard(
        state,
        command.playerId,
        command.cardInstanceId,
        command.targetSetId,
        command.chosenColor,
      );
      break;
    }

    case "reorganize_wild": {
      if (state.turn.phase === "draw") {
        throw new GameEngineError("MUST_DRAW_FIRST", "Must draw cards before taking actions");
      }
      result = reorganizeWildCard(
        state,
        command.playerId,
        command.cardInstanceId,
        command.fromSetId,
        command.toSetId,
        command.newColor,
      );
      break;
    }

    case "move_building": {
      if (state.turn.phase === "draw") {
        throw new GameEngineError("MUST_DRAW_FIRST", "Must draw cards before taking actions");
      }
      result = moveBuilding(
        state,
        command.playerId,
        command.buildingType,
        command.fromSetId,
        command.toSetId,
      );
      break;
    }

    case "play_action": {
      ensureActionPhaseAndLimit(state);
      result = playActionCard(
        state,
        command.playerId,
        command.cardInstanceId,
        command.targetPlayerId,
        command.targetSetId,
        command.targetCardInstanceId,
        command.offeredCardInstanceId,
      );
      break;
    }

    case "play_rent": {
      ensureActionPhaseAndLimit(state);
      result = playRentCard(
        state,
        command.playerId,
        command.rentCardInstanceId,
        command.chosenColor,
        command.targetPlayerId,
        command.doubleRentCardInstanceId,
      );
      break;
    }

    case "end_turn": {
      if (state.turn.phase === "draw") {
        throw new GameEngineError("MUST_DRAW_FIRST", "Must draw cards before ending turn");
      }
      result = endTurn(state, command.playerId);
      break;
    }

    default:
      throw new GameEngineError("UNKNOWN_ERROR", `Unhandled command type: ${(command as GameCommand).type}`);
  }

  return evaluateWin(result);
}

function ensureActionPhaseAndLimit(state: GameState): void {
  if (state.turn.phase === "draw") {
    throw new GameEngineError("MUST_DRAW_FIRST", "Must draw cards before taking turn actions");
  }
  if (state.turn.actionsRemaining <= 0) {
    throw new GameEngineError("NO_ACTIONS_REMAINING", "No actions remaining this turn (max 3 per turn)");
  }
}

function evaluateWin(result: ApplyCommandResult): ApplyCommandResult {
  const { nextState, wonEvent } = evaluateGameWinner(result.nextState);
  if (wonEvent) {
    return {
      nextState,
      events: [...result.events, wonEvent],
    };
  }
  return { nextState, events: result.events };
}
