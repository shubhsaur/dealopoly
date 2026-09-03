# Bot Intelligence Improvement Plan

## Current State

Both games (`monodeal` and `least-count`) have a single `BotController` class with one static
method `getNextBotAction(state, botPlayerId)`. Every bot — regardless of name (Atlas, Nova,
Cipher, Vortex) — uses the exact same fixed greedy heuristic. There are no difficulty levels.

### Current Monodeal Bot Flaws

| Flaw | Impact |
|---|---|
| Discards first N cards blindly | Throws away useful cards, keeps low-value ones |
| Wild card always placed on `dark-blue` fallback | Wastes wilds instead of completing real sets |
| Rent targets `opponents[0]` (first in player order) | Ignores who is actually winning |
| Never plays Deal Breaker / Sly Deal / Force Deal | Ignores the most powerful cards in the game |
| Always plays Pass Go regardless of hand size | Wastes an action when hand is already full |
| JSN usage: uses it on any action, even low-value rent | Wastes JSN on $1M rent, gets nothing in return |
| Payment: sometimes overpays with complete sets | Gives away a set that was 1 card from winning |

---

## Architecture Refactor (Required First)

Separate perception from decision-making. Currently everything is one flat function.

```
getNextBotAction(state, botPlayerId, difficulty)
  │
  ├── 1. buildWorldView(state, botPlayerId)      ← what can I observe?
  │         └── OpponentProfile[]               ← threat model per opponent
  │
  ├── 2. generateLegalMoves(state, botPlayerId)  ← what can I legally do?
  │         └── GameCommand[]
  │
  ├── 3. scoreMoves(moves, worldView, difficulty) ← how good is each move?
  │         └── ScoredMove[] (ranked)
  │
  └── 4. selectMove(rankedMoves, difficulty)     ← pick one (add noise for Easy)
```

### WorldView — Publicly Observable State

All of this is visible in the game state. No cheating, no hidden information used.

```typescript
interface OpponentProfile {
  playerId: string;
  completeSets: number;        // how close to winning (need 3)
  incompleteSets: number;      // sets in progress
  totalAssetValue: number;     // how rich they are (bank + property value)
  handCount: number;           // how many cards they hold
  hasPlayedJSN: boolean;       // inferred from visible play history
  mostValuableColor: CardColor;// best color to target with rent
  isWinThreat: boolean;        // completeSets >= 2
}

interface WorldView {
  opponents: OpponentProfile[];
  biggestThreat: OpponentProfile | null; // opponent with most complete sets
  richestOpponent: OpponentProfile | null; // opponent with highest asset value
  myCompleteSets: number;
  myIncompleteSets: number;
  turnsToWin: number; // estimated turns if everything goes perfectly
}
```

### BotDifficulty Type

```typescript
type BotDifficulty = "easy" | "medium" | "hard" | "expert";
```

This lives on the bot's seat record (persisted in Redis), set at room creation time by the host.

---

## Difficulty Levels

### Easy — "Plays Like a New Player"

**Goal:** Makes legal moves but makes clearly suboptimal choices.

| Parameter | Behaviour |
|---|---|
| Move selection | 40% picks best greedy move, 60% picks random legal move |
| JSN usage | Never uses Just Say No |
| Rent targeting | Picks a random opponent |
| Wild card placement | Places on any set without evaluating which is best |
| Payment | Pays randomly, sometimes overpays with complete sets |
| Double Rent | Never uses it |
| Threat awareness | None — ignores opponent progress entirely |
| Action cards | Banks Deal Breaker / Sly Deal instead of playing them |

**Implementation:** Generate all legal moves, assign scores, then with 60% probability pick
uniformly at random instead of the top score.

---

### Medium — "Current Bot, Properly Fixed"

**Goal:** Plays sensibly without strategic mistakes. No forward thinking but no obvious blunders.

**Improvements over current:**

#### Discard (currently: slice first N cards)
```
Sort hand by contribution score:
  - Cards that complete an in-progress set → score: 100 (never discard)
  - Cards matching a color you already have → score: 50
  - Money cards → score: face value
  - Action cards with no current use → score: 5
  - Highest-score-to-discard = lowest contribution score
```

#### Wild card placement (currently: always dark-blue fallback)
```
Evaluate each incomplete set:
  cardsNeededToComplete = set.requiredCount - set.currentCount
  priority = 1 / cardsNeededToComplete  ← fewer cards needed = higher priority
Pick the incomplete set that is closest to completion.
If no incomplete sets exist, start a new set on the most valuable color.
```

#### Rent targeting (currently: opponents[0])
```
Target = richestOpponent (highest totalAssetValue)
Reasoning: maximises actual money collected
```

#### Pass Go (currently: always play it)
```
Only play Pass Go if handSize <= 4
Reasoning: drawing 2 more cards when you already have 7 forces a discard next turn — wasted action
```

#### Action card priority (currently: always banked)
Add as Priority B (before property cards):
```
Deal Breaker  → play if any opponent has a complete set AND you have < 2 complete sets
Sly Deal      → play if stealing the target card completes one of your sets
Force Deal    → play if swapping gives you a card that completes your set
Debt Collector→ play against richestOpponent
```

---

### Hard — "Threat-Aware Player"

**Goal:** Actively tracks which opponent is closest to winning and makes decisions to slow them down.

#### Win Threat Detection
```
Each turn: identify biggestThreat (opponent with most complete sets)
if biggestThreat.completeSets >= 2:
  → Switch to defensive mode:
     - Prioritise rent / Deal Breaker / Sly Deal targeting biggestThreat
     - Save JSN specifically for actions targeting your most complete sets
     - Play Pass Go aggressively to get more counter-cards
```

#### Defensive Property Placement
```
When choosing which color to build:
  - Prefer colors that opponents do NOT have partial sets of
    (they can't Sly Deal / Force Deal toward a set they haven't started)
  - Place wilds on colors opponents are building to block their completion
    (wild on their target color adds a card to your set they'd want to steal)
```

#### Rent Maximisation
```
For each rent card in hand:
  Calculate: rentValue(color) × canDoubleRent
  Choose the color that yields the highest rent payout
  Always pair with Double The Rent if actionsRemaining >= 2
  Target: richestOpponent (maximises actual damage)
```

#### JSN Intelligence
```
Save JSN for:
  - Deal Breaker targeting any of your complete sets → ALWAYS use JSN
  - Debt Collector where amountDue > $4M → use JSN
  - Sly Deal targeting a card that would complete opponent's winning set → use JSN

Do NOT use JSN for:
  - Rent where amountDue <= $3M
  - Sly Deal targeting a card that doesn't complete their set
  - Any action when you have 0 complete sets (nothing to protect yet)
```

#### Action Card Priority (Hard mode full order)
```
1. Deal Breaker    → steal complete set from biggestThreat (if they have completeSets >= 2)
2. Sly Deal        → steal card that completes YOUR set
3. Force Deal      → swap your lowest-value card for opponent's highest-value card
4. Debt Collector  → target richestOpponent
5. Regular property, Pass Go, money, rent (same as Medium)
```

---

### Expert — "2-Move Lookahead"

**Goal:** Simulates consequences of the top N candidate moves 2 turns ahead before deciding.

The existing `applyCommand()` is a **pure function** — it takes state + command, returns new state
with zero side effects. This makes lookahead free to implement — just call it.

```typescript
function scoreWithLookahead(
  state: GameState,
  move: GameCommand,
  botId: string,
  depth: number = 2
): number {
  const { nextState } = applyCommand(state, move);

  if (depth === 0) {
    return evaluatePosition(nextState, botId);
  }

  // Simulate the most dangerous opponent's likely best response (using Hard bot logic)
  const threat = findBiggestThreat(nextState, botId);
  if (threat) {
    const opponentMove = getHardBotMove(nextState, threat.playerId);
    if (opponentMove) {
      const stateAfterOpponent = applyCommand(nextState, opponentMove).nextState;
      return evaluatePosition(stateAfterOpponent, botId);
    }
  }

  return evaluatePosition(nextState, botId);
}

function evaluatePosition(state: GameState, botId: string): number {
  const me = state.players[botId];
  const opponents = Object.values(state.players).filter(p => p.id !== botId);
  const maxOpponentSets = Math.max(...opponents.map(p => p.propertySets.filter(s => s.isComplete).length));

  return (
    me.propertySets.filter(s => s.isComplete).length  * 1000 +  // win progress (highest weight)
    me.propertySets.filter(s => !s.isComplete).length * 150 +   // partial sets in progress
    totalBankValue(me)                                 * 10  +   // money available
    me.hand.length                                     * 5   -   // cards in hand (options)
    maxOpponentSets                                    * 800     // penalise opponent progress
  );
}
```

**Performance constraints:**
- Only evaluate top 5 candidate moves (pre-scored by Hard bot logic) — not all legal moves
- Cap depth at 2 — enough to feel smart, won't block the event loop
- Add a 80ms timeout guard: if lookahead takes longer, fall back to Hard bot result
- The full move tree for a 3-action turn is at most 5³ = 125 nodes at depth 2 — trivial

---

## Implementation Phases

### Phase A — Shared Infrastructure
*Estimated: 1–2 days*

- [ ] Add `BotDifficulty` type to `packages/shared`
- [ ] Add `difficulty` field to `StoredSeat` / `RoomSeat` in `types.ts`
- [ ] Add `difficulty` param to `addBot()` in `RoomManager`
- [ ] Add `difficulty` param to `createRoom()` options
- [ ] Update Redis-persisted room to include per-seat difficulty
- [ ] Implement `buildWorldView(state, botPlayerId): WorldView` as a pure function
- [ ] Implement `generateLegalMoves(state, botPlayerId): GameCommand[]`
- [ ] Update `BotController.getNextBotAction()` signature to accept `difficulty`
- [ ] Update `triggerBotTurns()` in `server.ts` to pass seat difficulty to bot controller

### Phase B — Easy + Medium
*Estimated: 2–3 days*

- [ ] Implement random-noise move selector for Easy
- [ ] Fix discard logic: sort by contribution score
- [ ] Fix wild card placement: evaluate incomplete sets by closeness-to-completion
- [ ] Fix rent targeting: use richestOpponent
- [ ] Fix Pass Go guard: only play if handSize <= 4
- [ ] Add action card priority: Deal Breaker, Sly Deal, Force Deal, Debt Collector
- [ ] Wire Easy and Medium into the new architecture

### Phase C — Hard (Threat-Aware)
*Estimated: 2–3 days*

- [ ] Implement `buildWorldView()` with full `OpponentProfile` threat scoring
- [ ] Implement defensive mode trigger (biggestThreat.completeSets >= 2)
- [ ] Implement JSN save/spend decision logic
- [ ] Implement action card targeting (Deal Breaker against biggest threat)
- [ ] Implement rent color selection by highest payout
- [ ] Wire Hard difficulty

### Phase D — Expert (Lookahead)
*Estimated: 3–4 days*

- [ ] Implement `evaluatePosition(state, botId): number` scoring function
- [ ] Implement `scoreWithLookahead(state, move, botId, depth): number`
- [ ] Add 80ms timeout guard with Hard bot fallback
- [ ] Limit candidate moves to top 5 pre-scored by Hard logic
- [ ] Wire Expert difficulty

### Phase E — Least Count Bot
*Estimated: 1–2 days, independent of Phases A–D*

- [ ] Easy: random discard (no scoring)
- [ ] Medium: current behaviour (already reasonable)
- [ ] Hard: track which cards opponents drew from the visible discard pile,
     avoid discarding cards that would help the leader
- [ ] Expert: calculate probability opponent can declare Show this turn based
     on known discards, play defensively if threat is high

---

## Key Design Notes

1. **`applyCommand` is pure** — use it freely for Expert lookahead simulation.
   It takes state + command, returns `{ nextState, events }` with no side effects.

2. **Difficulty lives on the seat** — not on the room. Two bots in the same game can have
   different difficulties. Host picks per-bot when adding bots in the lobby.

3. **All information used is public** — the bot's masked view (`MaskedGameState`) is used,
   not the full state. This keeps the difficulty system honest and consistent with
   what a human player could observe.

4. **The greedy heuristic is the foundation** — Easy adds noise on top, Medium fixes the
   greedy logic, Hard adds opponent awareness, Expert adds lookahead on top of Hard.
   Each level is a strict superset of the previous.

5. **Fallback chain** — if any level fails to produce a move (timeout, error, edge case),
   fall back to the level below. Expert → Hard → Medium → Easy → draw_cards / end_turn.

---

## Progress Tracker

| Phase | Status |
|---|---|
| Phase A — Shared Infrastructure | ⬜ Not started |
| Phase B — Easy + Medium | ⬜ Not started |
| Phase C — Hard (Threat-Aware) | ⬜ Not started |
| Phase D — Expert (Lookahead) | ⬜ Not started |
| Phase E — Least Count Bot | ⬜ Not started |
