import type { GameCommand } from "../types/commands.js";
import type { GameState } from "../types/state.js";
import { applyCommand } from "../engine.js";
import { calculateTotalAssetValue, getPlayerTableAssets } from "../rules/payment.js";
import { generateLegalMoves } from "./legal-moves.js";
import { scoreMoves, selectMove } from "./score.js";
import { buildWorldView } from "./world-view.js";

const LOOKAHEAD_TIMEOUT_MS = 80;
const LOOKAHEAD_CANDIDATES = 5;

function totalBankValue(player: GameState["players"][string]): number {
  return player.bank.reduce((sum, card) => sum + card.value, 0);
}

export function evaluatePosition(state: GameState, botId: string): number {
  const me = state.players[botId];
  if (!me) return -Infinity;
  const opponents = Object.values(state.players).filter((p) => p.id !== botId);
  const maxOpponentSets =
    opponents.length === 0
      ? 0
      : Math.max(...opponents.map((p) => p.propertySets.filter((s) => s.isComplete).length));

  return (
    me.propertySets.filter((s) => s.isComplete).length * 1000 +
    me.propertySets.filter((s) => !s.isComplete).length * 150 +
    totalBankValue(me) * 10 +
    me.hand.length * 5 -
    maxOpponentSets * 800 +
    calculateTotalAssetValue(getPlayerTableAssets(me)) * 2
  );
}

export function getHardBotMove(state: GameState, botPlayerId: string): GameCommand | null {
  const world = buildWorldView(state, botPlayerId);
  const moves = generateLegalMoves(state, botPlayerId);
  if (moves.length === 0) return null;
  return selectMove(scoreMoves(moves, state, world, "hard"), "hard");
}

export function scoreWithLookahead(
  state: GameState,
  move: GameCommand,
  botId: string,
  depth = 2,
  deadline = Date.now() + LOOKAHEAD_TIMEOUT_MS,
): number {
  if (Date.now() > deadline) {
    return evaluatePosition(state, botId);
  }

  let nextState: GameState;
  try {
    nextState = applyCommand(state, move).nextState;
  } catch {
    return -Infinity;
  }

  if (depth === 0 || nextState.status === "completed") {
    if (nextState.winnerId === botId) return 50_000;
    if (nextState.winnerId && nextState.winnerId !== botId) return -50_000;
    return evaluatePosition(nextState, botId);
  }

  const threat = buildWorldView(nextState, botId).biggestThreat;
  if (threat) {
    const opponentMove = getHardBotMove(nextState, threat.playerId);
    if (opponentMove) {
      try {
        const afterOpponent = applyCommand(nextState, opponentMove).nextState;
        return evaluatePosition(afterOpponent, botId);
      } catch {
        return evaluatePosition(nextState, botId);
      }
    }
  }

  return evaluatePosition(nextState, botId);
}

export function pickExpertMove(
  state: GameState,
  botPlayerId: string,
  rankedHardMoves: GameCommand[],
): GameCommand | null {
  if (rankedHardMoves.length === 0) return null;
  if (state.pendingResolution || state.turn.phase !== "action") {
    return rankedHardMoves[0] ?? null;
  }

  const deadline = Date.now() + LOOKAHEAD_TIMEOUT_MS;
  const candidates = rankedHardMoves.slice(0, LOOKAHEAD_CANDIDATES);
  let best = candidates[0]!;
  let bestScore = -Infinity;

  for (const move of candidates) {
    if (Date.now() > deadline) {
      return rankedHardMoves[0] ?? best;
    }
    const score = scoreWithLookahead(state, move, botPlayerId, 2, deadline);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }

  return best;
}
