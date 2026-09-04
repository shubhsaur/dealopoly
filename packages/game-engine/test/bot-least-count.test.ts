import { describe, expect, it } from "vitest";
import {
  createLeastCountGame,
  handleDrawCard,
  handleDiscardCards,
  LeastCountBotController,
  buildLeastCountWorldView,
  findBestDiscardGreedy,
  findBestDiscardHard,
  findBestDiscardExpert,
  decideDrawHard,
  estimateOpponentShowProbability,
  getGameEngine,
  type LeastCountCard,
} from "../src/index.js";

describe("Phase E: Least Count (Lowdeck) Bot Intelligence", () => {
  describe("Public Draw Tracking (knownDrawnCards)", () => {
    it("tracks cards drawn from the discard pile per player", () => {
      let game = createLeastCountGame({
        seed: 70,
        players: [
          { id: "p1", name: "Alice", isBot: false },
          { id: "p2", name: "Bob", isBot: true },
        ],
      });

      // Place a known card on top of discard pile
      const kingOfHearts: LeastCountCard = {
        instanceId: "kh-1",
        rank: "K",
        suit: "hearts",
        points: 0,
        rankValue: 13,
      };
      game.discardPile = [kingOfHearts];
      game.activePlayerId = "p1";
      game.turnPhase = "draw";

      // Alice draws from discard
      const drawRes = handleDrawCard(game, "p1", "discard");
      game = drawRes.state;

      expect(game.knownDrawnCards?.["p1"]).toBeDefined();
      expect(game.knownDrawnCards?.["p1"]?.length).toBe(1);
      expect(game.knownDrawnCards?.["p1"]?.[0]?.instanceId).toBe("kh-1");

      // Later Alice discards that same card
      const discardRes = handleDiscardCards(game, "p1", ["kh-1"]);
      game = discardRes.state;

      expect(game.knownDrawnCards?.["p1"]?.length).toBe(0);
    });
  });

  describe("Easy Difficulty", () => {
    it("always produces a legal draw or discard command", () => {
      const game = createLeastCountGame({
        seed: 71,
        players: [
          { id: "bot", name: "EasyBot", isBot: true },
          { id: "opp", name: "Opponent", isBot: false },
        ],
      });

      // Draw phase
      const drawAction = LeastCountBotController.getNextBotAction(game, "bot", "easy");
      expect(drawAction).not.toBeNull();
      expect(["draw_card", "declare_show"]).toContain(drawAction?.type);

      // Discard phase
      game.turnPhase = "discard";
      const discardAction = LeastCountBotController.getNextBotAction(game, "bot", "easy");
      expect(discardAction).not.toBeNull();
      expect(discardAction?.type).toBe("discard_cards");
      if (discardAction?.type === "discard_cards") {
        expect(discardAction.cardInstanceIds.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Medium Difficulty", () => {
    it("greedily finds combinations that shed the most points", () => {
      const hand: LeastCountCard[] = [
        // 3-card sequence: 10-J-Q of Spades (10 + 11 + 12 = 33 pts)
        { instanceId: "s10", rank: "10", suit: "spades", points: 10, rankValue: 10 },
        { instanceId: "sj", rank: "J", suit: "spades", points: 11, rankValue: 11 },
        { instanceId: "sq", rank: "Q", suit: "spades", points: 12, rankValue: 12 },
        // Pair of 8s (16 pts)
        { instanceId: "c8", rank: "8", suit: "clubs", points: 8, rankValue: 8 },
        { instanceId: "d8", rank: "8", suit: "diamonds", points: 8, rankValue: 8 },
        // Low King (0 pts)
        { instanceId: "kh", rank: "K", suit: "hearts", points: 0, rankValue: 13 },
      ];

      const best = findBestDiscardGreedy(hand);
      expect(best.length).toBe(3);
      expect(best.map((c) => c.instanceId)).toEqual(["s10", "sj", "sq"]);
    });

    it("prefers a pair over a single high card", () => {
      const hand: LeastCountCard[] = [
        // Single Queen (12 pts)
        { instanceId: "sq", rank: "Q", suit: "spades", points: 12, rankValue: 12 },
        // Pair of 9s (18 pts)
        { instanceId: "h9", rank: "9", suit: "hearts", points: 9, rankValue: 9 },
        { instanceId: "d9", rank: "9", suit: "diamonds", points: 9, rankValue: 9 },
      ];

      const best = findBestDiscardGreedy(hand);
      expect(best.length).toBe(2);
      expect(best.map((c) => c.instanceId).sort()).toEqual(["d9", "h9"]);
    });

    it("declares Show if handScore <= 7", () => {
      const game = createLeastCountGame({
        seed: 72,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opp", isBot: false },
        ],
      });

      game.players["bot"]!.hand = [
        { instanceId: "k1", rank: "K", suit: "spades", points: 0, rankValue: 13 },
        { instanceId: "a1", rank: "A", suit: "hearts", points: 1, rankValue: 1 },
        { instanceId: "c4", rank: "4", suit: "clubs", points: 4, rankValue: 4 },
      ]; // Hand score = 5 (<= 7)

      const action = LeastCountBotController.getNextBotAction(game, "bot", "medium");
      expect(action).toEqual({ type: "declare_show", playerId: "bot" });
    });
  });

  describe("Hard Difficulty (Threat & Opponent-Aware)", () => {
    it("avoids discarding cards that feed known cards held by the next player", () => {
      const game = createLeastCountGame({
        seed: 73,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "nextOpp", name: "NextOpp", isBot: false },
        ],
      });

      // Next player is known to hold an 8 of Hearts
      game.knownDrawnCards = {
        nextOpp: [{ instanceId: "h8", rank: "8", suit: "hearts", points: 8, rankValue: 8 }],
      };

      const world = buildLeastCountWorldView(game, "bot");
      expect(world.nextPlayer?.playerId).toBe("nextOpp");
      expect(world.nextPlayer?.knownCards.length).toBe(1);

      // Bot hand has:
      // - an 8 of Spades (8 pts, but pairs with opponent's 8!)
      // - an 8 of Clubs (8 pts, connects with opponent's 8!)
      // - a 7 of Hearts (7 pts, connects sequence 7-8 of Hearts!)
      // - a 9 of Diamonds (9 pts, safe discard that doesn't feed)
      const hand: LeastCountCard[] = [
        { instanceId: "s8", rank: "8", suit: "spades", points: 8, rankValue: 8 },
        { instanceId: "h7", rank: "7", suit: "hearts", points: 7, rankValue: 7 },
        { instanceId: "d9", rank: "9", suit: "diamonds", points: 9, rankValue: 9 },
      ];

      const picked = findBestDiscardHard(hand, world);
      // d9 should be chosen because it sheds 9 points without pairing or sequencing opponent's 8 of Hearts
      expect(picked.length).toBe(1);
      expect(picked[0]?.instanceId).toBe("d9");
    });

    it("never discards a King as a single card", () => {
      const game = createLeastCountGame({
        seed: 74,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opp", isBot: false },
        ],
      });

      const world = buildLeastCountWorldView(game, "bot");
      const hand: LeastCountCard[] = [
        { instanceId: "k1", rank: "K", suit: "spades", points: 0, rankValue: 13 },
        { instanceId: "c3", rank: "3", suit: "clubs", points: 3, rankValue: 3 },
      ];

      const picked = findBestDiscardHard(hand, world);
      // Must discard 3 of clubs to shed points, preserving King (0 pts)
      expect(picked.length).toBe(1);
      expect(picked[0]?.instanceId).toBe("c3");
    });

    it("exercises caution before declaring Show if opponent has 2 or fewer cards", () => {
      const game = createLeastCountGame({
        seed: 75,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "opp", name: "Opp", isBot: false },
        ],
      });

      // Opponent has only 2 cards in hand
      game.players["opp"]!.hand = [
        { instanceId: "o1", rank: "K", suit: "hearts", points: 0, rankValue: 13 },
        { instanceId: "o2", rank: "3", suit: "diamonds", points: 3, rankValue: 3 },
      ];

      // Bot has 3 cards with score 6 (legal to show since <= 7, but risky!)
      game.players["bot"]!.hand = [
        { instanceId: "b1", rank: "2", suit: "clubs", points: 2, rankValue: 2 },
        { instanceId: "b2", rank: "2", suit: "spades", points: 2, rankValue: 2 },
        { instanceId: "b3", rank: "2", suit: "hearts", points: 2, rankValue: 2 },
      ];

      const world = buildLeastCountWorldView(game, "bot");
      const action = decideDrawHard(game, "bot", world);

      // Hard bot should draw instead of risking a 40-pt penalty against 2-card opponent
      expect(action.type).toBe("draw_card");
    });
  });

  describe("Expert Difficulty (Probability & Expected Value)", () => {
    it("estimates high show probability when opponent holds known King and few cards", () => {
      const opp = {
        playerId: "opp",
        name: "Opp",
        handCount: 2,
        score: 10,
        isEliminated: false,
        knownCards: [{ instanceId: "k1", rank: "K", suit: "spades", points: 0, rankValue: 13 } as LeastCountCard],
        isThreat: true,
        showProbability: 0,
      };

      const prob = estimateOpponentShowProbability(opp, 7);
      // With known King (0 pts), opponent only needs second card <= 7 (8 out of 13 cards)
      expect(prob).toBeGreaterThanOrEqual(0.60);
    });

    it("switches to emergency point shedding when opponent is an imminent Show threat", () => {
      const game = createLeastCountGame({
        seed: 76,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "threat", name: "Threat", isBot: false },
        ],
      });

      const world = buildLeastCountWorldView(game, "bot");
      // Mark threat with high show probability
      world.opponents[0]!.showProbability = 0.50;

      const hand: LeastCountCard[] = [
        // High pair of Queens (24 pts shed)
        { instanceId: "q1", rank: "Q", suit: "hearts", points: 12, rankValue: 12 },
        { instanceId: "q2", rank: "Q", suit: "spades", points: 12, rankValue: 12 },
        // Run of lower points: 3-4-5 of Clubs (12 pts shed)
        { instanceId: "c3", rank: "3", suit: "clubs", points: 3, rankValue: 3 },
        { instanceId: "c4", rank: "4", suit: "clubs", points: 4, rankValue: 4 },
        { instanceId: "c5", rank: "5", suit: "clubs", points: 5, rankValue: 5 },
      ];

      const picked = findBestDiscardExpert(hand, world);
      // In emergency mode, dropping 24 pts immediately beats a 12 pt sequence
      expect(picked.length).toBe(2);
      expect(picked.map((c) => c.instanceId).sort()).toEqual(["q1", "q2"]);
    });

    it("dispatches actions through LeastCountEngine computeBotAction across all difficulties", () => {
      const engine = getGameEngine("least_count");
      const game = createLeastCountGame({
        seed: 77,
        players: [
          { id: "bot", name: "Bot", isBot: true },
          { id: "p2", name: "Player 2", isBot: false },
        ],
      });

      for (const diff of ["easy", "medium", "hard", "expert"]) {
        const action = engine.computeBotAction(game, "bot", diff);
        expect(action).not.toBeNull();
        expect(action?.playerId).toBe("bot");
      }
    });
  });
});
