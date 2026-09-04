import type {
  LeastCountCard,
} from "./deck.js";
import { createLeastCountDeck } from "./deck.js";
import type {
  LeastCountGameState,
  LeastCountEvent,
  ShowResult,
  LeastCountConfig,
} from "./types.js";

/**
 * Calculates total point value of a hand of cards:
 * King = 0, Ace = 1, 2-10 = Face Value, J = 11, Q = 12
 */
export function calculateHandScore(cards: LeastCountCard[]): number {
  return cards.reduce((sum, c) => sum + c.points, 0);
}

/**
 * Validates whether a selection of cards is a legal discard move:
 * 1. Single card: Any 1 card.
 * 2. Pair / 2-card set: Exactly 2 cards of the exact same rank (e.g. two Kings, two 8s).
 * 3. 3-card sequence: Exactly 3 cards forming an increasing sequence in the same suit (e.g., 5-6-7 of Hearts).
 */
export function validateDiscardCombination(cards: LeastCountCard[]): { valid: boolean; reason?: string } {
  if (!cards || cards.length === 0) {
    return { valid: false, reason: "Must select at least one card to discard" };
  }

  // 1. Single card is always valid
  if (cards.length === 1) {
    return { valid: true };
  }

  // 2. Exactly 2 cards: Must be the exact same rank (e.g., two Kings or two 7s)
  if (cards.length === 2) {
    if (cards[0]!.rank === cards[1]!.rank) {
      return { valid: true };
    }
    return {
      valid: false,
      reason: "Two-card discard must be a pair of the exact same rank (e.g., two Kings or two 7s).",
    };
  }

  // 3. Exactly 3 cards: Must be an increasing sequence of the same suit (e.g., 5-6-7 of Hearts)
  if (cards.length === 3) {
    const suit = cards[0]!.suit;
    const isSameSuit = cards.every((c) => c.suit === suit);

    if (!isSameSuit) {
      return {
        valid: false,
        reason: "Three-card sequence must all belong to the same suit.",
      };
    }

    // Sort cards by rank numeric value (A=1, 2=2... 10=10, J=11, Q=12, K=13)
    const sorted = [...cards].sort((a, b) => a.rankValue - b.rankValue);
    const isConsecutive =
      sorted[0]!.rankValue + 1 === sorted[1]!.rankValue &&
      sorted[1]!.rankValue + 1 === sorted[2]!.rankValue;

    if (isConsecutive) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: "Three-card discard must be a continuous sequence in the same suit (e.g., 5-6-7 or 10-J-Q).",
    };
  }

  return {
    valid: false,
    reason: "Discards are limited to 1 card, a pair of the same rank, or a 3-card sequence in the same suit.",
  };
}

/**
 * Shuffles an array in place with a pseudorandom or Math.random generator
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const arr = [...array];
  let s = seed ?? Date.now();
  const rng = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

/**
 * Initializes a new Least Count game session.
 * - 2 players: 1 standard 52-card deck.
 * - 3 to 6 players: 2 standard decks combined (104 cards).
 */
export function createLeastCountGame(options: {
  gameId?: string;
  seed?: number;
  players: Array<{ id: string; name: string; isBot?: boolean }>;
  config?: LeastCountConfig;
}): LeastCountGameState {
  const { players, seed = Date.now(), gameId = `lc-${Date.now()}`, config } = options;

  if (players.length < 2 || players.length > 6) {
    throw new Error(`Least Count requires 2 to 6 players (provided: ${players.length})`);
  }

  const showThreshold = config?.showThreshold ?? 7;
  const maxScore = config?.maxScore ?? 200;
  const wrongShowPenalty = config?.wrongShowPenalty ?? 40;

  // Deck scaling: 1 deck for 2 players, 2 decks for 3-6 players
  let deck = shuffleArray(createLeastCountDeck(players.length), seed);
  const playerStates: Record<string, any> = {};
  const playerOrder = players.map((p) => p.id);

  // Deal 5 cards to each player
  for (const p of players) {
    const hand = deck.slice(0, 5);
    deck = deck.slice(5);

    playerStates[p.id] = {
      id: p.id,
      name: p.name,
      isBot: Boolean(p.isBot),
      hand,
      score: 0,
      roundScore: calculateHandScore(hand),
      isEliminated: false,
    };
  }

  // Game starts with an empty discard pile. The first player must discard a card.
  const discardPile: LeastCountCard[] = [];

  return {
    id: gameId,
    gameType: "least_count",
    status: "in_progress",
    roundNumber: 1,
    turnNumber: 1,
    turnPhase: "draw",
    activePlayerId: playerOrder[0]!,
    playerOrder,
    players: playerStates,
    drawPile: deck,
    discardPile,
    lastDiscardedCards: [],
    showThreshold,
    maxScore,
    wrongShowPenalty,
    knownDrawnCards: {},
  };
}

/**
 * Handles discarding cards on player's turn
 */
export function handleDiscardCards(
  state: LeastCountGameState,
  playerId: string,
  cardInstanceIds: string[],
): { state: LeastCountGameState; events: LeastCountEvent[] } {
  if (state.status !== "in_progress") {
    throw new Error("Game is not in progress");
  }
  if (state.activePlayerId !== playerId) {
    throw new Error("It is not your turn");
  }
  if (state.turnPhase !== "discard") {
    throw new Error("You have already discarded; you must draw a card to complete your turn");
  }

  const player = state.players[playerId];
  if (!player) throw new Error("Player not found");

  const cardsToDiscard = player.hand.filter((c) => cardInstanceIds.includes(c.instanceId));
  if (cardsToDiscard.length !== cardInstanceIds.length) {
    throw new Error("One or more selected cards are not in your hand");
  }

  const validation = validateDiscardCombination(cardsToDiscard);
  if (!validation.valid) {
    throw new Error(validation.reason || "Invalid discard combination");
  }

  // Remove from hand and push to discard pile
  const nextHand = player.hand.filter((c) => !cardInstanceIds.includes(c.instanceId));
  const nextDiscardPile = [...state.discardPile, ...cardsToDiscard];

  const nextPlayer = {
    ...player,
    hand: nextHand,
    roundScore: calculateHandScore(nextHand),
  };

  // Advance turn to next active (non-eliminated) player
  const activePlayers = state.playerOrder.filter((id) => !state.players[id]?.isEliminated);
  const currentIndex = activePlayers.indexOf(playerId);
  const nextPlayerId = activePlayers[(currentIndex + 1) % activePlayers.length]!;

  const currentKnown = state.knownDrawnCards?.[playerId] || [];
  const updatedKnownForPlayer = currentKnown.filter(
    (c) => !cardInstanceIds.includes(c.instanceId),
  );
  const nextKnownDrawnCards = {
    ...(state.knownDrawnCards || {}),
    [playerId]: updatedKnownForPlayer,
  };

  const nextState: LeastCountGameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: nextPlayer,
    },
    discardPile: nextDiscardPile,
    lastDiscardedCards: cardsToDiscard,
    turnPhase: "draw",
    turnNumber: state.turnNumber + 1,
    activePlayerId: nextPlayerId,
    knownDrawnCards: nextKnownDrawnCards,
  };

  const discardNames = cardsToDiscard.map((c) => `${c.rank}${c.suit.charAt(0).toUpperCase()}`).join(", ");
  const events: LeastCountEvent[] = [
    {
      id: `evt-${Date.now()}-1`,
      type: "cards_discarded",
      playerId,
      timestamp: Date.now(),
      message: `${player.name} discarded ${cardsToDiscard.length} card(s): [${discardNames}]`,
      payload: { cards: cardsToDiscard },
    },
  ];

  return { state: nextState, events };
}

/**
 * Handles drawing a card from draw pile or top of discard pile
 */
export function handleDrawCard(
  state: LeastCountGameState,
  playerId: string,
  source: "deck" | "discard",
): { state: LeastCountGameState; events: LeastCountEvent[] } {
  if (state.status !== "in_progress") {
    throw new Error("Game is not in progress");
  }
  if (state.activePlayerId !== playerId) {
    throw new Error("It is not your turn");
  }
  if (state.turnPhase !== "draw") {
    throw new Error("You must discard cards before drawing");
  }

  const player = state.players[playerId];
  if (!player) throw new Error("Player not found");

  let nextDrawPile = [...state.drawPile];
  let nextDiscardPile = [...state.discardPile];
  let drawnCard: LeastCountCard | undefined;
  const events: LeastCountEvent[] = [];

  if (source === "discard") {
    if (nextDiscardPile.length === 0) {
      throw new Error("Discard pile is empty");
    }
    drawnCard = nextDiscardPile.pop()!;
  } else {
    // Draw from closed draw pile
    if (nextDrawPile.length === 0) {
      // Reshuffle discard pile except the top cards
      if (nextDiscardPile.length <= 1) {
        throw new Error("No cards available to draw");
      }
      const topCards = nextDiscardPile.slice(-state.lastDiscardedCards.length);
      const toShuffle = nextDiscardPile.slice(0, -state.lastDiscardedCards.length);
      nextDrawPile = shuffleArray(toShuffle);
      nextDiscardPile = topCards;

      events.push({
        id: `evt-${Date.now()}-reshuffle`,
        type: "deck_reshuffled",
        timestamp: Date.now(),
        message: "Draw pile was empty. Discard pile reshuffled into new draw pile.",
      });
    }
    drawnCard = nextDrawPile.shift()!;
  }

  const nextHand = [...player.hand, drawnCard];
  const nextPlayer = {
    ...player,
    hand: nextHand,
    roundScore: calculateHandScore(nextHand),
  };

  const currentKnown = state.knownDrawnCards?.[playerId] || [];
  const nextKnownDrawnCards = {
    ...(state.knownDrawnCards || {}),
    [playerId]: source === "discard" && drawnCard ? [...currentKnown, drawnCard] : currentKnown,
  };

  const nextState: LeastCountGameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: nextPlayer,
    },
    drawPile: nextDrawPile,
    discardPile: nextDiscardPile,
    turnPhase: "discard",
    knownDrawnCards: nextKnownDrawnCards,
  };

  events.push({
    id: `evt-${Date.now()}-draw`,
    type: "card_drawn",
    playerId,
    timestamp: Date.now(),
    message: `${player.name} drew 1 card from ${source === "discard" ? "discard pile" : "closed deck"}`,
  });

  return { state: nextState, events };
}

/**
 * Handles Declaring "Show"
 */
export function handleDeclareShow(
  state: LeastCountGameState,
  playerId: string,
): { state: LeastCountGameState; events: LeastCountEvent[] } {
  if (state.status !== "in_progress") {
    throw new Error("Game is not in progress");
  }
  if (state.activePlayerId !== playerId) {
    throw new Error("You can only declare Show on your turn");
  }
  if (state.turnPhase !== "draw") {
    throw new Error("You can only declare Show at the beginning of your turn before drawing");
  }

  const caller = state.players[playerId];
  if (!caller) throw new Error("Caller not found");

  const callerScore = calculateHandScore(caller.hand);
  if (callerScore > state.showThreshold) {
    throw new Error(
      `Cannot declare Show with ${callerScore} points. Total points must be ${state.showThreshold} or less.`,
    );
  }

  // Calculate scores for all active players
  const activePlayerIds = state.playerOrder.filter((id) => !state.players[id]?.isEliminated);
  const playerScores: Record<string, { handScore: number; penaltyAdded: number; totalScore: number }> = {};

  let minScore = Infinity;
  let minPlayerId = playerId;

  for (const pid of activePlayerIds) {
    const p = state.players[pid]!;
    const hScore = calculateHandScore(p.hand);
    if (hScore < minScore) {
      minScore = hScore;
      minPlayerId = pid;
    }
  }

  // Check if caller was successfully lowest OR if someone matched/beat them (wrong show)
  const isSuccessful = minPlayerId === playerId && activePlayerIds.filter((pid) => pid !== playerId).every((pid) => calculateHandScore(state.players[pid]!.hand) > callerScore);

  const updatedPlayers: Record<string, any> = {};

  for (const pid of state.playerOrder) {
    const p = state.players[pid]!;
    if (p.isEliminated) {
      updatedPlayers[pid] = { ...p };
      continue;
    }

    const hScore = calculateHandScore(p.hand);
    let penalty = 0;

    if (isSuccessful) {
      // Caller gets 0, everyone else gets their hand score
      penalty = pid === playerId ? 0 : hScore;
    } else {
      // Wrong Show / Countered!
      if (pid === playerId) {
        penalty = hScore + state.wrongShowPenalty;
      } else if (pid === minPlayerId) {
        penalty = 0; // Lowest opponent gets 0
      } else {
        penalty = hScore;
      }
    }

    const newScore = p.score + penalty;
    const isEliminated = newScore > state.maxScore;

    playerScores[pid] = {
      handScore: hScore,
      penaltyAdded: penalty,
      totalScore: newScore,
    };

    updatedPlayers[pid] = {
      ...p,
      score: newScore,
      roundScore: hScore,
      isEliminated,
    };
  }

  // Check for game over (any player crosses maxScore)
  const anyPlayerEliminated = state.playerOrder.some((id) => updatedPlayers[id]?.isEliminated);
  let isGameCompleted = false;
  let overallWinnerId: string | undefined;

  if (anyPlayerEliminated) {
    isGameCompleted = true;
    // Find player with the lowest score
    let lowestScore = Infinity;
    for (const pid of state.playerOrder) {
      if (updatedPlayers[pid]!.score < lowestScore) {
        lowestScore = updatedPlayers[pid]!.score;
        overallWinnerId = pid;
      }
    }
  }

  const showResult: ShowResult = {
    callerPlayerId: playerId,
    callerScore,
    isSuccessful,
    lowestScore: minScore,
    winnerPlayerId: isSuccessful ? playerId : minPlayerId,
    playerScores,
  };

  const nextState: LeastCountGameState = {
    ...state,
    status: isGameCompleted ? "completed" : "round_end",
    turnPhase: "round_end",
    players: updatedPlayers,
    winnerId: overallWinnerId,
    lastShowResult: showResult,
  };

  const winnerName = state.players[showResult.winnerPlayerId]?.name || "Winner";
  const events: LeastCountEvent[] = [
    {
      id: `evt-${Date.now()}-show`,
      type: "show_declared",
      playerId,
      timestamp: Date.now(),
      message: isSuccessful
        ? `${caller.name} declared SHOW with ${callerScore} points and WON the round!`
        : `${caller.name} declared SHOW with ${callerScore} points but was COUNTERED by ${winnerName} (${minScore} pts)! +${state.wrongShowPenalty} penalty!`,
      payload: { showResult },
    },
  ];

  if (isGameCompleted) {
    events.push({
      id: `evt-${Date.now()}-gameover`,
      type: "game_completed",
      playerId: overallWinnerId,
      timestamp: Date.now(),
      message: `Game over! ${state.players[overallWinnerId!]?.name} won the match!`,
    });
  }

  return { state: nextState, events };
}

/**
 * Starts next round in match
 */
export function handleStartNextRound(
  state: LeastCountGameState,
  playerId: string,
): { state: LeastCountGameState; events: LeastCountEvent[] } {
  if (state.status !== "round_end") {
    throw new Error("Game is not in round_end state");
  }

  const anyPlayerEliminated = state.playerOrder.some((id) => state.players[id]?.isEliminated);
  if (anyPlayerEliminated) {
    throw new Error("Game is already completed");
  }

  let deck = shuffleArray(createLeastCountDeck(state.playerOrder.length), Date.now());
  const updatedPlayers: Record<string, any> = {};

  for (const pid of state.playerOrder) {
    const p = state.players[pid]!;
    if (p.isEliminated) {
      updatedPlayers[pid] = { ...p, hand: [] };
      continue;
    }

    const hand = deck.slice(0, 5);
    deck = deck.slice(5);

    updatedPlayers[pid] = {
      ...p,
      hand,
      roundScore: calculateHandScore(hand),
    };
  }

  const nextRoundNumber = state.roundNumber + 1;

  const nextState: LeastCountGameState = {
    ...state,
    status: "in_progress",
    roundNumber: nextRoundNumber,
    turnNumber: 1,
    turnPhase: "draw",
    activePlayerId: state.lastShowResult?.winnerPlayerId && !state.players[state.lastShowResult.winnerPlayerId]?.isEliminated
      ? state.lastShowResult.winnerPlayerId
      : state.playerOrder.filter(id => !state.players[id]?.isEliminated)[0]!,
    players: updatedPlayers,
    drawPile: deck,
    discardPile: [],
    lastDiscardedCards: [],
    lastShowResult: undefined,
    knownDrawnCards: {},
  };

  const events: LeastCountEvent[] = [
    {
      id: `evt-${Date.now()}-round-start`,
      type: "next_round_started",
      timestamp: Date.now(),
      message: `Round ${nextRoundNumber} started!`,
    },
  ];

  return { state: nextState, events };
}
