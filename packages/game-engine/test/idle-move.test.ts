import { describe, expect, it } from "vitest";
import {
  createGame,
  getIdleActorIds,
  getIdleMove,
  type CardInstance,
} from "../src/index.js";

function makeGame() {
  return createGame({
    seed: 7,
    players: [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
    ],
  });
}

describe("Monodeal idle actor + idle move (turn timers)", () => {
  it("reports the active player as the idle actor at the start of a turn", () => {
    const game = makeGame();
    expect(game.turn.activePlayerId).toBe("p1");
    expect(game.turn.phase).toBe("draw");
    expect(getIdleActorIds(game)).toEqual(["p1"]);
  });

  it("auto-draws when the idle player is in the draw phase", () => {
    const game = makeGame();
    const move = getIdleMove(game, "p1");
    expect(move).toEqual({ type: "draw_cards", playerId: "p1" });
  });

  it("auto-ends the turn when the idle player is in the action phase (never plays a card)", () => {
    const game = makeGame();
    game.turn.phase = "action";
    game.turn.actionsRemaining = 3;
    // Give the player a card they *could* play — the idle move must still not play it.
    game.players["p1"]!.hand = [
      {
        instanceId: "nope",
        defId: "action-pass-go",
        name: "Pass Go",
        type: "action",
        value: 1,
      },
    ];

    const move = getIdleMove(game, "p1");
    expect(move).toEqual({ type: "end_turn", playerId: "p1" });
  });

  it("returns no move for a player who is not blocking", () => {
    const game = makeGame();
    expect(getIdleMove(game, "p2")).toBeNull();
  });

  it("identifies a single reaction-window target", () => {
    const game = makeGame();
    game.pendingResolution = {
      type: "reaction_window",
      initiatorPlayerId: "p1",
      targetPlayerId: "p2",
      actionCard: {
        instanceId: "db",
        defId: "action-deal-breaker",
        name: "Deal Breaker",
        type: "action",
        value: 5,
      },
      justSayNoChainCount: 0,
      isCancelled: false,
      waitingForPlayerId: "p2",
    };

    expect(getIdleActorIds(game)).toEqual(["p2"]);
    expect(getIdleMove(game, "p2")).toEqual({
      type: "submit_reaction",
      playerId: "p2",
      action: "pass",
    });
  });

  it("identifies concurrent reaction-window targets (rent/birthday)", () => {
    const game = createGame({
      seed: 11,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
        { id: "p3", name: "Cass" },
      ],
    });
    game.pendingResolution = {
      type: "reaction_window",
      initiatorPlayerId: "p1",
      targetPlayerId: "p2",
      actionCard: {
        instanceId: "bday",
        defId: "action-its-my-birthday",
        name: "It's My Birthday",
        type: "action",
        value: 2,
      },
      justSayNoChainCount: 0,
      isCancelled: false,
      waitingForPlayerIds: ["p2", "p3"],
    };

    expect(getIdleActorIds(game).sort()).toEqual(["p2", "p3"]);
    for (const id of ["p2", "p3"]) {
      expect(getIdleMove(game, id)).toEqual({
        type: "submit_reaction",
        playerId: id,
        action: "pass",
      });
    }
  });

  it("prioritises the JSN sub-resolution waiter over the outer window", () => {
    const game = makeGame();
    game.pendingResolution = {
      type: "reaction_window",
      initiatorPlayerId: "p1",
      targetPlayerId: "p2",
      actionCard: {
        instanceId: "dc",
        defId: "action-debt-collector",
        name: "Debt Collector",
        type: "action",
        value: 3,
      },
      justSayNoChainCount: 1,
      isCancelled: false,
      waitingForPlayerIds: ["p2"],
      jsnSubResolution: {
        type: "reaction_window",
        initiatorPlayerId: "p2",
        targetPlayerId: "p1",
        actionCard: {
          instanceId: "jsn",
          defId: "action-just-say-no",
          name: "Just Say No",
          type: "action",
          value: 4,
        },
        justSayNoChainCount: 1,
        isCancelled: false,
        waitingForPlayerId: "p1",
      },
    };

    expect(getIdleActorIds(game)).toEqual(["p1"]);
    expect(getIdleMove(game, "p1")).toEqual({
      type: "submit_reaction",
      playerId: "p1",
      action: "pass",
    });
  });

  it("identifies unpaid debtors in a payment resolution and produces a legal payment", () => {
    const game = makeGame();
    const bankCard: CardInstance = {
      instanceId: "p2-bank",
      defId: "money-5m",
      name: "$5M",
      type: "money",
      value: 5,
    };
    game.players["p2"]!.bank = [bankCard];
    game.pendingResolution = {
      type: "payment",
      creditorPlayerId: "p1",
      debtorPlayerId: "p2",
      debtorPlayerIds: ["p2"],
      amountDue: 4,
      remainingDebtors: [],
      reason: "rent",
      paidDebtorIds: [],
    };

    expect(getIdleActorIds(game)).toEqual(["p2"]);
    const move = getIdleMove(game, "p2");
    expect(move?.type).toBe("submit_payment");
    if (move?.type === "submit_payment") {
      expect(move.paymentCardInstanceIds).toContain("p2-bank");
    }
  });

  it("excludes debtors who already paid", () => {
    const game = makeGame();
    game.pendingResolution = {
      type: "payment",
      creditorPlayerId: "p1",
      debtorPlayerId: "p2",
      debtorPlayerIds: ["p2"],
      amountDue: 4,
      remainingDebtors: [],
      reason: "rent",
      paidDebtorIds: ["p2"],
    };
    expect(getIdleActorIds(game)).toEqual([]);
  });

  it("identifies the discarding player and discards the required count", () => {
    const game = makeGame();
    game.pendingResolution = {
      type: "discard",
      playerId: "p1",
      requiredDiscardCount: 2,
    };

    expect(getIdleActorIds(game)).toEqual(["p1"]);
    const move = getIdleMove(game, "p1");
    expect(move?.type).toBe("discard_cards");
    if (move?.type === "discard_cards") {
      expect(move.cardInstanceIds).toHaveLength(2);
    }
  });

  it("reports no idle actors once the game is completed", () => {
    const game = makeGame();
    game.status = "completed";
    expect(getIdleActorIds(game)).toEqual([]);
  });
});