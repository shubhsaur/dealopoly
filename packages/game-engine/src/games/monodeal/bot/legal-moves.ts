import type { CardColor } from "@dealopoly/shared";
import { PROPERTY_COLORS } from "@dealopoly/shared";
import type { GameCommand } from "../types/commands.js";
import type { CardInstance, GameState, PlayerState, PropertySet } from "../types/state.js";
import { calculateTotalAssetValue, getPlayerTableAssets } from "../rules/payment.js";
import { validateWildColor } from "../rules/property.js";

const UNPLAYABLE_AS_ACTION = new Set([
  "action-just-say-no",
  "action-double-the-rent",
]);

function opponentIds(state: GameState, botPlayerId: string): string[] {
  return state.playerOrder.filter((id) => id !== botPlayerId && state.players[id]);
}

function stealablePropertyCards(player: PlayerState): Array<{ set: PropertySet; card: CardInstance }> {
  const result: Array<{ set: PropertySet; card: CardInstance }> = [];
  for (const set of player.propertySets) {
    if (set.isComplete) continue;
    for (const card of set.cards) {
      result.push({ set, card });
    }
  }
  return result;
}

function offeredPropertyCards(player: PlayerState): Array<{ set: PropertySet; card: CardInstance }> {
  return stealablePropertyCards(player);
}

function wildColorsForCard(card: CardInstance): CardColor[] {
  if (card.primaryColor === "all") {
    return PROPERTY_COLORS;
  }
  const colors: CardColor[] = [];
  if (card.primaryColor && card.primaryColor !== "all") colors.push(card.primaryColor);
  if (card.secondaryColor && card.secondaryColor !== "all") colors.push(card.secondaryColor);
  return colors.filter((color) => {
    try {
      validateWildColor(card, color);
      return true;
    } catch {
      return false;
    }
  });
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k <= 0) return [[]];
  if (k > items.length) return [];
  if (k === items.length) return [items];
  const result: T[][] = [];
  const walk = (start: number, chosen: T[]) => {
    if (chosen.length === k) {
      result.push([...chosen]);
      return;
    }
    const remainingSlots = k - chosen.length;
    for (let i = start; i <= items.length - remainingSlots; i++) {
      chosen.push(items[i]!);
      walk(i + 1, chosen);
      chosen.pop();
      if (result.length >= 48) return;
    }
  };
  walk(0, []);
  return result;
}

function greedyPaymentIds(bot: PlayerState, amountDue: number): string[] {
  const tableAssets = getPlayerTableAssets(bot);
  const totalTableValue = calculateTotalAssetValue(tableAssets);
  if (totalTableValue <= amountDue) {
    return tableAssets.map((c) => c.instanceId);
  }

  const sortedAssets = [...tableAssets].sort((a, b) => {
    const aInBank = bot.bank.some((c) => c.instanceId === a.instanceId);
    const bInBank = bot.bank.some((c) => c.instanceId === b.instanceId);
    if (aInBank && !bInBank) return -1;
    if (!aInBank && bInBank) return 1;

    const aSet = bot.propertySets.find(
      (s) =>
        s.cards.some((c) => c.instanceId === a.instanceId) ||
        s.houseCard?.instanceId === a.instanceId ||
        s.hotelCard?.instanceId === a.instanceId,
    );
    const bSet = bot.propertySets.find(
      (s) =>
        s.cards.some((c) => c.instanceId === b.instanceId) ||
        s.houseCard?.instanceId === b.instanceId ||
        s.hotelCard?.instanceId === b.instanceId,
    );
    const aComplete = aSet?.isComplete ? 1 : 0;
    const bComplete = bSet?.isComplete ? 1 : 0;
    if (aComplete !== bComplete) return aComplete - bComplete;
    return a.value - b.value;
  });

  const selected: string[] = [];
  let currentTotal = 0;
  for (const card of sortedAssets) {
    selected.push(card.instanceId);
    currentTotal += card.value;
    if (currentTotal >= amountDue) break;
  }
  return selected;
}

function recklessPaymentIds(bot: PlayerState, amountDue: number): string[] {
  const tableAssets = getPlayerTableAssets(bot);
  const totalTableValue = calculateTotalAssetValue(tableAssets);
  if (totalTableValue <= amountDue) {
    return tableAssets.map((c) => c.instanceId);
  }

  const sortedAssets = [...tableAssets].sort((a, b) => {
    const aSet = bot.propertySets.find((s) => s.cards.some((c) => c.instanceId === a.instanceId));
    const bSet = bot.propertySets.find((s) => s.cards.some((c) => c.instanceId === b.instanceId));
    const aComplete = aSet?.isComplete ? 1 : 0;
    const bComplete = bSet?.isComplete ? 1 : 0;
    if (aComplete !== bComplete) return bComplete - aComplete;
    return b.value - a.value;
  });

  const selected: string[] = [];
  let currentTotal = 0;
  for (const card of sortedAssets) {
    selected.push(card.instanceId);
    currentTotal += card.value;
    if (currentTotal >= amountDue) break;
  }
  return selected;
}

function uniqueCommands(commands: GameCommand[]): GameCommand[] {
  const seen = new Set<string>();
  const unique: GameCommand[] = [];
  for (const command of commands) {
    const key = JSON.stringify(command);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(command);
  }
  return unique;
}

export function generateLegalMoves(state: GameState, botPlayerId: string): GameCommand[] {
  const bot = state.players[botPlayerId];
  if (!bot) return [];

  if (state.pendingResolution?.type === "reaction_window") {
    if (state.pendingResolution.waitingForPlayerId !== botPlayerId) return [];
    const moves: GameCommand[] = [{ type: "submit_reaction", playerId: botPlayerId, action: "pass" }];
    const jsnCard = bot.hand.find((c) => c.defId === "action-just-say-no");
    if (jsnCard && state.pendingResolution.justSayNoChainCount < 2) {
      moves.push({
        type: "submit_reaction",
        playerId: botPlayerId,
        action: "just_say_no",
        justSayNoCardInstanceId: jsnCard.instanceId,
      });
    }
    return moves;
  }

  if (state.pendingResolution?.type === "payment") {
    if (state.pendingResolution.debtorPlayerId !== botPlayerId) return [];
    const amountDue = state.pendingResolution.amountDue;
    const greedy = greedyPaymentIds(bot, amountDue);
    const reckless = recklessPaymentIds(bot, amountDue);
    return uniqueCommands([
      { type: "submit_payment", playerId: botPlayerId, paymentCardInstanceIds: greedy },
      { type: "submit_payment", playerId: botPlayerId, paymentCardInstanceIds: reckless },
    ]);
  }

  if (state.pendingResolution?.type === "discard") {
    if (state.pendingResolution.playerId !== botPlayerId) return [];
    const discardCount = state.pendingResolution.requiredDiscardCount;
    const combos = combinations(bot.hand, discardCount);
    if (combos.length === 0) {
      return [
        {
          type: "discard_cards",
          playerId: botPlayerId,
          cardInstanceIds: bot.hand.slice(0, discardCount).map((c) => c.instanceId),
        },
      ];
    }
    return combos.map((cards) => ({
      type: "discard_cards",
      playerId: botPlayerId,
      cardInstanceIds: cards.map((c) => c.instanceId),
    }));
  }

  if (state.turn.activePlayerId !== botPlayerId) return [];

  if (state.turn.phase === "draw") {
    return [{ type: "draw_cards", playerId: botPlayerId }];
  }

  if (state.turn.phase !== "action") return [];

  const moves: GameCommand[] = [{ type: "end_turn", playerId: botPlayerId }];
  if (state.turn.actionsRemaining <= 0) return moves;

  const opponents = opponentIds(state, botPlayerId);

  for (const card of bot.hand) {
    if (card.type === "property") {
      const matchingSet = bot.propertySets.find((s) => s.color === card.primaryColor && !s.isComplete);
      moves.push({
        type: "play_property",
        playerId: botPlayerId,
        cardInstanceId: card.instanceId,
        targetSetId: matchingSet?.setId,
      });
    }

    if (card.type === "property-wild") {
      for (const chosenColor of wildColorsForCard(card)) {
        const matchingSet = bot.propertySets.find((s) => s.color === chosenColor && !s.isComplete);
        moves.push({
          type: "play_property",
          playerId: botPlayerId,
          cardInstanceId: card.instanceId,
          chosenColor,
          targetSetId: matchingSet?.setId,
        });
      }
    }

    if (card.value > 0) {
      moves.push({
        type: "bank_card",
        playerId: botPlayerId,
        cardInstanceId: card.instanceId,
      });
    }

    if (card.type === "action" && !UNPLAYABLE_AS_ACTION.has(card.defId)) {
      switch (card.defId) {
        case "action-pass-go":
        case "action-its-my-birthday":
          moves.push({ type: "play_action", playerId: botPlayerId, cardInstanceId: card.instanceId });
          break;
        case "action-house": {
          const eligible = bot.propertySets.filter(
            (s) => s.isComplete && !s.hasHouse && s.color !== "railroad" && s.color !== "utility",
          );
          for (const set of eligible) {
            moves.push({
              type: "play_action",
              playerId: botPlayerId,
              cardInstanceId: card.instanceId,
              targetSetId: set.setId,
            });
          }
          break;
        }
        case "action-hotel": {
          const eligible = bot.propertySets.filter((s) => s.isComplete && s.hasHouse && !s.hasHotel);
          for (const set of eligible) {
            moves.push({
              type: "play_action",
              playerId: botPlayerId,
              cardInstanceId: card.instanceId,
              targetSetId: set.setId,
            });
          }
          break;
        }
        case "action-deal-breaker":
          for (const opponentId of opponents) {
            const opponent = state.players[opponentId]!;
            for (const set of opponent.propertySets) {
              if (!set.isComplete) continue;
              moves.push({
                type: "play_action",
                playerId: botPlayerId,
                cardInstanceId: card.instanceId,
                targetPlayerId: opponentId,
                targetSetId: set.setId,
              });
            }
          }
          break;
        case "action-sly-deal":
          for (const opponentId of opponents) {
            const opponent = state.players[opponentId]!;
            for (const { card: targetCard } of stealablePropertyCards(opponent)) {
              moves.push({
                type: "play_action",
                playerId: botPlayerId,
                cardInstanceId: card.instanceId,
                targetPlayerId: opponentId,
                targetCardInstanceId: targetCard.instanceId,
              });
            }
          }
          break;
        case "action-force-deal":
        case "action-forced-deal": {
          const offered = offeredPropertyCards(bot);
          if (offered.length === 0) break;
          for (const opponentId of opponents) {
            const opponent = state.players[opponentId]!;
            const targets = stealablePropertyCards(opponent);
            for (const { card: targetCard } of targets) {
              for (const { card: offeredCard } of offered) {
                moves.push({
                  type: "play_action",
                  playerId: botPlayerId,
                  cardInstanceId: card.instanceId,
                  targetPlayerId: opponentId,
                  targetCardInstanceId: targetCard.instanceId,
                  offeredCardInstanceId: offeredCard.instanceId,
                });
                if (moves.length > 180) break;
              }
              if (moves.length > 180) break;
            }
            if (moves.length > 180) break;
          }
          break;
        }
        case "action-debt-collector":
          for (const opponentId of opponents) {
            moves.push({
              type: "play_action",
              playerId: botPlayerId,
              cardInstanceId: card.instanceId,
              targetPlayerId: opponentId,
            });
          }
          break;
        default:
          break;
      }
    }

    if (card.type === "rent") {
      const ownedColors = new Set(bot.propertySets.map((s) => s.color));
      let colors: CardColor[] = [];
      if (card.primaryColor === "all") {
        colors = [...ownedColors];
      } else {
        if (card.primaryColor && ownedColors.has(card.primaryColor)) colors.push(card.primaryColor);
        if (card.secondaryColor && ownedColors.has(card.secondaryColor)) colors.push(card.secondaryColor);
      }

      const doubleRentCard = bot.hand.find((c) => c.defId === "action-double-the-rent");
      const canDouble = Boolean(doubleRentCard && state.turn.actionsRemaining >= 2);

      for (const chosenColor of colors) {
        if (card.primaryColor === "all") {
          for (const targetPlayerId of opponents) {
            moves.push({
              type: "play_rent",
              playerId: botPlayerId,
              rentCardInstanceId: card.instanceId,
              chosenColor,
              targetPlayerId,
            });
            if (canDouble && doubleRentCard) {
              moves.push({
                type: "play_rent",
                playerId: botPlayerId,
                rentCardInstanceId: card.instanceId,
                chosenColor,
                targetPlayerId,
                doubleRentCardInstanceId: doubleRentCard.instanceId,
              });
            }
          }
        } else {
          moves.push({
            type: "play_rent",
            playerId: botPlayerId,
            rentCardInstanceId: card.instanceId,
            chosenColor,
          });
          if (canDouble && doubleRentCard) {
            moves.push({
              type: "play_rent",
              playerId: botPlayerId,
              rentCardInstanceId: card.instanceId,
              chosenColor,
              doubleRentCardInstanceId: doubleRentCard.instanceId,
            });
          }
        }
      }
    }
  }

  return uniqueCommands(moves);
}

export { greedyPaymentIds };
