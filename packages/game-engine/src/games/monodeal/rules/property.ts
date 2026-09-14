import type { CardColor } from "@dealopoly/shared";
import { COLOR_CONFIG } from "@dealopoly/shared";
import type { GameState, PropertySet, CardInstance } from "../types/state.js";
import { GameEngineError } from "../types/errors.js";
import type { PropertyPlayedEvent, WildReorganizedEvent, BuildingMovedEvent } from "../types/events.js";

export function createNewPropertySet(color: CardColor, firstCard: CardInstance): PropertySet {
  const config = COLOR_CONFIG[color];
  if (!config || color === "all") {
    throw new GameEngineError("INVALID_PROPERTY_COLOR", `Invalid property color: ${color}`);
  }

  const set: PropertySet = {
    setId: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${color}`,
    color,
    cards: [firstCard],
    hasHouse: false,
    hasHotel: false,
    isComplete: config.setSize === 1,
    setSize: config.setSize,
    rentTiers: config.rentTiers,
  };

  return set;
}

export function validateWildColor(card: CardInstance, chosenColor: CardColor): void {
  if (chosenColor === "all") {
    throw new GameEngineError("INVALID_WILD_COLOR", "Wild card cannot have color 'all'");
  }

  if (card.primaryColor === "all") {
    // Multicolor wild can be any standard color
    return;
  }

  if (card.primaryColor !== chosenColor && card.secondaryColor !== chosenColor) {
    throw new GameEngineError(
      "INVALID_WILD_COLOR",
      `Wild card cannot be used as ${chosenColor}. Valid colors: ${card.primaryColor}, ${card.secondaryColor}`,
    );
  }
}

export function playPropertyCard(
  state: GameState,
  playerId: string,
  cardInstanceId: string,
  targetSetId?: string,
  chosenColor?: CardColor,
): { nextState: GameState; events: PropertyPlayedEvent[] } {
  const player = state.players[playerId];
  if (!player) {
    throw new GameEngineError("NOT_YOUR_TURN", "Player not found");
  }

  const cardIndex = player.hand.findIndex((c) => c.instanceId === cardInstanceId);
  if (cardIndex === -1) {
    throw new GameEngineError("CARD_NOT_IN_HAND", "Card is not in player's hand");
  }

  const card = player.hand[cardIndex]!;
  if (card.type !== "property" && card.type !== "property-wild") {
    throw new GameEngineError("INVALID_CARD_TYPE", `Cannot play ${card.type} as a property`);
  }

  // Determine property color
  let assignedColor: CardColor;
  if (card.type === "property") {
    if (!card.primaryColor) {
      throw new GameEngineError("INVALID_PROPERTY_COLOR", "Property card missing primary color");
    }
    assignedColor = card.primaryColor;
  } else {
    // Wild card
    if (!chosenColor) {
      throw new GameEngineError("INVALID_WILD_COLOR", "Must specify chosen color for wild card");
    }
    validateWildColor(card, chosenColor);
    assignedColor = chosenColor;
  }

  const cardWithColor: CardInstance = {
    ...card,
    currentColor: assignedColor,
  };

  const remainingHand = player.hand.filter((_, idx) => idx !== cardIndex);
  const updatedSets = [...player.propertySets];
  let targetSet: PropertySet;
  let isNewSet = false;

  let effectiveTargetSetId = targetSetId;
  if (!effectiveTargetSetId) {
    // Automatically find an existing incomplete property set of the same color
    const matchingIncomplete = updatedSets.find(
      (s) => s.color === assignedColor && !s.isComplete,
    );
    if (matchingIncomplete) {
      effectiveTargetSetId = matchingIncomplete.setId;
    }
  }

  if (effectiveTargetSetId) {
    const existingIndex = updatedSets.findIndex((s) => s.setId === effectiveTargetSetId);
    if (existingIndex === -1) {
      throw new GameEngineError("PROPERTY_SET_NOT_FOUND", "Specified property set not found");
    }

    const existingSet = updatedSets[existingIndex]!;
    if (existingSet.color !== assignedColor) {
      throw new GameEngineError(
        "INVALID_PROPERTY_COLOR",
        `Set color mismatch: set is ${existingSet.color}, card is ${assignedColor}`,
      );
    }
    if (existingSet.isComplete) {
      throw new GameEngineError("CANNOT_ADD_TO_COMPLETED_SET", "Cannot add card to an already completed set");
    }

    const newCards = [...existingSet.cards, cardWithColor];
    targetSet = {
      ...existingSet,
      cards: newCards,
      isComplete: newCards.length >= existingSet.setSize,
    };
    updatedSets[existingIndex] = targetSet;
  } else {
    // Create new set (for standard property cards AND wild cards)
    targetSet = createNewPropertySet(assignedColor, cardWithColor);
    updatedSets.push(targetSet);
    isNewSet = true;
  }

  const event: PropertyPlayedEvent = {
    id: `event-${Date.now()}-prop`,
    timestamp: Date.now(),
    type: "property_played",
    playerId,
    card: cardWithColor,
    targetSetId: targetSet.setId,
    color: assignedColor,
    isNewSet,
    setCompleted: targetSet.isComplete,
    message: `${player.name} played ${card.name} into ${assignedColor} set${targetSet.isComplete ? " (Completed Set!)" : ""}.`,
  };

  const nextState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: remainingHand,
        propertySets: updatedSets,
      },
    },
    turn: {
      ...state.turn,
      actionsRemaining: state.turn.actionsRemaining - 1,
      cardsPlayedThisTurn: state.turn.cardsPlayedThisTurn + 1,
    },
    history: [...state.history, event],
  };

  return { nextState, events: [event] };
}

export function reorganizeWildCard(
  state: GameState,
  playerId: string,
  cardInstanceId: string,
  fromSetId: string,
  toSetId?: string,
  newColor?: CardColor,
): { nextState: GameState; events: WildReorganizedEvent[] } {
  const player = state.players[playerId];
  if (!player) {
    throw new GameEngineError("NOT_YOUR_TURN", "Player not found");
  }

  if (state.turn.activePlayerId !== playerId) {
    throw new GameEngineError("NOT_YOUR_TURN", "Can only reorganize property sets during your own turn");
  }

  if (state.turn.phase !== "action") {
    throw new GameEngineError("MUST_DRAW_FIRST", "Must draw cards before reorganizing property sets");
  }

  if (state.pendingResolution) {
    throw new GameEngineError("MUST_RESOLVE_PENDING_ACTION", "Cannot reorganize properties while an action/payment is pending resolution");
  }

  const fromSetIndex = player.propertySets.findIndex((s) => s.setId === fromSetId);
  if (fromSetIndex === -1) {
    throw new GameEngineError("PROPERTY_SET_NOT_FOUND", "Source property set not found");
  }

  const fromSet = player.propertySets[fromSetIndex]!;
  const cardIndex = fromSet.cards.findIndex((c) => c.instanceId === cardInstanceId);
  if (cardIndex === -1) {
    throw new GameEngineError("CARD_NOT_IN_SET", "Wild card not found in source property set");
  }

  const card = fromSet.cards[cardIndex]!;
  if (card.type !== "property-wild") {
    throw new GameEngineError("INVALID_CARD_TYPE", "Only wild cards can be reorganized");
  }

  if (!newColor) {
    throw new GameEngineError("INVALID_WILD_COLOR", "Must provide new color for wild card");
  }

  validateWildColor(card, newColor);

  // House and Hotel completion rule: Houses and Hotels strictly require fully completed base sets.
  // If the fromSet has a House or Hotel, removing a card cannot cause the set's property cards to drop below setSize.
  if (fromSet.hasHouse || fromSet.hasHotel) {
    const remainingCardsCount = fromSet.cards.length - 1;
    if (remainingCardsCount < fromSet.setSize) {
      throw new GameEngineError(
        "CANNOT_BREAK_SET_WITH_BUILDINGS",
        "Cannot move a card away from a completed set that has a House or Hotel. Buildings strictly require a fully completed set.",
      );
    }
  }

  const updatedCard: CardInstance = {
    ...card,
    currentColor: newColor,
  };

  // Remove card from source set
  const fromSetRemainingCards = fromSet.cards.filter((_, idx) => idx !== cardIndex);
  let updatedSets = [...player.propertySets];

  if (fromSetRemainingCards.length === 0 && !fromSet.hasHouse && !fromSet.hasHotel) {
    // Delete empty set if no cards and no buildings attached
    updatedSets = updatedSets.filter((_, idx) => idx !== fromSetIndex);
  } else {
    updatedSets[fromSetIndex] = {
      ...fromSet,
      cards: fromSetRemainingCards,
      isComplete: fromSetRemainingCards.length >= fromSet.setSize,
      hasHouse: fromSet.hasHouse,
      hasHotel: fromSet.hasHotel,
      houseCard: fromSet.houseCard,
      hotelCard: fromSet.hotelCard,
    };
  }

  let effectiveToSetId = toSetId;
  let targetSet: PropertySet;

  if (effectiveToSetId) {
    if (effectiveToSetId === fromSetId) {
      throw new GameEngineError("INVALID_ACTION_TARGET", "Cannot move card to the same set");
    }

    const toSetIndex = updatedSets.findIndex((s) => s.setId === effectiveToSetId);
    if (toSetIndex === -1) {
      throw new GameEngineError("PROPERTY_SET_NOT_FOUND", "Destination property set not found");
    }

    const toSet = updatedSets[toSetIndex]!;
    if (toSet.color !== newColor) {
      throw new GameEngineError(
        "INVALID_PROPERTY_COLOR",
        `Target set color mismatch: set is ${toSet.color}, wild changed to ${newColor}`,
      );
    }
    if (toSet.isComplete) {
      throw new GameEngineError("CANNOT_ADD_TO_COMPLETED_SET", "Cannot add card to an already completed set");
    }

    const newCards = [...toSet.cards, updatedCard];
    targetSet = {
      ...toSet,
      cards: newCards,
      isComplete: newCards.length >= toSet.setSize,
    };
    updatedSets[toSetIndex] = targetSet;
  } else {
    // Automatically find an existing incomplete property set of newColor (excluding source set), or create a new set
    const matchingIncompleteIndex = updatedSets.findIndex(
      (s) => s.color === newColor && !s.isComplete && s.setId !== fromSetId,
    );
    if (matchingIncompleteIndex !== -1) {
      const existingSet = updatedSets[matchingIncompleteIndex]!;
      const newCards = [...existingSet.cards, updatedCard];
      targetSet = {
        ...existingSet,
        cards: newCards,
        isComplete: newCards.length >= existingSet.setSize,
      };
      updatedSets[matchingIncompleteIndex] = targetSet;
    } else {
      // Create a new set for this color starting with the wildcard!
      targetSet = createNewPropertySet(newColor, updatedCard);
      updatedSets.push(targetSet);
    }
  }

  const event: WildReorganizedEvent = {
    id: `event-${Date.now()}-reorg`,
    timestamp: Date.now(),
    type: "wild_reorganized",
    playerId,
    card: updatedCard,
    fromSetId,
    toSetId: targetSet.setId,
    newColor,
    message: `${player.name} shifted wild card ${card.name} into ${newColor} set.`,
  };

  const nextState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        propertySets: updatedSets,
      },
    },
    history: [...state.history, event],
  };

  return { nextState, events: [event] };
}

export function moveBuilding(
  state: GameState,
  playerId: string,
  buildingType: "house" | "hotel",
  fromSetId: string,
  toSetId: string,
): { nextState: GameState; events: BuildingMovedEvent[] } {
  const player = state.players[playerId];
  if (!player) {
    throw new GameEngineError("NOT_YOUR_TURN", "Player not found");
  }

  if (state.turn.activePlayerId !== playerId) {
    throw new GameEngineError("NOT_YOUR_TURN", "Can only move buildings during your own turn");
  }

  if (state.turn.phase !== "action") {
    throw new GameEngineError("MUST_DRAW_FIRST", "Must draw cards before moving buildings");
  }

  if (state.pendingResolution) {
    throw new GameEngineError("MUST_RESOLVE_PENDING_ACTION", "Cannot move buildings while an action/payment is pending resolution");
  }

  if (fromSetId === toSetId) {
    throw new GameEngineError("INVALID_ACTION_TARGET", "Source and destination property sets must be different");
  }

  const fromSetIndex = player.propertySets.findIndex((s) => s.setId === fromSetId);
  if (fromSetIndex === -1) {
    throw new GameEngineError("PROPERTY_SET_NOT_FOUND", "Source property set not found");
  }
  const fromSet = player.propertySets[fromSetIndex]!;

  const toSetIndex = player.propertySets.findIndex((s) => s.setId === toSetId);
  if (toSetIndex === -1) {
    throw new GameEngineError("PROPERTY_SET_NOT_FOUND", "Destination property set not found");
  }
  const toSet = player.propertySets[toSetIndex]!;

  if (toSet.color === "railroad" || toSet.color === "utility") {
    throw new GameEngineError("CANNOT_ADD_BUILDING_TO_SPECIAL_SET", "Cannot add buildings to Railroad or Utility sets");
  }

  if (!toSet.isComplete) {
    throw new GameEngineError("HOUSE_REQUIRES_FULL_SET", "Destination property set must be a complete set");
  }

  let movedCard: CardInstance;
  let updatedFromSet: PropertySet;
  let updatedToSet: PropertySet;

  if (buildingType === "house") {
    if (!fromSet.hasHouse || !fromSet.houseCard) {
      throw new GameEngineError("CARD_NOT_IN_SET", "Source set does not have a House to move");
    }
    if (fromSet.hasHotel) {
      throw new GameEngineError(
        "CANNOT_BREAK_SET_WITH_BUILDINGS",
        "Cannot move House while a Hotel is present on the set. A Hotel strictly requires a House.",
      );
    }
    if (toSet.hasHouse) {
      throw new GameEngineError("HOUSE_REQUIRES_FULL_SET", "Destination property set already has a House");
    }

    movedCard = fromSet.houseCard;
    updatedFromSet = {
      ...fromSet,
      hasHouse: false,
      houseCard: undefined,
    };
    updatedToSet = {
      ...toSet,
      hasHouse: true,
      houseCard: movedCard,
    };
  } else {
    // Hotel
    if (!fromSet.hasHotel || !fromSet.hotelCard) {
      throw new GameEngineError("CARD_NOT_IN_SET", "Source set does not have a Hotel to move");
    }
    if (!toSet.hasHouse) {
      throw new GameEngineError("HOTEL_REQUIRES_HOUSE", "Destination property set must have a House before a Hotel can be added");
    }
    if (toSet.hasHotel) {
      throw new GameEngineError("HOTEL_REQUIRES_HOUSE", "Destination property set already has a Hotel");
    }

    movedCard = fromSet.hotelCard;
    updatedFromSet = {
      ...fromSet,
      hasHotel: false,
      hotelCard: undefined,
    };
    updatedToSet = {
      ...toSet,
      hasHotel: true,
      hotelCard: movedCard,
    };
  }

  const updatedSets = [...player.propertySets];
  updatedSets[fromSetIndex] = updatedFromSet;
  updatedSets[toSetIndex] = updatedToSet;

  const event: BuildingMovedEvent = {
    id: `event-${Date.now()}-move-building`,
    timestamp: Date.now(),
    type: "building_moved",
    playerId,
    buildingType,
    card: movedCard,
    fromSetId,
    toSetId,
    fromColor: fromSet.color,
    toColor: toSet.color,
    message: `${player.name} moved ${buildingType === "house" ? "House" : "Hotel"} from ${fromSet.color} set to ${toSet.color} set.`,
  };

  const nextState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        propertySets: updatedSets,
      },
    },
    history: [...state.history, event],
  };

  return { nextState, events: [event] };
}
