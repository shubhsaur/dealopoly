import { describe, expect, it } from "vitest";
import {
  BotController,
  buildWorldView,
  createGame,
  generateLegalMoves,
} from "../src/index.js";

describe("Phase A bot infrastructure", () => {
  it("builds a public WorldView with threat and wealth rankings", () => {
    const game = createGame({
      seed: 11,
      players: [
        { id: "bot", name: "Bot Atlas", isBot: true },
        { id: "rich", name: "Rich", isBot: false },
        { id: "leader", name: "Leader", isBot: false },
      ],
    });

    game.players["rich"]!.bank = [
      { instanceId: "m10", defId: "money-10m", name: "$10M", type: "money", value: 10 },
    ];
    game.players["leader"]!.propertySets = [
      {
        setId: "leader-brown",
        color: "brown",
        cards: [
          { instanceId: "b1", defId: "prop-mediterranean", name: "Mediterranean", type: "property", value: 1, primaryColor: "brown" },
          { instanceId: "b2", defId: "prop-baltic", name: "Baltic", type: "property", value: 1, primaryColor: "brown" },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [1, 2],
      },
      {
        setId: "leader-util",
        color: "utility",
        cards: [
          { instanceId: "u1", defId: "prop-electric", name: "Electric Company", type: "property", value: 2, primaryColor: "utility" },
          { instanceId: "u2", defId: "prop-water", name: "Water Works", type: "property", value: 2, primaryColor: "utility" },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [1, 2],
      },
    ];

    const world = buildWorldView(game, "bot");

    expect(world.opponents).toHaveLength(2);
    expect(world.biggestThreat?.playerId).toBe("leader");
    expect(world.richestOpponent?.playerId).toBe("rich");
    expect(world.defensiveMode).toBe(true);
    expect(world.turnsToWin).toBeGreaterThan(0);
  });

  it("generates legal draw and end-turn commands", () => {
    const game = createGame({
      seed: 12,
      players: [
        { id: "bot", name: "Bot Atlas", isBot: true },
        { id: "p2", name: "Human", isBot: false },
      ],
    });

    game.turn.activePlayerId = "bot";
    game.turn.phase = "draw";
    expect(generateLegalMoves(game, "bot")).toEqual([{ type: "draw_cards", playerId: "bot" }]);

    game.turn.phase = "action";
    game.turn.actionsRemaining = 0;
    expect(generateLegalMoves(game, "bot")).toEqual([{ type: "end_turn", playerId: "bot" }]);
  });

  it("accepts difficulty on getNextBotAction and returns a legal command", () => {
    const game = createGame({
      seed: 13,
      players: [
        { id: "bot", name: "Bot Atlas", isBot: true },
        { id: "p2", name: "Human", isBot: false },
      ],
    });

    game.turn.activePlayerId = "bot";
    game.turn.phase = "draw";

    for (const diff of ["easy", "medium", "hard", "expert"] as const) {
      const action = BotController.getNextBotAction(game, "bot", diff);
      expect(action).toEqual({ type: "draw_cards", playerId: "bot" });
    }
  });

  it("generates reaction moves: pass and just_say_no when available", () => {
    const game = createGame({
      seed: 14,
      players: [
        { id: "bot", name: "Bot Atlas", isBot: true },
        { id: "p2", name: "Human", isBot: false },
      ],
    });

    const jsnCard = {
      instanceId: "jsn-1",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action" as const,
      value: 4,
    };
    game.players["bot"]!.hand = [jsnCard];
    game.pendingResolution = {
      type: "reaction_window",
      initiatorPlayerId: "p2",
      targetPlayerId: "bot",
      waitingForPlayerId: "bot",
      actionCard: {
        instanceId: "db-1",
        defId: "action-deal-breaker",
        name: "Deal Breaker",
        type: "action" as const,
        value: 5,
      },
      justSayNoChainCount: 0,
      justSayNoPlayedBy: [],
    };

    const moves = generateLegalMoves(game, "bot");
    expect(moves).toContainEqual({
      type: "submit_reaction",
      playerId: "bot",
      action: "pass",
    });
    expect(moves).toContainEqual({
      type: "submit_reaction",
      playerId: "bot",
      action: "just_say_no",
      justSayNoCardInstanceId: "jsn-1",
    });
  });

  it("generates discard combinations when in discard resolution", () => {
    const game = createGame({
      seed: 15,
      players: [
        { id: "bot", name: "Bot Atlas", isBot: true },
        { id: "p2", name: "Human", isBot: false },
      ],
    });

    game.players["bot"]!.hand = [
      { instanceId: "c1", defId: "money-1m", name: "$1M", type: "money", value: 1 },
      { instanceId: "c2", defId: "money-2m", name: "$2M", type: "money", value: 2 },
      { instanceId: "c3", defId: "money-3m", name: "$3M", type: "money", value: 3 },
    ];
    game.pendingResolution = {
      type: "discard",
      playerId: "bot",
      requiredDiscardCount: 2,
    };

    const moves = generateLegalMoves(game, "bot");
    expect(moves).toHaveLength(3); // 3 choose 2 = 3 combinations
    for (const move of moves) {
      expect(move.type).toBe("discard_cards");
      if (move.type === "discard_cards") {
        expect(move.cardInstanceIds).toHaveLength(2);
      }
    }
  });

  it("generates legal property, wild, action, and rent moves in action phase", () => {
    const game = createGame({
      seed: 16,
      players: [
        { id: "bot", name: "Bot Atlas", isBot: true },
        { id: "p2", name: "Human", isBot: false },
      ],
    });

    game.turn.activePlayerId = "bot";
    game.turn.phase = "action";
    game.turn.actionsRemaining = 3;

    // Set opponent with a complete set and an incomplete property
    game.players["p2"]!.propertySets = [
      {
        setId: "p2-brown",
        color: "brown",
        cards: [
          { instanceId: "p2-b1", defId: "prop-mediterranean", name: "Mediterranean", type: "property", value: 1, primaryColor: "brown" },
          { instanceId: "p2-b2", defId: "prop-baltic", name: "Baltic", type: "property", value: 1, primaryColor: "brown" },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: true,
        setSize: 2,
        rentTiers: [1, 2],
      },
      {
        setId: "p2-dark-blue",
        color: "dark-blue",
        cards: [
          { instanceId: "p2-db1", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4, primaryColor: "dark-blue" },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 2,
        rentTiers: [3, 8],
      },
    ];

    // Bot has a set to offer for Force Deal and rent cards
    game.players["bot"]!.propertySets = [
      {
        setId: "bot-green",
        color: "green",
        cards: [
          { instanceId: "bot-g1", defId: "prop-regent", name: "Regent", type: "property", value: 4, primaryColor: "green" },
        ],
        hasHouse: false,
        hasHotel: false,
        isComplete: false,
        setSize: 3,
        rentTiers: [2, 4, 7],
      },
    ];

    game.players["bot"]!.hand = [
      { instanceId: "act-pg", defId: "action-pass-go", name: "Pass Go", type: "action", value: 1 },
      { instanceId: "act-db", defId: "action-deal-breaker", name: "Deal Breaker", type: "action", value: 5 },
      { instanceId: "act-sly", defId: "action-sly-deal", name: "Sly Deal", type: "action", value: 3 },
      { instanceId: "act-fd", defId: "action-force-deal", name: "Force Deal", type: "action", value: 3 },
      { instanceId: "act-dc", defId: "action-debt-collector", name: "Debt Collector", type: "action", value: 3 },
      { instanceId: "prop-g2", defId: "prop-oxford", name: "Oxford", type: "property", value: 4, primaryColor: "green" },
      { instanceId: "wild-dg", defId: "wild-dark-blue-green", name: "Wild DB/G", type: "property-wild", value: 4, primaryColor: "dark-blue", secondaryColor: "green" },
      { instanceId: "rent-g", defId: "rent-green-blue", name: "Rent G", type: "rent", value: 1, primaryColor: "green", secondaryColor: "dark-blue" },
      { instanceId: "rent-double", defId: "action-double-the-rent", name: "Double Rent", type: "action", value: 1 },
    ];

    const moves = generateLegalMoves(game, "bot");

    // Check action cards generated
    expect(moves.some((m) => m.type === "play_action" && m.cardInstanceId === "act-pg")).toBe(true);
    expect(moves.some((m) => m.type === "play_action" && m.cardInstanceId === "act-db" && m.targetSetId === "p2-brown")).toBe(true);
    expect(moves.some((m) => m.type === "play_action" && m.cardInstanceId === "act-sly" && m.targetCardInstanceId === "p2-db1")).toBe(true);
    expect(moves.some((m) => m.type === "play_action" && m.cardInstanceId === "act-fd" && m.targetCardInstanceId === "p2-db1" && m.offeredCardInstanceId === "bot-g1")).toBe(true);
    expect(moves.some((m) => m.type === "play_action" && m.cardInstanceId === "act-dc" && m.targetPlayerId === "p2")).toBe(true);

    // Check properties and wilds
    expect(moves.some((m) => m.type === "play_property" && m.cardInstanceId === "prop-g2")).toBe(true);
    expect(moves.some((m) => m.type === "play_property" && m.cardInstanceId === "wild-dg" && m.chosenColor === "green")).toBe(true);
    expect(moves.some((m) => m.type === "play_property" && m.cardInstanceId === "wild-dg" && m.chosenColor === "dark-blue")).toBe(true);

    // Check rent with and without double the rent
    expect(moves.some((m) => m.type === "play_rent" && m.rentCardInstanceId === "rent-g" && !m.doubleRentCardInstanceId)).toBe(true);
    expect(moves.some((m) => m.type === "play_rent" && m.rentCardInstanceId === "rent-g" && m.doubleRentCardInstanceId === "rent-double")).toBe(true);
  });
});
