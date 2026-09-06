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
      if (command.type !== "submit_reaction") {
        throw new GameEngineError(
          "MUST_RESOLVE_PENDING_ACTION",
          `Reaction window active. Expected 'submit_reaction' command from ${state.pendingResolution.waitingForPlayerId}`,
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
      if (command.type !== "submit_payment") {
        const expected =
          state.pendingResolution.debtorPlayerIds && state.pendingResolution.debtorPlayerIds.length > 0
            ? state.pendingResolution.debtorPlayerIds.join(", ")
            : state.pendingResolution.debtorPlayerId;
        throw new GameEngineError(
          "MUST_RESOLVE_PENDING_ACTION",
          `Payment pending. Expected 'submit_payment' command from ${expected}`,
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
