import { describe, expect, it } from "vitest";
import { createGame, applyCommand, type CardInstance } from "../src/index.js";

describe("Action Cards & Banking", () => {
  it("should allow banking money and action cards into personal bank", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const money5m: CardInstance = {
      instanceId: "test-money-5m",
      defId: "money-5m",
      name: "$5M Money Card",
      type: "money",
      value: 5,
    };

    game.players["p1"]!.hand = [money5m];
    game.turn.phase = "action";

    const { nextState } = applyCommand(game, {
      type: "bank_card",
      playerId: "p1",
      cardInstanceId: money5m.instanceId,
    });

    expect(nextState.players["p1"]!.bank.length).toBe(1);
    expect(nextState.players["p1"]!.bank[0]?.value).toBe(5);
    expect(nextState.players["p1"]!.hand.length).toBe(0);
    expect(nextState.turn.actionsRemaining).toBe(2);
  });

  it("should reject banking property cards regardless of value and reject $0M cards", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const wild2m: CardInstance = {
      instanceId: "test-wild-pink-orange",
      defId: "wild-pink-orange",
      name: "Property Wild Card",
      type: "property-wild",
      primaryColor: "pink",
      secondaryColor: "orange",
      value: 2,
    };
    const wild0m: CardInstance = {
      instanceId: "test-wild-all",
      defId: "wild-all-multicolor",
      name: "Multicolor Property Wild",
      type: "property-wild",
      primaryColor: "all",
      value: 0,
    };
    
    const ruleCard: CardInstance = {
      instanceId: "test-rule",
      defId: "rule-quick-start",
      name: "Quick Start Rules",
      type: "rule",
      value: 0,
    };

    game.players["p1"]!.hand = [wild2m, wild0m, ruleCard];
    game.turn.phase = "action";

    // Attempting to bank $2M property wild card should throw CANNOT_BANK_PROPERTY
    expect(() =>
      applyCommand(game, {
        type: "bank_card",
        playerId: "p1",
        cardInstanceId: wild2m.instanceId,
      }),
    ).toThrowError(/Property cards must be placed in your property collection area/);

    // Attempting to bank $0M property wild card should throw CANNOT_BANK_CARD ($0M check happens first)
    expect(() =>
      applyCommand(game, {
        type: "bank_card",
        playerId: "p1",
        cardInstanceId: wild0m.instanceId,
      }),
    ).toThrowError(/no monetary value/);
    
    // Attempting to bank $0M rule card should throw CANNOT_BANK_CARD
    expect(() =>
      applyCommand(game, {
        type: "bank_card",
        playerId: "p1",
        cardInstanceId: ruleCard.instanceId,
      }),
    ).toThrowError(/no monetary value/);
  });

  it("should allow Pass Go to draw 2 extra cards", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const passGo: CardInstance = {
      instanceId: "test-pass-go",
      defId: "action-pass-go",
      name: "Pass Go",
      type: "action",
      value: 1,
    };

    game.players["p1"]!.hand = [passGo];
    game.turn.phase = "action";
    const initialDeckCount = game.deck.length;

    const { nextState } = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: passGo.instanceId,
    });

    expect(nextState.players["p1"]!.hand.length).toBe(2);
    expect(nextState.deck.length).toBe(initialDeckCount - 2);
    expect(nextState.discardPile.some((c) => c.instanceId === passGo.instanceId)).toBe(true);
  });

  it("should allow placing House and Hotel only on complete non-special sets", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const house: CardInstance = {
      instanceId: "test-house",
      defId: "action-house",
      name: "House",
      type: "action",
      value: 3,
    };
    const hotel: CardInstance = {
      instanceId: "test-hotel",
      defId: "action-hotel",
      name: "Hotel",
      type: "action",
      value: 4,
    };

    // Give Alice complete dark-blue set
    game.players["p1"]!.propertySets = [
      {
        setId: "p1-set-blue",
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

    game.players["p1"]!.hand = [house, hotel];
    game.turn.phase = "action";

    // Play House without specifying targetSetId (auto-resolves single eligible complete set)
    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: house.instanceId,
    });

    expect(res1.nextState.players["p1"]!.propertySets[0]?.hasHouse).toBe(true);
    expect(res1.nextState.players["p1"]!.propertySets[0]?.hasHotel).toBe(false);

    // Play Hotel on set with House without specifying targetSetId (auto-resolves)
    const res2 = applyCommand(res1.nextState, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: hotel.instanceId,
    });

    expect(res2.nextState.players["p1"]!.propertySets[0]?.hasHouse).toBe(true);
    expect(res2.nextState.players["p1"]!.propertySets[0]?.hasHotel).toBe(true);
  });

  it("should enforce Sly Deal cannot steal from complete sets", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const slyDeal: CardInstance = {
      instanceId: "test-sly",
      defId: "action-sly-deal",
      name: "Sly Deal",
      type: "action",
      value: 3,
    };

    // Bob has a completed brown set
    game.players["p2"]!.propertySets = [
      {
        setId: "bob-set-brown",
        color: "brown",
        cards: [
          { instanceId: "b1", defId: "prop-mediterranean-avenue", name: "Mediterranean Avenue", type: "property", value: 1 },
          { instanceId: "b2", defId: "prop-baltic-avenue", name: "Baltic Avenue", type: "property", value: 1 },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [1, 2],
      },
    ];

    game.players["p1"]!.hand = [slyDeal];
    game.turn.phase = "action";

    expect(() =>
      applyCommand(game, {
        type: "play_action",
        playerId: "p1",
        cardInstanceId: slyDeal.instanceId,
        targetPlayerId: "p2",
        targetCardInstanceId: "b1",
      }),
    ).toThrowError();
  });

  it("should allow Forced Deal to swap single properties between incomplete sets", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const forcedDeal: CardInstance = {
      instanceId: "test-forced-deal",
      defId: "action-forced-deal",
      name: "Forced Deal",
      type: "action",
      value: 3,
    };

    const aliceYellow: CardInstance = {
      instanceId: "alice-coventry",
      defId: "prop-coventry-street",
      name: "Coventry Street",
      type: "property",
      primaryColor: "yellow",
      value: 3,
    };

    const bobRed: CardInstance = {
      instanceId: "bob-strand",
      defId: "prop-strand",
      name: "Strand",
      type: "property",
      primaryColor: "red",
      value: 3,
    };

    // Alice has 1 yellow card on table
    game.players["p1"]!.propertySets = [
      {
        setId: "p1-yellow-set",
        color: "yellow",
        cards: [aliceYellow],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 3,
        rentTiers: [2, 4, 6],
      },
    ];

    // Bob has 1 red card on table
    game.players["p2"]!.propertySets = [
      {
        setId: "p2-red-set",
        color: "red",
        cards: [bobRed],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 3,
        rentTiers: [2, 3, 6],
      },
    ];

    game.players["p1"]!.hand = [forcedDeal];
    game.turn.phase = "action";

    const { nextState: pendingState } = applyCommand(game, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: forcedDeal.instanceId,
      targetPlayerId: "p2",
      targetCardInstanceId: bobRed.instanceId,
      offeredCardInstanceId: aliceYellow.instanceId,
    });

    expect(pendingState.pendingResolution?.type).toBe("reaction_window");

    // Bob passes reaction
    const { nextState } = applyCommand(pendingState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "pass",
    });

    // Verify Alice now has Bob's Red card
    const aliceSets = nextState.players["p1"]!.propertySets;
    expect(aliceSets.some((s) => s.cards.some((c) => c.instanceId === bobRed.instanceId))).toBe(true);
    expect(aliceSets.some((s) => s.cards.some((c) => c.instanceId === aliceYellow.instanceId))).toBe(false);

    // Verify Bob now has Alice's Yellow card
    const bobSets = nextState.players["p2"]!.propertySets;
    expect(bobSets.some((s) => s.cards.some((c) => c.instanceId === aliceYellow.instanceId))).toBe(true);
    expect(bobSets.some((s) => s.cards.some((c) => c.instanceId === bobRed.instanceId))).toBe(false);
  });

  it("should double rent and consume 2 actions when played with Double The Rent card", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const rentCard: CardInstance = {
      instanceId: "test-rent-dark-blue",
      defId: "rent-green-dark-blue",
      name: "Rent (Green / Dark Blue)",
      type: "rent",
      primaryColor: "green",
      secondaryColor: "dark-blue",
      value: 1,
    };

    const doubleRentCard: CardInstance = {
      instanceId: "test-double-rent",
      defId: "action-double-the-rent",
      name: "Double The Rent",
      type: "action",
      value: 1,
    };

    const darkBlueProp: CardInstance = {
      instanceId: "p1-mayfair",
      defId: "prop-mayfair",
      name: "Mayfair",
      type: "property",
      primaryColor: "dark-blue",
      value: 4,
    };

    game.players["p1"]!.propertySets = [
      {
        setId: "p1-dark-blue",
        color: "dark-blue",
        cards: [darkBlueProp],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];

    game.players["p1"]!.hand = [rentCard, doubleRentCard];
    game.players["p2"]!.hand = []; // Bob has no Just Say No
    game.turn.phase = "action";
    game.turn.actionsRemaining = 3;

    const { nextState: reactionState } = applyCommand(game, {
      type: "play_rent",
      playerId: "p1",
      rentCardInstanceId: rentCard.instanceId,
      chosenColor: "dark-blue",
      doubleRentCardInstanceId: doubleRentCard.instanceId,
    });

    expect(reactionState.pendingResolution?.type).toBe("reaction_window");

    // Bob passes reaction window -> advances to payment
    const { nextState } = applyCommand(reactionState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "pass",
    });

    // Rent for 1 dark blue is $3M, doubled is $6M
    expect(nextState.pendingResolution?.type).toBe("payment");
    if (nextState.pendingResolution?.type === "payment") {
      expect(nextState.pendingResolution.amountDue).toBe(6);
      expect(nextState.pendingResolution.debtorPlayerId).toBe("p2");
    }

    // Both cards removed from hand
    expect(nextState.players["p1"]!.hand.length).toBe(0);

    // Both cards in discard pile
    expect(nextState.discardPile.some((c) => c.instanceId === rentCard.instanceId)).toBe(true);
    expect(nextState.discardPile.some((c) => c.instanceId === doubleRentCard.instanceId)).toBe(true);

    // 2 actions consumed (3 - 2 = 1)
    expect(nextState.turn.actionsRemaining).toBe(1);
    expect(nextState.turn.cardsPlayedThisTurn).toBe(2);
  });
});
