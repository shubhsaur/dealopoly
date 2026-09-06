import { describe, expect, it } from "vitest";
import { createGame, applyCommand, type CardInstance, BotController, calculateSetRent } from "../src/index.js";

describe("Rent and Debt Payments", () => {
  it("should charge rent and allow debtor to pay using bank money", () => {
    const game = createGame({
      seed: 400,
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

    // Alice has complete dark blue set (rent: $8M)
    game.players["p1"]!.propertySets = [
      {
        setId: "p1-blue-set",
        color: "dark-blue",
        cards: [
          { instanceId: "c1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4 },
          { instanceId: "c2", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4 },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];
    game.players["p1"]!.hand = [rentCard];
    game.turn.phase = "action";

    // Bob has $10M in bank
    const bobMoney10m: CardInstance = {
      instanceId: "bob-money-10",
      defId: "money-10m",
      name: "$10M Money Card",
      type: "money",
      value: 10,
    };
    game.players["p2"]!.bank = [bobMoney10m];
    game.players["p2"]!.hand = []; // No JSN

    // Alice charges dark blue rent -> enters parallel payment resolution directly
    const res1 = applyCommand(game, {
      type: "play_rent",
      playerId: "p1",
      rentCardInstanceId: rentCard.instanceId,
      chosenColor: "dark-blue",
    });

    expect(res1.nextState.pendingResolution?.type).toBe("payment");
    if (res1.nextState.pendingResolution?.type === "payment") {
      expect(res1.nextState.pendingResolution.amountDue).toBe(8);
      expect(res1.nextState.pendingResolution.debtorPlayerId).toBe("p2");
      expect(res1.nextState.pendingResolution.debtorPlayerIds).toEqual(["p2"]);
    }

    // Bob pays with his $10M card (no change given)
    const res2 = applyCommand(res1.nextState, {
      type: "submit_payment",
      playerId: "p2",
      paymentCardInstanceIds: [bobMoney10m.instanceId],
    });

    expect(res2.nextState.pendingResolution).toBeNull();
    expect(res2.nextState.players["p2"]!.bank.length).toBe(0);
    expect(res2.nextState.players["p1"]!.bank.length).toBe(1);
    expect(res2.nextState.players["p1"]!.bank[0]?.value).toBe(10);
  });

  it("should enforce table bankruptcy when debtor has insufficient funds", () => {
    const game = createGame({
      seed: 400,
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
    game.turn.phase = "action";

    // Bob only has $2M on table
    const bobMoney2m: CardInstance = {
      instanceId: "bob-money-2",
      defId: "money-2m",
      name: "$2M Money Card",
      type: "money",
      value: 2,
    };
    game.players["p2"]!.bank = [bobMoney2m];
    game.players["p2"]!.hand = [];

    // Alice plays Debt Collector ($5M due) -> enters reaction window
    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: debtCollector.instanceId,
      targetPlayerId: "p2",
    });

    expect(res1.nextState.pendingResolution?.type).toBe("reaction_window");

    // Bob passes reaction -> advances to payment
    const res1Pass = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "pass",
    });

    // Bob submits all his table assets ($2M)
    const res2 = applyCommand(res1Pass.nextState, {
      type: "submit_payment",
      playerId: "p2",
      paymentCardInstanceIds: [bobMoney2m.instanceId],
    });

    expect(res2.nextState.pendingResolution).toBeNull();
    expect(res2.nextState.players["p2"]!.bank.length).toBe(0);
    expect(res2.nextState.players["p1"]!.bank.length).toBe(1);
  });

  it("should generate valid bot payment when debtor is a bot with house/hotel and insufficient cash", () => {
    const game = createGame({
      seed: 400,
      players: [
        { id: "p1", name: "Player", isBot: false },
        { id: "bot-1", name: "Bot Atlas", isBot: true },
      ],
    });

    const houseCard: CardInstance = {
      instanceId: "house-1",
      defId: "action-house",
      name: "House",
      type: "action",
      value: 3,
    };

    // Bot has a set with a house ($1M + $1M + $3M house = $5M total)
    game.players["bot-1"]!.propertySets = [
      {
        setId: "bot-brown-set",
        color: "brown",
        cards: [
          { instanceId: "br-1", defId: "prop-mediterranean-avenue", name: "Mediterranean Avenue", type: "property", value: 1 },
          { instanceId: "br-2", defId: "prop-baltic-avenue", name: "Baltic Avenue", type: "property", value: 1 },
        ],
        hasHouse: true,
        houseCard,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [1, 2],
      },
    ];
    game.players["bot-1"]!.bank = [];
    game.players["bot-1"]!.hand = [];

    // Pending resolution: rent for $4M
    game.pendingResolution = {
      type: "payment",
      creditorPlayerId: "p1",
      debtorPlayerId: "bot-1",
      amountDue: 4,
      remainingDebtors: [],
      reason: "Rent for blue properties ($4M)",
    };

    const botAction = BotController.getNextBotAction(game, "bot-1");

    expect(botAction).not.toBeNull();
    expect(botAction?.type).toBe("submit_payment");

    // Applying bot's generated payment must succeed without throwing
    const res = applyCommand(game, botAction!);
    expect(res.nextState.pendingResolution).toBeNull();
  });

  it("should generate valid bot payment when debtor has 0 table assets", () => {
    const game = createGame({
      seed: 400,
      players: [
        { id: "p1", name: "Player", isBot: false },
        { id: "bot-1", name: "Bot Atlas", isBot: true },
      ],
    });

    game.players["bot-1"]!.propertySets = [];
    game.players["bot-1"]!.bank = [];
    game.players["bot-1"]!.hand = [];

    game.pendingResolution = {
      type: "payment",
      creditorPlayerId: "p1",
      debtorPlayerId: "bot-1",
      amountDue: 5,
      remainingDebtors: [],
      reason: "Debt Collector ($5M)",
    };

    const botAction = BotController.getNextBotAction(game, "bot-1");

    expect(botAction).not.toBeNull();
    expect(botAction?.type).toBe("submit_payment");
    if (botAction?.type === "submit_payment") {
      expect(botAction.paymentCardInstanceIds).toEqual([]);
    }

    const res = applyCommand(game, botAction!);
    expect(res.nextState.pendingResolution).toBeNull();
  });

  it("should calculate exact rent across all 10 property colors and tier counts", () => {
    // Exact rent tiers from the new design:
    // Brown: [1, 2]
    // Dark Blue: [3, 8]
    // Utility: [1, 2]
    // Green: [2, 4, 7]
    // Yellow: [2, 4, 6]
    // Red: [2, 3, 6]
    // Orange: [1, 3, 5]
    // Pink: [1, 2, 4]
    // Light Blue: [1, 2, 3]
    // Railroad: [1, 2, 3, 4]

    const expectedRents: Record<string, number[]> = {
      brown: [1, 2],
      "dark-blue": [3, 8],
      utility: [1, 2],
      green: [2, 4, 7],
      yellow: [2, 4, 6],
      red: [2, 3, 6],
      orange: [1, 3, 5],
      pink: [1, 2, 4],
      "light-blue": [1, 2, 3],
      railroad: [1, 2, 3, 4],
    };

    for (const [color, tiers] of Object.entries(expectedRents)) {
      for (let count = 1; count <= tiers.length; count++) {
        const dummyCards: CardInstance[] = Array.from({ length: count }, (_, i) => ({
          instanceId: `${color}-${i}`,
          defId: `prop-${color}-${i}`,
          name: `${color} property ${i}`,
          type: "property",
          value: 1,
        }));

        const set = {
          setId: `test-${color}-set`,
          color: color as any,
          cards: dummyCards,
          hasHouse: false,
          hasHotel: false,
          isComplete: count === tiers.length,
          setSize: tiers.length,
          rentTiers: tiers,
        };

        const calculatedRent = calculateSetRent(set);
        expect(calculatedRent).toBe(tiers[count - 1]);
      }
    }
  });

  it("should correctly add House (+3M), Hotel (+4M), and Double The Rent (x2)", () => {
    // Full Red set (3 cards) = $6M base
    const redCards: CardInstance[] = [
      { instanceId: "r1", defId: "r1", name: "Red 1", type: "property", value: 3 },
      { instanceId: "r2", defId: "r2", name: "Red 2", type: "property", value: 3 },
      { instanceId: "r3", defId: "r3", name: "Red 3", type: "property", value: 3 },
    ];

    const baseSet = {
      setId: "red-set",
      color: "red" as const,
      cards: redCards,
      hasHouse: false,
      hasHotel: false,
      isComplete: true,
      setSize: 3,
      rentTiers: [2, 3, 6],
    };

    expect(calculateSetRent(baseSet)).toBe(6);

    // With House (+3M) = $9M
    const setWithHouse = { ...baseSet, hasHouse: true };
    expect(calculateSetRent(setWithHouse)).toBe(9);

    // With House and Hotel (+3M + 4M) = $13M
    const setWithHotel = { ...baseSet, hasHouse: true, hasHotel: true };
    expect(calculateSetRent(setWithHotel)).toBe(13);

    // With Double The Rent (x2) = $26M
    expect(calculateSetRent(setWithHotel, true)).toBe(26);
  });

  it("should assign authentic setSize and rentTiers when property cards are transferred via rent payment", () => {
    const game = createGame({
      seed: 400,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    // Dark blue property on Bob's table ($4M card value)
    const parkPlace: CardInstance = {
      instanceId: "park-place-1",
      defId: "prop-park-lane",
      name: "Park Place",
      type: "property",
      primaryColor: "dark-blue",
      value: 4,
    };

    game.players["p2"]!.propertySets = [
      {
        setId: "bob-dark-blue",
        color: "dark-blue",
        cards: [parkPlace],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];
    game.players["p2"]!.bank = [];
    game.players["p2"]!.hand = [];

    // Alice is expecting $4M rent payment
    game.pendingResolution = {
      type: "payment",
      creditorPlayerId: "p1",
      debtorPlayerId: "p2",
      amountDue: 4,
      remainingDebtors: [],
      reason: "Rent ($4M)",
    };

    // Bob pays with Park Place
    const res = applyCommand(game, {
      type: "submit_payment",
      playerId: "p2",
      paymentCardInstanceIds: [parkPlace.instanceId],
    });

    expect(res.nextState.pendingResolution).toBeNull();
    // Bob has 0 property sets
    expect(res.nextState.players["p2"]!.propertySets.length).toBe(0);

    // Alice receives the dark blue set
    expect(res.nextState.players["p1"]!.propertySets.length).toBe(1);
    const aliceSet = res.nextState.players["p1"]!.propertySets[0]!;
    expect(aliceSet.color).toBe("dark-blue");
    expect(aliceSet.setSize).toBe(2); // Authentic Dark Blue set size
    expect(aliceSet.rentTiers).toEqual([3, 8]); // Authentic Dark Blue rent tiers!
  });

  it("should reject payment if debtor tries to pay using hand cards", () => {
    const game = createGame({
      seed: 400,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const handMoney: CardInstance = {
      instanceId: "bob-hand-money",
      defId: "money-5m",
      name: "$5M Money Card",
      type: "money",
      value: 5,
    };

    game.players["p2"]!.bank = [];
    game.players["p2"]!.propertySets = [];
    game.players["p2"]!.hand = [handMoney];

    game.pendingResolution = {
      type: "payment",
      creditorPlayerId: "p1",
      debtorPlayerId: "p2",
      amountDue: 5,
      remainingDebtors: [],
      reason: "Debt Collector ($5M)",
    };

    expect(() =>
      applyCommand(game, {
        type: "submit_payment",
        playerId: "p2",
        paymentCardInstanceIds: [handMoney.instanceId],
      }),
    ).toThrowError(/not on debtor's table/);
  });
  it("should simultaneously charge all opponents in parallel on dual rent and resolve individually in any order", () => {
    const game = createGame({
      seed: 400,
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

    // Alice has complete dark blue set (rent: $8M)
    game.players["p1"]!.propertySets = [
      {
        setId: "p1-blue-set",
        color: "dark-blue",
        cards: [
          { instanceId: "c1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4 },
          { instanceId: "c2", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4 },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];
    game.players["p1"]!.hand = [rentCard];
    game.turn.phase = "action";

    // Bob has $10M in bank
    const bobMoney10m: CardInstance = {
      instanceId: "bob-money-10",
      defId: "money-10m",
      name: "$10M Money Card",
      type: "money",
      value: 10,
    };
    game.players["p2"]!.bank = [bobMoney10m];

    // Charlie has $10M in bank
    const charlieMoney10m: CardInstance = {
      instanceId: "charlie-money-10",
      defId: "money-10m",
      name: "$10M Money Card",
      type: "money",
      value: 10,
    };
    game.players["p3"]!.bank = [charlieMoney10m];

    // Alice plays dual rent -> enters payment resolution for BOTH Bob and Charlie simultaneously
    const res1 = applyCommand(game, {
      type: "play_rent",
      playerId: "p1",
      rentCardInstanceId: rentCard.instanceId,
      chosenColor: "dark-blue",
    });

    expect(res1.nextState.pendingResolution?.type).toBe("payment");
    const payment = res1.nextState.pendingResolution as any;
    expect(payment.amountDue).toBe(8);
    expect(payment.debtorPlayerIds).toEqual(["p2", "p3"]);

    // Charlie (p3) submits payment FIRST (out of order), demonstrating non-blocking parallel resolution
    const resCharliePay = applyCommand(res1.nextState, {
      type: "submit_payment",
      playerId: "p3",
      paymentCardInstanceIds: [charlieMoney10m.instanceId],
    });

    // Payment resolution remains active for Bob (p2)
    expect(resCharliePay.nextState.pendingResolution?.type).toBe("payment");
    const remainingPayment = resCharliePay.nextState.pendingResolution as any;
    expect(remainingPayment.debtorPlayerIds).toEqual(["p2"]);
    expect(remainingPayment.debtorPlayerId).toBe("p2");
    expect(resCharliePay.nextState.players["p3"]!.bank.length).toBe(0);
    expect(resCharliePay.nextState.players["p1"]!.bank.length).toBe(1);

    // Bob (p2) now submits his payment
    const resBobPay = applyCommand(resCharliePay.nextState, {
      type: "submit_payment",
      playerId: "p2",
      paymentCardInstanceIds: [bobMoney10m.instanceId],
    });

    // All debts settled -> pending resolution cleared
    expect(resBobPay.nextState.pendingResolution).toBeNull();
    expect(resBobPay.nextState.players["p2"]!.bank.length).toBe(0);
    expect(resBobPay.nextState.players["p1"]!.bank.length).toBe(2);
  });

  it("should allow debtor to play Just Say No via submit_payment to refuse payment and clear debt", () => {
    const game = createGame({
      seed: 400,
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

    game.players["p1"]!.propertySets = [
      {
        setId: "p1-blue-set",
        color: "dark-blue",
        cards: [
          { instanceId: "c1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4 },
          { instanceId: "c2", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4 },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];
    game.players["p1"]!.hand = [rentCard];
    game.turn.phase = "action";

    // Bob has $10M in bank AND a Just Say No card in hand
    const bobMoney10m: CardInstance = {
      instanceId: "bob-money-10",
      defId: "money-10m",
      name: "$10M Money Card",
      type: "money",
      value: 10,
    };
    const bobJSN: CardInstance = {
      instanceId: "bob-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };
    game.players["p2"]!.bank = [bobMoney10m];
    game.players["p2"]!.hand = [bobJSN];

    // Charlie has $10M in bank
    const charlieMoney10m: CardInstance = {
      instanceId: "charlie-money-10",
      defId: "money-10m",
      name: "$10M Money Card",
      type: "money",
      value: 10,
    };
    game.players["p3"]!.bank = [charlieMoney10m];

    // Alice plays rent
    const resRent = applyCommand(game, {
      type: "play_rent",
      playerId: "p1",
      rentCardInstanceId: rentCard.instanceId,
      chosenColor: "dark-blue",
    });

    // Bob plays Just Say No to refuse payment
    const resBobJSN = applyCommand(resRent.nextState, {
      type: "submit_payment",
      playerId: "p2",
      paymentCardInstanceIds: [],
      justSayNoCardInstanceId: bobJSN.instanceId,
    });

    // Bob kept his $10M bank card!
    expect(resBobJSN.nextState.players["p2"]!.bank.length).toBe(1);
    expect(resBobJSN.nextState.players["p2"]!.hand.length).toBe(0);
    // JSN is in discard pile
    expect(resBobJSN.nextState.discardPile.some((c) => c.instanceId === bobJSN.instanceId)).toBe(true);

    // Charlie is still owed
    expect(resBobJSN.nextState.pendingResolution?.type).toBe("payment");
    const charliePayment = resBobJSN.nextState.pendingResolution as any;
    expect(charliePayment.debtorPlayerIds).toEqual(["p3"]);

    // Charlie pays
    const resCharliePay = applyCommand(resBobJSN.nextState, {
      type: "submit_payment",
      playerId: "p3",
      paymentCardInstanceIds: [charlieMoney10m.instanceId],
    });

    expect(resCharliePay.nextState.pendingResolution).toBeNull();
  });

  it("should trigger parallel payment resolution to all opponents on It's My Birthday", () => {
    const game = createGame({
      seed: 400,
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

    game.players["p1"]!.hand = [birthdayCard];
    game.players["p2"]!.bank = [
      { instanceId: "b-m2", defId: "money-2m", name: "$2M", type: "money", value: 2 },
    ];
    game.players["p3"]!.bank = [
      { instanceId: "c-m2", defId: "money-2m", name: "$2M", type: "money", value: 2 },
    ];
    game.turn.phase = "action";

    const res = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: birthdayCard.instanceId,
    });

    expect(res.nextState.pendingResolution?.type).toBe("payment");
    const payment = res.nextState.pendingResolution as any;
    expect(payment.amountDue).toBe(2);
    expect(payment.debtorPlayerIds).toEqual(["p2", "p3"]);
  });

  it("should allow bots to generate legal moves and resolve parallel payments autonomously", () => {
    const game = createGame({
      seed: 400,
      players: [
        { id: "p1", name: "Alice" },
        { id: "bot-1", name: "Bob Bot", isBot: true },
        { id: "bot-2", name: "Charlie Bot", isBot: true },
      ],
    });

    game.pendingResolution = {
      type: "payment",
      creditorPlayerId: "p1",
      debtorPlayerId: "bot-1",
      debtorPlayerIds: ["bot-1", "bot-2"],
      amountDue: 2,
      remainingDebtors: ["bot-2"],
      reason: "Rent ($2M)",
    };

    game.players["bot-1"]!.bank = [
      { instanceId: "b-m2", defId: "money-2m", name: "$2M", type: "money", value: 2 },
    ];
    game.players["bot-2"]!.bank = [
      { instanceId: "c-m2", defId: "money-2m", name: "$2M", type: "money", value: 2 },
    ];

    // Both bots can generate legal moves
    const bot1Move = BotController.getNextBotAction(game, "bot-1", "medium");
    const bot2Move = BotController.getNextBotAction(game, "bot-2", "medium");

    expect(bot1Move?.type).toBe("submit_payment");
    expect(bot2Move?.type).toBe("submit_payment");
  });
});
