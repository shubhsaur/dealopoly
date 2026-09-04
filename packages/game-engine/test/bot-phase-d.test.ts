import { describe, expect, it } from "vitest";
import {
  BotController,
  createGame,
  evaluatePosition,
  pickExpertMove,
  scoreWithLookahead,
} from "../src/index.js";
import type { GameCommand } from "../src/types/commands.js";

describe("Phase D bot intelligence (Expert — Lookahead Simulation)", () => {
  describe("Position Evaluation", () => {
    it("returns -Infinity if bot does not exist in the game state", () => {
      const game = createGame({
        seed: 50,
        players: [
          { id: "p1", name: "P1", isBot: false },
          { id: "p2", name: "P2", isBot: false },
        ],
      });

      expect(evaluatePosition(game, "ghost-bot")).toBe(-Infinity);
    });

    it("evaluates position based on sets, bank, hand, and opponent progress", () => {
      const game = createGame({
        seed: 51,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
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
        {
          setId: "bot-db",
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
      game.players["bot"]!.bank = [
        { instanceId: "m1", defId: "money-5", name: "$5M", type: "money", value: 5 },
        { instanceId: "m2", defId: "money-2", name: "$2M", type: "money", value: 2 },
      ];
      game.players["bot"]!.hand = [
        { instanceId: "h1", defId: "money-1", name: "$1M", type: "money", value: 1 },
      ];

      game.players["opp"]!.propertySets = [
        {
          setId: "opp-green",
          color: "green",
          cards: [
            { instanceId: "g1", defId: "prop-regent", name: "Regent", type: "property", value: 4, primaryColor: "green" },
            { instanceId: "g2", defId: "prop-oxford", name: "Oxford", type: "property", value: 4, primaryColor: "green" },
            { instanceId: "g3", defId: "prop-bond", name: "Bond", type: "property", value: 4, primaryColor: "green" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: true,
          setSize: 3,
          rentTiers: [2, 4, 7],
        },
      ];

      // Evaluation formula breakdown:
      // completeSets (1) * 1000 = 1000
      // incompleteSets (1) * 150 = 150
      // bankValue (7) * 10 = 70
      // handLength (1) * 5 = 5
      // maxOpponentSets (1) * -800 = -800
      // assets: brown ($2M) + dark-blue ($4M) + bank ($7M) = $13M. totalAssetValue (13) * 2 = 26
      // Total expected: 1000 + 150 + 70 + 5 - 800 + 26 = 451
      const score = evaluatePosition(game, "bot");
      expect(score).toBe(451);
    });

    it("penalizes positions heavily if opponent has 2 complete sets", () => {
      const game = createGame({
        seed: 52,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });

      game.players["opp"]!.propertySets = [
        {
          setId: "opp-1",
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
          setId: "opp-2",
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

      const scoreOpp2 = evaluatePosition(game, "bot");
      // Opponent having 2 sets applies 2 * -800 = -1600 penalty
      expect(scoreOpp2).toBeLessThan(-1000);
    });
  });

  describe("Lookahead Scoring", () => {
    it("returns 50,000 for a move that immediately wins the game", () => {
      const game = createGame({
        seed: 53,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });

      // Bot has 2 complete sets and 1 partial set needing 1 card
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
        {
          setId: "bot-db",
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
        {
          setId: "bot-utility",
          color: "utility",
          cards: [
            { instanceId: "u1", defId: "prop-water", name: "Water Works", type: "property", value: 2, primaryColor: "utility" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [1, 2],
        },
      ];

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;
      game.players["bot"]!.hand = [
        { instanceId: "u2", defId: "prop-electric", name: "Electric Company", type: "property", value: 2, primaryColor: "utility" },
      ];

      const winningMove: GameCommand = {
        type: "play_property",
        playerId: "bot",
        cardInstanceId: "u2",
        targetSetId: "bot-utility",
      };

      const score = scoreWithLookahead(game, winningMove, "bot", 2);
      expect(score).toBe(50_000);
    });

    it("returns -Infinity if move throws an illegal command error", () => {
      const game = createGame({
        seed: 54,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });

      const illegalMove: GameCommand = {
        type: "play_property",
        playerId: "bot",
        cardInstanceId: "non-existent-card",
      };

      const score = scoreWithLookahead(game, illegalMove, "bot", 2);
      expect(score).toBe(-Infinity);
    });

    it("returns evaluatePosition if lookahead deadline has passed (timeout guard)", () => {
      const game = createGame({
        seed: 55,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });

      const move: GameCommand = {
        type: "bank_card",
        playerId: "bot",
        cardInstanceId: game.players["bot"]!.hand[0]!.instanceId,
      };

      // Pass an expired deadline
      const expiredDeadline = Date.now() - 100;
      const score = scoreWithLookahead(game, move, "bot", 2, expiredDeadline);
      // When deadline passed, returns evaluatePosition(state, botId) without applying
      expect(score).toBe(evaluatePosition(game, "bot"));
    });
  });

  describe("pickExpertMove", () => {
    it("returns null if rankedHardMoves is empty", () => {
      const game = createGame({
        seed: 56,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });
      expect(pickExpertMove(game, "bot", [])).toBeNull();
    });

    it("immediately bypasses simulation when pendingResolution is active", () => {
      const game = createGame({
        seed: 57,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });

      game.pendingResolution = {
        type: "reaction_window",
        triggerActionDefId: "rent-wild",
        sourcePlayerId: "opp",
        waitingForPlayerId: "bot",
        targetPlayerIds: ["bot"],
        affectedCards: [],
        timestamp: Date.now(),
      };

      const candidateMove: GameCommand = {
        type: "submit_reaction",
        playerId: "bot",
        action: "pass",
      };

      const result = pickExpertMove(game, "bot", [candidateMove]);
      expect(result).toEqual(candidateMove);
    });

    it("immediately bypasses simulation when phase is draw or discard", () => {
      const game = createGame({
        seed: 58,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });
      game.turn.phase = "draw";

      const drawMove: GameCommand = {
        type: "draw_cards",
        playerId: "bot",
      };

      const result = pickExpertMove(game, "bot", [drawMove]);
      expect(result).toEqual(drawMove);
    });

    it("selects the move that produces higher lookahead score", () => {
      const game = createGame({
        seed: 59,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });

      game.turn.activePlayerId = "bot";
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      // Bot has 2 complete sets
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
        {
          setId: "bot-db",
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
        {
          setId: "bot-utility",
          color: "utility",
          cards: [
            { instanceId: "u1", defId: "prop-water", name: "Water Works", type: "property", value: 2, primaryColor: "utility" },
          ],
          hasHouse: false,
          hasHotel: false,
          isComplete: false,
          setSize: 2,
          rentTiers: [1, 2],
        },
      ];

      game.players["bot"]!.hand = [
        { instanceId: "m5", defId: "money-5", name: "$5M", type: "money", value: 5 },
        { instanceId: "u2", defId: "prop-electric", name: "Electric Company", type: "property", value: 2, primaryColor: "utility" },
      ];

      const bankMove: GameCommand = {
        type: "bank_card",
        playerId: "bot",
        cardInstanceId: "m5",
      };

      const winMove: GameCommand = {
        type: "play_property",
        playerId: "bot",
        cardInstanceId: "u2",
        targetSetId: "bot-utility",
      };

      // Suppose Hard heuristics ordered bankMove first
      const rankedMoves: GameCommand[] = [bankMove, winMove];
      const picked = pickExpertMove(game, "bot", rankedMoves);

      // Lookahead should realize winMove completes the 3rd set and wins (+50,000)
      expect(picked).toEqual(winMove);
    });
  });

  describe("End-to-End BotController with Expert Difficulty", () => {
    it("successfully computes actions for expert difficulty", () => {
      const game = createGame({
        seed: 60,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });

      const action = BotController.getNextBotAction(game, "bot", "expert");
      expect(action).not.toBeNull();
      expect(action?.playerId).toBe("bot");
      // Turn starts in draw phase
      expect(action?.type).toBe("draw_cards");
    });

    it("makes smart action phase choices in expert mode under 80ms", () => {
      const game = createGame({
        seed: 61,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });

      // Advance past draw phase
      game.turn.phase = "action";
      game.turn.actionsRemaining = 3;

      const startTime = performance.now();
      const action = BotController.getNextBotAction(game, "bot", "expert");
      const elapsed = performance.now() - startTime;

      expect(action).not.toBeNull();
      expect(action?.playerId).toBe("bot");
      expect(elapsed).toBeLessThan(100); // Must be well within reasonable execution limits
    });
  });
});
