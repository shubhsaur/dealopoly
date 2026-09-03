import type { CardColor } from "@dealopoly/shared";
import type { GameEvent } from "../types/events.js";
import type { CardInstance, GameState, PlayerState, PropertySet } from "../types/state.js";
import { calculateSetRent } from "../rules/rent.js";
import { calculateTotalAssetValue, getPlayerTableAssets } from "../rules/payment.js";
import type { OpponentProfile, WorldView } from "./types.js";

function completeSetCount(sets: PropertySet[]): number {
  return sets.filter((s) => s.isComplete).length;
}

function incompleteSetCount(sets: PropertySet[]): number {
  return sets.filter((s) => !s.isComplete).length;
}

function mostValuableColor(sets: PropertySet[]): CardColor {
  if (sets.length === 0) return "dark-blue";
  let best: PropertySet = sets[0]!;
  for (const set of sets) {
    if (calculateSetRent(set) > calculateSetRent(best)) {
      best = set;
    }
  }
  return best.color;
}

function hasPlayedJSN(history: GameEvent[], playerId: string): boolean {
  return history.some((event) => {
    if (event.type === "reaction_submitted" && event.playerId === playerId && event.justSayNoCard) {
      return true;
    }
    if (event.type === "action_cancelled" && event.cancelledByPlayerId === playerId) {
      return true;
    }
    return false;
  });
}

function cardsNeededForWin(player: PlayerState): number {
  const complete = completeSetCount(player.propertySets);
  if (complete >= 3) return 0;
  const remainingSets = 3 - complete;
  const incompleteNeed = player.propertySets
    .filter((s) => !s.isComplete)
    .map((s) => Math.max(0, s.setSize - s.cards.length))
    .sort((a, b) => a - b);
  let need = 0;
  for (let i = 0; i < remainingSets; i++) {
    need += incompleteNeed[i] ?? 2;
  }
  return need;
}

export function buildOpponentProfile(state: GameState, opponentId: string): OpponentProfile | null {
  const player = state.players[opponentId];
  if (!player) return null;

  const completeSets = completeSetCount(player.propertySets);
  return {
    playerId: opponentId,
    completeSets,
    incompleteSets: incompleteSetCount(player.propertySets),
    totalAssetValue: calculateTotalAssetValue(getPlayerTableAssets(player)),
    handCount: player.hand.length,
    hasPlayedJSN: hasPlayedJSN(state.history, opponentId),
    mostValuableColor: mostValuableColor(player.propertySets),
    isWinThreat: completeSets >= 2,
  };
}

export function buildWorldView(state: GameState, botPlayerId: string): WorldView {
  const me = state.players[botPlayerId];
  const opponentIds = state.playerOrder.filter((id) => id !== botPlayerId);
  const opponents = opponentIds
    .map((id) => buildOpponentProfile(state, id))
    .filter((profile): profile is OpponentProfile => profile !== null);

  const biggestThreat =
    opponents.length === 0
      ? null
      : [...opponents].sort((a, b) => {
          if (b.completeSets !== a.completeSets) return b.completeSets - a.completeSets;
          return b.totalAssetValue - a.totalAssetValue;
        })[0] ?? null;

  const richestOpponent =
    opponents.length === 0
      ? null
      : [...opponents].sort((a, b) => b.totalAssetValue - a.totalAssetValue)[0] ?? null;

  const myCompleteSets = me ? completeSetCount(me.propertySets) : 0;
  const myIncompleteSets = me ? incompleteSetCount(me.propertySets) : 0;
  const cardsNeeded = me ? cardsNeededForWin(me) : 9;
  const turnsToWin = Math.max(1, Math.ceil(cardsNeeded / 3));

  return {
    opponents,
    biggestThreat,
    richestOpponent,
    myCompleteSets,
    myIncompleteSets,
    turnsToWin,
    defensiveMode: (biggestThreat?.completeSets ?? 0) >= 2,
  };
}

export function setWouldCompleteWithCard(
  sets: PropertySet[],
  color: CardColor | undefined,
): boolean {
  if (!color || color === "all") return false;
  const matching = sets.find((s) => s.color === color && !s.isComplete);
  if (!matching) return false;
  return matching.cards.length + 1 >= matching.setSize;
}

export function cardPlacementColor(card: CardInstance): CardColor | undefined {
  return card.currentColor ?? card.primaryColor;
}
