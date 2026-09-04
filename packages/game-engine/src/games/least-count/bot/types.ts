import type { LeastCountCard } from "../deck.js";

export interface LeastCountOpponentProfile {
  playerId: string;
  name: string;
  handCount: number;
  score: number; // Cumulative match penalty score
  isEliminated: boolean;
  knownCards: LeastCountCard[];
  isThreat: boolean;
  showProbability: number;
}

export interface LeastCountWorldView {
  botId: string;
  myHand: LeastCountCard[];
  myHandScore: number;
  opponents: LeastCountOpponentProfile[];
  leader: LeastCountOpponentProfile | null;
  nextPlayer: LeastCountOpponentProfile | null;
  discardTop?: LeastCountCard;
  unseenCardCount: number;
}

export interface DiscardCandidate {
  cards: LeastCountCard[];
  pointsShed: number;
  type: "sequence" | "pair" | "single";
  score: number;
}
