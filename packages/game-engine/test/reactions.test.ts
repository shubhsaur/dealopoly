import { describe, expect, it } from "vitest";
import { createGame, applyCommand, type CardInstance } from "../src/index.js";

describe("Just Say No Reaction Windows and Counter Chains", () => {
  it("should open reaction window when targeting opponent who holds Just Say No", () => {
    const game = createGame({
      seed: 300,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const dealBreaker: CardInstance = {
      instanceId: "alice-db",
      defId: "action-deal-breaker",
      name: "Deal Breaker",
      type: "action",
      value: 5,
    };
    const bobJSN: CardInstance = {
      instanceId: "bob-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };

    // Bob has completed dark-blue set and a JSN card in hand
    game.players["p2"]!.propertySets = [
      {
        setId: "bob-set-blue",
        color: "dark-blue",
        cards: [
          { instanceId: "b1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4 },
          { instanceId: "b2", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4 },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];
    game.players["p2"]!.hand = [bobJSN];
    game.players["p1"]!.hand = [dealBreaker];
    game.turn.phase = "action";

    // Alice plays Deal Breaker targeting Bob
    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: dealBreaker.instanceId,
      targetPlayerId: "p2",
      targetSetId: "bob-set-blue",
    });

    expect(res1.nextState.pendingResolution).not.toBeNull();
    expect(res1.nextState.pendingResolution?.type).toBe("reaction_window");
    if (res1.nextState.pendingResolution?.type === "reaction_window") {
      expect(res1.nextState.pendingResolution.waitingForPlayerId).toBe("p2");
    }

    // Bob plays Just Say No
    const res2 = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "just_say_no",
      justSayNoCardInstanceId: bobJSN.instanceId,
    });

    // Now Alice is prompted to counter or pass
    expect(res2.nextState.pendingResolution?.type).toBe("reaction_window");
    if (res2.nextState.pendingResolution?.type === "reaction_window") {
      expect(res2.nextState.pendingResolution.waitingForPlayerId).toBe("p1");
    }

    // Alice passes (does not have JSN)
    const res3 = applyCommand(res2.nextState, {
      type: "submit_reaction",
      playerId: "p1",
      action: "pass",
    });

    // Deal Breaker blocked: Bob keeps his set!
    expect(res3.nextState.pendingResolution).toBeNull();
    expect(res3.nextState.players["p2"]!.propertySets.length).toBe(1);
    expect(res3.nextState.players["p1"]!.propertySets.length).toBe(0);
  });

  it("should allow initiator to counter-cancel opponent's Just Say No with their own Just Say No", () => {
    const game = createGame({
      seed: 300,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const dealBreaker: CardInstance = {
      instanceId: "alice-db",
      defId: "action-deal-breaker",
      name: "Deal Breaker",
      type: "action",
      value: 5,
    };
    const aliceJSN: CardInstance = {
      instanceId: "alice-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };
    const bobJSN: CardInstance = {
      instanceId: "bob-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };

    game.players["p2"]!.propertySets = [
      {
        setId: "bob-set-blue",
        color: "dark-blue",
        cards: [
          { instanceId: "b1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4 },
          { instanceId: "b2", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4 },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];
    game.players["p2"]!.hand = [bobJSN];
    game.players["p1"]!.hand = [dealBreaker, aliceJSN];
    game.turn.phase = "action";

    // 1. Alice plays Deal Breaker
    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: dealBreaker.instanceId,
      targetPlayerId: "p2",
      targetSetId: "bob-set-blue",
    });

    // 2. Bob plays JSN
    const res2 = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "just_say_no",
      justSayNoCardInstanceId: bobJSN.instanceId,
    });

    // 3. Alice counter-plays JSN
    const res3 = applyCommand(res2.nextState, {
      type: "submit_reaction",
      playerId: "p1",
      action: "just_say_no",
      justSayNoCardInstanceId: aliceJSN.instanceId,
    });

    // 4. Bob passes
    const res4 = applyCommand(res3.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "pass",
    });

    // Deal Breaker succeeds: Alice steals Bob's set!
    expect(res4.nextState.pendingResolution).toBeNull();
    expect(res4.nextState.players["p2"]!.propertySets.length).toBe(0);
    expect(res4.nextState.players["p1"]!.propertySets.length).toBe(1);
    expect(res4.nextState.players["p1"]!.propertySets[0]?.color).toBe("dark-blue");
  });

  it("should open universal reaction window even when targeted player holds NO Just Say No", () => {
    const game = createGame({
      seed: 300,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const slyDeal: CardInstance = {
      instanceId: "alice-sly",
      defId: "action-sly-deal",
      name: "Sly Deal",
      type: "action",
      value: 3,
    };
    const bobProp: CardInstance = {
      instanceId: "bob-prop-1",
      defId: "prop-red-1",
      name: "Red Prop",
      type: "property",
      primaryColor: "red",
      value: 3,
    };

    game.players["p2"]!.propertySets = [
      {
        setId: "bob-set-red",
        color: "red",
        cards: [bobProp],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 3,
        rentTiers: [2, 3, 6],
      },
    ];
    game.players["p2"]!.hand = []; // Bob has NO cards in hand
    game.players["p1"]!.hand = [slyDeal];
    game.turn.phase = "action";

    // Alice plays Sly Deal
    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: slyDeal.instanceId,
      targetPlayerId: "p2",
      targetCardInstanceId: bobProp.instanceId,
    });

    // Reaction window opens universally
    expect(res1.nextState.pendingResolution?.type).toBe("reaction_window");
    if (res1.nextState.pendingResolution?.type === "reaction_window") {
      expect(res1.nextState.pendingResolution.waitingForPlayerId).toBe("p2");
      expect(res1.nextState.pendingResolution.canExtend).toBe(true);
      expect(res1.nextState.pendingResolution.deadline).toBeGreaterThan(Date.now());
    }

    // Bob passes (no JSN)
    const res2 = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "pass",
    });

    expect(res2.nextState.pendingResolution).toBeNull();
    expect(res2.nextState.players["p1"]!.propertySets[0]?.cards[0]?.instanceId).toBe(bobProp.instanceId);
  });

  it("should allow extending reaction timer by +5s only once per window", () => {
    const game = createGame({
      seed: 300,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const debtCollector: CardInstance = {
      instanceId: "alice-debt",
      defId: "action-debt-collector",
      name: "Debt Collector",
      type: "action",
      value: 3,
    };

    game.players["p1"]!.hand = [debtCollector];
    game.players["p2"]!.hand = [];
    game.turn.phase = "action";

    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: debtCollector.instanceId,
      targetPlayerId: "p2",
    });

    const initialDeadline = (res1.nextState.pendingResolution as any).deadline;

    // Bob requests +5s extension
    const res2 = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "extend_timer",
    });

    const extendedDeadline = (res2.nextState.pendingResolution as any).deadline;
    expect(extendedDeadline).toBe(initialDeadline + 5000);
    expect((res2.nextState.pendingResolution as any).canExtend).toBe(false);

    // Attempting a second extension in the same window should throw
    expect(() =>
      applyCommand(res2.nextState, {
        type: "submit_reaction",
        playerId: "p2",
        action: "extend_timer",
      }),
    ).toThrowError(/already used/i);
  });

  it("should give all opponents a concurrent reaction window on dual-color rent", () => {
    const game = createGame({
      seed: 300,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
        { id: "p3", name: "Charlie" },
      ],
    });

    const rentCard: CardInstance = {
      instanceId: "alice-rent",
      defId: "rent-green-dark-blue",
      name: "Rent (Green / Dark Blue)",
      type: "rent",
      primaryColor: "green",
      secondaryColor: "dark-blue",
      value: 1,
    };
    const bobJSN: CardInstance = {
      instanceId: "bob-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };

    game.players["p1"]!.propertySets = [
      {
        setId: "p1-blue-set",
        color: "dark-blue",
        cards: [
          { instanceId: "c1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4 },
          { instanceId: "c2", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4 },
        ],
        hasHouse: false, hasHotel: false, isComplete: true, setSize: 2, rentTiers: [3, 8],
      },
    ];
    game.players["p1"]!.hand = [rentCard];
    game.players["p2"]!.hand = [bobJSN];
    game.players["p3"]!.hand = [];
    game.turn.phase = "action";

    // Alice plays dual-color rent -> all opponents react concurrently
    const res1 = applyCommand(game, {
      type: "play_rent",
      playerId: "p1",
      rentCardInstanceId: rentCard.instanceId,
      chosenColor: "dark-blue",
    });

    expect(res1.nextState.pendingResolution?.type).toBe("reaction_window");
    if (res1.nextState.pendingResolution?.type === "reaction_window") {
      expect(res1.nextState.pendingResolution.waitingForPlayerIds).toEqual(["p2", "p3"]);
      expect(res1.nextState.pendingResolution.responses).toEqual({});
    }

    // Charlie passes first (concurrent — order doesn't matter)
    const res2 = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "p3",
      action: "pass",
    });

    // Still waiting for Bob; Charlie recorded as pass
    expect(res2.nextState.pendingResolution?.type).toBe("reaction_window");
    if (res2.nextState.pendingResolution?.type === "reaction_window") {
      expect(res2.nextState.pendingResolution.waitingForPlayerIds).toEqual(["p2"]);
      expect(res2.nextState.pendingResolution.responses).toEqual({ p3: "pass" });
    }

    // Bob plays JSN -> creates jsnSubResolution (inline 1v1 with Alice)
    const res3 = applyCommand(res2.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "just_say_no",
      justSayNoCardInstanceId: bobJSN.instanceId,
    });

    expect(res3.nextState.pendingResolution?.type).toBe("reaction_window");
    if (res3.nextState.pendingResolution?.type === "reaction_window") {
      expect(res3.nextState.pendingResolution.jsnSubResolution).toBeDefined();
      expect(res3.nextState.pendingResolution.jsnSubResolution?.waitingForPlayerId).toBe("p1");
      expect(res3.nextState.pendingResolution.jsnSubResolution?.justSayNoChainCount).toBe(1);
    }

    // Alice passes (doesn't counter Bob's JSN) -> Bob is blocked
    const res4 = applyCommand(res3.nextState, {
      type: "submit_reaction",
      playerId: "p1",
      action: "pass",
    });

    // JSN resolved: Bob blocked, all responses collected -> transition to payment for Charlie only
    expect(res4.nextState.pendingResolution?.type).toBe("payment");
    if (res4.nextState.pendingResolution?.type === "payment") {
      expect(res4.nextState.pendingResolution.debtorPlayerIds).toEqual(["p3"]);
    }
  });

  it("should allow creditor to counter debtor's Just Say No during payment", () => {
    const game = createGame({
      seed: 300,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const rentCard: CardInstance = {
      instanceId: "alice-rent",
      defId: "rent-green-dark-blue",
      name: "Rent (Green / Dark Blue)",
      type: "rent",
      primaryColor: "green",
      secondaryColor: "dark-blue",
      value: 1,
    };
    const bobJSN: CardInstance = {
      instanceId: "bob-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };
    const aliceJSN: CardInstance = {
      instanceId: "alice-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };
    const bobMoney5: CardInstance = {
      instanceId: "bob-money-5",
      defId: "money-5m",
      name: "$5M",
      type: "money",
      value: 5,
    };

    game.players["p1"]!.propertySets = [
      {
        setId: "p1-blue-set", color: "dark-blue",
        cards: [
          { instanceId: "c1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4 },
          { instanceId: "c2", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4 },
        ],
        hasHouse: false, hasHotel: false, isComplete: true, setSize: 2, rentTiers: [3, 8],
      },
    ];
    game.players["p1"]!.hand = [rentCard, aliceJSN];
    game.players["p2"]!.hand = [bobJSN];
    game.players["p2"]!.bank = [bobMoney5];
    game.turn.phase = "action";

    // Alice plays rent -> Bob gets reaction window
    const res1 = applyCommand(game, {
      type: "play_rent",
      playerId: "p1",
      rentCardInstanceId: rentCard.instanceId,
      chosenColor: "dark-blue",
    });

    // Bob passes (doesn't use JSN in reaction) -> enters payment
    const res2 = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "pass",
    });
    expect(res2.nextState.pendingResolution?.type).toBe("payment");

    // Bob plays JSN during payment -> creates jsnSubResolution within payment
    const res3 = applyCommand(res2.nextState, {
      type: "submit_payment",
      playerId: "p2",
      paymentCardInstanceIds: [],
      justSayNoCardInstanceId: bobJSN.instanceId,
    });

    expect(res3.nextState.pendingResolution?.type).toBe("payment");
    if (res3.nextState.pendingResolution?.type === "payment") {
      expect(res3.nextState.pendingResolution.jsnSubResolution).toBeDefined();
      expect(res3.nextState.pendingResolution.jsnSubResolution?.waitingForPlayerId).toBe("p1");
      expect(res3.nextState.pendingResolution.jsnSubResolution?.justSayNoChainCount).toBe(1);
    }

    // Alice counters with her own JSN -> sub-resolution chain continues
    const res4 = applyCommand(res3.nextState, {
      type: "submit_reaction",
      playerId: "p1",
      action: "just_say_no",
      justSayNoCardInstanceId: aliceJSN.instanceId,
    });

    // Still payment with jsnSubResolution, now waiting for Bob
    expect(res4.nextState.pendingResolution?.type).toBe("payment");
    if (res4.nextState.pendingResolution?.type === "payment") {
      expect(res4.nextState.pendingResolution.jsnSubResolution?.waitingForPlayerId).toBe("p2");
      expect(res4.nextState.pendingResolution.jsnSubResolution?.justSayNoChainCount).toBe(2);
    }

    // Bob passes -> Alice's counter wins, Bob must pay (sub-resolution resolved)
    const res5 = applyCommand(res4.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "pass",
    });

    // Back to payment with jsnSubResolution cleared
    expect(res5.nextState.pendingResolution?.type).toBe("payment");
    if (res5.nextState.pendingResolution?.type === "payment") {
      expect(res5.nextState.pendingResolution.amountDue).toBe(8);
      expect(res5.nextState.pendingResolution.debtorPlayerId).toBe("p2");
      expect(res5.nextState.pendingResolution.jsnSubResolution).toBeUndefined();
    }

    // Bob pays
    const res6 = applyCommand(res5.nextState, {
      type: "submit_payment",
      playerId: "p2",
      paymentCardInstanceIds: [bobMoney5.instanceId],
    });

    expect(res6.nextState.pendingResolution).toBeNull();
    expect(res6.nextState.players["p1"]!.bank.length).toBe(1);
  });

  it("should give all opponents a concurrent reaction window on It's My Birthday", () => {
    const game = createGame({
      seed: 300,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
        { id: "p3", name: "Charlie" },
      ],
    });

    const birthdayCard: CardInstance = {
      instanceId: "bday-1",
      defId: "action-its-my-birthday",
      name: "It's My Birthday",
      type: "action",
      value: 2,
    };
    const bobJSN: CardInstance = {
      instanceId: "bob-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };

    game.players["p1"]!.hand = [birthdayCard];
    game.players["p2"]!.hand = [bobJSN];
    game.players["p3"]!.hand = [];
    game.turn.phase = "action";

    // Alice plays It's My Birthday -> all opponents react concurrently
    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: birthdayCard.instanceId,
    });

    expect(res1.nextState.pendingResolution?.type).toBe("reaction_window");
    if (res1.nextState.pendingResolution?.type === "reaction_window") {
      expect(res1.nextState.pendingResolution.waitingForPlayerIds).toEqual(["p2", "p3"]);
      expect(res1.nextState.pendingResolution.rentAmount).toBe(2);
      expect(res1.nextState.pendingResolution.responses).toEqual({});
    }

    // Charlie passes first (concurrent — order doesn't matter)
    const res2 = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "p3",
      action: "pass",
    });

    // Still waiting for Bob
    expect(res2.nextState.pendingResolution?.type).toBe("reaction_window");
    if (res2.nextState.pendingResolution?.type === "reaction_window") {
      expect(res2.nextState.pendingResolution.waitingForPlayerIds).toEqual(["p2"]);
      expect(res2.nextState.pendingResolution.responses).toEqual({ p3: "pass" });
    }

    // Bob plays JSN -> creates jsnSubResolution
    const res3 = applyCommand(res2.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "just_say_no",
      justSayNoCardInstanceId: bobJSN.instanceId,
    });

    expect(res3.nextState.pendingResolution?.type).toBe("reaction_window");
    if (res3.nextState.pendingResolution?.type === "reaction_window") {
      expect(res3.nextState.pendingResolution.jsnSubResolution).toBeDefined();
      expect(res3.nextState.pendingResolution.jsnSubResolution?.waitingForPlayerId).toBe("p1");
    }

    // Alice passes -> Bob's JSN blocks him
    const res4 = applyCommand(res3.nextState, {
      type: "submit_reaction",
      playerId: "p1",
      action: "pass",
    });

    // All responses collected: payment for Charlie only (Bob blocked)
    expect(res4.nextState.pendingResolution?.type).toBe("payment");
    if (res4.nextState.pendingResolution?.type === "payment") {
      expect(res4.nextState.pendingResolution.debtorPlayerIds).toEqual(["p3"]);
      expect(res4.nextState.pendingResolution.amountDue).toBe(2);
    }
  });
});
