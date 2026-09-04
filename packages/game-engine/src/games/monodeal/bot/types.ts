import type { BotDifficulty, CardColor } from "@dealopoly/shared";
import type { GameCommand } from "../types/commands.js";

export interface OpponentProfile {
  playerId: string;
  completeSets: number;
  incompleteSets: number;
  totalAssetValue: number;
  handCount: number;
  hasPlayedJSN: boolean;
  mostValuableColor: CardColor;
  isWinThreat: boolean;
}

export interface WorldView {
  opponents: OpponentProfile[];
  biggestThreat: OpponentProfile | null;
  richestOpponent: OpponentProfile | null;
  myCompleteSets: number;
  myIncompleteSets: number;
  turnsToWin: number;
  defensiveMode: boolean;
}

export interface ScoredMove {
  move: GameCommand;
  score: number;
}

export type { BotDifficulty };
