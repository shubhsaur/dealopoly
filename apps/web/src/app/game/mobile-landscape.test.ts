import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Mobile Landscape Responsiveness and Table Orientation Verification", () => {
  const cssPath = path.resolve(__dirname, "../globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("verifies landscape table SVG is displayed and portrait is hidden in landscape orientation", () => {
    // Media query showing landscape SVG in orientation: landscape
    expect(cssContent).toMatch(
      /@media\s*\([^{}]*orientation:\s*landscape[^{}]*\)\s*\{[\s\S]*?\.game-table-svg-bg--portrait\s*\{[\s\S]*?display:\s*none\s*!important;[\s\S]*?\.game-table-svg-bg--landscape\s*\{[\s\S]*?display:\s*flex\s*!important;/
    );

    // Media query showing portrait SVG in orientation: portrait on mobile
    expect(cssContent).toMatch(
      /@media\s*\([^{}]*orientation:\s*portrait[^{}]*max-width:\s*767px[^{}]*\)\s*\{[\s\S]*?\.game-table-svg-bg--portrait\s*\{[\s\S]*?display:\s*flex\s*!important;[\s\S]*?\.game-table-svg-bg--landscape\s*\{[\s\S]*?display:\s*none\s*!important;/
    );
  });

  it("verifies mobile landscape media query exists for short height screens (max-height: 550px)", () => {
    expect(cssContent).toContain("@media (orientation: landscape) and (max-height: 550px)");
  });

  it("verifies compact topbar and grid layout in mobile landscape", () => {
    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );

    // Compact top bar
    expect(mobileLandscapeSection).toMatch(
      /\.game-topbar\s*\{[\s\S]*?height:\s*38px\s*!important;/
    );

    // Grid takes remaining viewport height
    expect(mobileLandscapeSection).toMatch(
      /\.game-layout-grid\s*\{[\s\S]*?height:\s*calc\(100dvh - 38px\)\s*!important;/
    );
  });

  it("verifies center stage (main deck) is positioned in between the game table felt", () => {
    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );

    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-center-stage\s*\{[\s\S]*?position:\s*absolute\s*!important;[\s\S]*?top:\s*38%\s*!important;[\s\S]*?left:\s*50%\s*!important;[\s\S]*?transform:\s*translate\(-50%,\s*-50%\)\s*!important;/
    );
  });

  it("verifies opponent seats are vertically centered and positioned close to main deck horizontally in landscape orientation", () => {
    // General landscape rules
    expect(cssContent).toMatch(
      /\.game-table-shell\s+\.game-opponent-seat--top-left,[\s\S]*?right:\s*calc\(50%\s*\+\s*clamp\(110px,\s*16vw,\s*150px\)\);[\s\S]*?left:\s*auto;/
    );
    expect(cssContent).toMatch(
      /\.game-table-shell\s+\.game-opponent-seat--top-right,[\s\S]*?left:\s*calc\(50%\s*\+\s*clamp\(110px,\s*16vw,\s*150px\)\);[\s\S]*?right:\s*auto;/
    );

    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );

    // Left seats moved closer to main deck horizontally
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-opponent-seat--top-left,\s*\n\s*\.game-table-shell\s+\.game-opponent-seat--left,\s*\n\s*\.game-table-shell\s+\.game-opponent-seat--bottom-left\s*\{[\s\S]*?right:\s*calc\(50%\s*\+\s*clamp\(108px,\s*14vw,\s*135px\)\)\s*!important;[\s\S]*?left:\s*auto\s*!important;/
    );

    // Right seats moved closer to main deck horizontally
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-opponent-seat--top-right,\s*\n\s*\.game-table-shell\s+\.game-opponent-seat--right,\s*\n\s*\.game-table-shell\s+\.game-opponent-seat--bottom-right\s*\{[\s\S]*?left:\s*calc\(50%\s*\+\s*clamp\(108px,\s*14vw,\s*135px\)\)\s*!important;[\s\S]*?right:\s*auto\s*!important;/
    );

    // Vertical centering (single opponent on flank)
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-opponent-seat--top-left\s*\{[\s\S]*?top:\s*38%\s*!important;[\s\S]*?bottom:\s*auto\s*!important;[\s\S]*?transform:\s*translateY\(-50%\)\s*!important;/
    );
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-opponent-seat--top-right\s*\{[\s\S]*?top:\s*38%\s*!important;[\s\S]*?bottom:\s*auto\s*!important;[\s\S]*?transform:\s*translateY\(-50%\)\s*!important;/
    );

    // Multi-opponent flank symmetrical vertical stacking around center (38%)
    expect(mobileLandscapeSection).toMatch(
      /bottom:\s*calc\(100%\s*-\s*38%\s*\+\s*4px\)\s*!important;/
    );
    expect(mobileLandscapeSection).toMatch(
      /top:\s*calc\(38%\s*\+\s*4px\)\s*!important;/
    );
  });

  it("verifies game player assets row uses 100% width and spaces children apart in landscape orientation", () => {
    // General landscape rules
    expect(cssContent).toMatch(
      /\.game-table-shell\s+\.game-main-arena\s*>\s*\.game-player-assets-row\s*\{[\s\S]*?width:\s*100%\s*!important;[\s\S]*?display:\s*flex\s*!important;[\s\S]*?justify-content:\s*space-between\s*!important;/
    );

    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );

    // Assets row positioned top with 100% width and space-between
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-main-arena\s*>\s*\.game-player-assets-row\s*\{[\s\S]*?position:\s*absolute\s*!important;[\s\S]*?top:\s*6px\s*!important;[\s\S]*?justify-content:\s*space-between\s*!important;[\s\S]*?width:\s*100%\s*!important;/
    );

    // Bank panel has fixed width on the left with increased height
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-bank-panel\s*\{[\s\S]*?height:\s*56px\s*!important;[\s\S]*?width:\s*100px\s*!important;/
    );

    // Properties panel has increased height and decreased width, spaced apart on the right
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-properties-panel\s*\{[\s\S]*?height:\s*56px\s*!important;[\s\S]*?flex:\s*0\s*1\s*auto\s*!important;[\s\S]*?max-width:\s*min\(38vw,\s*280px\)\s*!important;/
    );
  });

  it("verifies hand cards scale cleanly without distortion", () => {
    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );

    // Hand cards scaled natively with font-size
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-hand-card-wrapper\s+\.monopoly-card[\s\S]*?font-size:\s*6\.2px\s*!important;/
    );

    // Hand container height
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-hand-fanned-container\s*\{[\s\S]*?height:\s*142px\s*!important;/
    );

    // Hand container width constrained to 60% in mobile landscape (centered by the hand section)
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-hand-fanned-container\s*\{[\s\S]*?width:\s*60%\s*!important;[\s\S]*?max-width:\s*60%\s*!important;/
    );
  });

  it("verifies game property set box uses small font sizes in landscape orientation", () => {
    // General landscape rule: compact clamp() typography (caps keep wide landscape screens unchanged)
    expect(cssContent).toMatch(
      /@media\s*\(orientation:\s*landscape\)\s*\{[\s\S]*?\.game-table-shell\s+\.game-property-set-name,\s*\n\s*\.game-table-shell\s+\.game-property-set-counter\s*\{[\s\S]*?font-size:\s*clamp\(0\.46rem,\s*0\.78vw,\s*0\.68rem\)\s*!important;/
    );

    expect(cssContent).toMatch(
      /\.game-table-shell\s+\.game-property-set-cards-list,\s*\n\s*\.game-table-shell\s+\.game-property-set-card-name\s*\{[\s\S]*?font-size:\s*clamp\(0\.44rem,\s*0\.74vw,\s*0\.64rem\)\s*!important;/
    );

    expect(cssContent).toMatch(
      /\.game-table-shell\s+\.game-property-set-upgrade-row\s*\{[\s\S]*?font-size:\s*clamp\(0\.48rem,\s*0\.8vw,\s*0\.72rem\)\s*!important;/
    );

    expect(cssContent).toMatch(
      /\.game-table-shell\s+\.game-property-set-box\s+\.game-wild-switch-btn\s*\{[\s\S]*?font-size:\s*clamp\(0\.44rem,\s*0\.72vw,\s*0\.62rem\)\s*!important;/
    );

    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );

    // Header label and set counter stay tiny
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-property-set-name\s*\{[\s\S]*?font-size:\s*0\.45rem\s*!important;/
    );
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-property-set-counter\s*\{[\s\S]*?font-size:\s*0\.42rem\s*!important;/
    );

    // Card rows and building (house/hotel) rows inside the box
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-property-set-cards-list,\s*\n\s*\.game-table-shell\s+\.game-property-set-card-name\s*\{[\s\S]*?font-size:\s*0\.42rem\s*!important;/
    );
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-property-set-upgrade-row\s*\{[\s\S]*?font-size:\s*0\.44rem\s*!important;/
    );
    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-property-set-box\s+\.game-wild-switch-btn\s*\{[\s\S]*?font-size:\s*0\.40rem\s*!important;/
    );
  });

  it("verifies landscape-only game page layout rules stay inside landscape media queries", () => {
    // Modal full-height layout is wrapped in a landscape media query
    expect(cssContent).toMatch(
      /@media\s*\(orientation:\s*landscape\)\s*\{\s*\.dialog-panel--table\s+\.dialog-body,/
    );

    // Inside the mobile (<= 767px) block, landscape-only layout must be nested in a landscape query
    const mobileStart = cssContent.indexOf("/* ── Mobile: Portrait Table SVG ");
    const mobileEnd = cssContent.indexOf("@media (max-width: 767px) and (max-height: 680px)");
    expect(mobileStart).toBeGreaterThan(-1);
    expect(mobileEnd).toBeGreaterThan(mobileStart);

    const mobileSection = cssContent.slice(mobileStart, mobileEnd);
    const nestedLandscapeIndex = mobileSection.indexOf("@media (orientation: landscape) {");
    expect(nestedLandscapeIndex).toBeGreaterThan(-1);

    const portraitPart = mobileSection.slice(0, nestedLandscapeIndex);
    const landscapePart = mobileSection.slice(nestedLandscapeIndex);

    // Portrait keeps default seat positions, panel height, banner sizing and assets row padding
    expect(portraitPart).not.toMatch(/top:\s*36%/);
    expect(portraitPart).not.toMatch(/height:\s*56px/);
    expect(portraitPart).not.toMatch(
      /right:\s*calc\(50%\s*\+\s*clamp\(110px,\s*16vw,\s*150px\)\)/
    );
    expect(portraitPart).toMatch(/font-size:\s*clamp\(0\.52rem,\s*1\.8vw,\s*0\.66rem\)/);
    expect(portraitPart).toMatch(/padding:\s*0\s*2px;/);

    // Landscape carries the compact banner, centered seats and slim assets row overrides
    expect(landscapePart).toMatch(
      /right:\s*calc\(50%\s*\+\s*clamp\(110px,\s*16vw,\s*150px\)\)/
    );
    expect(landscapePart).toMatch(
      /\.game-table-shell\s+\.game-properties-panel\s*\{\s*height:\s*56px;/
    );
    expect(landscapePart).toMatch(/font-size:\s*clamp\(0\.48rem,\s*1\.2vw,\s*0\.56rem\)/);
  });

  it("verifies HUD controls bar uses 100% width in landscape orientation", () => {
    // General landscape rule for 100% width on HUD controls
    expect(cssContent).toMatch(
      /@media\s*\([^{}]*orientation:\s*landscape[^{}]*\)\s*\{[\s\S]*?\.game-hud-controls-bar,\s*\n\s*\.game-table-shell\s+\.game-hud-controls-bar\s*\{[\s\S]*?width:\s*100%\s*!important;/
    );

    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );

    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-hud-controls-bar\s*\{[\s\S]*?width:\s*100%\s*!important;/
    );

    expect(mobileLandscapeSection).toMatch(
      /\.game-table-shell\s+\.game-player-table-stage\s*\{[\s\S]*?pointer-events:\s*auto\s*!important;/
    );

    expect(mobileLandscapeSection).toMatch(
      /\.game-card-action-dialog\s*\{[\s\S]*?max-height:\s*94dvh\s*!important;[\s\S]*?overflow-y:\s*auto\s*!important;/
    );
  });

  it("verifies game action prompt banner is compact with decreased font size in landscape orientation", () => {
    // Landscape general rule
    expect(cssContent).toMatch(
      /\.game-action-prompt-banner,[\s\S]*?padding:\s*2px\s*8px;[\s\S]*?font-size:\s*clamp\(0\.48rem,\s*1\.2vw,\s*0\.56rem\);[\s\S]*?max-width:\s*min\(86%,\s*220px\);[\s\S]*?margin:\s*2px\s*auto\s*0;/
    );

    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );

    // Mobile landscape banner styles
    expect(mobileLandscapeSection).toMatch(
      /\.game-action-prompt-banner,[\s\S]*?padding:\s*1\.5px\s*8px\s*!important;[\s\S]*?font-size:\s*0\.50rem\s*!important;[\s\S]*?max-width:\s*min\(85%,\s*210px\)\s*!important;[\s\S]*?margin:\s*2px\s*auto\s*0\s*!important;/
    );

    // Mobile landscape prompt icon
    expect(mobileLandscapeSection).toMatch(
      /\.game-action-prompt-banner\s+\.material-symbols-outlined,[\s\S]*?font-size:\s*10px\s*!important;/
    );
  });

  it("verifies properties card uses 100% of height available in table and properties modal", () => {
    // Base table dialog modal rules
    expect(cssContent).toMatch(
      /\.dialog-panel--table\s+\.game-properties-panel,[\s\S]*?height:\s*100%\s*!important;[\s\S]*?min-height:\s*100%\s*!important;[\s\S]*?flex:\s*1\s*1\s*auto\s*!important;/
    );

    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );

    // Mobile landscape table dialog modal rules
    expect(mobileLandscapeSection).toMatch(
      /\.dialog-panel--table\s+\.game-properties-panel,\s*\n\s*\.game-properties-panel--dialog\s*\{[\s\S]*?height:\s*100%\s*!important;[\s\S]*?min-height:\s*100%\s*!important;[\s\S]*?flex:\s*1\s*1\s*auto\s*!important;/
    );

    expect(mobileLandscapeSection).toMatch(
      /\.dialog-panel--table\s+\.game-player-assets-row,\s*\n\s*\.game-player-assets-row--dialog\s*\{[\s\S]*?height:\s*100%\s*!important;[\s\S]*?flex:\s*1\s*1\s*auto\s*!important;/
    );
  });

  it("verifies bank section is not displayed inside your table and properties modal", () => {
    const modalPath = path.resolve(__dirname, "_components/modals/your-properties-modal.tsx");
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // 1. Bank panel is not present in the modal
    expect(modalContent).not.toContain("game-bank-panel");
    expect(modalContent).not.toContain("YOUR BANK");

    // 2. Header metrics do not show bank
    expect(modalContent).not.toContain("Bank:");
  });

  it("verifies your properties section uses 100% height of the modal", () => {
    const modalPath = path.resolve(__dirname, "_components/modals/your-properties-modal.tsx");
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    // 1. Properties panel uses 100% height and minHeight
    expect(modalContent).toContain('height: "100%"');
    expect(modalContent).toContain('minHeight: "100%"');

    // 2. Alignment stretches to fill container instead of flex-start
    expect(modalContent).toContain('alignItems: "stretch"');
    expect(modalContent).not.toContain('alignItems: "flex-start"');

    // 3. Table dialog has explicit height defined in CSS
    expect(cssContent).toMatch(/\.dialog-panel--table\s*\{[^}]*height:\s*88vh;/);
    expect(cssContent).toMatch(/@media\s*\(min-width:\s*640px\)\s*\{[\s\S]*?\.dialog-panel--table\s*\{[^}]*height:\s*84vh;/);
  });

  it("verifies opponent seat table modal shows bank and properties section in flex-col direction", () => {
    const oppModalPath = path.resolve(__dirname, "_components/modals/opponent-inspector-modal.tsx");
    const oppModalContent = fs.readFileSync(oppModalPath, "utf-8");

    // 1. Assets row has flex-direction column in JSX
    expect(oppModalContent).toContain('flexDirection: "column"');
    expect(oppModalContent).toContain("game-player-assets-row--col");

    // 2. Bank panel has dialog variant class
    expect(oppModalContent).toContain("game-bank-panel--dialog");

    // 3. CSS has rules enforcing flex-direction column for opponent table modal assets row
    expect(cssContent).toMatch(/\.game-player-assets-row--col\s*\{[\s\S]*?flex-direction:\s*column\s*!important;/);
    expect(cssContent).toMatch(/\.game-bank-panel--dialog\s*\{[\s\S]*?width:\s*100%\s*!important;/);
  });

  it("verifies table property dialogs use a responsive 2/3/4-column vertical grid instead of horizontal scroll", () => {
    const oppModalPath = path.resolve(__dirname, "_components/modals/opponent-inspector-modal.tsx");
    const yourModalPath = path.resolve(__dirname, "_components/modals/your-properties-modal.tsx");
    const oppModalContent = fs.readFileSync(oppModalPath, "utf-8");
    const yourModalContent = fs.readFileSync(yourModalPath, "utf-8");

    expect(oppModalContent).toContain("opp-sets-grid--dialog");
    expect(yourModalContent).toContain("opp-sets-grid--dialog");
    expect(oppModalContent).toContain('overflowX: "hidden"');
    expect(yourModalContent).toContain('overflowX: "hidden"');

    expect(cssContent).toMatch(
      /\.dialog-panel--table\s*\{[\s\S]*?container-type:\s*inline-size;[\s\S]*?container-name:\s*properties-modal;/
    );
    expect(cssContent).toMatch(
      /\.opp-sets-grid--dialog\s*\{[\s\S]*?--set-cols:\s*2;[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(var\(--set-cols\),\s*minmax\(0,\s*1fr\)\);[\s\S]*?row-gap:\s*20px;[\s\S]*?overflow-x:\s*hidden;[\s\S]*?overflow-y:\s*auto;/
    );
    expect(cssContent).toMatch(
      /@container properties-modal \(min-width:\s*480px\)\s*\{[\s\S]*?--set-cols:\s*3;/
    );
    expect(cssContent).toMatch(
      /@container properties-modal \(min-width:\s*720px\)\s*\{[\s\S]*?--set-cols:\s*4;/
    );
    expect(cssContent).toMatch(/\.opp-sets-grid--dialog \.opp-sets-grid-empty\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1;/);

    const mobileLandscapeSection = cssContent.slice(
      cssContent.indexOf("@media (orientation: landscape) and (max-height: 550px)")
    );
    expect(mobileLandscapeSection).toMatch(
      /\.opp-sets-grid--dialog\s*\{[\s\S]*?overflow-y:\s*auto\s*!important;[\s\S]*?overflow-x:\s*hidden\s*!important;[\s\S]*?display:\s*grid\s*!important;[\s\S]*?grid-template-columns:\s*repeat\(var\(--set-cols,\s*2\),\s*minmax\(0,\s*1fr\)\)\s*!important;[\s\S]*?gap:\s*20px\s*12px\s*!important;/
    );
  });

  it("verifies the desktop hand-fan clipping fix leaves other table sections in place", () => {
    // 1. Base assets row carries no margin-top of its own (the arena overrides already zero it out)
    expect(cssContent).not.toMatch(/^\.game-player-assets-row\s*\{[^}]*margin-top:/m);

    // 2. The hand stage is not pulled up with a negative margin — that is what previously
    // dragged the flexible center stage (deck, discard pile) and opponents out of position
    expect(cssContent).not.toMatch(/\.game-player-table-stage\s*\{[^}]*margin-top:\s*-\d/);

    // 3. The clipping nudge only repositions the tray's paint box and is scoped to the desktop
    // table, so tablet/phone and mobile-landscape trays keep their own sizing
    expect(cssContent).toMatch(
      /@media \(min-width: 901px\) and \(min-height: 551px\) and \(max-height: 880px\)\s*\{[\s\S]*?\.game-table-shell \.game-hand-fanned-container\s*\{[\s\S]*?--hand-cards-rest-bottom:\s*863px;/
    );
    expect(cssContent).toMatch(
      /top:\s*calc\(\s*-1\s*\*\s*clamp\(0px,\s*calc\(var\(--hand-cards-rest-bottom\)\s*\+\s*18px\s*-\s*100vh\),\s*var\(--hand-nudge-max\)\)\s*\);/
    );
  });
});


