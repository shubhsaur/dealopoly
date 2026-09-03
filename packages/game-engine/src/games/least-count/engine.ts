import type { IGameEngine } from "../../core.js";
import type {
  LeastCountGameState,
  MaskedLeastCountGameState,
  LeastCountCommand,
  LeastCountEvent,
  LeastCountConfig,
} from "./types.js";
import {
  createLeastCountGame,
  handleDiscardCards,
  handleDrawCard,
  handleDeclareShow,
  handleStartNextRound,
} from "./rules.js";
import { getMaskedLeastCountView } from "./masking.js";
import { LeastCountBotController } from "./bot.js";

export class LeastCountEngine
  implements
    IGameEngine<
      LeastCountGameState,
      MaskedLeastCountGameState,
      LeastCountCommand,
      LeastCountEvent,
      {
        gameId?: string;
        seed?: number;
        players: Array<{ id: string; name: string; isBot?: boolean }>;
        config?: LeastCountConfig;
      }
    >
{
  public readonly gameType = "least_count";
  public readonly displayName = "Least Count";
  public readonly minPlayers = 2;
  public readonly maxPlayers = 6;

  public createGame(options: {
    gameId?: string;
    seed?: number;
    players: Array<{ id: string; name: string; isBot?: boolean }>;
    config?: LeastCountConfig;
  }): LeastCountGameState {
    return createLeastCountGame(options);
  }

  public applyCommand(
    state: LeastCountGameState,
    command: LeastCountCommand,
  ): { nextState: LeastCountGameState; events: LeastCountEvent[] } {
    switch (command.type) {
      case "declare_show": {
        const res = handleDeclareShow(state, command.playerId);
        return { nextState: res.state, events: res.events };
      }
      case "discard_cards": {
        const res = handleDiscardCards(state, command.playerId, command.cardInstanceIds);
        return { nextState: res.state, events: res.events };
      }
      case "draw_card": {
        const res = handleDrawCard(state, command.playerId, command.source);
        return { nextState: res.state, events: res.events };
      }
      case "start_next_round": {
        const res = handleStartNextRound(state, command.playerId);
        return { nextState: res.state, events: res.events };
      }
      default:
        throw new Error(`Unknown Least Count command: ${(command as any).type}`);
    }
  }

  public getMaskedView(
    state: LeastCountGameState,
    playerId: string,
  ): MaskedLeastCountGameState {
    return getMaskedLeastCountView(state, playerId);
  }

  public computeBotAction(
    state: LeastCountGameState,
    botPlayerId: string,
    _difficulty?: string,
  ): LeastCountCommand | null {
    return LeastCountBotController.getNextBotAction(state, botPlayerId);
  }
}
