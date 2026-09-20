import {
  type GameState,
  type MaskedGameState,
  type GameCommand,
  type GameEvent,
  type CreateGameOptions,
  type ApplyCommandResult,
  createGame,
  applyCommand,
  getMaskedView,
  getSpectatorView,
  getIdleActorIds as getIdleActorIdsImpl,
  getIdleMove as getIdleMoveImpl,
  BotController,
} from "./games/monodeal/index.js";
import { parseBotDifficulty } from "@dealopoly/shared";

/**
 * Generic Game Engine Interface
 * Every card game plugin (Monodeal, Least Count, etc.) implements this contract.
 */
export interface IGameEngine<
  TState = unknown,
  TMaskedState = unknown,
  TCommand = unknown,
  TEvent = unknown,
  TCreateOptions = any
> {
  readonly gameType: string;
  readonly displayName: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;

  /** Initialize a fresh game session */
  createGame(options: TCreateOptions): TState;

  /** Execute a command against the game state */
  applyCommand(state: TState, command: TCommand): { nextState: TState; events: TEvent[] };

  /** Mask private state (e.g. other players' hands) for a specific client */
  getMaskedView(state: TState, playerId: string): TMaskedState;

  /**
   * Read-only view for spectators (the least-privileged viewer).
   * Optional — engines that omit it fall back to a fully hand-hidden masked view.
   */
  getSpectatorView?(state: TState): TMaskedState;

  /**
   * Player ids the game is currently waiting on (the active player and/or
   * players in a pending resolution). Used by server-side timers to detect idle
   * blockers. Optional — engines that omit it are not turn-timed.
   */
  getIdleActorIds?(state: TState): string[];

  /**
   * Safe, always-legal fallback move for a player who failed to act in time.
   * Must never play strategically; returns null when the player is not blocking.
   */
  getIdleMove?(state: TState, playerId: string): TCommand | null;

  /** Compute bot decision heuristic */
  computeBotAction(state: TState, botPlayerId: string, difficulty?: string): TCommand | null;
}

/**
 * Monodeal Engine Plugin Implementation (Dealopoly / Monopoly Deal)
 */
export class MonodealEngine implements IGameEngine<GameState, MaskedGameState, GameCommand, GameEvent, CreateGameOptions> {
  public readonly gameType = "monodeal";
  public readonly displayName = "Monodeal";
  public readonly minPlayers = 2;
  public readonly maxPlayers = 5;

  public createGame(options: CreateGameOptions): GameState {
    return createGame(options);
  }

  public applyCommand(state: GameState, command: GameCommand): ApplyCommandResult {
    return applyCommand(state, command);
  }

  public getMaskedView(state: GameState, playerId: string): MaskedGameState {
    return getMaskedView(state, playerId);
  }

  public getSpectatorView(state: GameState): MaskedGameState {
    return getSpectatorView(state) as MaskedGameState;
  }

  public getIdleActorIds(state: GameState): string[] {
    return getIdleActorIdsImpl(state);
  }

  public getIdleMove(state: GameState, playerId: string): GameCommand | null {
    return getIdleMoveImpl(state, playerId);
  }

  public computeBotAction(state: GameState, botPlayerId: string, difficulty?: string): GameCommand | null {
    return BotController.getNextBotAction(state, botPlayerId, parseBotDifficulty(difficulty));
  }
}

import { LeastCountEngine } from "./games/least-count/engine.js";

/**
 * Central Game Engine Registry
 */
const ENGINES: Record<string, IGameEngine<any, any, any, any, any>> = {
  monodeal: new MonodealEngine(),
  least_count: new LeastCountEngine(),
};

/**
 * Register a new game engine plugin dynamically
 */
export function registerGameEngine(engine: IGameEngine<any, any, any, any, any>): void {
  ENGINES[engine.gameType] = engine;
}

/**
 * Get game engine instance by gameType identifier
 */
export function getGameEngine<
  TState = unknown,
  TMaskedState = unknown,
  TCommand = unknown,
  TEvent = unknown,
  TCreateOptions = any
>(gameType: string): IGameEngine<TState, TMaskedState, TCommand, TEvent, TCreateOptions> {
  const engine = ENGINES[gameType] || ENGINES["monodeal"];
  if (!engine) {
    throw new Error(`Game engine not found for game type: "${gameType}"`);
  }
  return engine as IGameEngine<TState, TMaskedState, TCommand, TEvent, TCreateOptions>;
}

/**
 * List all available registered game engines
 */
export function listGameEngines(): Array<{
  gameType: string;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;
}> {
  return Object.values(ENGINES).map((e) => ({
    gameType: e.gameType,
    displayName: e.displayName,
    minPlayers: e.minPlayers,
    maxPlayers: e.maxPlayers,
  }));
}
