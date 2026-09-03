import type { BotDifficulty, CardColor } from "@dealopoly/shared";
import type { GameCommand } from "../types/commands.js";
import type { CardInstance, GameState, PlayerState, PropertySet } from "../types/state.js";
import { calculateSetRent } from "../rules/rent.js";
import type { ScoredMove, WorldView } from "./types.js";
import { cardPlacementColor, setWouldCompleteWithCard } from "./world-view.js";

const POWER_ACTIONS = new Set([
  "action-deal-breaker",
  "action-sly-deal",
  "action-force-deal",
  "action-forced-deal",
]);

function findCard(player: PlayerState, instanceId: string | undefined): CardInstance | undefined {
  if (!instanceId) return undefined;
  return (
    player.hand.find((c) => c.instanceId === instanceId) ??
    player.bank.find((c) => c.instanceId === instanceId) ??
    player.propertySets.flatMap((s) => [
      ...s.cards,
      ...(s.houseCard ? [s.houseCard] : []),
      ...(s.hotelCard ? [s.hotelCard] : []),
    ]).find((c) => c.instanceId === instanceId)
  );
}

function findSetContaining(player: PlayerState, instanceId: string): PropertySet | undefined {
  return player.propertySets.find(
    (s) =>
      s.cards.some((c) => c.instanceId === instanceId) ||
      s.houseCard?.instanceId === instanceId ||
      s.hotelCard?.instanceId === instanceId,
  );
}

export function cardContributionScore(player: PlayerState, card: CardInstance): number {
  if (card.type === "property" || card.type === "property-wild") {
    const colors: CardColor[] = [];
    if (card.primaryColor === "all") {
      colors.push(...player.propertySets.map((s) => s.color));
    } else {
      if (card.primaryColor && card.primaryColor !== "all") colors.push(card.primaryColor);
      if (card.secondaryColor && card.secondaryColor !== "all") colors.push(card.secondaryColor);
    }
    if (colors.some((color) => setWouldCompleteWithCard(player.propertySets, color))) {
      return 100;
    }
    if (player.propertySets.some((s) => colors.includes(s.color))) {
      return 50;
    }
    return 20;
  }
  if (card.type === "money") return card.value;
  return 5;
}

function discardPenalty(player: PlayerState, ids: string[]): number {
  return ids.reduce((sum, id) => {
    const card = player.hand.find((c) => c.instanceId === id);
    return sum + (card ? cardContributionScore(player, card) : 0);
  }, 0);
}

function rentPayout(player: PlayerState, color: CardColor, doubled: boolean): number {
  const owned = player.propertySets.filter((s) => s.color === color);
  if (owned.length === 0) return 0;
  const best = owned.reduce((a, b) => (calculateSetRent(a) > calculateSetRent(b) ? a : b));
  return calculateSetRent(best, doubled);
}

function paymentBreaksCompleteSet(player: PlayerState, ids: string[]): boolean {
  return ids.some((id) => findSetContaining(player, id)?.isComplete);
}

function targetCardCompletesMySet(me: PlayerState, target: CardInstance | undefined): boolean {
  if (!target) return false;
  const color = cardPlacementColor(target);
  return setWouldCompleteWithCard(me.propertySets, color);
}

function scoreMedium(move: GameCommand, state: GameState, world: WorldView): number {
  const me = state.players[move.playerId];
  if (!me) return -Infinity;

  switch (move.type) {
    case "draw_cards":
      return 1000;
    case "end_turn":
      return 1;
    case "play_property": {
      const card = findCard(me, move.cardInstanceId);
      if (!card) return 0;
      const color = move.chosenColor ?? card.primaryColor;
      if (setWouldCompleteWithCard(me.propertySets, color)) return 920;
      if (me.propertySets.some((s) => s.color === color && !s.isComplete)) return 720;
      return 520;
    }
    case "play_action": {
      const card = findCard(me, move.cardInstanceId);
      if (!card) return 0;
      if (card.defId === "action-pass-go") {
        return me.hand.length <= 4 ? 360 : -40;
      }
      if (card.defId === "action-house" || card.defId === "action-hotel") return 760;
      if (card.defId === "action-its-my-birthday") return 390;
      if (card.defId === "action-debt-collector") {
        const bonus = move.targetPlayerId === world.richestOpponent?.playerId ? 40 : 0;
        return 410 + bonus;
      }
      if (card.defId === "action-deal-breaker") {
        if (world.myCompleteSets >= 2) return 120;
        return 860;
      }
      if (card.defId === "action-sly-deal") {
        const opponent = move.targetPlayerId ? state.players[move.targetPlayerId] : undefined;
        const target = opponent && move.targetCardInstanceId
          ? findCard(opponent, move.targetCardInstanceId)
          : undefined;
        return targetCardCompletesMySet(me, target) ? 840 : 200;
      }
      if (card.defId === "action-force-deal" || card.defId === "action-forced-deal") {
        const opponent = move.targetPlayerId ? state.players[move.targetPlayerId] : undefined;
        const target = opponent && move.targetCardInstanceId
          ? findCard(opponent, move.targetCardInstanceId)
          : undefined;
        return targetCardCompletesMySet(me, target) ? 830 : 180;
      }
      return 150;
    }
    case "play_rent": {
      const doubled = Boolean(move.doubleRentCardInstanceId);
      const payout = rentPayout(me, move.chosenColor, doubled);
      const targetBonus = move.targetPlayerId === world.richestOpponent?.playerId ? 15 : 0;
      return 300 + payout * 25 + (doubled ? 20 : 0) + targetBonus;
    }
    case "bank_card": {
      const card = findCard(me, move.cardInstanceId);
      if (!card) return 0;
      if (card.type === "property" || card.type === "property-wild") return -80;
      if (POWER_ACTIONS.has(card.defId)) return 90;
      if (card.type === "money") return 220 + card.value;
      return 140 + card.value;
    }
    case "discard_cards":
      return 400 - discardPenalty(me, move.cardInstanceIds) * 4;
    case "submit_payment":
      return paymentBreaksCompleteSet(me, move.paymentCardInstanceIds) ? 50 : 400;
    case "submit_reaction":
      if (move.action === "just_say_no") return 250;
      return 100;
    default:
      return 10;
  }
}

function scoreEasy(move: GameCommand, state: GameState, world: WorldView): number {
  const base = scoreMedium(move, state, world);
  const me = state.players[move.playerId];
  if (!me) return base;

  if (move.type === "submit_reaction" && move.action === "just_say_no") return -1000;
  if (move.type === "play_rent" && move.doubleRentCardInstanceId) return -200;
  if (move.type === "play_action") {
    const card = findCard(me, move.cardInstanceId);
    if (card && POWER_ACTIONS.has(card.defId)) return 20;
  }
  if (move.type === "bank_card") {
    const card = findCard(me, move.cardInstanceId);
    if (card && POWER_ACTIONS.has(card.defId)) return 280;
  }
  if (move.type === "submit_payment" && paymentBreaksCompleteSet(me, move.paymentCardInstanceIds)) {
    return 220;
  }
  return base;
}

function scoreHard(move: GameCommand, state: GameState, world: WorldView): number {
  const base = scoreMedium(move, state, world);
  const me = state.players[move.playerId];
  if (!me) return base;
  const threatId = world.biggestThreat?.playerId;
  const pending = state.pendingResolution;

  if (move.type === "submit_reaction") {
    if (move.action !== "just_say_no") return 80;
    if (!pending || pending.type !== "reaction_window") return -50;
    const actionDef = pending.actionCard.defId;
    const amountDue = pending.rentAmount ?? 0;
    const targetingMyBestSet =
      pending.targetPropertySetId != null &&
      me.propertySets.some((s) => s.setId === pending.targetPropertySetId && s.isComplete);

    if (actionDef === "action-deal-breaker" && targetingMyBestSet) return 2000;
    if (actionDef === "action-deal-breaker") return 1800;
    if (actionDef === "action-debt-collector" && amountDue > 4) return 900;
    if (
      (actionDef === "action-sly-deal" || actionDef === "action-force-deal" || actionDef === "action-forced-deal") &&
      pending.targetCardInstanceId
    ) {
      const targetCard = findCard(me, pending.targetCardInstanceId);
      const color = cardPlacementColor(targetCard);
      const set = color ? me.propertySets.find((s) => s.color === color) : undefined;
      if (set && set.cards.length + 1 >= set.setSize) return 1600;
      return -20;
    }
    if (amountDue <= 3) return -80;
    if (world.myCompleteSets === 0) return -60;
    return 40;
  }

  if (move.type === "play_action") {
    const card = findCard(me, move.cardInstanceId);
    if (card?.defId === "action-deal-breaker") {
      const vsThreat = move.targetPlayerId === threatId ? 120 : 0;
      if (world.defensiveMode && move.targetPlayerId === threatId) return 980 + vsThreat;
      return base + vsThreat;
    }
    if (card?.defId === "action-sly-deal" || card?.defId === "action-force-deal" || card?.defId === "action-forced-deal") {
      const vsThreat = world.defensiveMode && move.targetPlayerId === threatId ? 80 : 0;
      if (card.defId !== "action-sly-deal") {
        const opponent = move.targetPlayerId ? state.players[move.targetPlayerId] : undefined;
        const target = opponent && move.targetCardInstanceId
          ? findCard(opponent, move.targetCardInstanceId)
          : undefined;
        const offered = move.offeredCardInstanceId ? findCard(me, move.offeredCardInstanceId) : undefined;
        const valueSwing = (target?.value ?? 0) - (offered?.value ?? 0);
        return base + vsThreat + valueSwing * 8;
      }
      return base + vsThreat;
    }
    if (card?.defId === "action-pass-go" && world.defensiveMode) {
      return 420;
    }
  }

  if (move.type === "play_property" && move.chosenColor) {
    const opponentsBuilding = world.opponents.some((opp) => {
      const opponent = state.players[opp.playerId];
      return opponent?.propertySets.some((s) => s.color === move.chosenColor && !s.isComplete);
    });
    const uniqueColor = !opponentsBuilding;
    if (world.defensiveMode && opponentsBuilding) return base + 40;
    if (uniqueColor) return base + 25;
  }

  if (move.type === "play_rent") {
    const doubled = Boolean(move.doubleRentCardInstanceId);
    const payout = rentPayout(me, move.chosenColor, doubled);
    const targetId = move.targetPlayerId ?? world.richestOpponent?.playerId;
    const vsThreat = world.defensiveMode && targetId === threatId ? 70 : 0;
    const vsRich = targetId === world.richestOpponent?.playerId ? 20 : 0;
    return 320 + payout * 30 + (doubled ? 50 : 0) + vsThreat + vsRich;
  }

  if (move.type === "submit_payment" && paymentBreaksCompleteSet(me, move.paymentCardInstanceIds)) {
    return -30;
  }

  return base;
}

export function scoreMoves(
  moves: GameCommand[],
  state: GameState,
  world: WorldView,
  difficulty: BotDifficulty,
): ScoredMove[] {
  const scorer = difficulty === "easy" ? scoreEasy : difficulty === "hard" || difficulty === "expert" ? scoreHard : scoreMedium;
  return moves
    .map((move) => ({ move, score: scorer(move, state, world) }))
    .sort((a, b) => b.score - a.score);
}

export function selectMove(
  ranked: ScoredMove[],
  difficulty: BotDifficulty,
  random: () => number = Math.random,
): GameCommand | null {
  if (ranked.length === 0) return null;

  if (difficulty === "easy") {
    const playable = ranked.filter((entry) => {
      if (entry.move.type === "submit_reaction" && entry.move.action === "just_say_no") return false;
      return true;
    });
    const pool = playable.length > 0 ? playable : ranked;
    if (random() < 0.6) {
      return pool[Math.floor(random() * pool.length)]!.move;
    }
    return pool[0]!.move;
  }

  return ranked[0]!.move;
}

export function pickScoredMove(
  state: GameState,
  botPlayerId: string,
  world: WorldView,
  moves: GameCommand[],
  difficulty: BotDifficulty,
): GameCommand | null {
  return selectMove(scoreMoves(moves, state, world, difficulty), difficulty);
}

export { scoreHard, rentPayout };
