import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Disabled Hand Cards & Waiting UI Polish Verification", () => {
  const cssPath = path.resolve(__dirname, "../globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("verifies disabled hand cards are 100% opaque and never translucent", () => {
    // 1. .game-hand-card-wrapper--disabled must have opacity: 1 !important
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s*\{[^}]*opacity:\s*1\s*!important;/);

    // 2. .game-hand-card-wrapper--disabled .monopoly-card, .standard-card must have opacity: 1 !important
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s+\.monopoly-card[^}]*opacity:\s*1\s*!important;/);

    // 3. .game-hand-fanned-container--disabled must have opacity: 1 !important (no container-level alpha compositing)
    expect(cssContent).toMatch(/\.game-hand-fanned-container--disabled\s*\{[^}]*opacity:\s*1\s*!important;/);

    // 4. .standard-card--disabled must have opacity: 1 !important for Lowdeck cards
    expect(cssContent).toMatch(/\.standard-card--disabled\s*\{[^}]*opacity:\s*1\s*!important;/);
  });

  it("verifies disabled hand cards have polished resting filter and depth shadow", () => {
    // Checks that cards have resting filter (dimmed/relaxed, but crisp text and authentic colors)
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s*\{[^}]*filter:\s*brightness\(0\.86\)\s*contrast\(0\.96\)\s*saturate\(0\.88\);/);
    
    // Checks that disabled card wrapper has cursor: not-allowed
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s*\{[^}]*cursor:\s*not-allowed\s*!important;/);

    // Checks that pointer-events are enabled (pointer-events: auto) so cursor shows and hover peek works
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s*\{[^}]*pointer-events:\s*auto;/);
  });

  it("verifies desktop inspection peek on hover allows reading card details during opponent's turn", () => {
    // Checks that hover on disabled card peeks upward and raises z-index for reading obscured details
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled:hover\s*\{[^}]*transform:\s*translateY\(-10px\)\s*scale\(1\.02\);/);
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled:hover\s*\{[^}]*z-index:\s*45\s*!important;/);
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled:hover\s*\{[^}]*cursor:\s*not-allowed;/);
  });

  it("verifies waiting turn badge and pulse animation are defined in globals.css", () => {
    expect(cssContent).toContain(".game-hand-waiting-badge {");
    expect(cssContent).toContain(".game-hand-waiting-pulse {");
    expect(cssContent).toContain("@keyframes hand-waiting-pulse {");
  });

  it("verifies mobile hand layout prevents left-card cut-off bug with safe center and auto margins", () => {
    // 1. Container uses justify-content: safe center to avoid pushing overflow into negative coordinate space
    expect(cssContent).toContain("justify-content: safe center;");

    // 2. Cards row uses margin-inline: auto so it centers when fitting and evaluates to 0 when overflowing
    expect(cssContent).toContain("margin-inline: auto;");

    // 3. Container has touch-action: pan-x and overscroll-behavior-x: contain for smooth mobile swipe without back navigation
    expect(cssContent).toContain("touch-action: pan-x;");
    expect(cssContent).toContain("overscroll-behavior-x: contain;");

    // 4. Scroll navigation bar and buttons are defined for overflowing cards
    expect(cssContent).toContain(".game-hand-scroll-nav {");
    expect(cssContent).toContain(".game-hand-scroll-btn {");
    expect(cssContent).toContain(".game-hand-scroll-count {");
  });

  it("verifies confetti animations are hardware-accelerated for Safari with translate3d and will-change", () => {
    // 1. Full page confettiFall uses translate3d
    expect(cssContent).toContain("@keyframes confettiFall {");
    expect(cssContent).toMatch(/@keyframes confettiFall[\s\S]*?translate3d\(0,\s*-10vh,\s*0\)/);
    expect(cssContent).toMatch(/@keyframes confettiFall[\s\S]*?translate3d\(0,\s*105vh,\s*0\)/);

    // 2. Winner card continuousConfettiShower uses translate3d
    expect(cssContent).toContain("@keyframes continuousConfettiShower {");
    expect(cssContent).toMatch(/@keyframes continuousConfettiShower[\s\S]*?translate3d\(0,\s*-20px,\s*0\)/);
    expect(cssContent).toMatch(/@keyframes continuousConfettiShower[\s\S]*?translate3d\(0,\s*580px,\s*0\)/);

    // 3. Confetti pieces have will-change and backface-visibility for GPU layer pre-allocation
    expect(cssContent).toMatch(/\.victory-confetti-piece\s*\{[^}]*will-change:\s*transform,\s*opacity;/);
    expect(cssContent).toMatch(/\.victory-confetti-piece\s*\{[^}]*backface-visibility:\s*hidden;/);
    expect(cssContent).toMatch(/\.victory-card-confetti-piece\s*\{[^}]*will-change:\s*transform,\s*opacity;/);
    expect(cssContent).toMatch(/\.victory-card-confetti-piece\s*\{[^}]*backface-visibility:\s*hidden;/);

    // 4. Containers isolate layout & paint and enforce GPU compositing
    expect(cssContent).toMatch(/\.victory-confetti-container\s*\{[^}]*contain:\s*layout\s+paint;/);
    expect(cssContent).toMatch(/\.victory-card-confetti-shower\s*\{[^}]*contain:\s*layout\s+paint;/);
  });
});

