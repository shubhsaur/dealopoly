# Dealopoly Game Hub: Public Lobbies & Leaderboards

## 1. Overview

This plan adds two high-impact multiplayer features to the Dealopoly game hub:

1. **Public Lobbies** — A browsable list of open rooms that players can join without an invite code.
2. **Per-Game Leaderboards** — Ranked standings for each supported game (Monodeal, Lowdeck), updated after every completed match.

Both features build on the existing room/Redis/Drizzle stack and require minimal architectural changes.

## 2. Goals

- **Reduce friction**: Let players join an active game in one click.
- **Increase retention**: Give players a reason to keep playing (rankings, win streaks).
- **Stay game-agnostic**: Support Monodeal and Lowdeck independently.
- **Preserve privacy**: Keep private rooms invite-only; public opt-in only.

## 3. Non-Goals

- Full skill-based matchmaking (ELO) for v1.- Real-time spectator lobbies (can reuse the existing spectator flow).
- In-app friends list / clubs (out of scope, but designed to be additive).

## 4. Current State

- Rooms are created with `isPrivate` (defaults from user settings) and stored in Postgres + Redis.
- Room status is `lobby` → `in_progress` → `completed`/`abandoned`.
- Game results are persisted via the existing match-history flow.
- The `game-server` already exposes `/api/stats` and room state via WebSocket.

## 5. Public Lobbies

### 5.1 Core Behaviour

- Hosts can mark a room as **Public** when creating it.
- Public rooms in `lobby` status appear on the `/lobby` page and a new `/lobbies` page.
- Players can browse, filter by game, and join a public room directly.
- Public rooms still respect `maxSeats`.
- Once a game starts, the room drops off the public list but can still be spectated.

### 5.2 Data Model Changes

Add to `packages/db/src/schema.ts`:

```ts
export const rooms = pgTable("rooms", {
  // ... existing columns ...
  isPublic: boolean("is_public").notNull().default(false),
  name: text("name"), // optional public room name, e.g. "Shubham's Room"
});
```

Add a Drizzle migration for the new columns.

### 5.3 Server Changes

#### `apps/game-server/src/rooms/manager.ts`

- Add `isPublic?: boolean` and `roomName?: string` to create-room options.
- On room creation, store `isPublic` in both Postgres and Redis.
- When a room leaves `lobby` status, remove it from the public set.
- Add `getPublicRooms(gameType?: string)`:
  - Query Redis for all room codes with `status=lobby` and `isPublic=true`.
  - Return a lightweight list: `code`, `name`, `gameType`, `playerCount`, `maxSeats`, `hostName`.

#### `apps/game-server/src/server.ts`

Add endpoints:

- `GET /api/lobbies?game=monodeal|least_count`
  - Returns public open rooms.
- `POST /api/rooms/:code/join-public` (or reuse existing join with a flag)
  - Validates the room is public and in `lobby` state.
  - Returns the same join payload as a private invite join.

### 5.4 Redis Additions

- `room:<code>:public` — boolean flag.
- `public:rooms:<game>` — sorted set of public room codes by creation timestamp, or use the existing room scan with a filter.

Simpler approach for v1: scan `room:*:status == lobby` and filter by `room:*:public == true`.

### 5.5 Frontend

#### New Page: `apps/web/src/app/lobbies/page.tsx`

- List public rooms in a card grid.
- Filters: game type, room name search, hide full rooms.
- Columns: room name, host, players/max, game type, “Join” button.
- Polling every 5 s or Server-Sent Events (SSE) for near-real-time updates.

#### Lobby Creation (`apps/web/src/app/lobby/page.tsx`)

- Add a **Public / Private** toggle when creating a room.
- Optional room name input for public rooms.

#### Navigation

- Add “Public Lobbies” link in the marketing nav and app sidebar.

### 5.6 UX Details

- Public rooms auto-abandon after 30 min inactivity if no human players remain.
- Hosts can switch a room from public to private only while still in `lobby`.
- Display a lock icon on private rooms in the host’s lobby UI.

## 6. Leaderboards

### 6.1 Core Behaviour

- Each game has its own leaderboard: **Monodeal**, **Lowdeck**.
- Rank players by a score derived from wins, matches played, and win rate.
- Update asynchronously after a match ends.
- Show top 100 players plus the current logged-in player’s rank.

### 6.2 Monodeal Scoring Formula

```
score = (wins × 100)
      + (winRate × 200)
      + (avgFinishBonus × 20)
      + (sqrt(gamesPlayed) × 20)
      + (completedSets × 5)
```

**1. wins** — total Monodeal games won.
- Contribution: `wins × 100`.

**2. winRate** — `wins / gamesPlayed` (decimal `0` to `1`).
- Contribution: `winRate × 200`.

**3. avgFinishBonus** — derived from the player's average finishing position in a 4-player game.
- Use linear interpolation between the reference points below:

| Avg Finish | Bonus Base |
|-----------|------------|
| 1.0       | 100        |
| 1.5       | 75         |
| 2.0       | 50         |
| 2.5       | 25         |
| 3.0       | 10         |
| 3.5       | 0          |
| 4.0       | -25        |

- Contribution: `avgFinishBonus × 20`.

**4. gamesPlayed** — total completed Monodeal games.
- Contribution: `sqrt(gamesPlayed) × 20` (diminishing returns).
- If `gamesPlayed === 0`, treat this term as `0` and `winRate` as `0`.

**5. completedSets** — total property sets completed across recorded games.
- Contribution: `completedSets × 5` (kept intentionally small; winning is the primary reward).

**Tie-breaker:** higher score first, then more recent win, then higher wins.

**Important:** implement a single reusable `calculateMonodealScore(...)` function. Use it everywhere the score is generated, queried, sorted, or displayed. Add unit tests to keep the formula deterministic.

#### Example

For a player with:
- `wins = 42`
- `gamesPlayed = 80`
- `winRate = 42 / 80 = 0.525`
- `avgFinish = 1.8` → interpolated `avgFinishBonus` between 1.5 (`75`) and 2.0 (`50`) = `65`
- `completedSets = 100`

```
score = (42 × 100) + (0.525 × 200) + (65 × 20) + (sqrt(80) × 20) + (100 × 5)
      = 4200 + 105 + 1300 + 178.88 + 500
      = 6283.88
```

### 6.3 LowDeck Scoring Formula

```
score = (wins × 100)
      + (winRate × 200)
      + (avgFinishBonus × 20)
      + (sqrt(gamesPlayed) × 20)
```

**1. wins** — total LowDeck games won.
- Contribution: `wins × 100`.

**2. winRate** — `wins / gamesPlayed` (decimal `0` to `1`).
- Contribution: `winRate × 200`.

**3. avgFinishBonus** — derived from the player's average finishing position in a 4-player game.
- Use linear interpolation between the reference points below:

| Avg Finish | Bonus Base |
|-----------|------------|
| 1.0       | 100        |
| 1.5       | 75         |
| 2.0       | 50         |
| 2.5       | 25         |
| 3.0       | 10         |
| 3.5       | 0          |
| 4.0       | -25        |

- Contribution: `avgFinishBonus × 20`.

**4. gamesPlayed** — total completed LowDeck games.
- Contribution: `sqrt(gamesPlayed) × 20` (diminishing returns).
- If `gamesPlayed === 0`, treat this term as `0` and `winRate` as `0`.

**Tie-breaker:** higher score first, then more recent win, then higher wins.

**Important:** implement a single reusable `calculateLowdeckScore(...)` function. Use it everywhere the score is generated, queried, sorted, or displayed. Add unit tests to keep the formula deterministic.

#### Example

For a player with:
- `wins = 30`
- `gamesPlayed = 50`
- `winRate = 30 / 50 = 0.60`
- `avgFinish = 1.8` → interpolated `avgFinishBonus` between 1.5 (`75`) and 2.0 (`50`) = `60`

```
score = (30 × 100) + (0.60 × 200) + (60 × 20) + (sqrt(50) × 20)
      = 3000 + 120 + 1200 + 141.42
      = 4461.42
      ≈ 4461
```

### Edge Cases (Both Formulas)

- If `gamesPlayed === 0`, the score must resolve to `0` safely.
- Avoid division by zero.
- Use one reusable/shared function per game.
- Round the final score to the nearest integer before storing or displaying.
- Add unit tests covering `0`, `1`, `5`, `20`, and `100+` games.

### 6.4 Data Model Changes

Add `leaderboard_entries` table:

```ts
export const leaderboardEntries = pgTable(
  "leaderboard_entries",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    gameType: text("game_type").notNull(), // "monodeal" | "least_count"
    matches: integer("matches").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    avgFinish: real("avg_finish").notNull().default(0),
    completedSets: integer("completed_sets").notNull().default(0),
    score: integer("score").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("leaderboard_user_game_idx").on(t.userId, t.gameType)]
);

export const leaderboardEntryIndexes = pgIndex("leaderboard_game_score_idx")
  .on(leaderboardEntries.gameType, leaderboardEntries.score)
  .desc();
```

### 6.5 Updating Leaderboards

Hook into the existing match-end flow in `apps/game-server/src/rooms/manager.ts`:

1. When a room reaches `completed` status and has human players:
   - Identify winners, losers, finishing positions, and total completed property sets per player.
   - For each human player:
     - Upsert a `leaderboard_entries` row for the game type.
     - Increment `matches`.
     - Increment `wins` if the player won.
     - Add the player's completed sets to `completedSets` (Monodeal only).
     - Update `avgFinish` with the new running average finishing position.
     - Recalculate `score` using the shared `calculateMonodealScore(...)` or `calculateLowdeckScore(...)` function, depending on `gameType`.
2. Run in a background job or within the same transaction; it is cheap for v1.

### 6.6 API Endpoints

In `apps/web/src/app/api/` or game-server:

- `GET /api/leaderboard?game=monodeal|least_count&limit=100`
  - Returns top entries plus `currentUserRank` if authenticated.
- `GET /api/leaderboard/profile?game=monodeal|least_count`
  - Returns the current user’s stats and rank.

### 6.7 Frontend

#### New Page: `apps/web/src/app/leaderboard/page.tsx`

- Tab switcher: Monodeal / Lowdeck.
- Table showing rank, player name/avatar, score, wins, win rate, average finish, games played.
- Highlight the current user if logged in.
- Pagination or “Load more”.
- **Do not expose the raw scoring formula in the UI.**

#### Player Profile

- Add a small leaderboard card on `/profile`: rank, wins, matches per game.

## 7. API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lobbies?game=` | List public rooms |
| POST | `/api/rooms/:code/join` | Join public/private room (reuse) |
| GET | `/api/leaderboard?game=` | Top players |
| GET | `/api/leaderboard/profile?game=` | Current user rank |

## 8. Database Migrations

1. Add `is_public` and `name` columns to `rooms`.
2. Create `leaderboard_entries` table and index.
3. (Optional) Backfill `leaderboard_entries` from existing match history if available.

## 9. Security & Abuse

- Rate-limit public-room creation (per IP / user).
- Do not expose room codes for private rooms in public endpoints.
- Validate that a joining player cannot exceed `maxSeats`.
- Leaderboard entries only for authenticated users with verified outcomes (server-trusted).

## 10. Rollout Phases

### Phase 1: Public Lobbies

- DB migration for `rooms.is_public` and `rooms.name`.
- `manager.getPublicRooms()` and Redis support.
- `GET /api/lobbies`.
- New `/lobbies` page with join button.
- Toggle in room creation UI.

### Phase 2: Leaderboards

- DB migration for `leaderboard_entries`.
- Update scores on match completion.
- `GET /api/leaderboard` and profile endpoints.
- New `/leaderboard` page and profile widget.

### Phase 3: Polish

- Real-time lobby list via SSE.
- Leaderboard caching (Redis sorted sets) for top 100.
- Search / filter improvements.

## 11. Decisions

1. **Guests allowed**: Public rooms do not require authentication; guest players can join.
2. **Global leaderboard**: No seasonal resets for v1.
3. **Bot matches excluded**: Matches with bots do not count toward leaderboard stats.
4. **Host kick only**: Only the host who created the public lobby can kick players.

## 12. Files Likely to Change

- `packages/db/src/schema.ts`
- `packages/db/src/migrations/*`
- `apps/game-server/src/rooms/manager.ts`
- `apps/game-server/src/server.ts`
- `apps/web/src/app/lobby/page.tsx`
- `apps/web/src/app/lobbies/page.tsx` (new)
- `apps/web/src/app/leaderboard/page.tsx` (new)
- `apps/web/src/app/profile/page.tsx`
- `apps/web/src/lib/api.ts`
- `apps/web/src/app/globals.css`
