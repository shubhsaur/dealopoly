import type { LeastCountCard } from "../deck.js";
import type {
  LeastCountGameState,
  LeastCountCommand,
} from "../types.js";
import {
  calculateHandScore,
  validateDiscardCombination,
} from "../rules.js";
import type { DiscardCandidate } from "./types.js";

function getCombinations<T>(array: T[], size: number): T[][] {
  if (size === 1) return array.map((item) => [item]);
  const result: T[][] = [];
  for (let i = 0; i <= array.length - size; i++) {
    const head = array[i]!;
    const tailCombinations = getCombinations(array.slice(i + 1), size - 1);
    for (const tail of tailCombinations) {
      result.push([head, ...tail]);
    }
  }
  return result;
}

export function getAllLegalDiscards(hand: LeastCountCard[]): DiscardCandidate[] {
  if (hand.length === 0) return [];
  const candidates: DiscardCandidate[] = [];

  // 1. 3-card sequences
  if (hand.length >= 3) {
    const combos = getCombinations(hand, 3);
    for (const combo of combos) {
      if (validateDiscardCombination(combo).valid) {
        const pointsShed = combo.reduce((sum, c) => sum + c.points, 0);
        candidates.push({
          cards: combo,
          pointsShed,
          type: "sequence",
          score: pointsShed * 10 + 50,
        });
      }
    }
  }

  // 2. 2-card pairs
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      const pair = [hand[i]!, hand[j]!];
      if (validateDiscardCombination(pair).valid) {
        const pointsShed = pair.reduce((sum, c) => sum + c.points, 0);
        candidates.push({
          cards: pair,
          pointsShed,
          type: "pair",
          score: pointsShed * 10 + 20,
        });
      }
    }
  }

  // 3. 1-card singles
  for (const card of hand) {
    candidates.push({
      cards: [card],
      pointsShed: card.points,
      type: "single",
      score: card.points * 10,
    });
  }

  return candidates;
}

/**
 * Greedily selects combination that sheds the highest point total (Medium mode).
 */
export function findBestDiscardGreedy(hand: LeastCountCard[]): LeastCountCard[] {
  if (hand.length === 0) return [];
  if (hand.length === 1) return [hand[0]!];

  const candidates = getAllLegalDiscards(hand);
  if (candidates.length === 0) return [hand[0]!];

  // Sort by:
  // 1. pointsShed desc
  // 2. combo length desc (drop more cards on tie)
  candidates.sort((a, b) => {
    if (b.pointsShed !== a.pointsShed) {
      return b.pointsShed - a.pointsShed;
    }
    return b.cards.length - a.cards.length;
  });

  return candidates[0]!.cards;
}

/**
 * Randomly picks a legal discard move (Easy mode).
 */
export function pickRandomDiscard(hand: LeastCountCard[]): LeastCountCard[] {
  if (hand.length === 0) return [];
  const candidates = getAllLegalDiscards(hand);
  if (candidates.length === 0) return [hand[0]!];

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex]!.cards;
}

/**
 * Easy bot draw decision:
 * 50% random chance to declare show if eligible, otherwise 50% random draw source if discard available.
 */
export function decideDrawEasy(
  state: LeastCountGameState,
  botPlayerId: string,
): LeastCountCommand {
  const bot = state.players[botPlayerId];
  const handScore = bot ? calculateHandScore(bot.hand) : 999;

  if (handScore <= state.showThreshold && Math.random() < 0.5) {
    return { type: "declare_show", playerId: botPlayerId };
  }

  const hasDiscard = state.discardPile.length > 0;
  if (hasDiscard && Math.random() < 0.5) {
    return { type: "draw_card", playerId: botPlayerId, source: "discard" };
  }

  return { type: "draw_card", playerId: botPlayerId, source: "deck" };
}

/**
 * Medium bot draw decision:
 * Always declare show if handScore <= threshold.
 * Draw low card (K, A, <= 2 pts) or matching rank from discard; else draw deck.
 */
export function decideDrawMedium(
  state: LeastCountGameState,
  botPlayerId: string,
): LeastCountCommand {
  const bot = state.players[botPlayerId];
  const handScore = bot ? calculateHandScore(bot.hand) : 999;

  if (handScore <= state.showThreshold) {
    return { type: "declare_show", playerId: botPlayerId };
  }

  const discardTop = state.discardPile.length > 0
    ? state.discardPile[state.discardPile.length - 1]
    : undefined;

  if (discardTop && bot) {
    const isLowValue = discardTop.rank === "K" || discardTop.points <= 2;
    const matchesHandRank = bot.hand.some((c) => c.rank === discardTop.rank);

    if (isLowValue || matchesHandRank) {
      return { type: "draw_card", playerId: botPlayerId, source: "discard" };
    }
  }

  return { type: "draw_card", playerId: botPlayerId, source: "deck" };
}
