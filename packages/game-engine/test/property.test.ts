import { describe, expect, it } from "vitest";
import { createGame, applyCommand, type CardInstance, calculateSetRent } from "../src/index.js";

describe("Property Sets and Wilds", () => {
  it("should allow playing a property card and creating a property set", () => {
    const game = createGame({
      seed: 100,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const propCard: CardInstance = {
      instanceId: "test-prop-dark-blue-1",
      defId: "prop-park-lane",
      name: "Park Lane",
      type: "property",
      primaryColor: "dark-blue",
      value: 4,
      setSize: 2,
    };

    // Inject card into hand
    game.players["p1"]!.hand = [propCard];
    game.turn.phase = "action";

    const { nextState } = applyCommand(game, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: propCard.instanceId,
    });

    const p1Sets = nextState.players["p1"]!.propertySets;
    expect(p1Sets.length).toBe(1);
    expect(p1Sets[0]?.color).toBe("dark-blue");
    expect(p1Sets[0]?.cards.length).toBe(1);
    expect(p1Sets[0]?.isComplete).toBe(false);
    expect(nextState.turn.actionsRemaining).toBe(2);
  });

  it("should mark property set as complete when reaching required set size", () => {
    const game = createGame({
      seed: 100,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const card1: CardInstance = {
      instanceId: "test-brown-1",
      defId: "prop-mediterranean-avenue",
      name: "Mediterranean Avenue",
      type: "property",
      primaryColor: "brown",
      value: 1,
      setSize: 2,
    };
    const card2: CardInstance = {
      instanceId: "test-brown-2",
      defId: "prop-baltic-avenue",
      name: "Baltic Avenue",
      type: "property",
      primaryColor: "brown",
      value: 1,
      setSize: 2,
    };

    game.players["p1"]!.hand = [card1, card2];
    game.turn.phase = "action";

    // Play card 1
    const res1 = applyCommand(game, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: card1.instanceId,
    });
    const setId = res1.nextState.players["p1"]!.propertySets[0]!.setId;

    // Play card 2 into existing set
    const res2 = applyCommand(res1.nextState, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: card2.instanceId,
      targetSetId: setId,
    });

    const p1Sets = res2.nextState.players["p1"]!.propertySets;
    expect(p1Sets.length).toBe(1);
    expect(p1Sets[0]?.isComplete).toBe(true);
    expect(p1Sets[0]?.cards.length).toBe(2);
  });

  it("should allow playing and reorganizing wild property cards into existing property sets", () => {
    const game = createGame({
      seed: 100,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const pinkProp: CardInstance = {
      instanceId: "test-prop-pink-1",
      defId: "prop-pall-mall",
      name: "Pall Mall",
      type: "property",
      primaryColor: "pink",
      value: 2,
      setSize: 3,
    };
    const orangeProp: CardInstance = {
      instanceId: "test-prop-orange-1",
      defId: "prop-bow-street",
      name: "Bow Street",
      type: "property",
      primaryColor: "orange",
      value: 2,
      setSize: 3,
    };
    const wildCard: CardInstance = {
      instanceId: "test-wild-pink-orange",
      defId: "wild-pink-orange",
      name: "Property Wild Card",
      type: "property-wild",
      primaryColor: "pink",
      secondaryColor: "orange",
      value: 2,
    };

    // Alice has a Pink set and an Orange set on her table
    game.players["p1"]!.propertySets = [
      {
        setId: "p1-pink-set",
        color: "pink",
        cards: [pinkProp],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 3,
        rentTiers: [1, 2, 4],
      },
      {
        setId: "p1-orange-set",
        color: "orange",
        cards: [orangeProp],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 3,
        rentTiers: [1, 3, 5],
      },
    ];

    game.players["p1"]!.hand = [wildCard];
    game.turn.phase = "action";

    // Play as Pink into existing pink set
    const res1 = applyCommand(game, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: wildCard.instanceId,
      chosenColor: "pink",
    });

    const pinkSet = res1.nextState.players["p1"]!.propertySets.find((s) => s.color === "pink")!;
    expect(pinkSet.cards.length).toBe(2);
    expect(pinkSet.cards.some((c) => c.instanceId === wildCard.instanceId && c.currentColor === "pink")).toBe(true);

    // Reorganize to Orange set without consuming actions
    const initialActions = res1.nextState.turn.actionsRemaining;
    const res2 = applyCommand(res1.nextState, {
      type: "reorganize_wild",
      playerId: "p1",
      cardInstanceId: wildCard.instanceId,
      fromSetId: pinkSet.setId,
      newColor: "orange",
    });

    const orangeSet = res2.nextState.players["p1"]!.propertySets.find((s) => s.color === "orange")!;
    expect(orangeSet.cards.length).toBe(2);
    expect(orangeSet.cards.some((c) => c.instanceId === wildCard.instanceId && c.currentColor === "orange")).toBe(true);
    expect(res2.nextState.turn.actionsRemaining).toBe(initialActions);
  });

  it("should allow playing a wild property card when no property of that color is already present on the table", () => {
    const game = createGame({
      seed: 100,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const wildCard: CardInstance = {
      instanceId: "test-wild-pink-orange",
      defId: "wild-pink-orange",
      name: "Property Wild Card",
      type: "property-wild",
      primaryColor: "pink",
      secondaryColor: "orange",
      value: 2,
    };

    game.players["p1"]!.hand = [wildCard];
    game.players["p1"]!.propertySets = []; // No property sets on table
    game.turn.phase = "action";

    // Playing a wild card creates a new property set for the chosen color
    const res = applyCommand(game, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: wildCard.instanceId,
      chosenColor: "pink",
    });

    const sets = res.nextState.players["p1"]!.propertySets;
    expect(sets.length).toBe(1);
    expect(sets[0]?.color).toBe("pink");
    expect(sets[0]?.cards.length).toBe(1);
  });

  it("should automatically merge same-color property cards without specifying targetSetId", () => {
    const game = createGame({
      seed: 100,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const card1: CardInstance = {
      instanceId: "test-red-1",
      defId: "prop-strand",
      name: "Strand",
      type: "property",
      primaryColor: "red",
      value: 3,
      setSize: 3,
    };
    const card2: CardInstance = {
      instanceId: "test-red-2",
      defId: "prop-fleet-street",
      name: "Fleet Street",
      type: "property",
      primaryColor: "red",
      value: 3,
      setSize: 3,
    };

    game.players["p1"]!.hand = [card1, card2];
    game.turn.phase = "action";

    // Play card 1 without targetSetId
    const res1 = applyCommand(game, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: card1.instanceId,
    });

    // Play card 2 without targetSetId -> must automatically merge into the red set
    const res2 = applyCommand(res1.nextState, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: card2.instanceId,
    });

    const p1Sets = res2.nextState.players["p1"]!.propertySets;
    expect(p1Sets.length).toBe(1);
    expect(p1Sets[0]?.color).toBe("red");
    expect(p1Sets[0]?.cards.length).toBe(2);
    expect(p1Sets[0]?.isComplete).toBe(false);
  });

  it("should automatically merge wild card into same-color property set without targetSetId", () => {
    const game = createGame({
      seed: 100,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const propCard: CardInstance = {
      instanceId: "test-dark-blue-prop",
      defId: "prop-mayfair",
      name: "Mayfair",
      type: "property",
      primaryColor: "dark-blue",
      value: 4,
      setSize: 2,
    };
    const wildCard: CardInstance = {
      instanceId: "test-dark-blue-wild",
      defId: "wild-dark-blue-green",
      name: "Property Wild Card",
      type: "property-wild",
      primaryColor: "dark-blue",
      secondaryColor: "green",
      value: 4,
      setSize: 2,
    };

    game.players["p1"]!.hand = [propCard, wildCard];
    game.turn.phase = "action";

    // Play Mayfair
    const res1 = applyCommand(game, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: propCard.instanceId,
    });

    // Play Wild card as dark-blue without targetSetId -> must auto-merge and complete set
    const res2 = applyCommand(res1.nextState, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: wildCard.instanceId,
      chosenColor: "dark-blue",
    });

    const p1Sets = res2.nextState.players["p1"]!.propertySets;
    expect(p1Sets.length).toBe(1);
    expect(p1Sets[0]?.color).toBe("dark-blue");
    expect(p1Sets[0]?.cards.length).toBe(2);
    expect(p1Sets[0]?.isComplete).toBe(true);
  });

  it("should allow completing a set, charging rent, and then rearranging the wild card to break the set as a free action", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const mayfair: CardInstance = {
      instanceId: "test-mayfair",
      defId: "prop-mayfair",
      name: "Mayfair",
      type: "property",
      primaryColor: "dark-blue",
      value: 4,
      setSize: 2,
    };
    const wildBlueGreen: CardInstance = {
      instanceId: "test-wild-blue-green",
      defId: "wild-dark-blue-green",
      name: "Property Wild Card",
      type: "property-wild",
      primaryColor: "dark-blue",
      secondaryColor: "green",
      value: 4,
    };
    const rentCard: CardInstance = {
      instanceId: "test-rent-blue-green",
      defId: "rent-dark-blue-green",
      name: "Rent",
      type: "rent",
      primaryColor: "dark-blue",
      secondaryColor: "green",
      value: 1,
    };

    // Bob has $10M in bank to pay rent
    game.players["p2"]!.bank = [
      {
        instanceId: "bob-money-5",
        defId: "money-5",
        name: "$5M",
        type: "money",
        value: 5,
      },
      {
        instanceId: "bob-money-5-2",
        defId: "money-5",
        name: "$5M",
        type: "money",
        value: 5,
      },
    ];

    // Alice has Mayfair on table
    game.players["p1"]!.propertySets = [
      {
        setId: "p1-blue-set",
        color: "dark-blue",
        cards: [mayfair],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];

    // Alice has wild card and rent card in hand
    game.players["p1"]!.hand = [wildBlueGreen, rentCard];
    game.turn.phase = "action";
    game.turn.actionsRemaining = 3;

    // Action 1: Play wild card as dark-blue to complete Dark Blue set ($8M rent value)
    const step1 = applyCommand(game, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: wildBlueGreen.instanceId,
      chosenColor: "dark-blue",
    });

    expect(step1.nextState.turn.actionsRemaining).toBe(2);
    const blueSet = step1.nextState.players["p1"]!.propertySets.find((s) => s.color === "dark-blue");
    expect(blueSet?.isComplete).toBe(true);
    expect(blueSet?.cards.length).toBe(2);

    // Action 2: Play rent card on complete dark-blue set -> enters reaction window
    const step2 = applyCommand(step1.nextState, {
      type: "play_rent",
      playerId: "p1",
      rentCardInstanceId: rentCard.instanceId,
      chosenColor: "dark-blue",
    });

    expect(step2.nextState.turn.actionsRemaining).toBe(1);
    expect(step2.nextState.pendingResolution?.type).toBe("reaction_window");

    // Bob passes reaction -> advances to payment
    const step2Pass = applyCommand(step2.nextState, {
      type: "submit_reaction",
      playerId: "p2",
      action: "pass",
    });

    expect(step2Pass.nextState.pendingResolution?.type).toBe("payment");

    // Bob pays the $8M rent
    const step3 = applyCommand(step2Pass.nextState, {
      type: "submit_payment",
      playerId: "p2",
      paymentCardInstanceIds: ["bob-money-5", "bob-money-5-2"],
    });

    expect(step3.nextState.pendingResolution).toBeNull();
    expect(step3.nextState.turn.actionsRemaining).toBe(1);

    // Free Move: Reorganize wild card from Dark Blue to Green
    const step4 = applyCommand(step3.nextState, {
      type: "reorganize_wild",
      playerId: "p1",
      cardInstanceId: wildBlueGreen.instanceId,
      fromSetId: "p1-blue-set",
      newColor: "green",
    });

    // 1. Actions remaining remains unchanged (0 actions spent)
    expect(step4.nextState.turn.actionsRemaining).toBe(1);

    // 2. Dark Blue set is now broken (1 card, incomplete)
    const updatedBlueSet = step4.nextState.players["p1"]!.propertySets.find((s) => s.color === "dark-blue");
    expect(updatedBlueSet?.cards.length).toBe(1);
    expect(updatedBlueSet?.isComplete).toBe(false);

    // 3. Green set is newly created with the wild card (1/3 cards)
    const newGreenSet = step4.nextState.players["p1"]!.propertySets.find((s) => s.color === "green");
    expect(newGreenSet).toBeDefined();
    expect(newGreenSet?.cards.length).toBe(1);
    expect(newGreenSet?.cards[0]?.instanceId).toBe(wildBlueGreen.instanceId);
    expect(newGreenSet?.cards[0]?.currentColor).toBe("green");
  });

  it("should prevent moving a wild card away from a completed set that has a House or Hotel", () => {
    const game = createGame({
      seed: 300,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const mayfair: CardInstance = {
      instanceId: "test-mayfair",
      defId: "prop-mayfair",
      name: "Mayfair",
      type: "property",
      primaryColor: "dark-blue",
      value: 4,
      setSize: 2,
    };
    const wildBlueGreen: CardInstance = {
      instanceId: "test-wild-blue-green",
      defId: "wild-dark-blue-green",
      name: "Property Wild Card",
      type: "property-wild",
      primaryColor: "dark-blue",
      secondaryColor: "green",
      value: 4,
    };
    const houseCard: CardInstance = {
      instanceId: "test-house",
      defId: "action-house",
      name: "House",
      type: "action",
      value: 3,
    };

    // Alice has complete Dark Blue set with a House
    game.players["p1"]!.propertySets = [
      {
        setId: "p1-blue-set",
        color: "dark-blue",
        cards: [mayfair, wildBlueGreen],
        hasHouse: true,
        hasHotel: false,
        houseCard,
        isComplete: true,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];

    game.turn.phase = "action";

    // Attempting to move wild card away would break the base set for the House
    expect(() =>
      applyCommand(game, {
        type: "reorganize_wild",
        playerId: "p1",
        cardInstanceId: wildBlueGreen.instanceId,
        fromSetId: "p1-blue-set",
        newColor: "green",
      }),
    ).toThrowError(/House or Hotel/i);
  });

  it("should reject reorganization when not player's turn or during pending actions", () => {
    const game = createGame({
      seed: 400,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const wildCard: CardInstance = {
      instanceId: "test-wild",
      defId: "wild-pink-orange",
      name: "Property Wild Card",
      type: "property-wild",
      primaryColor: "pink",
      secondaryColor: "orange",
      value: 2,
    };

    game.players["p2"]!.propertySets = [
      {
        setId: "p2-pink-set",
        color: "pink",
        cards: [wildCard],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 3,
        rentTiers: [1, 2, 4],
      },
    ];

    game.turn.activePlayerId = "p1";
    game.turn.phase = "action";

    // Bob trying to reorganize during Alice's turn
    expect(() =>
      applyCommand(game, {
        type: "reorganize_wild",
        playerId: "p2",
        cardInstanceId: wildCard.instanceId,
        fromSetId: "p2-pink-set",
        newColor: "orange",
      }),
    ).toThrowError(/turn/i);
  });

  it("should allow playing a dual-color wild card on its own without existing table cards", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const wildCard: CardInstance = {
      instanceId: "wild-red-yellow-1",
      defId: "wild-red-yellow",
      name: "Property Wild Card",
      type: "property-wild",
      primaryColor: "red",
      secondaryColor: "yellow",
      value: 3,
    };

    game.players["p1"]!.hand = [wildCard];
    game.players["p1"]!.propertySets = []; // 0 cards on table
    game.turn.phase = "action";

    // Play as red to start a new set
    const { nextState } = applyCommand(game, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: wildCard.instanceId,
      chosenColor: "red",
    });

    const p1Sets = nextState.players["p1"]!.propertySets;
    expect(p1Sets.length).toBe(1);
    expect(p1Sets[0]?.color).toBe("red");
    expect(p1Sets[0]?.cards.length).toBe(1);
    expect(p1Sets[0]?.cards[0]?.instanceId).toBe("wild-red-yellow-1");
    expect(p1Sets[0]?.cards[0]?.currentColor).toBe("red");

    // Dual-color wild cards have rent printed on them, so 1 card produces tier 1 rent ($2M for Red)
    expect(calculateSetRent(p1Sets[0]!)).toBe(2);
  });

  it("should allow playing a 10-color multicolor wild card on its own to start a set", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const multiWild: CardInstance = {
      instanceId: "wild-multi-1",
      defId: "wild-multicolor",
      name: "Property Wild Card (All)",
      type: "property-wild",
      primaryColor: "all",
      value: 0,
    };

    game.players["p1"]!.hand = [multiWild];
    game.players["p1"]!.propertySets = []; // 0 cards on table
    game.turn.phase = "action";

    // Play as green to start a new set
    const { nextState } = applyCommand(game, {
      type: "play_property",
      playerId: "p1",
      cardInstanceId: multiWild.instanceId,
      chosenColor: "green",
    });

    const p1Sets = nextState.players["p1"]!.propertySets;
    expect(p1Sets.length).toBe(1);
    expect(p1Sets[0]?.color).toBe("green");
    expect(p1Sets[0]?.cards.length).toBe(1);
    expect(p1Sets[0]?.cards[0]?.currentColor).toBe("green");

    // Official rule: 10-color multicolor wild card alone cannot charge rent
    expect(calculateSetRent(p1Sets[0]!)).toBe(0);

    // Attempting to charge rent on solo multicolor wild card throws error
    const rentCard: CardInstance = {
      instanceId: "rent-green",
      defId: "rent-green-dark-blue",
      name: "Rent (Green / Dark Blue)",
      type: "rent",
      primaryColor: "green",
      secondaryColor: "dark-blue",
      value: 1,
    };
    nextState.players["p1"]!.hand = [rentCard];

    expect(() =>
      applyCommand(nextState, {
        type: "play_rent",
        playerId: "p1",
        rentCardInstanceId: rentCard.instanceId,
        chosenColor: "green",
      }),
    ).toThrowError(/multicolor wild card cannot charge rent on its own/);
  });

  it("should charge rent on a set with a multicolor wild card once a second property card is added", () => {
    const game = createGame({
      seed: 200,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    const multiWild: CardInstance = {
      instanceId: "wild-multi-1",
      defId: "wild-multicolor",
      name: "Property Wild Card (All)",
      type: "property-wild",
      primaryColor: "all",
      value: 0,
    };

    const regularGreen: CardInstance = {
      instanceId: "prop-green-1",
      defId: "prop-regent-street",
      name: "Regent Street",
      type: "property",
      primaryColor: "green",
      value: 4,
    };

    const rentCard: CardInstance = {
      instanceId: "rent-green",
      defId: "rent-green-dark-blue",
      name: "Rent (Green / Dark Blue)",
      type: "rent",
      primaryColor: "green",
      secondaryColor: "dark-blue",
      value: 1,
    };

    // Both cards in green set (2 cards in set: rent for green is $4M)
    game.players["p1"]!.propertySets = [
      {
        setId: "green-set",
        color: "green",
        cards: [multiWild, regularGreen],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 3,
        rentTiers: [2, 4, 7],
      },
    ];
    game.players["p1"]!.hand = [rentCard];
    game.turn.phase = "action";

    expect(calculateSetRent(game.players["p1"]!.propertySets[0]!)).toBe(4);

    const { nextState } = applyCommand(game, {
      type: "play_rent",
      playerId: "p1",
      rentCardInstanceId: rentCard.instanceId,
      chosenColor: "green",
    });

    expect(nextState.pendingResolution?.type).toBe("reaction_window");
    if (nextState.pendingResolution?.type === "reaction_window") {
      expect(nextState.pendingResolution.rentAmount).toBe(4);
    }
  });
});
