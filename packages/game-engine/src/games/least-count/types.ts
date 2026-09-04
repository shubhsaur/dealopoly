import type { LeastCountCard } from "./deck.js";

export type LeastCountGameStatus = "in_progress" | "round_end" | "completed";
export type LeastCountTurnPhase = "discard" | "draw" | "round_end";

export interface LeastCountPlayer {
  id: string;
  name: string;
  isBot: boolean;
  hand: LeastCountCard[];
  score: number; // Cumulative match score (penalty points)
  roundScore: number; // Score in current round
  isEliminated: boolean;
}

export interface MaskedLeastCountPlayer {
  id: string;
  name: string;
  isBot: boolean;
  handCount: number;
  hand?: LeastCountCard[]; // Visible only to self, or revealed to all during round_end
  score: number;
  roundScore: number;
  isEliminated: boolean;
}

export interface ShowResult {
  callerPlayerId: string;
  callerScore: number;
  isSuccessful: boolean;
  lowestScore: number;
  winnerPlayerId: string;
  playerScores: Record<string, { handScore: number; penaltyAdded: number; totalScore: number }>;
}

export interface LeastCountGameState {
  id: string;
  gameType: "least_count";
  status: LeastCountGameStatus;
  roundNumber: number;
  turnNumber: number;
  turnPhase: LeastCountTurnPhase;
  activePlayerId: string;
  playerOrder: string[];
  players: Record<string, LeastCountPlayer>;
  drawPile: LeastCountCard[];
  discardPile: LeastCountCard[];
  lastDiscardedCards: LeastCountCard[];
  showThreshold: number; // e.g. 7 points
  maxScore: number; // e.g. 100 points
  wrongShowPenalty: number; // e.g. 40 points
  winnerId?: string;
  lastShowResult?: ShowResult;
  knownDrawnCards?: Record<string, LeastCountCard[]>;
}

export interface MaskedLeastCountGameState {
  id: string;
  gameType: "least_count";
  status: LeastCountGameStatus;
  roundNumber: number;
  turnNumber: number;
  turnPhase: LeastCountTurnPhase;
  activePlayerId: string;
  playerOrder: string[];
  players: Record<string, MaskedLeastCountPlayer>;
  drawPileCount: number;
  discardPileTop?: LeastCountCard;
  discardPileCount: number;
  lastDiscardedCards: LeastCountCard[];
  showThreshold: number;
  maxScore: number;
  wrongShowPenalty: number;
  winnerId?: string;
  lastShowResult?: ShowResult;
  knownDrawnCards?: Record<string, LeastCountCard[]>;
}

// Commands
export interface LeastCountDeclareShowCommand {
  type: "declare_show";
  playerId: string;
}

export interface LeastCountDiscardCardsCommand {
  type: "discard_cards";
  playerId: string;
  cardInstanceIds: string[];
}

export interface LeastCountDrawCardCommand {
  type: "draw_card";
  playerId: string;
  source: "deck" | "discard";
}

export interface LeastCountStartNextRoundCommand {
  type: "start_next_round";
  playerId: string;
}

export type LeastCountCommand =
  | LeastCountDeclareShowCommand
  | LeastCountDiscardCardsCommand
  | LeastCountDrawCardCommand
  | LeastCountStartNextRoundCommand;

// Events
export interface LeastCountEvent {
  id: string;
  type:
    | "game_started"
    | "show_declared"
    | "cards_discarded"
    | "card_drawn"
    | "round_ended"
    | "next_round_started"
    | "game_completed"
    | "deck_reshuffled";
  playerId?: string;
  timestamp: number;
  message: string;
  payload?: Record<string, unknown>;
}

export interface LeastCountConfig {
  showThreshold?: number; // default 7
  maxScore?: number; // default 100
  wrongShowPenalty?: number; // default 40
  includeJokers?: boolean; // default true
}
