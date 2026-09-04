import { describe, expect, it } from "vitest";
import {
  BotController,
  buildWorldView,
  createGame,
  generateLegalMoves,
  scoreMoves,
  selectMove,
} from "../src/index.js";

describe("Phase C bot intelligence (Hard — Threat-Aware)", () => {
  describe("Win Threat Detection & Defensive Mode", () => {
    it("triggers defensive mode when an opponent reaches 2 complete sets", () => {
      const game = createGame({
        seed: 40,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "leader", name: "Leader", isBot: false },
        ],
      });

      game.players["leader"]!.propertySets = [
        {
          setId: "lead-brown",
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
          setId: "lead-db",
          color: "dark-blue",
          cards: [
            { instanceId: "db1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4, primaryColor: "dark-blue" },
            { instanceId: "db2", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4, primaryColor: "dark-blue" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: true,
          setSize: 2,
          rentTiers: [3, 8],
        },
      ];

      const world = buildWorldView(game, "bot");
      expect(world.biggestThreat?.playerId).toBe("leader");
      expect(world.biggestThreat?.completeSets).toBe(2);
      expect(world.biggestThreat?.isWinThreat).toBe(true);
      expect(world.defensiveMode).toBe(true);
    });

    it("prioritizes Deal Breaker against biggestThreat in defensive mode", () => {
      const game = createGame({
        seed: 41,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "threat", name: "Threat", isBot: false },
          { id: "bystander", name: "Bystander", isBot: false },
        ],
      });

      // Threat has 2 complete sets
      game.players["threat"]!.propertySets = [
        {
          setId: "t-brown",
          color: "brown",
          cards: [
            { instanceId: "tb1", defId: "prop-mediterranean", name: "Mediterranean", type: "property", value: 1, primaryColor: "brown" },
            { instanceId: "tb2", defId: "prop-baltic", name: "Baltic", type: "property", value: 1, primaryColor: "brown" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: true,
          setSize: 2,
          rentTiers: [1, 2],
        },
        {
          setId: "t-util",
          color: "utility",
          cards: [
            { instanceId: "tu1", defId: "prop-electric", name: "Electric", type: "property", value: 2, primaryColor: "utility" },
            { instanceId: "tu2", defId: "prop-water", name: "Water", type: "property", value: 2, primaryColor: "utility" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: true,
          setSize: 2,
          rentTiers: [1, 2],
        },
      ];

      // Bystander has 1 complete set
      game.players["bystander"]!.propertySets = [
        {
          setId: "by-db",
          color: "dark-blue",
          cards: [
            { instanceId: "by-pl", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4, primaryColor: "dark-blue" },
            { instanceId: "by-mf", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4, primaryColor: "dark-blue" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: true,
          setSize: 2,
          rentTiers: [3, 8],
        },
      ];

      game.players["bot"]!.hand = [
        { instanceId: "db", defId: "action-deal-breaker", name: "Deal Breaker", type: "action", value: 5 },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "hard");
      expect(action?.type).toBe("play_action");
      if (action?.type === "play_action") {
        // Must target threat, NOT bystander
        expect(action.targetPlayerId).toBe("threat");
      }
    });
  });

  describe("JSN Intelligence in Hard Mode", () => {
    it("ALWAYS plays Just Say No when Deal Breaker targets bot's complete set", () => {
      const game = createGame({
        seed: 42,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opponent", name: "Opponent", isBot: false },
        ],
      });

      game.players["bot"]!.propertySets = [
        {
          setId: "bot-brown",
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
        { instanceId: "jsn", defId: "action-just-say-no", name: "JSN", type: "action", value: 4 },
      ];

      game.pendingResolution = {
        type: "reaction_window",
        initiatorPlayerId: "opponent",
        targetPlayerId: "bot",
        waitingForPlayerId: "bot",
        actionCard: { instanceId: "db", defId: "action-deal-breaker", name: "Deal Breaker", type: "action", value: 5 },
        targetPropertySetId: "bot-brown",
        justSayNoChainCount: 0,
        justSayNoPlayedBy: [],
      };

      const action = BotController.getNextBotAction(game, "bot", "hard");
      expect(action).toEqual({
        type: "submit_reaction",
        playerId: "bot",
        action: "just_say_no",
        justSayNoCardInstanceId: "jsn",
      });
    });

    it("plays Just Say No when Sly Deal targets a card that would complete opponent's winning set", () => {
      const game = createGame({
        seed: 43,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opponent", name: "Opponent", isBot: false },
        ],
      });

      // Opponent already has 2 complete sets and an incomplete Dark Blue set (needs Mayfair)
      game.players["opponent"]!.propertySets = [
        {
          setId: "opp-brown",
          color: "brown",
          cards: [
            { instanceId: "ob1", defId: "prop-mediterranean", name: "Mediterranean", type: "property", value: 1, primaryColor: "brown" },
            { instanceId: "ob2", defId: "prop-baltic", name: "Baltic", type: "property", value: 1, primaryColor: "brown" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: true,
          setSize: 2,
          rentTiers: [1, 2],
        },
        {
          setId: "opp-util",
          color: "utility",
          cards: [
            { instanceId: "ou1", defId: "prop-electric", name: "Electric", type: "property", value: 2, primaryColor: "utility" },
            { instanceId: "ou2", defId: "prop-water", name: "Water", type: "property", value: 2, primaryColor: "utility" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: true,
          setSize: 2,
          rentTiers: [1, 2],
        },
        {
          setId: "opp-db",
          color: "dark-blue",
          cards: [
            { instanceId: "odb1", defId: "prop-park-lane", name: "Park Lane", type: "property", value: 4, primaryColor: "dark-blue" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [3, 8],
        },
      ];

      // Bot has Mayfair on an incomplete set
      game.players["bot"]!.propertySets = [
        {
          setId: "bot-db",
          color: "dark-blue",
          cards: [
            { instanceId: "b-mayfair", defId: "prop-mayfair", name: "Mayfair", type: "property", value: 4, primaryColor: "dark-blue" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [3, 8],
        },
      ];

      game.players["bot"]!.hand = [
        { instanceId: "jsn", defId: "action-just-say-no", name: "JSN", type: "action", value: 4 },
      ];

      game.pendingResolution = {
        type: "reaction_window",
        initiatorPlayerId: "opponent",
        targetPlayerId: "bot",
        waitingForPlayerId: "bot",
        actionCard: { instanceId: "sly", defId: "action-sly-deal", name: "Sly Deal", type: "action", value: 3 },
        targetCardInstanceId: "b-mayfair",
        justSayNoChainCount: 0,
        justSayNoPlayedBy: [],
      };

      const action = BotController.getNextBotAction(game, "bot", "hard");
      // Stealing Mayfair gives opponent their 3rd complete set -> MUST USE JSN
      expect(action).toEqual({
        type: "submit_reaction",
        playerId: "bot",
        action: "just_say_no",
        justSayNoCardInstanceId: "jsn",
      });
    });

    it("does NOT use Just Say No when rent is <= $3M", () => {
      const game = createGame({
        seed: 44,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opponent", name: "Opponent", isBot: false },
        ],
      });

      // Bot has 1 complete set and some bank
      game.players["bot"]!.propertySets = [
        {
          setId: "bot-brown",
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
      game.players["bot"]!.bank = [
        { instanceId: "m5", defId: "money-5m", name: "$5M", type: "money", value: 5 },
      ];

      game.players["bot"]!.hand = [
        { instanceId: "jsn", defId: "action-just-say-no", name: "JSN", type: "action", value: 4 },
      ];

      game.pendingResolution = {
        type: "reaction_window",
        initiatorPlayerId: "opponent",
        targetPlayerId: "bot",
        waitingForPlayerId: "bot",
        actionCard: { instanceId: "rent-b", defId: "rent-brown-cyan", name: "Rent", type: "rent", value: 1 },
        rentAmount: 2, // $2M <= $3M
        justSayNoChainCount: 0,
        justSayNoPlayedBy: [],
      };

      const action = BotController.getNextBotAction(game, "bot", "hard");
      // Must pass instead of wasting JSN on $2M rent
      expect(action).toEqual({
        type: "submit_reaction",
        playerId: "bot",
        action: "pass",
      });
    });

    it("does NOT use Just Say No when bot has 0 complete sets (nothing to protect yet)", () => {
      const game = createGame({
        seed: 45,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opponent", name: "Opponent", isBot: false },
        ],
      });

      game.players["bot"]!.propertySets = []; // 0 complete sets
      game.players["bot"]!.bank = [
        { instanceId: "m1", defId: "money-1m", name: "$1M", type: "money", value: 1 },
      ];
      game.players["bot"]!.hand = [
        { instanceId: "jsn", defId: "action-just-say-no", name: "JSN", type: "action", value: 4 },
      ];

      // Opponent plays rent $4M
      game.pendingResolution = {
        type: "reaction_window",
        initiatorPlayerId: "opponent",
        targetPlayerId: "bot",
        waitingForPlayerId: "bot",
        actionCard: { instanceId: "rent-o", defId: "rent-orange-magenta", name: "Rent", type: "rent", value: 1 },
        rentAmount: 4,
        justSayNoChainCount: 0,
        justSayNoPlayedBy: [],
      };

      const action = BotController.getNextBotAction(game, "bot", "hard");
      expect(action).toEqual({
        type: "submit_reaction",
        playerId: "bot",
        action: "pass",
      });
    });
  });

  describe("Rent Maximization in Hard Mode", () => {
    it("chooses rent color that yields higher payout and pairs with Double The Rent", () => {
      const game = createGame({
        seed: 46,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Human", isBot: false },
        ],
      });

      // Bot has:
      // Red: 1 card -> rent tier [2, 3, 6] -> rent = $2M
      // Yellow: 2 cards -> rent tier [2, 4, 6] -> rent = $4M (higher payout!)
      game.players["bot"]!.propertySets = [
        {
          setId: "bot-red",
          color: "red",
          cards: [
            { instanceId: "r1", defId: "prop-strand", name: "Strand", type: "property", value: 3, primaryColor: "red" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 3,
          rentTiers: [2, 3, 6],
        },
        {
          setId: "bot-yellow",
          color: "yellow",
          cards: [
            { instanceId: "y1", defId: "prop-piccadilly", name: "Piccadilly", type: "property", value: 3, primaryColor: "yellow" },
            { instanceId: "y2", defId: "prop-coventry", name: "Coventry", type: "property", value: 3, primaryColor: "yellow" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 3,
          rentTiers: [2, 4, 6],
        },
      ];

      game.players["bot"]!.hand = [
        { instanceId: "rent-ry", defId: "rent-red-yellow", name: "Rent R/Y", type: "rent", value: 1, primaryColor: "red", secondaryColor: "yellow" },
        { instanceId: "double-rent", defId: "action-double-the-rent", name: "Double Rent", type: "action", value: 1 },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "hard");
      expect(action).toEqual({
        type: "play_rent",
        playerId: "bot",
        rentCardInstanceId: "rent-ry",
        chosenColor: "yellow", // Yellow chosen over Red!
        doubleRentCardInstanceId: "double-rent", // Paired with Double The Rent!
      });
    });

    it("targets biggestThreat instead of richestOpponent when in defensive mode", () => {
      const game = createGame({
        seed: 47,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "threat", name: "Threat", isBot: false },
          { id: "rich", name: "Rich", isBot: false },
        ],
      });

      // Threat has 2 complete sets (defensive mode!) but low bank
      game.players["threat"]!.propertySets = [
        {
          setId: "t-brown",
          color: "brown",
          cards: [
            { instanceId: "tb1", defId: "prop-mediterranean", name: "Mediterranean", type: "property", value: 1, primaryColor: "brown" },
            { instanceId: "tb2", defId: "prop-baltic", name: "Baltic", type: "property", value: 1, primaryColor: "brown" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: true,
          setSize: 2,
          rentTiers: [1, 2],
        },
        {
          setId: "t-util",
          color: "utility",
          cards: [
            { instanceId: "tu1", defId: "prop-electric", name: "Electric", type: "property", value: 2, primaryColor: "utility" },
            { instanceId: "tu2", defId: "prop-water", name: "Water", type: "property", value: 2, primaryColor: "utility" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: true,
          setSize: 2,
          rentTiers: [1, 2],
        },
      ];

      // Rich has $10M in bank but 0 complete sets
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

      // Multi-color wild rent (single target)
      game.players["bot"]!.hand = [
        { instanceId: "rent-wild", defId: "rent-wild", name: "Wild Rent", type: "rent", value: 3, primaryColor: "all" },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const action = BotController.getNextBotAction(game, "bot", "hard");
      expect(action?.type).toBe("play_rent");
      if (action?.type === "play_rent") {
        // In defensive mode, targets threat instead of rich
        expect(action.targetPlayerId).toBe("threat");
      }
    });
  });
});
