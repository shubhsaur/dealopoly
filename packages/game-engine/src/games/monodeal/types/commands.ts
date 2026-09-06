import type { CardColor } from "@dealopoly/shared";

export type CommandType =
  | "start_game"
  | "draw_cards"
  | "bank_card"
  | "play_property"
  | "reorganize_wild"
  | "move_building"
  | "play_action"
  | "play_rent"
  | "submit_reaction"
  | "submit_payment"
  | "discard_cards"
  | "end_turn";

export interface BaseCommand {
  type: CommandType;
  playerId: string;
}

export interface StartGameCommand extends BaseCommand {
  type: "start_game";
}

export interface DrawCardsCommand extends BaseCommand {
  type: "draw_cards";
}

export interface BankCardCommand extends BaseCommand {
  type: "bank_card";
  cardInstanceId: string;
}

export interface PlayPropertyCommand extends BaseCommand {
  type: "play_property";
  cardInstanceId: string;
  targetSetId?: string; // if adding to existing set; omit to create new set
  chosenColor?: CardColor; // required if card is a wild property
}

export interface ReorganizeWildCommand extends BaseCommand {
  type: "reorganize_wild";
  cardInstanceId: string;
  fromSetId: string;
  toSetId?: string; // omit if creating a new set
  newColor: CardColor;
}

export interface MoveBuildingCommand extends BaseCommand {
  type: "move_building";
  buildingType: "house" | "hotel";
  fromSetId: string;
  toSetId: string;
}

export interface PlayActionCommand extends BaseCommand {
  type: "play_action";
  cardInstanceId: string;
  targetPlayerId?: string; // required for Deal Breaker, Sly Deal, Force Deal, Debt Collector
  targetSetId?: string; // required for Deal Breaker, House, Hotel
  targetCardInstanceId?: string; // required for Sly Deal, Force Deal
  offeredCardInstanceId?: string; // required for Force Deal
}

export interface PlayRentCommand extends BaseCommand {
  type: "play_rent";
  rentCardInstanceId: string;
  chosenColor: CardColor;
  targetPlayerId?: string; // required if using 10-color Wild Rent (targets 1 player)
  doubleRentCardInstanceId?: string; // optional Double The Rent card to play together
}

export interface SubmitReactionCommand extends BaseCommand {
  type: "submit_reaction";
  action: "just_say_no" | "pass" | "extend_timer";
  justSayNoCardInstanceId?: string;
}

export interface SubmitPaymentCommand extends BaseCommand {
  type: "submit_payment";
  paymentCardInstanceIds: string[]; // card instance IDs from table (bank + property cards)
  justSayNoCardInstanceId?: string; // optional: play Just Say No to refuse payment
}

export interface DiscardCardsCommand extends BaseCommand {
  type: "discard_cards";
  cardInstanceIds: string[];
}

export interface EndTurnCommand extends BaseCommand {
  type: "end_turn";
}

export type GameCommand =
  | StartGameCommand
  | DrawCardsCommand
  | BankCardCommand
  | PlayPropertyCommand
  | ReorganizeWildCommand
  | MoveBuildingCommand
  | PlayActionCommand
  | PlayRentCommand
  | SubmitReactionCommand
  | SubmitPaymentCommand
  | DiscardCardsCommand
  | EndTurnCommand;
