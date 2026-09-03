import type { WebSocket } from "ws";
import type { GameState } from "@dealopoly/game-engine";
import type { BotDifficulty } from "@dealopoly/shared";

export interface RoomSeat {
  seatIndex: number;
  playerId: string;
  name: string;
  isBot: boolean;
  sessionToken: string;
  isConnected: boolean;
  difficulty?: BotDifficulty;
  socket?: WebSocket;
}

export type RoomStatus = "lobby" | "in_progress" | "completed";

export interface Room {
  id?: string;
  code: string;
  gameType: string;
  config?: Record<string, unknown>;
  hostPlayerId: string;
  status: RoomStatus;
  seats: RoomSeat[];
  maxSeats: number;
  gameState?: any;
  dbGameId?: string;
  nextSequenceNum?: number;
  createdAt: number;
  lastActivityAt: number;
}

export interface PublicRoomSeat {
  seatIndex: number;
  playerId: string;
  name: string;
  isBot: boolean;
  isConnected: boolean;
  difficulty?: BotDifficulty;
}

export interface PublicRoomInfo {
  code: string;
  gameType: string;
  hostPlayerId: string;
  status: RoomStatus;
  seats: PublicRoomSeat[];
  maxSeats: number;
  isStarted: boolean;
}
