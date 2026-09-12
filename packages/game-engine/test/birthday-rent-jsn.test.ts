import { describe, expect, it } from "vitest";
import { createGame, applyCommand, BotController, type CardInstance } from "../src/index.js";

describe("Birthday and Rent JSN interaction test", () => {
  it("when user plays Birthday and Bot 1 plays JSN, Bot 2 must NOT generate moves or crash the engine", () => {
    const game = createGame({
      seed: 123,
      players: [
        { id: "human", name: "Human", isBot: false },
        { id: "bot1", name: "Bot 1", isBot: true },
        { id: "bot2", name: "Bot 2", isBot: true },
      ],
    });

    const bdayCard: CardInstance = {
      instanceId: "bday-1",
      defId: "action-its-my-birthday",
      name: "It's My Birthday",
      type: "action",
      value: 2,
    };
    const bot1JSN: CardInstance = {
      instanceId: "jsn-1",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };

    game.players["human"]!.hand = [bdayCard];
    game.players["bot1"]!.hand = [bot1JSN];
    game.players["bot2"]!.hand = [];
    game.turn.phase = "action";
    game.turn.activePlayerId = "human";

    // Human plays Birthday
    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "human",
      cardInstanceId: bdayCard.instanceId,
    });

    expect(res1.nextState.pendingResolution?.type).toBe("reaction_window");
    expect((res1.nextState.pendingResolution as any).waitingForPlayerIds).toEqual(["bot1", "bot2"]);

    // Bot 1 acts and plays Just Say No
    const bot1Action = BotController.getNextBotAction(res1.nextState, "bot1", "medium");
    expect(bot1Action).toEqual({
      type: "submit_reaction",
      playerId: "bot1",
      action: "just_say_no",
      justSayNoCardInstanceId: bot1JSN.instanceId,
    });

    const res2 = applyCommand(res1.nextState, bot1Action!);
    expect(res2.nextState.pendingResolution?.type).toBe("reaction_window");
    const pending = res2.nextState.pendingResolution as any;
    expect(pending.jsnSubResolution).toBeDefined();
    expect(pending.jsnSubResolution.waitingForPlayerId).toBe("human");

    // NOW CHECK BOT 2:
    // Because jsnSubResolution is waiting for Human, Bot 2 MUST NOT generate a reaction move!
    const bot2Action = BotController.getNextBotAction(res2.nextState, "bot2", "medium");
    expect(bot2Action).toBeNull();

    // Now human passes
    const res3 = applyCommand(res2.nextState, {
      type: "submit_reaction",
      playerId: "human",
      action: "pass",
    });

    // Verify JSN resolved, Bot 2 is still waiting
    expect(res3.nextState.pendingResolution?.type).toBe("reaction_window");
    expect((res3.nextState.pendingResolution as any).waitingForPlayerIds).toEqual(["bot2"]);
    expect((res3.nextState.pendingResolution as any).jsnSubResolution).toBeUndefined();

    // Now Bot 2 should have legal moves
    const bot2ActionAfter = BotController.getNextBotAction(res3.nextState, "bot2", "medium");
    expect(bot2ActionAfter).toBeDefined();
    expect(bot2ActionAfter?.playerId).toBe("bot2");

    // Bot 2 passes
    const res4 = applyCommand(res3.nextState, bot2ActionAfter!);
    // Transitions to payment for bot2
    expect(res4.nextState.pendingResolution?.type).toBe("payment");
    expect((res4.nextState.pendingResolution as any).debtorPlayerIds).toEqual(["bot2"]);

    // Bot 2 pays
    const bot2PayAction = BotController.getNextBotAction(res4.nextState, "bot2", "medium");
    expect(bot2PayAction).toBeDefined();
    expect(bot2PayAction?.type).toBe("submit_payment");

    const res5 = applyCommand(res4.nextState, bot2PayAction!);
    // Payment complete: pendingResolution must be null!
    expect(res5.nextState.pendingResolution).toBeNull();
    // Turn is back to human with remaining actions
    expect(res5.nextState.turn.activePlayerId).toBe("human");
    expect(res5.nextState.turn.actionsRemaining).toBe(2);
  });

  it("when Bot 2 pays first, and Bot 1 refuses payment with JSN, resolving JSN must properly complete payment and not get stuck", () => {
    const game = createGame({
      seed: 456,
      players: [
        { id: "human", name: "Human", isBot: false },
        { id: "bot1", name: "Bot 1", isBot: true },
        { id: "bot2", name: "Bot 2", isBot: true },
      ],
    });

    const bdayCard: CardInstance = {
      instanceId: "bday-1",
      defId: "action-its-my-birthday",
      name: "It's My Birthday",
      type: "action",
      value: 2,
    };
    const bot1JSN: CardInstance = {
      instanceId: "jsn-1",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };
    const bot2Money: CardInstance = {
      instanceId: "m2",
      defId: "money-2",
      name: "$2M Money",
      type: "money",
      value: 2,
    };

    game.players["human"]!.hand = [bdayCard];
    game.players["bot1"]!.hand = [bot1JSN];
    game.players["bot2"]!.bank = [bot2Money];
    game.turn.phase = "action";
    game.turn.activePlayerId = "human";

    // Human plays Birthday
    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "human",
      cardInstanceId: bdayCard.instanceId,
    });

    // Both pass reaction window
    const res2 = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "bot1",
      action: "pass",
    });
    const res3 = applyCommand(res2.nextState, {
      type: "submit_reaction",
      playerId: "bot2",
      action: "pass",
    });

    // Both debtors owe payment
    expect(res3.nextState.pendingResolution?.type).toBe("payment");
    const payPending = res3.nextState.pendingResolution as any;
    expect(payPending.debtorPlayerIds).toEqual(["bot1", "bot2"]);

    // Bot 2 pays first
    const res4 = applyCommand(res3.nextState, {
      type: "submit_payment",
      playerId: "bot2",
      paymentCardInstanceIds: [bot2Money.instanceId],
    });

    expect(res4.nextState.pendingResolution?.type).toBe("payment");
    expect((res4.nextState.pendingResolution as any).paidDebtorIds).toEqual(["bot2"]);

    // Bot 1 plays Just Say No to refuse payment
    const res5 = applyCommand(res4.nextState, {
      type: "submit_payment",
      playerId: "bot1",
      paymentCardInstanceIds: [],
      justSayNoCardInstanceId: bot1JSN.instanceId,
    });

    expect(res5.nextState.pendingResolution?.type).toBe("payment");
    expect((res5.nextState.pendingResolution as any).jsnSubResolution).toBeDefined();
    expect((res5.nextState.pendingResolution as any).jsnSubResolution.waitingForPlayerId).toBe("human");

    // Human passes on JSN
    const res6 = applyCommand(res5.nextState, {
      type: "submit_reaction",
      playerId: "human",
      action: "pass",
    });

    // Since Bot 2 ALREADY paid, and Bot 1 blocked with JSN:
    // ALL DEBTORS ARE SETTLED! pendingResolution MUST BE NULL!
    console.log("res6 pendingResolution:", res6.nextState.pendingResolution);
    expect(res6.nextState.pendingResolution).toBeNull();
  });

  it("when user counters bot's JSN with their own JSN, and bot passes, bot must now pay rent/birthday", () => {
    const game = createGame({
      seed: 789,
      players: [
        { id: "human", name: "Human", isBot: false },
        { id: "bot1", name: "Bot 1", isBot: true },
      ],
    });

    const bdayCard: CardInstance = {
      instanceId: "bday-1",
      defId: "action-its-my-birthday",
      name: "It's My Birthday",
      type: "action",
      value: 2,
    };
    const humanJSN: CardInstance = {
      instanceId: "human-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };
    const bot1JSN: CardInstance = {
      instanceId: "bot1-jsn",
      defId: "action-just-say-no",
      name: "Just Say No",
      type: "action",
      value: 4,
    };
    const bot1Money: CardInstance = {
      instanceId: "bot1-m2",
      defId: "money-2",
      name: "$2M Money",
      type: "money",
      value: 2,
    };

    game.players["human"]!.hand = [bdayCard, humanJSN];
    game.players["bot1"]!.hand = [bot1JSN];
    game.players["bot1"]!.bank = [bot1Money];
    game.turn.phase = "action";
    game.turn.activePlayerId = "human";

    // Human plays Birthday
    const res1 = applyCommand(game, {
      type: "play_action",
      playerId: "human",
      cardInstanceId: bdayCard.instanceId,
    });

    // Bot 1 plays JSN
    const res2 = applyCommand(res1.nextState, {
      type: "submit_reaction",
      playerId: "bot1",
      action: "just_say_no",
      justSayNoCardInstanceId: bot1JSN.instanceId,
    });

    // Human counters with Human JSN!
    const res3 = applyCommand(res2.nextState, {
      type: "submit_reaction",
      playerId: "human",
      action: "just_say_no",
      justSayNoCardInstanceId: humanJSN.instanceId,
    });

    expect(res3.nextState.pendingResolution?.type).toBe("reaction_window");
    expect((res3.nextState.pendingResolution as any).jsnSubResolution).toBeDefined();
    expect((res3.nextState.pendingResolution as any).jsnSubResolution.waitingForPlayerId).toBe("bot1");

    // Bot 1 has no more JSN cards, Bot 1 must pass
    const bot1PassAction = BotController.getNextBotAction(res3.nextState, "bot1", "medium");
    expect(bot1PassAction).toEqual({
      type: "submit_reaction",
      playerId: "bot1",
      action: "pass",
    });

    const res4 = applyCommand(res3.nextState, bot1PassAction!);
    // Since human countered bot's JSN and bot passed, human's birthday stands!
    // It must transition to payment for bot1!
    expect(res4.nextState.pendingResolution?.type).toBe("payment");
    expect((res4.nextState.pendingResolution as any).debtorPlayerIds).toEqual(["bot1"]);

    // Bot 1 pays
    const bot1Pay = BotController.getNextBotAction(res4.nextState, "bot1", "medium");
    expect(bot1Pay?.type).toBe("submit_payment");

    const res5 = applyCommand(res4.nextState, bot1Pay!);
    expect(res5.nextState.pendingResolution).toBeNull();
  });
});
