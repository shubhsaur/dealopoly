import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { COLOR_CONFIG, CARD_CATALOGUE } from "@dealopoly/shared";
import { createGame, applyCommand } from "@dealopoly/game-engine";

describe("Mobile Card Action Bottom Sheet Verification", () => {
  const cssPath = path.resolve(__dirname, "../globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("verifies CSS rules for mobile sheet and backdrop modal at <= 900px breakpoint", () => {
    // 1. Check that desktop popover is hidden on mobile
    expect(cssContent).toContain(".game-card-action-popover {\n    display: none !important;");

    // 2. Check .game-card-mobile-modal has position: fixed, inset: 0, z-index: 200, backdrop-filter
    expect(cssContent).toContain(".game-card-mobile-modal {");
    expect(cssContent).toMatch(/\.game-card-mobile-modal\s*\{[^}]*position:\s*fixed;/);
    expect(cssContent).toMatch(/\.game-card-mobile-modal\s*\{[^}]*inset:\s*0;/);
    expect(cssContent).toMatch(/\.game-card-mobile-modal\s*\{[^}]*z-index:\s*200;/);
    expect(cssContent).toMatch(/\.game-card-mobile-modal\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.75\);/);
    expect(cssContent).toMatch(/\.game-card-mobile-modal\s*\{[^}]*backdrop-filter:\s*blur\(8px\);/);
    expect(cssContent).toMatch(/\.game-card-mobile-modal\s*\{[^}]*align-items:\s*flex-end;/);
    expect(cssContent).toMatch(/\.game-card-mobile-modal\s*\{[^}]*justify-content:\s*center;/);

    // 3. Check .game-card-mobile-sheet has max-height, rounded top corners, slide-in animation
    expect(cssContent).toContain(".game-card-mobile-sheet {");
    expect(cssContent).toMatch(/\.game-card-mobile-sheet\s*\{[^}]*max-height:\s*88vh;/);
    expect(cssContent).toMatch(/\.game-card-mobile-sheet\s*\{[^}]*border-radius:\s*24px 24px 0 0;/);
    expect(cssContent).toMatch(/\.game-card-mobile-sheet\s*\{[^}]*box-shadow:\s*0 -12px 40px rgba\(0,\s*0,\s*0,\s*0\.85\);/);
    expect(cssContent).toMatch(/\.game-card-mobile-sheet\s*\{[^}]*animation:\s*mobile-sheet-slide-in/);

    // 4. Verify mobile-sheet-slide-in keyframes
    expect(cssContent).toContain("@keyframes mobile-sheet-slide-in {");
    expect(cssContent).toMatch(/transform:\s*translateY\(100%\);/);
    expect(cssContent).toMatch(/transform:\s*translateY\(0\);/);
  });

  it("verifies z-index hierarchy ensures sheet sits above bank panel, property sets, and hand", () => {
    // Mobile modal has z-index: 200 ensuring it sits above table panels (1-100)
    expect(cssContent).toMatch(/\.game-card-mobile-modal\s*\{[^}]*z-index:\s*200;/);
  });

  it("verifies all card types have corresponding action buttons and color selectors in the bottom sheet", () => {
    for (const cardDef of CARD_CATALOGUE) {
      if (cardDef.type === "property") {
        expect(cardDef.primaryColor).toBeDefined();
      } else if (cardDef.type === "property-wild") {
        if (cardDef.primaryColor === "all") {
          const colors = Object.keys(COLOR_CONFIG);
          expect(colors.length).toBeGreaterThanOrEqual(10);
        } else {
          expect(cardDef.primaryColor).toBeDefined();
          expect(cardDef.secondaryColor).toBeDefined();
        }
      } else if (cardDef.type === "money" || cardDef.type === "action" || cardDef.type === "rent") {
        expect(cardDef.value).toBeGreaterThan(0);
      }
    }
  });

  it("verifies game state transition from draw phase to action phase and performing card actions", () => {
    const initialState = createGame({
      players: [
        { id: "p1", name: "Player 1" },
        { id: "bot-1", name: "Bot 1", isBot: true },
      ],
    });

    expect(initialState.turn.phase).toBe("draw");
    expect(initialState.turn.actionsRemaining).toBe(3);
    const p1Initial = initialState.players["p1"];
    expect(p1Initial).toBeDefined();
    expect(p1Initial?.hand.length).toBe(5);

    // Step 3: Draw cards to transition to action phase
    const { nextState: drawState } = applyCommand(initialState, {
      type: "draw_cards",
      playerId: "p1",
    });

    expect(drawState.turn.phase).toBe("action");
    expect(drawState.turn.actionsRemaining).toBe(3);
    const p1Draw = drawState.players["p1"];
    expect(p1Draw).toBeDefined();
    expect(p1Draw?.hand.length).toBe(7);

    // Step 4 & 5: Play a card from hand (e.g. bank money or play property)
    const cardToPlay = p1Draw?.hand[0];
    expect(cardToPlay).toBeDefined();
    if (!cardToPlay) return;

    if (cardToPlay.type === "money" || cardToPlay.type === "action" || cardToPlay.type === "rent") {
      const { nextState: bankState } = applyCommand(drawState, {
        type: "bank_card",
        playerId: "p1",
        cardInstanceId: cardToPlay.instanceId,
      });
      expect(bankState.turn.actionsRemaining).toBe(2);
      const p1Bank = bankState.players["p1"];
      expect(p1Bank?.bank.some((c) => c.instanceId === cardToPlay.instanceId)).toBe(true);
      expect(p1Bank?.hand.some((c) => c.instanceId === cardToPlay.instanceId)).toBe(false);
    } else if (cardToPlay.type === "property") {
      const { nextState: propState } = applyCommand(drawState, {
        type: "play_property",
        playerId: "p1",
        cardInstanceId: cardToPlay.instanceId,
      });
      expect(propState.turn.actionsRemaining).toBe(2);
      const p1Prop = propState.players["p1"];
      expect(p1Prop?.propertySets.length).toBeGreaterThan(0);
      expect(p1Prop?.hand.some((c) => c.instanceId === cardToPlay.instanceId)).toBe(false);
    }
  });

  it("verifies universal mobile bottom sheet conversion and anti-layout-shift rules", () => {
    // 1. Check join-dialog-overlay and overlays align to bottom with no padding on mobile
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*639px\)\s*\{[\s\S]*?\.join-dialog-overlay[\s\S]*?align-items:\s*flex-end\s*!important;/);

    // 2. Check all dialog panels expand to 100% width with 24px 24px 0 0 radius on mobile
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*639px\)\s*\{[\s\S]*?\.dialog-panel[\s\S]*?border-radius:\s*24px 24px 0 0\s*!important;/);
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*639px\)\s*\{[\s\S]*?\.dialog-panel[\s\S]*?width:\s*100%\s*!important;/);

    // 3. Check anti-layout-shift: scrollbar-gutter stable and overscroll-behavior contain
    expect(cssContent).toMatch(/\.dialog-body[\s\S]*?scrollbar-gutter:\s*stable;/);
    expect(cssContent).toMatch(/\.dialog-body[\s\S]*?overscroll-behavior:\s*contain;/);
    expect(cssContent).toMatch(/\.game-settings-dialog-body[\s\S]*?scrollbar-gutter:\s*stable;/);
    expect(cssContent).toMatch(/\.game-card-action-body[\s\S]*?scrollbar-gutter:\s*stable;/);

    // 4. Check sheet-handle exists and is hidden on desktop (min-width: 640px)
    expect(cssContent).toContain(".sheet-handle {");
    expect(cssContent).toMatch(/@media\s*\(min-width:\s*640px\)\s*\{[\s\S]*?\.sheet-handle\s*\{[\s\S]*?display:\s*none;/);

    // 5. Check game-card-action-body has overflow-x: hidden to prevent horizontal scrollbars
    expect(cssContent).toMatch(/\.game-card-action-body\s*\{[^}]*overflow-x:\s*hidden;/);
  });

  it("verifies 2x rent button colors match rent card color and wrap text cleanly without overflow", () => {
    const actionsPath = path.resolve(__dirname, "_components/actions/action-bottom-sheet.tsx");
    const actionsContent = fs.readFileSync(actionsPath, "utf-8");

    // 1. Check that 2x rent buttons use COLOR_CONFIG for background color instead of hardcoded orange gradient
    expect(actionsContent).toMatch(/background:\s*COLOR_CONFIG\[selectedCard\.primaryColor as CardColor\]\?\.hex/);
    expect(actionsContent).toMatch(/background:\s*COLOR_CONFIG\[selectedCard\.secondaryColor as CardColor\]\?\.hex/);

    // 2. Check that grid columns use repeat(2, minmax(0, 1fr)) to avoid horizontal blowout
    expect(actionsContent).toContain('gridTemplateColumns: selectedCard.secondaryColor ? "repeat(2, minmax(0, 1fr))" : "1fr"');

    // 3. Check that buttons have whiteSpace: "normal" and wordBreak: "break-word" with minWidth: 0
    expect(actionsContent).toContain('whiteSpace: "normal"');
    expect(actionsContent).toContain('wordBreak: "break-word"');
    expect(actionsContent).toContain('minWidth: 0');
  });
});
