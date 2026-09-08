import type { CardColor, CardType } from "@dealopoly/shared";
import type { GameEvent } from "./events.js";

export interface CardInstance {
  instanceId: string;
  defId: string;
  name: string;
  type: CardType;
  value: number;
  primaryColor?: CardColor;
  secondaryColor?: CardColor;
  currentColor?: CardColor;
  setSize?: number;
  description?: string;
  icon?: string;
}

export interface PropertySet {
  setId: string;
  color: CardColor;
  cards: CardInstance[];
  houseCard?: CardInstance;
  hotelCard?: CardInstance;
  hasHouse: boolean;
  hasHotel: boolean;
  isComplete: boolean;
  setSize: number;
  rentTiers: number[];
}

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  hand: CardInstance[];
  bank: CardInstance[];
  propertySets: PropertySet[];
}

export type TurnPhase = "draw" | "action" | "discard" | "ended";

export interface TurnState {
  activePlayerId: string;
  actionsRemaining: number;
  cardsPlayedThisTurn: number;
  turnNumber: number;
  phase: TurnPhase;
}

export type PendingResolutionType =
  | "reaction_window"
  | "payment"
  | "discard";

export interface ReactionResolution {
  type: "reaction_window";
  initiatorPlayerId: string;
  targetPlayerId: string;
  actionCard: CardInstance;
  targetPropertySetId?: string;
  targetCardInstanceId?: string;
  swappedCardInstanceId?: string;
  rentAmount?: number;
  doubleRent?: boolean;
  waitingForPlayerId: string;
  justSayNoChainCount: number;
  isCancelled: boolean;
  remainingTargets?: string[]; // for multi-player rent / birthday
  passedTargetIds?: string[]; // targets that passed (action applies to them), used for multi-target rent/birthday
  deadline?: number; // epoch timestamp ms when the reaction window expires
  durationMs?: number; // default total window duration (e.g. 7000)
  canExtend?: boolean; // whether +5s extension is available (max 1 per window)
}

export interface PaymentResolution {
  type: "payment";
  creditorPlayerId: string;
  debtorPlayerId: string;
  debtorPlayerIds?: string[]; // All currently owed debtors in parallel
  amountDue: number;
  remainingDebtors: string[];
  reason: string;
  actionCard?: CardInstance;
}

export interface DiscardResolution {
  type: "discard";
  playerId: string;
  requiredDiscardCount: number;
}

export type PendingResolution =
  | ReactionResolution
  | PaymentResolution
  | DiscardResolution;

export type GameStatus = "waiting" | "in_progress" | "completed";

export interface GameState {
  id: string;
  seed: number;
  status: GameStatus;
  players: Record<string, PlayerState>;
  playerOrder: string[];
  turn: TurnState;
  deck: CardInstance[];
  discardPile: CardInstance[];
  pendingResolution: PendingResolution | null;
  winnerId: string | null;
  history: GameEvent[];
}

export interface MaskedPlayerState {
  id: string;
  name: string;
  isBot: boolean;
  handCount: number;
  hand?: CardInstance[]; // only present if viewer is this player
  bank: CardInstance[];
  bankTotal: number;
  propertySets: PropertySet[];
}

export interface MaskedGameState {
  id: string;
  status: GameStatus;
  viewerPlayerId: string;
  players: Record<string, MaskedPlayerState>;
  playerOrder: string[];
  turn: TurnState;
  deckCount: number;
  discardPile: CardInstance[];
  discardPileTop: CardInstance | null;
  pendingResolution: PendingResolution | null;
  winnerId: string | null;
  history: GameEvent[];
}
