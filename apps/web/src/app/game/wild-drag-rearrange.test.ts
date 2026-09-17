import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Wild card drag & drop rearrangement (desktop)", () => {
  const modalPath = path.resolve(__dirname, "_components/modals/your-properties-modal.tsx");
  const modalContent = fs.readFileSync(modalPath, "utf-8");
  const cssContent = fs.readFileSync(path.resolve(__dirname, "../globals.css"), "utf-8");
  const pageContent = fs.readFileSync(path.resolve(__dirname, "page.tsx"), "utf-8");

  it("drag only starts with a mouse pointer (desktop only)", () => {
    expect(modalContent).toMatch(/e\.pointerType\s*!==\s*"mouse"/);
    expect(modalContent).toMatch(/e\.button\s*!==\s*0/);
  });

  it("drag only applies to wild cards during your action phase", () => {
    expect(modalContent).toMatch(/const isWild = c\.type === "property-wild"/);
    expect(modalContent).toMatch(
      /const canReorganize = isActionActive && isWild;/,
    );
    expect(modalContent).toMatch(
      /const canDrag = canReorganize && !isDragBlockedByBuilding\(set\);/,
    );
  });

  it("blocks dragging a wild out of a set with a building that would drop below setSize", () => {
    expect(modalContent).toMatch(
      /isDragBlockedByBuilding[\s\S]*?hasHouse \|\| fromSet\.hasHotel[\s\S]*?cards\.length - 1 < fromSet\.setSize/,
    );
  });

  it("only allows drops on incomplete sets whose color the wild can represent", () => {
    expect(modalContent).toMatch(/if \(targetSet\.setId === fromSetId\) return false;/);
    expect(modalContent).toMatch(/if \(targetSet\.isComplete\) return false;/);
    expect(modalContent).toMatch(
      /getWildColors\(card\)\.includes\(targetSet\.color\)/,
    );
  });

  it("uses the target set color as the wild's new color and sends the reorganize command", () => {
    expect(modalContent).toMatch(/newColor: hit\.set\.color/);
    expect(modalContent).toMatch(/toSetId: hit\.set\.setId/);
    expect(pageContent).toMatch(
      /onDragReorganize=\{\(\{ card, fromSet, toSetId, newColor \}\) =>\s*\n?\s*handleReorganizeWild\(card\.instanceId, fromSet\.setId, newColor, toSetId\)/,
    );
  });

  it("keeps the card in its original form via a portal-rendered drag ghost", () => {
    expect(modalContent).toContain("createPortal");
    expect(modalContent).toMatch(/game-wild-drag-ghost/);
    expect(modalContent).toMatch(/currentColor=\{dragCard\.card\.currentColor\}/);
    expect(cssContent).toMatch(
      /\.game-wild-drag-ghost\s*\{[^}]*position:\s*fixed;[^}]*pointer-events:\s*none;/,
    );
  });

  it("sticks the ghost to the cursor via imperative transform updates (no per-move re-render)", () => {
    expect(modalContent).toMatch(/ghostRef\.current\.style\.transform = `translate3d\(\$\{x\}px, \$\{y\}px, 0\)`/);
    expect(modalContent).toMatch(/c\.grabDX = e\.clientX - rect\.left/);
    expect(cssContent).toMatch(/\.game-wild-drag-ghost\s*\{[^}]*will-change:\s*transform;/);
  });

  it("plays a subtle drop animation: ghost glides into the target set and the stack pulses", () => {
    expect(modalContent).toMatch(/game-wild-drag-ghost--landing/);
    expect(cssContent).toMatch(
      /\.game-wild-drag-ghost--landing\s*\{[^}]*transition:[^}]*transform/,
    );
    expect(cssContent).toMatch(/\.opp-property-set-stack--drop-landed\s*\{[^}]*animation:\s*setDropPulse/);
    expect(cssContent).toMatch(/@keyframes setDropPulse\s*\{/);
    expect(modalContent).toMatch(/opp-property-set-stack--drop-landed/);
  });

  it("highlights valid drop targets and dims incompatible sets while dragging", () => {
    expect(cssContent).toMatch(
      /\.opp-property-set-stack\[data-drop-valid="true"\]\s*\{[^}]*outline:/,
    );
    expect(cssContent).toMatch(/\.opp-property-set-stack--drop-hover\s*\{/);
    expect(modalContent).toContain("data-set-id={set.setId}");
    expect(modalContent).toContain("data-drop-valid=");
    expect(modalContent).toMatch(/has-drag-active/);
    expect(cssContent).toMatch(
      /\.opp-sets-grid--dialog\.has-drag-active \.opp-property-set-stack\[data-drop-valid="true"\]\s*\{[^}]*animation:\s*setTargetGlow/,
    );
    expect(cssContent).toMatch(
      /\.opp-sets-grid--dialog\.has-drag-active \.opp-property-set-stack:not\(\[data-drop-valid="true"\]\)\s*\{[^}]*opacity:\s*0\.35;[^}]*filter:\s*grayscale/,
    );
    expect(cssContent).toMatch(/@keyframes setTargetGlow\s*\{/);
  });

  it("binds pointer listeners for the whole modal lifetime (drag activates on move)", () => {
    expect(modalContent).toMatch(/window\.addEventListener\("pointermove", onMove, \{ passive: false \}\)/);
    expect(modalContent).toMatch(/window\.addEventListener\("pointerup", onUp\)/);
    // Effect must not depend on drag state (chicken-and-egg regression guard)
    expect(modalContent).toMatch(/\}, \[\]\);/);
    // Card press must not be hijacked by the sheet's swipe-to-close drag
    expect(modalContent).toMatch(/e\.stopPropagation\(\);\s*\n\s*dragCandidateRef\.current = \{/);
  });

  it("suppresses text selection while dragging", () => {
    expect(cssContent).toMatch(/body\.wild-dragging\s*\{[^}]*user-select:\s*none;/);
  });
});
