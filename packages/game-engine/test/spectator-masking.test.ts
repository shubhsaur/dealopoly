import { describe, expect, it } from "vitest";
import {
  createGame,
  getMaskedView,
  getSpectatorView,
  type CardInstance,
} from "../src/index.js";

function makeGame() {
  return createGame({
    seed: 42,
    players: [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
    ],
  });
}

describe("Spectator masking", () => {
  it("hides every player's hand from spectators", () => {
    const game = makeGame();
    const view = getSpectatorView(game);

    expect(view.viewerKind).toBe("spectator");
    expect(view.viewerPlayerId).toBe("__spectator__");
    for (const pid of ["p1", "p2"]) {
      expect(view.players[pid]?.hand).toBeUndefined();
      expect(view.players[pid]?.handCount).toBe(5);
    }
  });

  it("strips card payloads from a reaction_window resolution", () => {
    const game = makeGame();
    const actionCard: CardInstance = {
      instanceId: "alice-db",
      defId: "action-deal-breaker",
      name: "Deal Breaker",
      type: "action",
      value: 5,
    };
    const targetCard: CardInstance = {
      instanceId: "bob-prop",
      defId: "prop-mayfair",
      name: "Mayfair",
      type: "property",
      value: 4,
    };

    game.pendingResolution = {
      type: "reaction_window",
      initiatorPlayerId: "p1",
      targetPlayerId: "p2",
      actionCard,
      targetCard,
      targetCardInstanceId: targetCard.instanceId,
      justSayNoChainCount: 0,
      isCancelled: false,
      waitingForPlayerId: "p2",
      deadline: Date.now() + 7000,
    };

    const view = getSpectatorView(game);
    const p = view.pendingResolution;

    expect(p).not.toBeNull();
    expect(p?.type).toBe("reaction_window");
    // Metadata the UI needs is preserved…
    expect(p && "initiatorPlayerId" in p && p.initiatorPlayerId).toBe("p1");
    expect(p && "waitingForPlayerId" in p && p.waitingForPlayerId).toBe("p2");
    // …but no card payloads leak.
    const raw = JSON.stringify(p);
    expect(raw).not.toContain("alice-db");
    expect(raw).not.toContain("bob-prop");
    expect(raw).not.toContain("actionCard");
    expect(raw).not.toContain("targetCard");
  });

  it("strips card payloads from a payment resolution", () => {
    const game = makeGame();
    game.pendingResolution = {
      type: "payment",
      creditorPlayerId: "p1",
      debtorPlayerId: "p2",
      debtorPlayerIds: ["p2"],
      amountDue: 4,
      remainingDebtors: [],
      reason: "rent",
      actionCard: {
        instanceId: "rent-card",
        defId: "action-rent-blue-green",
        name: "Rent",
        type: "action",
        value: 1,
      },
    };

    const view = getSpectatorView(game);
    const p = view.pendingResolution;

    expect(p?.type).toBe("payment");
    expect(p && "amountDue" in p && p.amountDue).toBe(4);
    expect(JSON.stringify(p)).not.toContain("rent-card");
  });

  it("keeps discard resolution metadata (no cards involved)", () => {
    const game = makeGame();
    game.pendingResolution = {
      type: "discard",
      playerId: "p1",
      requiredDiscardCount: 2,
    };

    const view = getSpectatorView(game);
    expect(view.pendingResolution?.type).toBe("discard");
    expect(
      view.pendingResolution &&
        "requiredDiscardCount" in view.pendingResolution &&
        view.pendingResolution.requiredDiscardCount,
    ).toBe(2);
  });

  it("seated players still receive full resolution card payloads (unchanged)", () => {
    const game = makeGame();
    game.pendingResolution = {
      type: "reaction_window",
      initiatorPlayerId: "p1",
      targetPlayerId: "p2",
      actionCard: {
        instanceId: "alice-db",
        defId: "action-deal-breaker",
        name: "Deal Breaker",
        type: "action",
        value: 5,
      },
      justSayNoChainCount: 0,
      isCancelled: false,
      waitingForPlayerId: "p2",
    };

    // A real player's masked view still contains the action card (needed for UI),
    // and the acting player still sees their own hand.
    const p1View = getMaskedView(game, "p1");
    expect(p1View.players["p1"]?.hand).toBeDefined();
    expect(JSON.stringify(p1View.pendingResolution)).toContain("alice-db");
  });
});
