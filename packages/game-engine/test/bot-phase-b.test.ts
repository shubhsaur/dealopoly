import { describe, expect, it } from "vitest";
import {
  BotController,
  buildWorldView,
  createGame,
  generateLegalMoves,
  scoreMoves,
  selectMove,
  cardContributionScore,
} from "../src/index.js";

describe("Phase B bot intelligence (Easy + Medium)", () => {
  describe("Discard logic", () => {
    it("assigns high contribution score to set completers and power actions, low to money/idle cards", () => {
      const game = createGame({
        seed: 20,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      // Bot has an incomplete brown set (1 of 2 cards)
      game.players["bot"]!.propertySets = [
        {
          setId: "bot-brown",
          color: "brown",
          cards: [
            { instanceId: "b1", defId: "prop-mediterranean", name: "Mediterranean", type: "property", value: 1, primaryColor: "brown" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [1, 2],
        },
      ];

      const bot = game.players["bot"]!;

      // Completes set -> 100
      const completer = { instanceId: "b2", defId: "prop-baltic", name: "Baltic", type: "property" as const, value: 1, primaryColor: "brown" as const };
      expect(cardContributionScore(bot, completer)).toBe(100);

      // Power actions -> 95 for JSN, 90 for Deal Breaker, 75 for Sly Deal
      const jsn = { instanceId: "jsn", defId: "action-just-say-no", name: "JSN", type: "action" as const, value: 4 };
      const db = { instanceId: "db", defId: "action-deal-breaker", name: "DB", type: "action" as const, value: 5 };
      const sly = { instanceId: "sly", defId: "action-sly-deal", name: "Sly", type: "action" as const, value: 3 };
      expect(cardContributionScore(bot, jsn)).toBe(95);
      expect(cardContributionScore(bot, db)).toBe(90);
      expect(cardContributionScore(bot, sly)).toBe(75);

      // Standalone new property -> 20
      const newProp = { instanceId: "g1", defId: "prop-regent", name: "Regent", type: "property" as const, value: 4, primaryColor: "green" as const };
      expect(cardContributionScore(bot, newProp)).toBe(20);

      // Money -> face value
      const m1 = { instanceId: "m1", defId: "money-1m", name: "$1M", type: "money" as const, value: 1 };
      const m5 = { instanceId: "m5", defId: "money-5m", name: "$5M", type: "money" as const, value: 5 };
      expect(cardContributionScore(bot, m1)).toBe(1);
      expect(cardContributionScore(bot, m5)).toBe(5);
    });

    it("Medium bot discards lowest contribution cards, preserving set completers and power actions", () => {
      const game = createGame({
        seed: 21,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      game.players["bot"]!.propertySets = [
        {
          setId: "bot-brown",
          color: "brown",
          cards: [
            { instanceId: "b1", defId: "prop-mediterranean", name: "Mediterranean", type: "property", value: 1, primaryColor: "brown" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [1, 2],
        },
      ];

      const completer = { instanceId: "b2", defId: "prop-baltic", name: "Baltic", type: "property" as const, value: 1, primaryColor: "brown" as const };
      const jsn = { instanceId: "jsn", defId: "action-just-say-no", name: "JSN", type: "action" as const, value: 4 };
      const lowMoney1 = { instanceId: "m1", defId: "money-1m", name: "$1M", type: "money" as const, value: 1 };
      const lowMoney2 = { instanceId: "m2", defId: "money-2m", name: "$2M", type: "money" as const, value: 2 };

      game.players["bot"]!.hand = [completer, jsn, lowMoney1, lowMoney2];
      game.pendingResolution = {
        type: "discard",
        playerId: "bot",
        requiredDiscardCount: 2,
      };

      const action = BotController.getNextBotAction(game, "bot", "medium");
      expect(action).not.toBeNull();
      expect(action?.type).toBe("discard_cards");
      if (action?.type === "discard_cards") {
        expect(action.cardInstanceIds).toContain("m1");
        expect(action.cardInstanceIds).toContain("m2");
        expect(action.cardInstanceIds).not.toContain("b2");
        expect(action.cardInstanceIds).not.toContain("jsn");
      }
    });
  });

  describe("Wild card placement", () => {
    it("Medium bot prioritizes placing wild on set closest to completion", () => {
      const game = createGame({
        seed: 22,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      // Set 1: Green (size 3, has 1 card -> needs 2 cards)
      // Set 2: Dark Blue (size 2, has 1 card -> needs 1 card -> CLOSER!)
      game.players["bot"]!.propertySets = [
        {
          setId: "bot-green",
          color: "green",
          cards: [
            { instanceId: "g1", defId: "prop-regent", name: "Regent", type: "property", value: 4, primaryColor: "green" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 3,
          rentTiers: [2, 4, 7],
        },
        {
          setId: "bot-dark-blue",
          color: "dark-blue",
          cards: [
            { instanceId: "db1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4, primaryColor: "dark-blue" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [3, 8],
        },
      ];

      // Wild card: Dark Blue / Green
      game.players["bot"]!.hand = [
        {
          instanceId: "wild-dbg",
          defId: "wild-dark-blue-green",
          name: "Wild DB/G",
          type: "property-wild",
          value: 4,
          primaryColor: "dark-blue",
          secondaryColor: "green",
        },
      ];
      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "medium");
      expect(action).not.toBeNull();
      expect(action?.type).toBe("play_property");
      if (action?.type === "play_property") {
        // Must choose dark-blue because it completes the set (needs 1 card vs 2)
        expect(action.chosenColor).toBe("dark-blue");
      }
    });

    it("Medium bot starts new set on most valuable color when no sets in progress", () => {
      const game = createGame({
        seed: 23,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      game.players["bot"]!.propertySets = []; // no sets in progress

      // Wild card: Light Blue / Brown (Light blue full rent is $3M, Brown is $2M)
      game.players["bot"]!.hand = [
        {
          instanceId: "wild-lbb",
          defId: "wild-light-blue-brown",
          name: "Wild LB/B",
          type: "property-wild",
          value: 1,
          primaryColor: "light-blue",
          secondaryColor: "brown",
        },
      ];
      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "medium");
      expect(action?.type).toBe("play_property");
      if (action?.type === "play_property") {
        expect(action.chosenColor).toBe("light-blue");
      }
    });
  });

  describe("Rent targeting", () => {
    it("Medium bot targets richestOpponent when playing targeted rent", () => {
      const game = createGame({
        seed: 24,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "poor", name: "Poor", isBot: false },
          { id: "rich", name: "Rich", isBot: false },
        ],
      });

      game.players["poor"]!.bank = [
        { instanceId: "p-m1", defId: "money-1m", name: "$1M", type: "money", value: 1 },
      ];
      game.players["rich"]!.bank = [
        { instanceId: "r-m10", defId: "money-10m", name: "$10M", type: "money", value: 10 },
      ];

      game.players["bot"]!.propertySets = [
        {
          setId: "bot-brown",
          color: "brown",
          cards: [
            { instanceId: "b1", defId: "prop-mediterranean", name: "Mediterranean", type: "property", value: 1, primaryColor: "brown" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [1, 2],
        },
      ];

      // Multi-color wild rent (targets single player)
      game.players["bot"]!.hand = [
        {
          instanceId: "rent-wild",
          defId: "rent-wild",
          name: "Wild Rent",
          type: "rent",
          value: 3,
          primaryColor: "all",
        },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "medium");
      expect(action?.type).toBe("play_rent");
      if (action?.type === "play_rent") {
        expect(action.targetPlayerId).toBe("rich");
      }
    });
  });

  describe("Pass Go guard", () => {
    it("Medium bot plays Pass Go when handSize <= 4", () => {
      const game = createGame({
        seed: 25,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      game.players["bot"]!.hand = [
        { instanceId: "pg1", defId: "action-pass-go", name: "Pass Go", type: "action", value: 1 },
        { instanceId: "m1", defId: "money-1m", name: "$1M", type: "money", value: 1 },
      ]; // hand size 2 <= 4

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "medium");
      expect(action).toEqual({
        type: "play_action",
        playerId: "bot",
        cardInstanceId: "pg1",
      });
    });

    it("Medium bot avoids playing Pass Go when handSize > 4", () => {
      const game = createGame({
        seed: 26,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      // Hand size 6 > 4
      game.players["bot"]!.hand = [
        { instanceId: "pg1", defId: "action-pass-go", name: "Pass Go", type: "action", value: 1 },
        { instanceId: "m1", defId: "money-1m", name: "$1M", type: "money", value: 1 },
        { instanceId: "m2", defId: "money-2m", name: "$2M", type: "money", value: 2 },
        { instanceId: "m3", defId: "money-3m", name: "$3M", type: "money", value: 3 },
        { instanceId: "m4", defId: "money-4m", name: "$4M", type: "money", value: 4 },
        { instanceId: "m5", defId: "money-5m", name: "$5M", type: "money", value: 5 },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "medium");
      // Should NOT play Pass Go; banking money or ending turn is preferred
      expect(action?.type).not.toBe("play_action");
      expect(action?.type).toBe("bank_card");
    });
  });

  describe("Action card priority in Medium", () => {
    it("plays Deal Breaker to steal an opponent complete set", () => {
      const game = createGame({
        seed: 27,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      game.players["p2"]!.propertySets = [
        {
          setId: "p2-brown",
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
      ];

      game.players["bot"]!.hand = [
        { instanceId: "db", defId: "action-deal-breaker", name: "Deal Breaker", type: "action", value: 5 },
        { instanceId: "m1", defId: "money-1m", name: "$1M", type: "money", value: 1 },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "medium");
      expect(action).toEqual({
        type: "play_action",
        playerId: "bot",
        cardInstanceId: "db",
        targetPlayerId: "p2",
        targetSetId: "p2-brown",
      });
    });

    it("plays Sly Deal if stealing target card completes bot's set", () => {
      const game = createGame({
        seed: 28,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      // Bot needs 1 dark blue card
      game.players["bot"]!.propertySets = [
        {
          setId: "bot-db",
          color: "dark-blue",
          cards: [
            { instanceId: "b-pl", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4, primaryColor: "dark-blue" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [3, 8],
        },
      ];

      // Opponent has Mayfair (incomplete set)
      game.players["p2"]!.propertySets = [
        {
          setId: "p2-db",
          color: "dark-blue",
          cards: [
            { instanceId: "p-mayfair", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4, primaryColor: "dark-blue" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [3, 8],
        },
      ];

      game.players["bot"]!.hand = [
        { instanceId: "sly", defId: "action-sly-deal", name: "Sly Deal", type: "action", value: 3 },
        { instanceId: "m1", defId: "money-1m", name: "$1M", type: "money", value: 1 },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "medium");
      expect(action).toEqual({
        type: "play_action",
        playerId: "bot",
        cardInstanceId: "sly",
        targetPlayerId: "p2",
        targetCardInstanceId: "p-mayfair",
      });
    });

    it("plays Debt Collector against richestOpponent", () => {
      const game = createGame({
        seed: 29,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "poor", name: "Poor", isBot: false },
          { id: "rich", name: "Rich", isBot: false },
        ],
      });

      game.players["poor"]!.bank = [
        { instanceId: "p-m1", defId: "money-1m", name: "$1M", type: "money", value: 1 },
      ];
      game.players["rich"]!.bank = [
        { instanceId: "r-m10", defId: "money-10m", name: "$10M", type: "money", value: 10 },
      ];

      game.players["bot"]!.hand = [
        { instanceId: "dc", defId: "action-debt-collector", name: "Debt Collector", type: "action", value: 3 },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "medium");
      expect(action).toEqual({
        type: "play_action",
        playerId: "bot",
        cardInstanceId: "dc",
        targetPlayerId: "rich",
      });
    });
  });

  describe("Easy bot behavior", () => {
    it("banks Deal Breaker instead of playing it", () => {
      const game = createGame({
        seed: 30,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      game.players["p2"]!.propertySets = [
        {
          setId: "p2-brown",
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
      ];

      game.players["bot"]!.hand = [
        { instanceId: "db", defId: "action-deal-breaker", name: "Deal Breaker", type: "action", value: 5 },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const world = buildWorldView(game, "bot");
      const moves = generateLegalMoves(game, "bot");
      const ranked = scoreMoves(moves, game, world, "easy");

      // When Easy picks its top move, it banks the Deal Breaker instead of playing it
      const deterministicTop = selectMove(ranked, "easy", () => 0.99); // 0.99 >= 0.6 -> top greedy move
      expect(deterministicTop).toEqual({
        type: "bank_card",
        playerId: "bot",
        cardInstanceId: "db",
      });
    });

    it("never uses Just Say No in Easy difficulty", () => {
      const game = createGame({
        seed: 31,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      game.players["bot"]!.hand = [
        { instanceId: "jsn", defId: "action-just-say-no", name: "JSN", type: "action", value: 4 },
      ];

      game.pendingResolution = {
        type: "reaction_window",
        initiatorPlayerId: "p2",
        targetPlayerId: "bot",
        waitingForPlayerId: "bot",
        actionCard: { instanceId: "dc", defId: "action-debt-collector", name: "Debt Collector", type: "action", value: 3 },
        justSayNoChainCount: 0,
        justSayNoPlayedBy: [],
      };

      // Both greedy branch and random branch should NEVER pick just_say_no
      const greedyAction = selectMove(scoreMoves(generateLegalMoves(game, "bot"), game, buildWorldView(game, "bot"), "easy"), "easy", () => 0.99);
      expect(greedyAction).toEqual({
        type: "submit_reaction",
        playerId: "bot",
        action: "pass",
      });

      const randomAction = selectMove(scoreMoves(generateLegalMoves(game, "bot"), game, buildWorldView(game, "bot"), "easy"), "easy", () => 0.1);
      expect(randomAction).toEqual({
        type: "submit_reaction",
        playerId: "bot",
        action: "pass",
      });
    });
  });
});
