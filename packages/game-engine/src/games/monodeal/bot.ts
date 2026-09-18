import type { BotDifficulty } from "@dealopoly/shared";
import { DEFAULT_BOT_DIFFICULTY, parseBotDifficulty } from "@dealopoly/shared";
import type { GameState } from "./types/state.js";
import type { GameCommand } from "./types/commands.js";
import { buildWorldView } from "./bot/world-view.js";
import { generateLegalMoves } from "./bot/legal-moves.js";
import { scoreMoves, selectMove } from "./bot/score.js";
import { pickExpertMove } from "./bot/lookahead.js";

export { buildWorldView } from "./bot/world-view.js";
export { generateLegalMoves } from "./bot/legal-moves.js";
export { scoreMoves, selectMove, cardContributionScore } from "./bot/score.js";
export { evaluatePosition, scoreWithLookahead, pickExpertMove } from "./bot/lookahead.js";
export type { OpponentProfile, WorldView, ScoredMove } from "./bot/types.js";

const FALLBACK_ORDER: BotDifficulty[] = ["expert", "hard", "medium", "easy"];

/**
 * Returns the player ids that the game is currently waiting on.
 *
 * This is the single source of truth for "who must act now" and is used by
 * server-side turn/decision timers to detect an idle blocker. It covers pending
 * resolutions (reaction windows, payments, discards, JSN sub-chains) and the
 * active player's turn. Returns an empty array when the game is over or no one
 * needs to act.
 */
export function getIdleActorIds(state: GameState): string[] {
  const pending = state.pendingResolution;

  if (pending) {
    if (pending.type === "reaction_window") {
      if (pending.jsnSubResolution?.waitingForPlayerId) {
        return [pending.jsnSubResolution.waitingForPlayerId];
      }
      if (pending.waitingForPlayerId) return [pending.waitingForPlayerId];
      if (pending.waitingForPlayerIds?.length) return [...pending.waitingForPlayerIds];
      return [];
    }

    if (pending.type === "payment") {
      if (pending.jsnSubResolution?.waitingForPlayerId) {
        return [pending.jsnSubResolution.waitingForPlayerId];
      }
      const debtors = pending.debtorPlayerIds ?? (pending.debtorPlayerId ? [pending.debtorPlayerId] : []);
      const paid = pending.paidDebtorIds ?? [];
      return debtors.filter((id) => !paid.includes(id));
    }

    if (pending.type === "discard") {
      return pending.playerId ? [pending.playerId] : [];
    }

    return [];
  }

  if (state.status !== "in_progress") return [];
  return state.turn?.activePlayerId ? [state.turn.activePlayerId] : [];
}

/**
 * Computes the safe, always-legal "idle" move for a player who failed to act
 * in time. Unlike the strategic bot heuristic, this never plays cards: it
 * passes reactions, pays what is owed, discards the required count, draws, or
 * ends the turn. This is what server-side timers apply so an idle player can
 * never stall the game — while remaining bound to the same engine rules as
 * every other actor.
 */
export function getIdleMove(state: GameState, playerId: string): GameCommand | null {
  return fallbackMove(state, playerId);
}

function fallbackMove(state: GameState, botPlayerId: string): GameCommand | null {
  const bot = state.players[botPlayerId];
  if (!bot) return null;

  if (state.pendingResolution?.type === "reaction_window") {
    if (state.pendingResolution.jsnSubResolution) {
      if (state.pendingResolution.jsnSubResolution.waitingForPlayerId === botPlayerId) {
        return { type: "submit_reaction", playerId: botPlayerId, action: "pass" };
      }
      return null;
    }
    const isWaiting =
      state.pendingResolution.waitingForPlayerId === botPlayerId ||
      state.pendingResolution.waitingForPlayerIds?.includes(botPlayerId);
    if (isWaiting) {
      return { type: "submit_reaction", playerId: botPlayerId, action: "pass" };
    }
  }
  if (state.pendingResolution?.type === "payment") {
    if (state.pendingResolution.jsnSubResolution) {
      if (state.pendingResolution.jsnSubResolution.waitingForPlayerId === botPlayerId) {
        return { type: "submit_reaction", playerId: botPlayerId, action: "pass" };
      }
      return null;
    }
    const paidIds = state.pendingResolution.paidDebtorIds || [];
    const isDebtor =
      (state.pendingResolution.debtorPlayerIds?.includes(botPlayerId) ||
        state.pendingResolution.debtorPlayerId === botPlayerId) &&
      !paidIds.includes(botPlayerId);
    if (isDebtor) {
      const moves = generateLegalMoves(state, botPlayerId);
      return moves[0] ?? { type: "submit_payment", playerId: botPlayerId, paymentCardInstanceIds: [] };
    }
  }
  if (state.pendingResolution?.type === "discard" && state.pendingResolution.playerId === botPlayerId) {
    const count = state.pendingResolution.requiredDiscardCount;
    return {
      type: "discard_cards",
      playerId: botPlayerId,
      cardInstanceIds: bot.hand.slice(0, count).map((c) => c.instanceId),
    };
  }
  if (state.turn.activePlayerId !== botPlayerId) return null;
  if (state.turn.phase === "draw") {
    return { type: "draw_cards", playerId: botPlayerId };
  }
  return { type: "end_turn", playerId: botPlayerId };
}

function chooseAtDifficulty(
  state: GameState,
  botPlayerId: string,
  difficulty: BotDifficulty,
): GameCommand | null {
  const world = buildWorldView(state, botPlayerId);
  const moves = generateLegalMoves(state, botPlayerId);
  if (moves.length === 0) return null;

  const ranked = scoreMoves(moves, state, world, difficulty);
  if (difficulty === "expert") {
    return pickExpertMove(
      state,
      botPlayerId,
      ranked.map((entry) => entry.move),
    );
  }
  return selectMove(ranked, difficulty);
}

export class BotController {
  public static getNextBotAction(
    state: GameState,
    botPlayerId: string,
    difficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY,
  ): GameCommand | null {
    const resolved = parseBotDifficulty(difficulty);
    const startIndex = FALLBACK_ORDER.indexOf(resolved);
    const chain: BotDifficulty[] = startIndex >= 0 ? FALLBACK_ORDER.slice(startIndex) : ["medium", "easy"];

    for (const level of chain) {
      try {
        const move = chooseAtDifficulty(state, botPlayerId, level);
        if (move) return move;
      } catch {
        continue;
      }
    }

    return fallbackMove(state, botPlayerId);
  }
}
