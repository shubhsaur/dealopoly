# Redis Integration Plan (Upstash)

## Context

Currently all active game room state lives in a single Node.js process's memory:

```typescript
// apps/game-server/src/rooms/manager.ts
export class RoomManager {
  private rooms = new Map<string, Room>();          // ← single process RAM
  private disconnectTimers = new Map<string, NodeJS.Timeout>();
```

This means horizontal scaling is broken — if two server instances run, a room created on Instance 1 is invisible to Instance 2. A server crash loses all in-progress games.

## What We Are Replacing

| Current (in-memory) | Target (Redis) |
|---|---|
| `Map<string, Room>` | Redis JSON keys (`room:{code}`) |
| `Map<string, NodeJS.Timeout>` disconnect timers | Redis TTL keys |
| `setInterval` `sweepIdleRooms()` | Redis key TTL auto-expiry |
| Direct in-process WebSocket broadcast | Redis Pub/Sub channels |
| `hydrateRoomsFromDb()` on boot | Hydrate from Redis, fall back to Neon |

## Redis Provider

**Upstash** — serverless Redis, pay-per-request, free tier suitable for development and moderate production load. Works via REST client (`@upstash/redis`) — no persistent TCP connection needed.

---

## Phases

### Phase 1 — Setup & Infrastructure
**Goal: Redis client package wired up, env vars in place, nothing broken yet**

- [x] Create `packages/redis/` — new shared package with Upstash client
- [x] Add `@upstash/redis` dependency to the new package
- [x] Add env vars to `.env.example`:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- [x] Wire `@dealopoly/redis` into `apps/game-server` dependencies
- [x] Add a `/api/redis-health` endpoint to verify the connection works
- [x] **No game logic changes in this phase**

---

### Phase 2 — Room State in Redis
**Goal: `RoomManager` reads/writes room state from Redis instead of in-memory Map**

- [x] Replace `private rooms = new Map<string, Room>()` with Redis-backed helpers
- [x] `createRoom()` → `redis.set("room:{code}", JSON.stringify(room), { ex: 14400 })` (4hr TTL)
- [x] `getRoom()` → `redis.get("room:{code}")`
- [x] `joinRoom()`, `addBot()`, `removePlayer()`, `startGame()`, `applyCommand()` → read → mutate → write back to Redis
- [x] Keep `safeRedis()` pattern (mirrors existing `safeDb()`) — if Redis unavailable, fall back to in-memory with a warning log
- [x] **Game commands still work; no Pub/Sub yet** (single instance only at this stage)

---

### Phase 3 — Disconnect Timers & Room Expiry via Redis TTL
**Goal: Replace `disconnectTimers Map` and `sweepIdleRooms()` with Redis TTL**

- [ ] Replace `disconnectTimers = new Map<string, NodeJS.Timeout>()` with Redis keys
  - `redis.set("disconnect:{code}_{playerId}", "1", { ex: 300 })` instead of `setTimeout`
  - Clear timer: `redis.del("disconnect:{code}_{playerId}")`
- [ ] Remove `sweepIdleRooms()` entirely — room keys auto-expire after 4 hours via TTL
- [ ] Refresh TTL on every room activity: `redis.expire("room:{code}", 14400)`
- [ ] Handle expiry-triggered cleanup (abandon room / convert player to bot) via polling or Upstash keyspace notifications

---

### Phase 4 — Redis Pub/Sub for Cross-Instance Broadcasting
**Goal: Multiple server instances can broadcast game state to each other's WebSocket clients**

- [ ] Each server instance subscribes to `room:{code}:events` Redis channel on room attach
- [ ] After `applyCommand()` / `startGame()` / any state mutation: publish update event to Redis channel instead of broadcasting directly
- [ ] Each instance's subscriber receives the published event, finds its locally connected WebSocket clients for that room, and sends them the masked game state
- [ ] This is the key step that enables true horizontal scaling — any instance can serve any player
- [ ] Use `ioredis` with Upstash Redis URL for pub/sub (Upstash REST client does not support pub/sub)

---

### Phase 5 — Server Hydration from Redis
**Goal: On server boot, hydrate active rooms from Redis instead of Neon Postgres**

- [ ] Replace `hydrateRoomsFromDb()` — scan Redis for `room:*` keys instead of querying Postgres
- [ ] Redis becomes the source of truth for live state; Neon Postgres stays as the audit/history log
- [ ] Safety net: if Redis is cold (no keys), fall back to Neon Postgres hydration
- [ ] Add startup log: `[Hydration] Restored N rooms from Redis`

---

### Phase 6 — Testing & Hardening
**Goal: Verify correctness and handle all edge cases**

- [ ] Test reconnect flow: player disconnects → bot takes over → player reconnects → bot reverts
- [ ] Test server restart with active rooms (hydration from Redis)
- [ ] Test two-instance scenario locally (two processes on different ports sharing same Redis)
- [ ] Handle Redis connection failures gracefully — fall back to in-memory, log a clear warning
- [ ] Add Redis stats to `/api/stats` endpoint (ping latency, key count)
- [ ] Remove old in-memory sweep code and dead code
- [ ] Update `.env.example`, `README.md`, and `IMPLEMENTATION_PLAN.md`

---

## Dependency Order

```
Phase 1 (infrastructure)
  └── Phase 2 (room state in Redis)
        └── Phase 3 (timers & expiry via TTL)
              └── Phase 4 (pub/sub cross-instance broadcast)
                    └── Phase 5 (server boot hydration from Redis)
                          └── Phase 6 (testing & hardening)
```

Each phase depends on the previous. They must be implemented in order.

---

## Environment Variables Required

```env
# Upstash Redis (get from https://console.upstash.com)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

## Key Redis Schema

| Key Pattern | Value | TTL |
|---|---|---|
| `room:{code}` | JSON-serialized `Room` object | 4 hours (reset on activity) |
| `disconnect:{code}_{playerId}` | `"1"` | 5 minutes |
| `room:{code}:events` | Pub/Sub channel | N/A |

---

## Progress Tracker

| Phase | Status |
|---|---|
| Phase 1 — Setup & Infrastructure | ✅ Done |
| Phase 2 — Room State in Redis | ✅ Done |
| Phase 3 — Timers & Expiry via TTL | ⬜ Not started |
| Phase 4 — Pub/Sub Broadcasting | ⬜ Not started |
| Phase 5 — Boot Hydration from Redis | ⬜ Not started |
| Phase 6 — Testing & Hardening | ⬜ Not started |
