"use client";

/**
 * TEMPORARY performance harness for the Your Table & Properties modal.
 * Mounted at /dev-perf — used only to profile the desktop open animation with a
 * heavy grid (14 cards / 8 sets) and deleted after the investigation.
 */

import { useEffect, useReducer, useState } from "react";
import type { CardColor, CardDefinition } from "@dealopoly/shared";
import { CARD_CATALOGUE, COLOR_CONFIG } from "@dealopoly/shared";
import type { MaskedGameState, PropertySet } from "@dealopoly/game-engine";
import { YourPropertiesModal } from "../game/_components/modals";

const SET_COLORS: CardColor[] = [
  "brown",
  "light-blue",
  "pink",
  "orange",
  "red",
  "yellow",
  "green",
  "dark-blue",
];

function firstPropertyDef(color: CardColor): CardDefinition {
  return (
    CARD_CATALOGUE.find((c) => c.type === "property" && c.primaryColor === color) ??
    CARD_CATALOGUE[0]!
  );
}

function firstWildDef(): CardDefinition {
  return CARD_CATALOGUE.find((c) => c.type === "property-wild") ?? CARD_CATALOGUE[0]!;
}

function buildSets(): PropertySet[] {
  const sets: PropertySet[] = [];
  let cardIndex = 0;
  SET_COLORS.forEach((color, i) => {
    // 6 two-card sets + 2 single wild sets = 14 cards across 8 sets
    const isWild = i >= 6;
    const cards = isWild
      ? [firstWildDef()]
      : [firstPropertyDef(color), firstPropertyDef(color)];
    sets.push({
      setId: `perf-set-${i}`,
      color: isWild ? "all" : color,
      cards: cards.map((def) => ({
        instanceId: `perf-${cardIndex++}`,
        defId: def.id,
        name: def.name,
        type: def.type,
        value: def.value,
        primaryColor: isWild ? "all" : color,
        setSize: isWild ? 0 : (COLOR_CONFIG[color]?.setSize ?? 3),
      })),
      hasHouse: false,
      hasHotel: false,
      isComplete: !isWild,
      setSize: isWild ? 0 : (COLOR_CONFIG[color]?.setSize ?? 3),
      rentTiers: isWild ? [] : (COLOR_CONFIG[color]?.rentTiers ?? []),
    });
  });
  return sets;
}

const STATIC_SETS = buildSets();

const STUB_GAME_STATE = {
  id: "perf",
  status: "in_progress",
  turn: {
    activePlayerId: "you",
    actionsRemaining: 3,
    cardsPlayedThisTurn: 0,
    turnNumber: 1,
    phase: "action",
  },
  pendingResolution: null,
} as unknown as MaskedGameState;

export default function PropertiesPerfPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [tick, forceTick] = useReducer((c: number) => c + 1, 0);

  // Mirror the real game page: bots step every ~700ms and the modal subtree re-renders
  // with a fresh object identity while the open animation is still running.
  useEffect(() => {
    const interval = setInterval(forceTick, 700);
    return () => clearInterval(interval);
  }, []);

  // Fresh object identity per render, exactly like `you` derived from a new gameState.
  const you = {
    id: "you",
    name: "Perf Player",
    hand: [],
    bankTotal: 0,
    bank: [],
    propertySets: tick % 2 === 0 ? STATIC_SETS : [...STATIC_SETS].reverse(),
  };

  return (
    <main
      style={{
        background: "#06090b",
        color: "#e7ebee",
        minHeight: "100vh",
        padding: 16,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 16, marginBottom: 8 }}>Properties modal perf probe</h1>
      <section style={{ marginBottom: 12 }}>
        <button
          type="button"
          data-open
          onClick={() => setIsOpen(true)}
          style={{ padding: "10px 18px", fontSize: 15 }}
        >
          Open modal (14 cards / 8 sets)
        </button>
      </section>

      <YourPropertiesModal
        isOpen={isOpen}
        you={you}
        isYourTurn
        gameState={STUB_GAME_STATE}
        onClose={() => setIsOpen(false)}
        onReorganizeTarget={() => {}}
        onMoveBuildingTarget={() => {}}
      />
    </main>
  );
}
