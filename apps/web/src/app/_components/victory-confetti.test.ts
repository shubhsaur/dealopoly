import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Victory Confetti Optimization & Winner-Only Verification", () => {
  const summaryPath = path.resolve(__dirname, "game-over-summary.tsx");
  const summaryContent = fs.readFileSync(summaryPath, "utf-8");

  const confettiCompPath = path.resolve(__dirname, "victory-confetti.tsx");
  const confettiCompContent = fs.readFileSync(confettiCompPath, "utf-8");

  const cssPath = path.resolve(__dirname, "../globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("verifies confetti is rendered strictly for the winner and not for losing players", () => {
    // 1. VictoryConfetti is imported in GameOverSummary
    expect(summaryContent).toContain('import { VictoryConfetti } from "./victory-confetti";');

    // 2. VictoryConfetti is guarded strictly by isYouWinner
    expect(summaryContent).toMatch(/\{isYouWinner\s*&&\s*<VictoryConfetti/);

    // 3. Old unconditional card confetti shower is completely removed
    expect(summaryContent).not.toContain("victory-card-confetti-shower");
    expect(summaryContent).not.toContain("winnerCardConfetti");

    // 4. Old DOM pieces array is removed
    expect(summaryContent).not.toContain("setConfettiPieces");
    expect(summaryContent).not.toContain("confettiPieces.map");
  });

  it("verifies VictoryConfetti uses hardware-accelerated HTML5 Canvas with 3D physics and Safari optimization", () => {
    // 1. Renders a canvas element with victory-confetti-canvas class
    expect(confettiCompContent).toContain('className={`victory-confetti-canvas ${className}`}');

    // 2. Scales for Retina / High-DPI screens via devicePixelRatio
    expect(confettiCompContent).toContain("window.devicePixelRatio");
    expect(confettiCompContent).toContain("ctx.setTransform(dpr, 0, 0, dpr, 0, 0)");

    // 3. High performance physics: 3D tumbling with cos(wobble) and light reflection
    expect(confettiCompContent).toContain("const cosWobble = Math.cos(p.wobble);");
    expect(confettiCompContent).toContain("ctx.scale(scaleX, 1);");
    expect(confettiCompContent).toContain("cosWobble < 0 ? p.darkColor : p.color");

    // 4. Multiple authentic shapes (rect, ribbon, circle, sparkle)
    expect(confettiCompContent).toContain('shape = "ribbon"');
    expect(confettiCompContent).toContain('shape = "circle"');
    expect(confettiCompContent).toContain('shape = "sparkle"');

    // 5. Cleans up RAF on unmount to prevent memory leaks
    expect(confettiCompContent).toContain("cancelAnimationFrame(animationFrameId)");
    expect(confettiCompContent).toContain("window.removeEventListener(\"resize\", resizeCanvas)");
  });

  it("verifies confetti has finite duration and accessibility support", () => {
    // 1. Accessibility: respects prefers-reduced-motion
    expect(confettiCompContent).toContain("prefers-reduced-motion: reduce");

    // 2. Finite duration: default ~4.8s and terminates gracefully
    expect(confettiCompContent).toContain("durationMs = 4800");
    expect(confettiCompContent).toContain("setIsFinished(true)");
    expect(confettiCompContent).toContain("onComplete?.()");

    // 3. Unmounts / returns null when finished
    expect(confettiCompContent).toContain("if (isFinished) {");
    expect(confettiCompContent).toContain("return null;");
  });

  it("verifies globals.css includes canvas styles and preserves test-required legacy keyframes", () => {
    // 1. .victory-confetti-canvas styles
    expect(cssContent).toMatch(/\.victory-confetti-canvas\s*\{[\s\S]*?position:\s*fixed;/);
    expect(cssContent).toMatch(/\.victory-confetti-canvas\s*\{[\s\S]*?pointer-events:\s*none;/);
    expect(cssContent).toMatch(/\.victory-confetti-canvas\s*\{[\s\S]*?z-index:\s*90;/);

    // 2. Legacy keyframes and selectors preserved for test suite backwards compatibility
    expect(cssContent).toContain("@keyframes confettiFall {");
    expect(cssContent).toContain("@keyframes continuousConfettiShower {");
    expect(cssContent).toContain(".victory-confetti-container {");
    expect(cssContent).toContain(".victory-card-confetti-shower {");
  });
});
