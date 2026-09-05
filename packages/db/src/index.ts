/**
 * @dealopoly/db — public API
 *
 * Re-exports the Drizzle client, schema tables, helpers, and inferred types.
 */

export { db, getDb } from "./client.js";
export type { Db } from "./client.js";

export {
  users,
  accounts,
  sessions,
  verificationTokens,
  players,
  rooms,
  roomSeats,
  games,
  gameEvents,
  gameSnapshots,
  gameCommands,
} from "./schema.js";

export {
  eq,
  ne,
  ilike,
  inArray,
  sql,
  desc,
  asc,
  and,
  or,
  not,
  count,
} from "drizzle-orm";

export type {
  User,
  NewUser,
  Account,
  NewAccount,
  Session,
  NewSession,
  VerificationToken,
  NewVerificationToken,
  Player,
  NewPlayer,
  Room,
  NewRoom,
  RoomSeat,
  NewRoomSeat,
  Game,
  NewGame,
  GameEvent,
  NewGameEvent,
  GameSnapshot,
  NewGameSnapshot,
  GameCommand,
  NewGameCommand,
} from "./schema.js";
