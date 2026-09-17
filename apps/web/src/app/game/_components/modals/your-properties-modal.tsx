"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CardInstance, MaskedGameState, PropertySet } from "@dealopoly/game-engine";
import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { Card } from "../../../_components/card";
import { resolveCardDef } from "../types";
import { DialogShell } from "../../../_components/dialog-shell";

export interface YourPropertiesModalProps {
  isOpen: boolean;
  you: {
    id?: string;
    name?: string;
    hand?: CardInstance[];
    bankTotal?: number;
    bank?: CardInstance[];
    propertySets: PropertySet[];
  } | null;
  isYourTurn: boolean;
  gameState: MaskedGameState;
  onClose: () => void;
  onReorganizeTarget: (target: { card: CardInstance; fromSet: PropertySet }) => void;
  onMoveBuildingTarget: (target: { buildingType: "house" | "hotel"; fromSet: PropertySet }) => void;
  /** Desktop drag & drop: move a wild card between sets (color = target set color). */
  onDragReorganize?: (t: { card: CardInstance; fromSet: PropertySet; toSetId: string; newColor: CardColor }) => void;
}

const ALL_WILD_COLORS: CardColor[] = [
  "brown",
  "dark-blue",
  "green",
  "light-blue",
  "orange",
  "pink",
  "railroad",
  "red",
  "utility",
  "yellow",
];

/** Colors a wild card is allowed to represent. */
function getWildColors(card: CardInstance): CardColor[] {
  return card.primaryColor === "all"
    ? ALL_WILD_COLORS
    : ([card.primaryColor, card.secondaryColor].filter(Boolean) as CardColor[]);
}

/** Whether the dragged wild card may legally join the target set. */
function canDropOn(targetSet: PropertySet, card: CardInstance, fromSetId: string): boolean {
  if (targetSet.setId === fromSetId) return false;
  // Only incomplete sets can receive the wild — dropping on a complete set
  // would never be needed (it already counts).
  if (targetSet.isComplete) return false;
  return getWildColors(card).includes(targetSet.color);
}

/** Removing a wild from a set with buildings must not drop it below setSize (engine rule). */
function isDragBlockedByBuilding(fromSet: PropertySet): boolean {
  return Boolean(
    (fromSet.hasHouse || fromSet.hasHotel) && fromSet.cards.length - 1 < fromSet.setSize,
  );
}

interface DragSource {
  card: CardInstance;
  fromSet: PropertySet;
  element: HTMLElement;
  startX: number;
  startY: number;
  pointerId: number;
  grabDX: number;
  grabDY: number;
  active: boolean;
}

export function YourPropertiesModal({
  isOpen,
  you,
  isYourTurn,
  gameState,
  onClose,
  onReorganizeTarget,
  onMoveBuildingTarget,
  onDragReorganize,
}: YourPropertiesModalProps) {
  const isActionActive = Boolean(
    isOpen && you && isYourTurn && gameState.turn.phase === "action" && !gameState.pendingResolution,
  );

  // --- Wild card drag & drop (desktop / mouse only) -------------------------
  // Ghost position is updated imperatively via ref (no per-move React renders)
  // so the card sticks to the cursor with zero lag.
  const [dragCard, setDragCard] = useState<{ card: CardInstance; fromSet: PropertySet; x: number; y: number } | null>(null);
  const [hoverSetId, setHoverSetId] = useState<string | null>(null);
  const dragCandidateRef = useRef<DragSource | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const setsRef = useRef<PropertySet[]>([]);
  setsRef.current = you?.propertySets ?? [];

  // Latest-ref so pointer handlers always call the freshest callback without rebinding.
  const onDropReorganizeRef = useRef<
    (t: { card: CardInstance; fromSet: PropertySet; toSetId: string; newColor: CardColor }) => void
  >(onDragReorganize ?? (() => {}));
  onDropReorganizeRef.current = onDragReorganize ?? (() => {});

  useEffect(() => {
    const hitTestSet = (x: number, y: number): { set: PropertySet; el: Element } | null => {
      const el = document.elementFromPoint(x, y);
      const stack = el?.closest?.("[data-set-id]");
      const setId = stack?.getAttribute("data-set-id");
      if (!stack || !setId) return null;
      const set = setsRef.current.find((s) => s.setId === setId);
      return set ? { set, el: stack } : null;
    };

    const onMove = (e: PointerEvent) => {
      const c = dragCandidateRef.current;
      if (!c || e.pointerId !== c.pointerId) return;
      if (!c.active) {
        if (Math.hypot(e.clientX - c.startX, e.clientY - c.startY) <= 6) return;
        c.active = true;
        document.body.classList.add("wild-dragging");
        // Stick the ghost exactly where the user grabbed the card.
        const rect = c.element.getBoundingClientRect();
        c.grabDX = e.clientX - rect.left;
        c.grabDY = e.clientY - rect.top;
        setDragCard({ card: c.card, fromSet: c.fromSet, x: e.clientX - c.grabDX, y: e.clientY - c.grabDY });
        return;
      }
      e.preventDefault();
      const x = e.clientX - c.grabDX;
      const y = e.clientY - c.grabDY;
      if (ghostRef.current) {
        ghostRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      const hit = hitTestSet(e.clientX, e.clientY);
      const nextHover = hit && canDropOn(hit.set, c.card, c.fromSet.setId) ? hit.set.setId : null;
      setHoverSetId((prev) => (prev === nextHover ? prev : nextHover));
    };

    const onUp = (e: PointerEvent) => {
      const c = dragCandidateRef.current;
      dragCandidateRef.current = null;
      document.body.classList.remove("wild-dragging");
      if (!c?.active) {
        setDragCard(null);
        setHoverSetId(null);
        return;
      }
      const hit = hitTestSet(e.clientX, e.clientY);
      if (hit && canDropOn(hit.set, c.card, c.fromSet.setId)) {
        // Subtle drop animation: ghost glides into the destination set and fades,
        // while the destination stack pulses.
        const ghost = ghostRef.current;
        if (ghost) {
          const sr = hit.el.getBoundingClientRect();
          const gr = ghost.getBoundingClientRect();
          const toX = sr.left + sr.width / 2 - gr.width / 2;
          const toY = sr.top + sr.height / 2 - gr.height / 2;
          ghost.classList.add("game-wild-drag-ghost--landing");
          ghost.style.transform = `translate3d(${toX}px, ${toY}px, 0) scale(0.82)`;
          ghost.style.opacity = "0";
        }
        hit.el.classList.add("opp-property-set-stack--drop-landed");
        window.setTimeout(() => hit.el.classList.remove("opp-property-set-stack--drop-landed"), 620);
        window.setTimeout(() => {
          setDragCard(null);
          setHoverSetId(null);
        }, 300);
        onDropReorganizeRef.current({
          card: c.card,
          fromSet: c.fromSet,
          toSetId: hit.set.setId,
          newColor: hit.set.color,
        });
        return;
      }
      setDragCard(null);
      setHoverSetId(null);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.classList.remove("wild-dragging");
    };
  }, []);

  if (!isOpen || !you) return null;

  const completedSetsCount = you.propertySets.filter((s) => s.isComplete).length;

  return (
    <>
      <DialogShell isOpen={isOpen && Boolean(you)} onClose={onClose} size="table" zIndex={300} swipeToClose>
      <div className="dialog-header">
        <div>
          <h2 style={{ fontSize: "1.1rem", margin: "0 0 4px" }}>Your Table &amp; Properties</h2>
          <div className="game-opponent-metrics" style={{ fontSize: "0.8rem" }}>
            <span>{you.hand?.length ?? 0} Cards in Hand</span>
            <span>•</span>
            <span style={{ color: "var(--primary)" }}>★ {completedSetsCount} / 3 Sets Complete</span>
          </div>
        </div>
        <button
          type="button"
          className="dialog-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            close
          </span>
        </button>
      </div>

      <div className="dialog-body" style={{ flex: "1 1 auto", height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div
          className="game-player-assets-row game-player-assets-row--dialog"
          style={{ flex: "1 1 auto", height: "100%", minHeight: "100%", width: "100%", display: "flex", alignItems: "stretch" }}
        >
          {/* Properties Panel */}
          <div
            className="game-properties-panel game-properties-panel--dialog"
            style={{ flex: "1 1 auto", width: "100%", height: "100%", minHeight: "100%", display: "flex", flexDirection: "column" }}
          >
            <div className="game-properties-header">
              <div className="game-properties-title-group">
                <span className="game-properties-title-label">YOUR PROPERTIES</span>
                <span className="game-properties-completed-badge">
                  ★ {completedSetsCount} / 3 Sets
                </span>
              </div>
            </div>

            <div
              className={`game-properties-sets-grid opp-sets-grid--dialog ${dragCard ? "has-drag-active" : ""}`}
              style={{ flex: "1 1 auto", height: "100%", minHeight: 0, overflowY: "auto", overflowX: "hidden" }}
            >
              {you.propertySets.length === 0 ? (
                <div className="opp-sets-grid-empty" style={{ padding: "28px 16px", textAlign: "center", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--outline)", opacity: 0.6 }}>
                    domain_disabled
                  </span>
                  <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "8px 0 0" }}>
                    No property sets laid down yet.
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--outline)", margin: "4px 0 0" }}>
                    Click or drag property cards in your hand to start building full sets!
                  </p>
                </div>
              ) : (
                you.propertySets.map((set) => {
                  const colorHex = COLOR_CONFIG[set.color as CardColor]?.hex || "#0055A4";
                  const totalCardCount = set.cards.length + (set.hasHouse ? 1 : 0) + (set.hasHotel ? 1 : 0);
                  const CARD_H = 170;
                  const OFFSET = 28;
                  const stackH = CARD_H + (totalCardCount - 1) * OFFSET;

                  return (
                    <div
                      key={set.setId}
                      data-set-id={set.setId}
                      data-drop-valid={
                        dragCard && canDropOn(set, dragCard.card, dragCard.fromSet.setId)
                          ? "true"
                          : undefined
                      }
                      className={`opp-property-set-stack ${set.isComplete ? "opp-property-set-stack--complete" : ""} ${hoverSetId === set.setId ? "opp-property-set-stack--drop-hover" : ""}`}
                      style={{
                        borderColor: colorHex,
                        minHeight: stackH + 24,
                      }}
                    >
                      <div className="opp-property-set-label" style={{ color: colorHex }}>
                        <span style={{ textTransform: "uppercase", fontWeight: 800, fontSize: "0.62rem" }}>
                          {set.color}
                        </span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", opacity: 0.8 }}>
                          {set.cards.length}/{set.setSize}
                          {set.isComplete && " ★"}
                        </span>
                      </div>

                      <div className="opp-property-set-fan" style={{ height: stackH }}>
                        {set.cards.map((c, idx) => {
                          const isWild = c.type === "property-wild";
                          const canReorganize = isActionActive && isWild;
                          const canDrag = canReorganize && !isDragBlockedByBuilding(set);
                          const isDraggingThis = dragCard?.card.instanceId === c.instanceId;

                          return (
                            <div
                              key={c.instanceId}
                              className={`opp-fan-card ${canDrag && !isDraggingThis ? "game-wild-can-drag" : ""} ${isDraggingThis ? "wild-drag-source" : ""}`}
                              style={{
                                top: idx * OFFSET,
                                zIndex: idx,
                              }}
                              onPointerDown={(e) => {
                                if (!canDrag || e.pointerType !== "mouse" || e.button !== 0) return;
                                // Don't let the sheet's swipe-to-close drag hijack the card press.
                                e.stopPropagation();
                                dragCandidateRef.current = {
                                  card: c,
                                  fromSet: set,
                                  element: e.currentTarget,
                                  startX: e.clientX,
                                  startY: e.clientY,
                                  pointerId: e.pointerId,
                                  grabDX: 0,
                                  grabDY: 0,
                                  active: false,
                                };
                              }}
                            >
                              <Card card={resolveCardDef(c)} size="xs" isInteractive={false} currentColor={c.currentColor} />
                              {canReorganize && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                    onReorganizeTarget({ card: c, fromSet: set });
                                  }}
                                  className="game-wild-switch-btn"
                                  style={{
                                    position: "absolute",
                                    bottom: "6px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    zIndex: 20,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
                                  }}
                                  title="Switch Wildcard Color (Free Action)"
                                >
                                  <span>🔄</span>
                                  <span>Move</span>
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {set.hasHouse && (
                          <div
                            className="opp-fan-card opp-fan-upgrade"
                            style={{
                              top: set.cards.length * OFFSET,
                              zIndex: set.cards.length,
                              background: "#16a34a",
                              borderColor: "#4ade80",
                            }}
                          >
                            <span style={{ fontSize: "1.1rem" }}>🏠</span>
                            <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#86efac", marginTop: "2px" }}>
                              +$3M
                            </span>
                            {isActionActive && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onMoveBuildingTarget({ buildingType: "house", fromSet: set });
                                }}
                                className="game-wild-switch-btn"
                                style={{
                                  fontSize: "0.55rem",
                                  padding: "1px 4px",
                                  marginTop: "2px",
                                  zIndex: 20,
                                }}
                                title="Move House to another full set"
                              >
                                Move
                              </button>
                            )}
                          </div>
                        )}

                        {set.hasHotel && (
                          <div
                            className="opp-fan-card opp-fan-upgrade"
                            style={{
                              top: (set.cards.length + (set.hasHouse ? 1 : 0)) * OFFSET,
                              zIndex: set.cards.length + (set.hasHouse ? 1 : 0),
                              background: "#b45309",
                              borderColor: "#fbbf24",
                            }}
                          >
                            <span style={{ fontSize: "1.1rem" }}>🏨</span>
                            <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#fde68a", marginTop: "2px" }}>
                              +$4M
                            </span>
                            {isActionActive && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onMoveBuildingTarget({ buildingType: "hotel", fromSet: set });
                                }}
                                className="game-wild-switch-btn"
                                style={{
                                  fontSize: "0.55rem",
                                  padding: "1px 4px",
                                  marginTop: "2px",
                                  zIndex: 20,
                                }}
                                title="Move Hotel to another full set"
                              >
                                Move
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogShell>
      {dragCard &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={ghostRef}
            className="game-wild-drag-ghost"
            style={{ transform: `translate3d(${dragCard.x}px, ${dragCard.y}px, 0)` }}
          >
            <Card
              card={resolveCardDef(dragCard.card)}
              size="xs"
              isInteractive={false}
              currentColor={dragCard.card.currentColor}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
