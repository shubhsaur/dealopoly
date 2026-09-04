import type {
  LeastCountGameState,
  MaskedLeastCountGameState,
  MaskedLeastCountPlayer,
} from "./types.js";

/**
 * Masks hidden information (other players' hand cards) from a specific player's view
 */
export function getMaskedLeastCountView(
  state: LeastCountGameState,
  viewerPlayerId: string,
): MaskedLeastCountGameState {
  const isRevealPhase = state.status === "round_end" || state.status === "completed";
  const maskedPlayers: Record<string, MaskedLeastCountPlayer> = {};

  for (const [playerId, player] of Object.entries(state.players)) {
    const isViewer = playerId === viewerPlayerId;
    const shouldRevealHand = isViewer || isRevealPhase;

    maskedPlayers[playerId] = {
      id: player.id,
      name: player.name,
      isBot: player.isBot,
      handCount: player.hand.length,
      hand: shouldRevealHand ? [...player.hand] : undefined,
      score: player.score,
      roundScore: player.roundScore,
      isEliminated: player.isEliminated,
    };
  }

  const discardPileTop = state.discardPile.length > 0
    ? state.discardPile[state.discardPile.length - 1]
    : undefined;

  return {
    id: state.id,
    gameType: "least_count",
    status: state.status,
    roundNumber: state.roundNumber,
    turnNumber: state.turnNumber,
    turnPhase: state.turnPhase,
    activePlayerId: state.activePlayerId,
    playerOrder: state.playerOrder,
    players: maskedPlayers,
    drawPileCount: state.drawPile.length,
    discardPileTop,
    discardPileCount: state.discardPile.length,
    lastDiscardedCards: state.lastDiscardedCards,
    showThreshold: state.showThreshold,
    maxScore: state.maxScore,
    wrongShowPenalty: state.wrongShowPenalty,
    winnerId: state.winnerId,
    lastShowResult: state.lastShowResult,
    knownDrawnCards: state.knownDrawnCards,
  };
}
