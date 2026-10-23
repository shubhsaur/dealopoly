import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Victory Standings Revamp & Sets/Hand Showcase Verification", () => {
  const summaryPath = path.resolve(__dirname, "game-over-summary.tsx");
  const summaryContent = fs.readFileSync(summaryPath, "utf-8");

  const cssPath = path.resolve(__dirname, "../globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  const maskingPath = path.resolve(__dirname, "../../../../../packages/game-engine/src/games/monodeal/masking.ts");
  const maskingContent = fs.readFileSync(maskingPath, "utf-8");

  it("verifies game engine unmasks all player hands at game conclusion", () => {
    // Shows hands when status === completed or winnerId !== null or turn phase ended
    expect(maskingContent).toContain('const isGameOver = state.status === "completed" || state.winnerId !== null || state.turn.phase === "ended";');
    expect(maskingContent).toContain("hand: isViewer || isGameOver ? [...player.hand] : undefined");
    expect(maskingContent).toContain("if (!isViewer && !isGameOver && c.type === \"property-wild\" && c.primaryColor !== \"all\")");
  });

  it("verifies Sets Completed column is revamped with highlighted sets and cards", () => {
    // 1. Table headers include Completed Sets & Properties and Cards in Hand
    expect(summaryContent).toContain("Completed Sets & Properties</th>");
    expect(summaryContent).toContain("Cards in Hand</th>");

    // 2. SetsShowcase component renders completed sets list and cards
    expect(summaryContent).toContain("function SetsShowcase");
    expect(summaryContent).toContain("victory-completed-sets-list");
    expect(summaryContent).toContain("victory-completed-set-card");
    expect(summaryContent).toContain("victory-completed-set-banner");
    expect(summaryContent).toContain("victory-card-mini-pill");

    // 3. In-progress sets are rendered distinctly
    expect(summaryContent).toContain("victory-partial-sets-wrap");
    expect(summaryContent).toContain("victory-partial-set-pill");
  });

  it("verifies Cards in Hand showcase displays cards held at match end", () => {
    // 1. HandShowcase component is defined and rendered
    expect(summaryContent).toContain("function HandShowcase");
    expect(summaryContent).toContain("victory-hand-showcase");
    expect(summaryContent).toContain("victory-hand-cards-list");
    expect(summaryContent).toContain("victory-hand-card-chip");

    // 2. Responsive tabular layout renders both SetsShowcase and HandShowcase in table rows
    expect(summaryContent).toMatch(/<div className="victory-table-wrap">[\s\S]*?<SetsShowcase[\s\S]*?<HandShowcase/);
    expect(summaryContent).toContain("victory-table-scroll-hint");
  });

  it("verifies globals.css includes styles for revamped sets, cards, and hands", () => {
    // 1. .victory-sets-showcase & completed set cards
    expect(cssContent).toContain(".victory-sets-showcase {");
    expect(cssContent).toContain(".victory-completed-set-card {");
    expect(cssContent).toContain(".victory-completed-set-banner {");
    expect(cssContent).toContain(".victory-card-mini-pill {");

    // 2. .victory-hand-showcase & hand card chips
    expect(cssContent).toContain(".victory-hand-showcase {");
    expect(cssContent).toContain(".victory-hand-card-chip {");
    expect(cssContent).toContain(".victory-hand-empty-pill {");

    // 3. Table top alignment and scroll cues for responsive layout
    expect(cssContent).toMatch(/\.victory-table td\s*\{[^}]*vertical-align:\s*top;/);
    expect(cssContent).toContain(".victory-table-scroll-hint {");
  });
});
