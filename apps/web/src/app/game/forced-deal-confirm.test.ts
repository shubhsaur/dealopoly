import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { createGame, applyCommand, type GameState } from "@dealopoly/game-engine";

describe("Forced Deal Confirm Flow Verification", () => {
  const targetingModalPath = path.resolve(__dirname, "_components/actions/targeting-modal.tsx");
  const targetingModalContent = fs.readFileSync(targetingModalPath, "utf-8");

  it("verifies TargetingModal contains Forced Deal card selection and confirmation button", () => {
    // 1. Verifies selection state for target opponent card
    expect(targetingModalContent).toContain("selectedForcedDealTarget");
    expect(targetingModalContent).toContain("setSelectedForcedDealTarget");

    // 2. Verifies canConfirmForcedDeal guard requirement
    expect(targetingModalContent).toContain("canConfirmForcedDeal");
    expect(targetingModalContent).toContain("handleConfirmForcedDeal");

    // 3. Verifies Exchange Preview display
    expect(targetingModalContent).toContain("Exchange Preview");
    expect(targetingModalContent).toContain("You Give");
    expect(targetingModalContent).toContain("You Receive");

    // 4. Verifies Confirm button is present in Forced Deal flow
    expect(targetingModalContent).toContain("Confirm Exchange of Cards");
    expect(targetingModalContent).toContain("Confirm Exchange");

    // 5. Verifies footer has both Cancel and Confirm Exchange buttons for Forced Deal
    expect(targetingModalContent).toMatch(/targetingAction\.type === "forced_deal"[\s\S]*?Confirm Exchange/);
  });

  it("verifies game engine executes Forced Deal swap when confirmed with target and offered cards", () => {
    const game: GameState = createGame({
      seed: 42,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    // p1 draws cards to enter action phase
    const drawRes = applyCommand(game, { type: "draw_cards", playerId: "p1" });
    let currentState = drawRes.nextState;

    // Setup: Give p1 Forced Deal action card and an incomplete property card
    const forcedDealCard = {
      instanceId: "fd-1",
      defId: "action-forced-deal",
      name: "Forced Deal",
      type: "action" as const,
      value: 3,
    };
    const p1Prop = {
      instanceId: "p1-prop-1",
      defId: "prop-euston-road",
      name: "Euston Road",
      type: "property" as const,
      value: 1,
    };
    const p2Prop = {
      instanceId: "p2-prop-1",
      defId: "prop-pall-mall",
      name: "Pall Mall",
      type: "property" as const,
      value: 2,
    };

    currentState = {
      ...currentState,
      players: {
        ...currentState.players,
        p1: {
          ...currentState.players["p1"]!,
          hand: [forcedDealCard],
          propertySets: [
            {
              setId: "p1-set-light-blue",
              color: "light-blue",
              cards: [p1Prop],
              hasHouse: false,
              hasHotel: false,
              isComplete: false,
              setSize: 3,
              rentTiers: [1, 2, 3],
            },
          ],
        },
        p2: {
          ...currentState.players["p2"]!,
          propertySets: [
            {
              setId: "p2-set-pink",
              color: "pink",
              cards: [p2Prop],
              hasHouse: false,
              hasHotel: false,
              isComplete: false,
              setSize: 3,
              rentTiers: [1, 2, 4],
            },
          ],
        },
      },
    };

    // Confirm play action: Forced Deal
    const result = applyCommand(currentState, {
      type: "play_action",
      playerId: "p1",
      cardInstanceId: "fd-1",
      targetPlayerId: "p2",
      targetCardInstanceId: "p2-prop-1",
      offeredCardInstanceId: "p1-prop-1",
    });

    expect(result.events.some((e) => e.type === "action_played")).toBe(true);
    currentState = result.nextState;

    // If reaction window triggers, Bob can pass
    if (currentState.pendingResolution?.type === "reaction_window") {
      const passRes = applyCommand(currentState, {
        type: "submit_reaction",
        playerId: "p2",
        action: "pass",
      });
      currentState = passRes.nextState;
    }

    // After resolution, p1 now has p2Prop (Pall Mall) and p2 now has p1Prop (Euston Road)
    const p1AllCards = currentState.players["p1"]!.propertySets.flatMap((s) => s.cards.map((c) => c.instanceId));
    const p2AllCards = currentState.players["p2"]!.propertySets.flatMap((s) => s.cards.map((c) => c.instanceId));

    expect(p1AllCards).toContain("p2-prop-1");
    expect(p2AllCards).toContain("p1-prop-1");
  });
});
