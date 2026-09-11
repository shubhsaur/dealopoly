import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Disabled Hand Cards & Waiting UI Polish Verification", () => {
  const cssPath = path.resolve(__dirname, "../globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("verifies disabled hand cards are 100% solid and never see through each other", () => {
    // 1. .game-hand-card-wrapper--disabled has opacity: 1 !important so overlapping cards are never see-through
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s*\{[^}]*opacity:\s*1\s*!important;/);

    // 2. Direct card children maintain opacity: 1
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled[\s>]+\.monopoly-card[^}]*opacity:\s*1\s*!important;/);

    // 3. .game-hand-fanned-container--disabled maintains opacity: 1 (no container-level alpha compositing)
    expect(cssContent).toMatch(/\.game-hand-fanned-container--disabled\s*\{[^}]*opacity:\s*1\s*!important;/);

    // 4. .standard-card--disabled has opacity: 1 !important for Lowdeck cards
    expect(cssContent).toMatch(/\.standard-card--disabled\s*\{[^}]*opacity:\s*1\s*!important;/);
  });

  it("verifies disabled hand cards retain clean dimming without boxy artifacts and allow warning haptics", () => {
    // 1. Clean brightness/saturate dimming on the wrapper
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s*\{[^}]*filter:\s*brightness\(0\.68\)\s+saturate\(0\.85\);/);

    // 2. Disabled card wrapper has cursor: not-allowed
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s*\{[^}]*cursor:\s*not-allowed\s*!important;/);

    // 3. Pointer-events are auto so tapping provides warning haptics
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled\s*\{[^}]*pointer-events:\s*auto;/);
  });

  it("verifies viewport facade overlay is removed so cards are never partially obscured during mobile scroll", () => {
    const gameBoardPath = path.resolve(__dirname, "_components/game-board.tsx");
    const gameBoardContent = fs.readFileSync(gameBoardPath, "utf-8");
    const leastCountPath = path.resolve(__dirname, "../_components/least-count-game-view.tsx");
    const leastCountContent = fs.readFileSync(leastCountPath, "utf-8");

    // 1. Facade CSS class is removed
    expect(cssContent).not.toContain(".game-hand-facade {");

    // 2. Neither game view renders the viewport-limited facade overlay
    expect(gameBoardContent).not.toContain('className="game-hand-facade"');
    expect(leastCountContent).not.toContain('className="game-hand-facade"');
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

    // 4. Scroll navigation is no longer rendered; drag-to-scroll remains enabled
    expect(cssContent).not.toContain(".game-hand-scroll-nav {");
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
    // 1. Desktop .game-hand-fanned-container has padding-top >= 48px for hover elevation clearance
    expect(cssContent).toMatch(/\.game-hand-fanned-container\s*\{[\s\S]*?padding-top:\s*48px;/);

    // 2. Desktop .game-hand-fanned-container has negative margin-top to cancel stage gap
    expect(cssContent).toMatch(/\.game-hand-fanned-container\s*\{[\s\S]*?margin-top:\s*-6px;/);

    // 3. Desktop .game-hand-card-wrapper--selected applies authentic glow halo across direct card roots
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--selected[\s>]+\[class\*="hasbro-"\]/);
    expect(cssContent).toMatch(/\.game-hand-card-wrapper--disabled[\s>]+\[class\*="hasbro-"\]/);

    // 4. Critical: Ensure disabled wrapper does NOT apply blanket box-shadow to descendant [class*="hasbro-"] elements,
    // which previously created embossed boxy artifacts around internal headers, badges, and text.
    expect(cssContent).not.toMatch(/\.game-hand-card-wrapper--disabled\s+\[class\*="hasbro-"\]\s*\{[^}]*box-shadow/);

    // 5. Tablet .game-hand-fanned-container has padding-top >= 50px
    expect(cssContent).toMatch(/\.game-hand-fanned-container\s*\{[\s\S]*?padding-top:\s*52px;/);
  });

  it("verifies discard pile does not open inspector dialog when clicked", () => {
    const gameBoardPath = path.resolve(__dirname, "_components/game-board.tsx");
    const gameBoardContent = fs.readFileSync(gameBoardPath, "utf-8");
    const pagePath = path.resolve(__dirname, "page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    // game-board.tsx discard pile has no onClick dialog opener or interactive class
    expect(gameBoardContent).not.toContain("onOpenDiscardInspector");
    expect(gameBoardContent).not.toContain("game-discard-pile--interactive");

    // page.tsx does not hook up isDiscardInspectorOpen to center stage
    expect(pageContent).not.toContain("isDiscardInspectorOpen");
  });

  it("verifies game settings dialog eliminates layout shifts when switching tabs", () => {
    const dialogPath = path.resolve(__dirname, "../_components/game-settings-dialog.tsx");
    const dialogContent = fs.readFileSync(dialogPath, "utf-8");

    // 1. Desktop fixed height to prevent vertical center jumping
    expect(cssContent).toMatch(/\.dialog-panel\.game-settings-dialog-panel\s*\{[\s\S]*?height:\s*74svh;/);
    expect(cssContent).toMatch(/@media\s*\(min-width:\s*640px\)\s*\{[\s\S]*?\.dialog-panel\.game-settings-dialog-panel\s*\{[\s\S]*?height:\s*570px;/);

    // 2. Scrollbar-gutter stable to prevent horizontal layout shifts when switching tabs
    expect(cssContent).toMatch(/\.game-settings-dialog-body\s*\{[\s\S]*?scrollbar-gutter:\s*stable;/);

    // 3. Tab pane animations and flex display
    expect(cssContent).toContain(".game-settings-tab-pane {");
    expect(cssContent).toContain("@keyframes settings-tab-fade {");

    // 4. Markup in game-settings-dialog.tsx uses the panel class, tablist, and tabpanels
    expect(dialogContent).toContain("game-settings-dialog-panel");
    expect(dialogContent).toContain('role="tablist"');
    expect(dialogContent).toContain('role="tab"');
    expect(dialogContent).toContain('role="tabpanel"');
    expect(dialogContent).toContain('id="settings-tabpanel-audio"');
    expect(dialogContent).toContain('id="settings-tabpanel-gameplay"');
    expect(dialogContent).toContain('id="settings-tabpanel-appearance"');
  });

  it("verifies discard modal has close and cancel options to resume turn when clicked by mistake", () => {
    const modalsPath = path.resolve(__dirname, "_components/modals/discard-modal.tsx");
    const modalsContent = fs.readFileSync(modalsPath, "utf-8");
    const pagePath = path.resolve(__dirname, "page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    // 1. DiscardModal interface supports onClose
    expect(modalsContent).toContain("onClose?: () => void;");

    // 2. DiscardModal renders close button (✕) in header and Cancel button in footer
    expect(modalsContent).toContain('className="dialog-close-btn"');
    expect(modalsContent).toContain("aria-label=\"Close discard dialog\"");
    expect(modalsContent).toContain("Cancel");

    // 3. page.tsx passes onClose sending cancel_discard command
    expect(pageContent).toMatch(/onClose=\{\(\)\s*=>\s*\{[\s\S]*?type:\s*"cancel_discard"/);
  });

  it("verifies View Cards pill in properties header is not clipped on mobile screens", () => {
    // 1. Mobile header wraps and does not hide overflow
    expect(cssContent).toMatch(/\.game-properties-title-group\s*\{[\s\S]*?overflow:\s*visible;/);
    expect(cssContent).toMatch(/\.game-properties-title-group\s*\{[\s\S]*?flex-wrap:\s*wrap;/);

    // 2. View cards pill has flex-shrink: 0 and white-space: nowrap
    expect(cssContent).toMatch(/\.game-properties-view-btn\s*\{[\s\S]*?flex-shrink:\s*0;/);
    expect(cssContent).toMatch(/\.game-properties-view-btn\s*\{[\s\S]*?white-space:\s*nowrap;/);
  });

  it("verifies hand card sizes are scaled down on mobile devices to display more cards in viewport", () => {
    // 1. Mobile phone card scaling (<= 640px)
    expect(cssContent).toMatch(/\[class\*="hasbro-"\]\[class\*="-card--sm"\],\s*\n\s*\.hasbro-card--sm\s*\{\s*\n\s*font-size:\s*8\.2px;/);

    // 2. Small mobile screen card scaling (<= 480px)
    expect(cssContent).toMatch(/\[class\*="hasbro-"\]\[class\*="-card--sm"\],\s*\n\s*\.hasbro-card--sm\s*\{\s*\n\s*font-size:\s*7\.8px;/);
  });

  it("verifies card action dialog and spotlight card scale responsively based on resolution", () => {
    // 1. Desktop scaling: card scales to ~13.5px max font-size so both card and action buttons fit comfortably
    expect(cssContent).toMatch(/\.game-card-spotlight-wrap\s+\[class\*="hasbro-"\]\[class\*="-card"\][\s\S]*?font-size:\s*clamp\(11px,\s*2\.1vh,\s*13\.5px\)\s*!important;/);

    // 2. Mobile scaling (<= 640px): card scales down to ~9-10px font-size
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*?\.game-card-spotlight-wrap\s+\[class\*="hasbro-"\]\[class\*="-card"\][\s\S]*?font-size:\s*clamp\(8\.8px,\s*2\.3vh,\s*10\.2px\)\s*!important;/);

    // 3. Short height / landscape scaling (<= 680px height)
    expect(cssContent).toMatch(/@media\s*\(max-height:\s*680px\)\s*\{[\s\S]*?\.game-card-spotlight-wrap\s+\[class\*="hasbro-"\]\[class\*="-card"\][\s\S]*?font-size:\s*clamp\(7\.5px,\s*2\.0vh,\s*9px\)\s*!important;/);

    // 4. Action buttons have responsive padding
    expect(cssContent).toContain(".game-action-choice-btn {");
    expect(cssContent).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*?\.game-action-choice-btn\s*\{[\s\S]*?padding:\s*9px\s+12px;/);
  });
});
