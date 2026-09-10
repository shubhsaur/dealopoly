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

function fallbackMove(state: GameState, botPlayerId: string): GameCommand | null {
  const bot = state.players[botPlayerId];
  if (!bot) return null;

  if (state.pendingResolution?.type === "reaction_window") {
    const isWaiting =
      state.pendingResolution.waitingForPlayerId === botPlayerId ||
      state.pendingResolution.waitingForPlayerIds?.includes(botPlayerId);
    if (isWaiting) {
      return { type: "submit_reaction", playerId: botPlayerId, action: "pass" };
    }
    // Check JSN sub-resolution
    if (state.pendingResolution.jsnSubResolution?.waitingForPlayerId === botPlayerId) {
      return { type: "submit_reaction", playerId: botPlayerId, action: "pass" };
    }
  }
  if (state.pendingResolution?.type === "payment") {
    const paidIds = state.pendingResolution.paidDebtorIds || [];
    const isDebtor =
      (state.pendingResolution.debtorPlayerIds?.includes(botPlayerId) ||
        state.pendingResolution.debtorPlayerId === botPlayerId) &&
      !paidIds.includes(botPlayerId);
    if (isDebtor) {
      const moves = generateLegalMoves(state, botPlayerId);
      return moves[0] ?? { type: "submit_payment", playerId: botPlayerId, paymentCardInstanceIds: [] };
    }
    // Check JSN sub-resolution within payment
    if (state.pendingResolution.jsnSubResolution?.waitingForPlayerId === botPlayerId) {
      return { type: "submit_reaction", playerId: botPlayerId, action: "pass" };
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
