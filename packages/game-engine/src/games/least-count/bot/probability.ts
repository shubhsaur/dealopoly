import type { LeastCountCard } from "../deck.js";
import type {
  LeastCountGameState,
  LeastCountCommand,
} from "../types.js";
import type {
  LeastCountOpponentProfile,
  LeastCountWorldView,
} from "./types.js";
import { getAllLegalDiscards } from "./heuristics.js";
import { isFeedingOpponent } from "./threat.js";

/**
 * Estimates the probability that an opponent can declare Show (hand score <= threshold)
 * on or before their next turn, based on hand size, known cards, and unseen card pool.
 */
export function estimateOpponentShowProbability(
  opponent: LeastCountOpponentProfile,
  threshold = 7,
): number {
  if (opponent.isEliminated) return 0;
  const count = opponent.handCount;
  if (count === 0) return 1;

  const knownCards = opponent.knownCards;
  const knownPoints = knownCards.reduce((sum, c) => sum + c.points, 0);

  // If all cards in their hand are known:
  if (knownCards.length >= count) {
    return knownPoints <= threshold ? 1 : 0;
  }

  const unknownCount = count - knownCards.length;

  // Single unknown card:
  if (unknownCount === 1) {
    // Points budget remaining: threshold - knownPoints
    const budget = threshold - knownPoints;
    if (budget < 0) return 0;
    // Ranks: K(0), A(1), 2..10, J(11), Q(12). Total 13 ranks.
    // Count ranks with points <= budget:
    // K (0 pts), A (1 pt), 2..budget
    const favorableRanks = budget >= 10 ? 11 : budget >= 1 ? budget + 1 : 1; // +1 for K=0
    return Math.min(1, favorableRanks / 13);
  }

  // Two unknown cards:
  if (unknownCount === 2) {
    const budget = threshold - knownPoints;
    if (budget < 0) return 0;
    // Combinations of 2 cards summing <= budget
    if (budget >= 7) return 0.32;
    if (budget >= 5) return 0.22;
    if (budget >= 3) return 0.12;
    if (budget >= 1) return 0.05;
    return 0.01; // two Kings = 0 pts
  }

  // 3 unknown cards:
  if (unknownCount === 3) {
    const budget = threshold - knownPoints;
    if (budget < 3) return 0.01;
    if (budget >= 7) return 0.08;
    return 0.04;
  }

  // 4+ cards:
  return 0.02;
}

/**
 * Decides whether to declare Show or draw based on expected value (Expert mode).
 */
export function decideShowExpert(
  state: LeastCountGameState,
  botPlayerId: string,
  world: LeastCountWorldView,
): boolean {
  const myScore = world.myHandScore;
  if (myScore > state.showThreshold) return false;

  // With score <= 3, show is almost always +EV
  if (myScore <= 3) return true;

  // Calculate cumulative probability of wrong show against all active opponents
  const activeOpponents = world.opponents.filter((o) => !o.isEliminated);
  let pNoOpponentBeatsMe = 1;

  for (const opp of activeOpponents) {
    // Probability that this opponent has score <= myScore
    const pOppLeqMyScore = estimateOpponentShowProbability(opp, myScore);
    pNoOpponentBeatsMe *= (1 - pOppLeqMyScore);
  }

  const pWrongShow = 1 - pNoOpponentBeatsMe;
  const penalty = state.wrongShowPenalty; // e.g. 40 pts

  // Expected cost of declaring show:
  // EV(Show) = pWrongShow * (penalty + myScore)
  const evShow = pWrongShow * (penalty + myScore);

  // Expected cost of drawing (continuing the round):
  // Bot will likely shed 2-6 points on next discard or declare show next round with lower score
  const evDraw = myScore;

  return evShow < evDraw && pWrongShow < 0.20;
}

/**
 * Expert discard selection:
 * Enters emergency point-shedding mode when opponent threat is critical,
 * and accounts for show probabilities when avoiding feeding.
 */
export function findBestDiscardExpert(
  hand: LeastCountCard[],
  world: LeastCountWorldView,
): LeastCountCard[] {
  if (hand.length === 0) return [];
  if (hand.length === 1) return [hand[0]!];

  const candidates = getAllLegalDiscards(hand);
  if (candidates.length === 0) return [hand[0]!];

  // Check if any opponent is an imminent Show threat (P(show) > 0.35)
  const isEmergencyThreat = world.opponents.some((o) => !o.isEliminated && o.showProbability > 0.35);

  for (const candidate of candidates) {
    let score = candidate.pointsShed * 10;

    if (isEmergencyThreat) {
      // In emergency mode, max immediate points shed takes paramount priority
      score = candidate.pointsShed * 20;
      if (candidate.type === "sequence") score += 30;
      if (candidate.type === "pair") score += 15;
    } else {
      if (candidate.type === "sequence") score += 50;
      if (candidate.type === "pair") score += 20;
    }

    // Never discard King as single
    if (candidate.type === "single" && candidate.cards[0]!.rank === "K") {
      score -= 500;
    }
    if (candidate.type === "single" && candidate.cards[0]!.rank === "A") {
      score -= 200;
    }

    // Weight penalty for feeding opponents by their threat level / show probability
    if (world.nextPlayer && isFeedingOpponent(candidate.cards, world.nextPlayer)) {
      const threatWeight = 150 + world.nextPlayer.showProbability * 400;
      score -= threatWeight;
    }

    for (const opp of world.opponents) {
      if (opp.playerId !== world.nextPlayer?.playerId && isFeedingOpponent(candidate.cards, opp)) {
        score -= 50 + opp.showProbability * 200;
      }
    }

    candidate.score = score;
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]!.cards;
}

/**
 * Expert bot draw decision:
 * EV-based Show evaluation, sequence/pair completion, and threat defense.
 */
export function decideDrawExpert(
  state: LeastCountGameState,
  botPlayerId: string,
  world: LeastCountWorldView,
): LeastCountCommand {
  if (decideShowExpert(state, botPlayerId, world)) {
    return { type: "declare_show", playerId: botPlayerId };
  }

  const discardTop = world.discardTop;
  if (discardTop) {
    // 1. King is 0 points -> instant pickup
    if (discardTop.rank === "K") {
      return { type: "draw_card", playerId: botPlayerId, source: "discard" };
    }

    // 2. Ace or 2 pts -> pickup if hand has cards of higher value
    if (discardTop.points <= 2 && world.myHand.some((c) => c.points > discardTop.points)) {
      return { type: "draw_card", playerId: botPlayerId, source: "discard" };
    }

    // 3. Completes 3-card sequence
    for (let i = 0; i < world.myHand.length; i++) {
      for (let j = i + 1; j < world.myHand.length; j++) {
        const testSeq = [world.myHand[i]!, world.myHand[j]!, discardTop];
        testSeq.sort((a, b) => a.rankValue - b.rankValue);
        const isSameSuit = testSeq.every((c) => c.suit === testSeq[0]!.suit);
        const isConsecutive =
          testSeq[0]!.rankValue + 1 === testSeq[1]!.rankValue &&
          testSeq[1]!.rankValue + 1 === testSeq[2]!.rankValue;
        if (isSameSuit && isConsecutive) {
          return { type: "draw_card", playerId: botPlayerId, source: "discard" };
        }
      }
    }

    // 4. Forms a high pair (>= 8 pts)
    if (world.myHand.some((c) => c.rank === discardTop.rank && c.points >= 8)) {
      return { type: "draw_card", playerId: botPlayerId, source: "discard" };
    }
  }

  return { type: "draw_card", playerId: botPlayerId, source: "deck" };
}
