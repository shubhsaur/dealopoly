import type { BotDifficulty } from "@dealopoly/shared";
import { DEFAULT_BOT_DIFFICULTY, parseBotDifficulty } from "@dealopoly/shared";
import type {
  LeastCountGameState,
  LeastCountCommand,
} from "./types.js";
import {
  decideDrawEasy,
  decideDrawMedium,
  pickRandomDiscard,
  findBestDiscardGreedy,
} from "./bot/heuristics.js";
import {
  buildLeastCountWorldView,
  decideDrawHard,
  findBestDiscardHard,
} from "./bot/threat.js";
import {
  decideDrawExpert,
  findBestDiscardExpert,
} from "./bot/probability.js";

export * from "./bot/index.js";

export class LeastCountBotController {
  /**
   * Computes the next legal and strategic move for a Least Count bot player
   * based on the selected difficulty tier.
   */
  public static getNextBotAction(
    state: LeastCountGameState,
    botPlayerId: string,
    difficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY,
  ): LeastCountCommand | null {
    if (state.status === "completed") return null;

    if (state.status === "round_end") {
      return {
        type: "start_next_round",
        playerId: botPlayerId,
      };
    }

    if (state.activePlayerId !== botPlayerId) {
      return null;
    }

    const bot = state.players[botPlayerId];
    if (!bot || bot.isEliminated) return null;

    const level = parseBotDifficulty(difficulty);

    // 1. Draw Phase (Declare Show or Draw from deck / discard)
    if (state.turnPhase === "draw") {
      switch (level) {
        case "easy":
          return decideDrawEasy(state, botPlayerId);
        case "medium":
          return decideDrawMedium(state, botPlayerId);
        case "hard": {
          const world = buildLeastCountWorldView(state, botPlayerId);
          return decideDrawHard(state, botPlayerId, world);
        }
        case "expert": {
          const world = buildLeastCountWorldView(state, botPlayerId);
          return decideDrawExpert(state, botPlayerId, world);
        }
      }
    }

    // 2. Discard Phase (Select legal combination to shed points)
    if (state.turnPhase === "discard") {
      let cardsToDiscard = bot.hand.slice(0, 1);

      switch (level) {
        case "easy":
          cardsToDiscard = pickRandomDiscard(bot.hand);
          break;
        case "medium":
          cardsToDiscard = findBestDiscardGreedy(bot.hand);
          break;
        case "hard": {
          const world = buildLeastCountWorldView(state, botPlayerId);
          cardsToDiscard = findBestDiscardHard(bot.hand, world);
          break;
        }
        case "expert": {
          const world = buildLeastCountWorldView(state, botPlayerId);
          cardsToDiscard = findBestDiscardExpert(bot.hand, world);
          break;
        }
      }

      return {
        type: "discard_cards",
        playerId: botPlayerId,
        cardInstanceIds: cardsToDiscard.map((c) => c.instanceId),
      };
    }

    return null;
  }
}
