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

  it("verifies action energy dots and pips are styled in turn pill and opponent player pills", () => {
    // 1. Turn Pill pips
    expect(cssContent).toContain(".game-turn-pill-pips {");
    expect(cssContent).toContain(".game-turn-pill-pip {");
    expect(cssContent).toContain(".game-turn-pill-pip--active {");
    expect(cssContent).toContain(".game-turn-pill-pip--spent {");
    expect(cssContent).toContain(".game-turn-pill-count {");

    // 2. Opponent Player Pill energy dots
    expect(cssContent).toContain(".game-opponent-energy-pill {");
    expect(cssContent).toContain(".game-opponent-energy-pips {");
    expect(cssContent).toContain(".game-opponent-energy-pip {");
    expect(cssContent).toContain(".game-opponent-energy-pip--active {");
    expect(cssContent).toContain(".game-opponent-energy-pip--spent {");
    expect(cssContent).toContain(".game-opponent-energy-text {");

    // 3. Active dots glow with amber color
    expect(cssContent).toMatch(/\.game-turn-pill-pip--active\s*\{[^}]*background:\s*#f59e0b;/);
    expect(cssContent).toMatch(/\.game-opponent-energy-pip--active\s*\{[^}]*background:\s*#f59e0b;/);
  });

  it("verifies properties header is clickable with view hint and opens dialog/sheet with original cards", () => {
    // 1. Clickable properties header styling
    expect(cssContent).toContain(".game-properties-header--clickable {");
    expect(cssContent).toMatch(/\.game-properties-header--clickable\s*\{[^}]*cursor:\s*pointer;/);

    // 2. View cards hint badge
    expect(cssContent).toContain(".game-properties-view-btn {");
    expect(cssContent).toMatch(/\.game-properties-view-btn\s*\{[^}]*display:\s*inline-flex;/);

    // 3. Hover state elevates view button
    expect(cssContent).toContain(".game-properties-header--clickable:hover .game-properties-view-btn {");
  });

  it("verifies discard pile size and responsiveness matches draw pile exactly across screen sizes", () => {
    // 1. Desktop: Both draw and discard pile have 110px width and 160px height
    expect(cssContent).toMatch(/\.game-draw-pile\s*\{[\s\S]*?width:\s*110px;[\s\S]*?height:\s*160px;/);
    expect(cssContent).toMatch(/\.game-discard-pile\s*\{[\s\S]*?width:\s*110px;[\s\S]*?height:\s*160px;/);

    // 2. Discard top card constraints: scales direct child card cleanly without distorting internal elements
    expect(cssContent).toContain(".game-discard-top-card > *");
    expect(cssContent).toMatch(/\.game-discard-top-card\s*>\s*\*[\s\S]*?font-size:\s*7\.333px\s*!important;/);
    expect(cssContent).toMatch(/\.game-discard-top-card\s*>\s*\*::after[\s\S]*?border-radius:\s*inherit\s*!important;/);

    // 3. Mobile responsiveness (76px x 110px): Both draw and discard piles are 76px x 110px
    expect(cssContent).toMatch(/\.game-draw-pile,\s*\n\s*\.game-discard-pile\s*\{\s*\n\s*width:\s*76px;\s*\n\s*height:\s*110px;/);

    // 4. Mobile discard card font size scales root card to 5.06px
    expect(cssContent).toMatch(/\.game-discard-top-card\s*>\s*\*[\s\S]*?font-size:\s*5\.06px\s*!important;/);

    // 5. Tablet discard card font size scales root card to 6.93px
    expect(cssContent).toMatch(/\.game-discard-top-card\s*>\s*\*[\s\S]*?font-size:\s*6\.93px\s*!important;/);
  });

  it("verifies desktop hand container has sufficient top headroom so hovered/selected cards are never clipped", () => {
    // 1. Desktop .game-hand-fanned-container has padding-top >= 50px for hover elevation clearance
    expect(cssContent).toMatch(/\.game-hand-fanned-container\s*\{[\s\S]*?padding-top:\s*56px;/);

    // 2. Desktop .game-hand-fanned-container has negative margin-top to cancel stage gap
    expect(cssContent).toMatch(/\.game-hand-fanned-container\s*\{[\s\S]*?margin-top:\s*-12px;/);

    // 3. Desktop .game-hand-card-wrapper--selected applies authentic glow halo across Hasbro and Monopoly cards
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--selected\s+\[class\*="hasbro-"\]/);
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s+\[class\*="hasbro-"\]/);

    // 4. Tablet .game-hand-fanned-container has padding-top >= 50px
    expect(cssContent).toMatch(/\.game-hand-fanned-container\s*\{[\s\S]*?padding-top:\s*52px;/);
  });

  it("verifies discard pile inspector is connected so players can click and inspect all discarded cards", () => {
    const gameBoardPath = path.resolve(__dirname, "_components/game-board.tsx");
    const gameBoardContent = fs.readFileSync(gameBoardPath, "utf-8");
    const pagePath = path.resolve(__dirname, "page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    // game-board.tsx connects onOpenDiscardInspector to .game-discard-pile
    expect(gameBoardContent).toContain("onOpenDiscardInspector");
    expect(gameBoardContent).toContain("game-discard-pile--interactive");

    // page.tsx renders DiscardInspectorModal and passes onOpenDiscardInspector
    expect(pageContent).toContain("DiscardInspectorModal");
    expect(pageContent).toContain("isDiscardInspectorOpen");
  });
});



