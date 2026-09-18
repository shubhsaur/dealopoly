# Article Review — "What I Learned From Building a Multiplayer Card Game"

> Source article: <https://dev.to/shubhsaur/what-i-learned-from-building-a-multiplayer-card-game-4had>
>
> This document walks through the article section by section and cross-references every
> technical claim against the actual codebase (`apps/game-server`, `packages/game-engine`,
> `packages/redis`, `packages/db`, `packages/shared`, `apps/web`).
>
> Each item is classified as:
>
> - ✅ **Handled perfectly** — claim fully backed by the code
> - 🔶 **Can still improve** — implemented, but with known rough edges
> - ❌ **Not handled yet** — gap relative to the article's own framework / project plans

---

## ✅ Handled Perfectly

| # | Article claim | Evidence in codebase |
|---|---|---|
| §1 | **Server-authoritative state** — browser requests, server decides | `apps/game-server/src/server.ts` routes every command through `RoomManager.applyCommand()` → `getGameEngine(gameType).applyCommand()`. The client only sends `{ type: "COMMAND", command }` (`apps/web/src/lib/use-game-socket.ts`). |
| §2 | **Client treated as untrusted input** | Server checks room membership, seat ownership, and turn validity before touching the engine; the engine's `applyCommand` re-validates legality (`packages/game-engine/src/games/monodeal/rules/*.ts`). The article's checklist (in room? their turn? command legal? target valid? state accepts?) maps 1:1 onto `rooms/manager.ts` + engine guards. |
| §3 | **Engine separated from the WebSocket server** | `packages/game-engine/src/core.ts` — pure `IGameEngine` interface: `createGame` / `applyCommand(state, command)` / `getMaskedView` / `computeBotAction`. Zero imports of Fastify, `ws`, Redis, or the DB in the engine package. Rules are testable without any server (14 test files in `packages/game-engine/test/`). |
| §4 | **Deterministic rules, explicit rule modules** | The exact modules listed in the article exist: `rules/setup.ts`, `draw.ts`, `property.ts`, `rent.ts`, `payment.ts`, `reactions.ts`, `win-condition.ts` (plus `actions.ts`, `discard.ts`). Deterministic shuffle via seeded Mulberry32 PRNG (`games/monodeal/deck/shuffle.ts`). |
| §5 | **Reactions modeled as a state machine, not hidden in a function** | `pendingResolution` is explicit state with types `reaction_window`, `payment`, `discard`, plus nested `jsnSubResolution` with `justSayNoChainCount` for counter-chains — exactly the article's "pause / counter / new window / resolve" diagram. Heavily tested (`reactions.test.ts`, `birthday-rent-jsn.test.ts`). |
| §6 | **Per-player masked views; masking beyond hiding hands** | `games/monodeal/masking.ts` hides opponent hands (`hand: undefined`, only `handCount`) **and** does viewer-dependent card representation: property-wild cards are shown to opponents only via their currently-visible color, hiding the hidden side — exactly the article's "same state, different representations" point. Also implemented for Least Count (`games/least-count/masking.ts`). |
| §7 | **Disconnect state machine: CONNECTED → DISCONNECTED → reconnect or BOT/LEAVE** | `packages/redis/src/timers.ts` (5-minute TTL grace period), `rooms/manager.ts` `handleDisconnectTimeout` → converts a guest to a bot, destroys the room if the host abandons; the reconnect path restores the seat ("reconnected and took back their seat"). Tested end-to-end in `apps/game-server/src/disconnect.test.ts`. |
| §8 | **Redis as a coordination layer, not just a cache** | `packages/redis/`: room state + 4h TTL (`rooms.ts`), disconnect timers (`timers.ts`), Pub/Sub across instances (`pubsub.ts`), active-room indexing — matches the article's list exactly. |
| §9 | **Bots use the same engine/commands as humans** | `BotController.getNextBotAction()` returns a normal `GameCommand`, applied through the same `applyCommand` path (`server.ts` bot loop). No `bot.setWinner()` shortcuts. Bot recovery logic synthesizes legal fallback commands (pass/pay/discard) when stuck. |
| §10 | **Simulation harness with deterministic seeds** | `packages/game-engine/test/simulation.test.ts` runs full bot games to completion through the engine with safety guards; all tests use fixed seeds (`seed: 400`, etc.). `createGame` takes a seed; the server generates one at game start. |
| §11 | **Persistence vs. realtime state split** | Clean split: Redis = ephemeral (rooms, timers, pub/sub), Postgres = durable (`packages/db/schema.ts`: users, leaderboard entries, rooms with `expiresAt`). |
| §12 | **Monorepo boundaries, not folders** | The article's responsibility table is literally the repo: `apps/web`, `apps/game-server`, `packages/game-engine`, `packages/db`, `packages/redis`, `packages/shared`, `packages/ui`. The engine never imports server/db/redis code. |
| §13 | **Edge-case interactions (disconnect × timer × pending reaction)** | Dedicated bot-recovery code in `server.ts` handles exactly this: a disconnected player converted to a bot mid-`reaction_window`/payment/discard gets synthesized legal commands. `disconnect.test.ts` tests bot takeover during pending reactions. |
| §14 | **Principles** (pure domain, untrusted clients, explicit intermediate states, design for disconnects, test transitions) | All demonstrably followed — the engine is pure, `pendingResolution` is explicit, the disconnect flow is first-class, and most tests are state-transition tests, not screen tests. |

---

## 🔶 Handled, But Can Still Improve

### 1. Disconnect timer dual-tracking
- **Current state:** Redis TTL key (durable signal) **+** in-process `setTimeout` (executor) in `rooms/manager.ts`. If the instance dies mid-grace-period, hydration restores the room but the 5-minute countdown effectively restarts; TTL expiry relies on a polling loop rather than Redis keyspace notifications.
- **Improvement:** Use Redis keyspace notifications or a shared expirations stream so *any* instance fires the timeout exactly once.

### 2. Client reconnect UX
- **Current state:** Client `ws.onclose` just sets `isConnected = false` and shows "Reconnecting..." — **no automatic reconnection/backoff**. The user must refresh, which works (session token reclaims the seat) but is manual. The UI literally says "Reconnecting..." while nothing is retrying (`apps/web/src/lib/use-game-socket.ts`).
- **Improvement:** Add auto-reconnect with exponential backoff, reusing the stored `playerId` + `sessionToken`.

### 3. Reaction-window deadline enforcement
- **Current state:** `deadline` fields exist in state and the client shows countdowns (`use-reaction-timer.ts`, defaults to 7s), but server-side enforcement appears to be "auto-pass via the bot loop" for bots only. A connected human who goes AFK during a reaction window can stall the game.
- **Improvement:** Server-enforced reaction expiry — on deadline, auto-`pass` for humans too.

### 4. WebSocket payload schema validation
- **Current state:** Engine validation is strong, but there is no schema validation (no zod/ajv) on raw WebSocket payloads — malformed JSON/unknown types are handled ad hoc (`try/catch`, silent ignore).
- **Improvement:** Add a discriminated-union schema parse at the socket boundary; reject with structured error codes.

### 5. Determinism / replay story
- **Current state:** Seeds make games reproducible and `history` exists in state, but there is no stored command log per game — so "replay the exact sequence that failed" (§10's promise) works in tests but not for production games.
- **Improvement:** Persist the command stream per game (append to Postgres) → production replay + anti-cheat audit trail.

### 6. Command idempotency / stale commands
- **Current state:** §13 mentions "a stale client can send a command after another player has already changed the state" — the engine rejects most of these naturally, but there are no client command sequence numbers/idempotency keys, so a retried command after a reconnect could double-apply if it arrives twice in a valid window.
- **Improvement:** Add per-client monotonic `seq` + dedupe on the server.

### 7. Repo hygiene (ironic given §12)
- **Current state:** Literal duplicated directories committed: `apps/web/src/app 2/`, `packages/game-engine/src/rules 2/`, `packages/game-engine/src/deck 2/` — likely a bad merge/Finder duplicate.
- **Improvement:** Delete them; they confuse exactly the "boundaries" story the article celebrates.

### 8. CORS
- **Current state:** `origin: cb(null, true)` — any origin allowed, with credentials (`server.ts`).
- **Improvement:** Restrict to known frontend origins in production.

---

## ❌ Not Handled Yet (Prioritized)

Gaps relative to the article's own framework and the project's `IMPLEMENTATION_PLAN.md`,
ordered by priority (player-facing impact × security risk × effort):

### P1 — Server-side turn timers ✅ IMPLEMENTED
- **Impact: critical (game-stalling).** Only disconnect timers existed — no per-turn deadline, so an idle *connected* active player blocked a room forever. The article lists "timers" as a core hard problem; only the disconnect half was solved.
- **Implemented:**
  - **Engine (pure, additive):** `getIdleActorIds(state)` (who the game is waiting on: reaction waiters incl. JSN sub-chains, unpaid debtors, discarding player, or the active player) and `getIdleMove(state, playerId)` (the safe fallback: pass / pay / discard / draw / end-turn — **never** a strategic card play). Added to the `IGameEngine` contract as optional; implemented for both `monodeal` and `least_count`.
  - **Redis (`packages/redis/src/turn-timers.ts`):** durable TTL signal per room, mirroring the disconnect-timer design.
  - **RoomManager:** `stampTurnTimer` (synchronous, before persist/broadcast so clients receive `turnDeadline` with the state change) → `armTurnTimer` (Redis TTL + local `setTimeout`) → `handleTurnTimeout` (stale-fire guard via a monotonic `turnTimerEpoch`, applies the idle move through the normal `applyCommand` path so events/persistence/broadcast/bot-scheduling behave exactly like a human move, and broadcasts an `IDLE_TIMEOUT` notice). Timers are cleared on abandon and on server close, and re-armed in `hydrateOnBoot` so a restart can't resurrect a stall.
  - **Budgets (env-overridable):** `TURN_TIMEOUT_MS` 60s (whole turn), `DECISION_TIMEOUT_MS` 30s (resolutions without a deadline), plus `DECISION_GRACE_MS` 2s on engine-provided reaction deadlines so the client's own countdown always wins the race.
- **Bonus security fix found during implementation:** `applyCommand` never verified that the authenticated `playerId` matched `command.playerId` — a modified client could **impersonate another player** (contradicting the article's §2). Added a caller-ownership + seat-membership guard in `RoomManager.applyCommand` (all existing callers, including the bot loop and this timer, already send matching ids). Tested in `apps/game-server/src/turn-timer.test.ts` (8 tests) and `packages/game-engine/test/idle-move.test.ts` (11 tests).

### P2 — Rate limiting / abuse protection ✅ IMPLEMENTED
- **Impact: high (production abuse vector).** `IMPLEMENTATION_PLAN.md` Phase 3 explicitly lists "Add rate limits and validation to protect room creation and joining". The game is publicly deployed; room creation and WS messages were unthrottled.
- **Implemented:** `@fastify/rate-limit` for HTTP (global 200/min per IP, stricter 20/min on `POST /api/rooms` and `/api/rooms/join`) + a per-socket WS token bucket (`src/ws-rate-limit.ts`, burst 30 / refill 10/s / 16 KB cap / 3-strike close). Tested in `src/ws-rate-limit.test.ts` and the `HTTP rate limiting` suite in `src/server.test.ts`.

### P3 — Spectator masking audit ✅ IMPLEMENTED
- **Impact: high (hidden-info leak = cheating).** The article never mentions **spectators**, but the code has a full spectator flow (`useSpectatorSocket`, spectator registries in `rooms/manager.ts`). Masking for *spectator* viewers (who should see less than any player) was not differentiated from player masking. §6's whole point is that representation must depend on the viewer — spectators are the least-privileged viewer.
- **Audit finding:** spectators already received a fully hand-hidden view, **but** `pendingResolution` was passed through verbatim, and `ReactionResolution` embeds `actionCard` / `targetCard` / `swappedCard` / `targetPropertySetCards` — which can reference cards in a **player's hidden hand** (e.g. Deal Breaker / Sly Deal targets).
- **Implemented:** engine-level `getSpectatorView(state)` (pure, in `packages/game-engine/src/games/monodeal/masking.ts`) that reuses the standard masking and reduces `pendingResolution` to a card-free `SpectatorPendingResolution`, plus a `viewerKind: "spectator"` marker. Added to the `IGameEngine` interface (optional, with a safe fallback) and implemented for both `monodeal` and `least_count`. All **3** spectator broadcast call sites in `apps/game-server` now use it. Tested in `packages/game-engine/test/spectator-masking.test.ts` (5 tests) and the `Spectator masking` integration suite in `apps/game-server/src/server.test.ts`.

### P4 — Observability / metrics
- **Impact: high (debuggability of §13 bugs).** The plan says "Instrument connection, command rejection, game completion, and reconnect events" — not done beyond Fastify's default logger. The hardest bugs (disconnect × timer × pending reaction) are invisible in production without this.
- **Effort: medium.** Structured log events for the four planned categories; optionally Prometheus/OpenTelemetry export.

### P5 — WS-layer session hardening
- **Impact: medium (requires a token leak first).** Anonymous guest sessions are fine by design (ADR-003 in `docs/architecture-decisions.md`), but there is no protection against seat-hijacking if a session token leaks (no rotation, no device heuristics beyond the `DEVICE_TRANSFERRED` flow).
- **Effort: medium.** Session-token rotation on reconnect + optional signed server-issued seat tokens.

### P6 — Human turn pacing
- **Impact: medium (UX noise, not correctness).** Bots get 450ms pacing delays; humans get no minimum move time / animation-lock protection, so rapid double-clicks rely entirely on engine rejection (works, but produces noisy error traffic).
- **Effort: low.** Client-side action lock during in-flight commands + optional short server-side debounce.

### P7 — Browser-level E2E tests
- **Impact: medium (confidence, not a live defect).** Engine simulations + server integration tests exist, but no browser-level E2E (e.g. Playwright) covering reconnect-via-refresh, spectator flows, and completed human matches as the plan calls for.
- **Effort: high.** Playwright harness driving two browser contexts against a local server.

### P8 — Load testing / capacity targets
- **Impact: low today, high at scale.** Explicitly in the plan ("Load-test concurrent rooms and establish capacity targets") — no load tests exist. The Pub/Sub multi-instance path is coded but unvalidated at scale.
- **Effort: high.** Scripted WS clients (e.g. k6 with the WebSocket API) simulating N concurrent rooms.


---

## Summary Scorecard

| Category | Verdict |
|---|---|
| ✅ Handled perfectly | All 15 sections' core claims are genuinely implemented — server authority, pure engine, explicit reaction state machine, per-viewer masking, disconnect grace/bot takeover, Redis-as-coordination, bot parity, seeded simulations, persistence split, monorepo boundaries. |
| 🔶 Can still improve | Client auto-reconnect, single-source disconnect timers, human reaction deadlines, WS payload schema validation, command idempotency, CORS tightening, and deleting the stray `* 2` duplicate directories. |
| ❌ Not handled yet | ~~P1–P3~~ → **P1, P2, P3 are now IMPLEMENTED** (see below). Still open, in priority order: P4: observability/metrics · P5: WS session hardening · P6: human turn pacing · P7: browser E2E tests · P8: load testing. |

**Overall:** the article is honest — nothing it claims is vaporware. The gaps are almost all
items `IMPLEMENTATION_PLAN.md` already acknowledged but deferred (rate limits, instrumentation,
load tests), plus a few hardening items (idempotency, AFK timers, spectator masking) that the
article's own "the edges are the real product" philosophy points at next.

