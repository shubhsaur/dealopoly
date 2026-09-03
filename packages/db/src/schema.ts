/**
 * Dealopoly — Drizzle ORM Schema
 *
 * Tables:
 *   NextAuth (Auth.js) Tables:
 *     - users
 *     - accounts
 *     - sessions
 *     - verificationTokens
 *
 *   Dealopoly Game Engine & Real-Time Tables:
 *     - players (supports both guests and authenticated users via user_id)
 *     - rooms
 *     - room_seats
 *     - games
 *     - game_events
 *     - game_snapshots
 *     - game_commands
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  smallint,
  integer,
  bigserial,
  jsonb,
  timestamp,
  char,
  unique,
  check,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// 0. NextAuth: users
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  password: text("password"),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires", { withTimezone: true }),
  customTag: text("custom_tag"),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 0. NextAuth: accounts
// ---------------------------------------------------------------------------
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

// ---------------------------------------------------------------------------
// 0. NextAuth: sessions
// ---------------------------------------------------------------------------
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

// ---------------------------------------------------------------------------
// 0. NextAuth: verification_tokens
// ---------------------------------------------------------------------------
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// ---------------------------------------------------------------------------
// 1. players
//    One row per browser identity — human OR bot.
//    If the player is signed in, userId points to users.id.
//    If playing as guest, userId is NULL.
// ---------------------------------------------------------------------------
export const players = pgTable("players", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  displayName: text("display_name").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  isBot: boolean("is_bot").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 2. rooms
//    The lobby + game container. Maps to Room in rooms/types.ts.
// ---------------------------------------------------------------------------
// 2. rooms
//    The lobby + game container. Maps to Room in rooms/types.ts.
// ---------------------------------------------------------------------------
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    code: char("code", { length: 6 }).notNull().unique(),
    gameType: text("game_type").notNull().default("monodeal"),
    config: jsonb("config"),
    hostPlayerId: uuid("host_player_id")
      .notNull()
      .references(() => players.id),
    status: text("status").notNull().default("lobby"),
    maxSeats: smallint("max_seats").notNull().default(5),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '4 hours'`),
  },
  (t) => [
    check("rooms_status_check", sql`${t.status} IN ('lobby','in_progress','completed','abandoned')`),
  ]
);

// ---------------------------------------------------------------------------
// 3. room_seats
//    Which player is in which seat. Maps to RoomSeat.
// ---------------------------------------------------------------------------
export const roomSeats = pgTable(
  "room_seats",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    seatIndex: smallint("seat_index").notNull(),
    sessionToken: text("session_token").notNull(),
    difficulty: text("difficulty"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("room_seats_room_seat_idx").on(t.roomId, t.seatIndex),
    unique("room_seats_room_player_idx").on(t.roomId, t.playerId),
  ]
);

// ---------------------------------------------------------------------------
// 4. games
// ---------------------------------------------------------------------------
export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    roomId: uuid("room_id")
      .notNull()
      .unique()
      .references(() => rooms.id),
    gameType: text("game_type").notNull().default("monodeal"),
    seed: integer("seed").notNull(),
    status: text("status").notNull().default("in_progress"),
    playerOrder: uuid("player_order").array().notNull(),
    winnerId: uuid("winner_id").references(() => players.id),
    turnCount: integer("turn_count").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    check("games_status_check", sql`${t.status} IN ('in_progress','completed','abandoned')`),
  ]
);

// ---------------------------------------------------------------------------
// 5. game_events
// ---------------------------------------------------------------------------
export const gameEvents = pgTable(
  "game_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    sequenceNum: integer("sequence_num").notNull(),
    eventType: text("event_type").notNull(),
    playerId: uuid("player_id").references(() => players.id),
    payload: jsonb("payload").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("game_events_game_seq_idx").on(t.gameId, t.sequenceNum),
  ]
);

// ---------------------------------------------------------------------------
// 6. game_snapshots
// ---------------------------------------------------------------------------
export const gameSnapshots = pgTable(
  "game_snapshots",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    afterSequence: integer("after_sequence").notNull(),
    stateJson: jsonb("state_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("game_snapshots_game_seq_idx").on(t.gameId, t.afterSequence),
  ]
);

// ---------------------------------------------------------------------------
// 7. game_commands
// ---------------------------------------------------------------------------
export const gameCommands = pgTable("game_commands", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  sequenceNum: integer("sequence_num").notNull(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  commandType: text("command_type").notNull(),
  payload: jsonb("payload").notNull(),
  accepted: boolean("accepted").notNull().default(true),
  rejectionReason: text("rejection_reason"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type RoomSeat = typeof roomSeats.$inferSelect;
export type NewRoomSeat = typeof roomSeats.$inferInsert;

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export type GameEvent = typeof gameEvents.$inferSelect;
export type NewGameEvent = typeof gameEvents.$inferInsert;

export type GameSnapshot = typeof gameSnapshots.$inferSelect;
export type NewGameSnapshot = typeof gameSnapshots.$inferInsert;

export type GameCommand = typeof gameCommands.$inferSelect;
export type NewGameCommand = typeof gameCommands.$inferInsert;
