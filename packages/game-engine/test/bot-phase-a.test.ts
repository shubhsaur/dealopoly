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

    const action = BotController.getNextBotAction(game, "bot", "hard");
    expect(action).toEqual({ type: "draw_cards", playerId: "bot" });
  });
});
