import type { LeastCountCard } from "../deck.js";
import type {
  LeastCountGameState,
  LeastCountCommand,
} from "../types.js";
import { calculateHandScore } from "../rules.js";
import type {
  LeastCountOpponentProfile,
  LeastCountWorldView,
  DiscardCandidate,
} from "./types.js";
import { getAllLegalDiscards } from "./heuristics.js";

export function buildLeastCountWorldView(
  state: LeastCountGameState,
  botPlayerId: string,
): LeastCountWorldView {
  const bot = state.players[botPlayerId];
  const myHand = bot ? bot.hand : [];
  const myHandScore = calculateHandScore(myHand);

  const activeOrder = state.playerOrder.filter((id) => !state.players[id]?.isEliminated);
  const botIndex = activeOrder.indexOf(botPlayerId);
  const nextPlayerId = botIndex >= 0 && activeOrder.length > 1
    ? activeOrder[(botIndex + 1) % activeOrder.length]!
    : null;

  const opponents: LeastCountOpponentProfile[] = [];
  for (const [id, p] of Object.entries(state.players)) {
    if (id === botPlayerId) continue;
    const known = state.knownDrawnCards?.[id] || [];
    const isThreat = !p.isEliminated && (p.hand.length <= 2 || p.score <= (bot?.score ?? 0));
    opponents.push({
      playerId: id,
      name: p.name,
      handCount: p.hand.length,
      score: p.score,
      isEliminated: p.isEliminated,
      knownCards: known,
      isThreat,
      showProbability: 0,
    });
  }

  const nonEliminatedOpponents = opponents.filter((o) => !o.isEliminated);
  const leader = nonEliminatedOpponents.length > 0
    ? [...nonEliminatedOpponents].sort((a, b) => a.score - b.score)[0]!
    : null;

  const nextPlayer = nextPlayerId ? opponents.find((o) => o.playerId === nextPlayerId) ?? null : null;
  const discardTop = state.discardPile.length > 0
    ? state.discardPile[state.discardPile.length - 1]
    : undefined;

  return {
    botId: botPlayerId,
    myHand,
    myHandScore,
    opponents,
    leader,
    nextPlayer,
    discardTop,
    unseenCardCount: state.drawPile.length,
  };
}

/**
 * Determines whether a discard candidate leaves a card on top of the discard pile
 * that visibly benefits the target opponent.
 */
export function isFeedingOpponent(
  cardsToDiscard: LeastCountCard[],
  target: LeastCountOpponentProfile | null,
): boolean {
  if (!target || target.isEliminated || cardsToDiscard.length === 0) return false;

  const topCard = cardsToDiscard[cardsToDiscard.length - 1]!;

  // 1. Check if top card matches rank of any card known to be held by target
  if (target.knownCards.some((c) => c.rank === topCard.rank)) {
    return true;
  }

  // 2. Check if top card connects to a sequence with a card held by target
  if (target.knownCards.some((c) => c.suit === topCard.suit && Math.abs(c.rankValue - topCard.rankValue) === 1)) {
    return true;
  }

  // 3. Check if top card is a zero or ultra-low point card and target has low hand count
  if ((topCard.rank === "K" || topCard.points <= 2) && target.handCount <= 3) {
    return true;
  }

  return false;
}

/**
 * Evaluates discard options with threat & feeding awareness (Hard mode).
 */
export function findBestDiscardHard(
  hand: LeastCountCard[],
  world: LeastCountWorldView,
): LeastCountCard[] {
  if (hand.length === 0) return [];
  if (hand.length === 1) return [hand[0]!];

  const candidates = getAllLegalDiscards(hand);
  if (candidates.length === 0) return [hand[0]!];

  for (const candidate of candidates) {
    let score = candidate.score;

    // Never willingly discard a King as single card (King is 0 points)
    if (candidate.type === "single" && candidate.cards[0]!.rank === "K") {
      score -= 500;
    }
    // Discourage discarding an Ace as single card (Ace is only 1 pt)
    if (candidate.type === "single" && candidate.cards[0]!.rank === "A") {
      score -= 200;
    }

    // Heavy penalty for feeding the immediate next player
    if (world.nextPlayer && isFeedingOpponent(candidate.cards, world.nextPlayer)) {
      score -= 250;
    }

    // Additional penalty for feeding the overall leader
    if (world.leader && world.leader.playerId !== world.nextPlayer?.playerId && isFeedingOpponent(candidate.cards, world.leader)) {
      score -= 150;
    }

    candidate.score = score;
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]!.cards;
}

/**
 * Hard bot draw decision:
 * Cautious show calling (avoids wrong-show penalties when opponents have small hands).
 * Checks for sequence / high-pair completion from discard pile.
 */
export function decideDrawHard(
  state: LeastCountGameState,
  botPlayerId: string,
  world: LeastCountWorldView,
): LeastCountCommand {
  const handScore = world.myHandScore;

  // Show evaluation:
  if (handScore <= state.showThreshold) {
    // If hand score <= 4, very strong hand -> declare show
    if (handScore <= 4) {
      return { type: "declare_show", playerId: botPlayerId };
    }

    // Hand score is 5..7: Check if any opponent is a severe threat (handCount <= 2)
    const activeOpponents = world.opponents.filter((o) => !o.isEliminated);
    const hasSmallHandOpponent = activeOpponents.some((o) => o.handCount <= 2);

    // If bot has 3+ cards with a marginal score (5..7) and an opponent only has 2 cards,
    // opponent likely has <= 5 points. Don't risk a 40-pt penalty!
    if (hasSmallHandOpponent && world.myHand.length >= 3) {
      // Pass on show this turn, draw instead to lower hand score further
    } else {
      return { type: "declare_show", playerId: botPlayerId };
    }
  }

  const discardTop = world.discardTop;
  if (discardTop) {
    // 1. King (0 pts) is an instant pickup
    if (discardTop.rank === "K") {
      return { type: "draw_card", playerId: botPlayerId, source: "discard" };
    }

    // 2. Ace (1 pt) or 2 pts is an instant pickup if hand has higher cards
    if (discardTop.points <= 2 && world.myHand.some((c) => c.points > discardTop.points)) {
      return { type: "draw_card", playerId: botPlayerId, source: "discard" };
    }

    // 3. Does discardTop complete a 3-card sequence with 2 cards in hand?
    for (let i = 0; i < world.myHand.length; i++) {
      for (let j = i + 1; j < world.myHand.length; j++) {
        const testSequence = [world.myHand[i]!, world.myHand[j]!, discardTop];
        testSequence.sort((a, b) => a.rankValue - b.rankValue);
        const isSameSuit = testSequence.every((c) => c.suit === testSequence[0]!.suit);
        const isConsecutive =
          testSequence[0]!.rankValue + 1 === testSequence[1]!.rankValue &&
          testSequence[1]!.rankValue + 1 === testSequence[2]!.rankValue;
        if (isSameSuit && isConsecutive) {
          return { type: "draw_card", playerId: botPlayerId, source: "discard" };
        }
      }
    }

    // 4. Does discardTop form a pair with a high card (>= 8 pts) so both can be dropped together?
    const hasMatchingHighCard = world.myHand.some((c) => c.rank === discardTop.rank && c.points >= 8);
    if (hasMatchingHighCard) {
      return { type: "draw_card", playerId: botPlayerId, source: "discard" };
    }
  }

  return { type: "draw_card", playerId: botPlayerId, source: "deck" };
}
