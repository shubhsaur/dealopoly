import type { GameState, MaskedGameState, MaskedPlayerState } from "./types/state.js";
import type {
  SpectatorGameState,
  SpectatorPendingResolution,
} from "./types/state.js";

export function getMaskedView(state: GameState, viewerPlayerId: string): MaskedGameState {
  const maskedPlayers: Record<string, MaskedPlayerState> = {};

  for (const [playerId, player] of Object.entries(state.players)) {
    const isViewer = playerId === viewerPlayerId;
    const bankTotal = player.bank.reduce((sum, c) => sum + c.value, 0);

    maskedPlayers[playerId] = {
      id: player.id,
      name: player.name,
      isBot: player.isBot,
      handCount: player.hand.length,
      hand: isViewer ? [...player.hand] : undefined,
      bank: [...player.bank],
      bankTotal,
      propertySets: player.propertySets.map((s) => ({
        ...s,
        cards: s.cards.map((c) => {
          // Rule: Opponents cannot check hidden sides of wildcards on the table.
          if (!isViewer && c.type === "property-wild" && c.primaryColor !== "all") {
            const visibleColor = s.color;
            const displayName = visibleColor.charAt(0).toUpperCase() + visibleColor.slice(1) + " Wild Property";
            return {
              ...c,
              name: displayName,
              primaryColor: visibleColor,
              secondaryColor: undefined,
              currentColor: visibleColor,
            };
          }
          return { ...c };
        }),
      })),
    };
  }

  const discardPileTop =
    state.discardPile.length > 0
      ? state.discardPile[state.discardPile.length - 1]!
      : null;

  return {
    id: state.id,
    status: state.status,
    viewerPlayerId,
    players: maskedPlayers,
    playerOrder: [...state.playerOrder],
    turn: { ...state.turn },
    deckCount: state.deck.length,
    discardPile: [...state.discardPile],
    discardPileTop,
    pendingResolution: state.pendingResolution ? { ...state.pendingResolution } : null,
    winnerId: state.winnerId,
    history: [...state.history],
  };
}

/**
 * Reduces a full PendingResolution to its spectator-safe form, stripping any
 * card payloads that could reveal a hidden hand card to a non-player.
 */
function toSpectatorPendingResolution(
  state: GameState,
): SpectatorPendingResolution | null {
  const p = state.pendingResolution;
  if (!p) return null;

  if (p.type === "reaction_window") {
    return {
      type: "reaction_window",
      initiatorPlayerId: p.initiatorPlayerId,
      targetPlayerId: p.targetPlayerId,
      rentAmount: p.rentAmount,
      justSayNoChainCount: p.justSayNoChainCount,
      waitingForPlayerId: p.waitingForPlayerId,
      waitingForPlayerIds: p.waitingForPlayerIds,
      deadline: p.deadline,
    };
  }

  if (p.type === "payment") {
    return {
      type: "payment",
      creditorPlayerId: p.creditorPlayerId,
      debtorPlayerIds: p.debtorPlayerIds,
      amountDue: p.amountDue,
      reason: p.reason,
      paidDebtorIds: p.paidDebtorIds,
    };
  }

  // discard
  return {
    type: "discard",
    playerId: p.playerId,
    requiredDiscardCount: p.requiredDiscardCount,
  };
}

/**
 * Builds the read-only view broadcast to spectators.
 *
 * Reuses the standard player masking with the reserved `__spectator__` id (so
 * every hand is hidden and wildcard hidden sides are concealed), then layers on
 * a reduced `pendingResolution` that contains no card instances.
 */
export function getSpectatorView(state: GameState): SpectatorGameState {
  const base = getMaskedView(state, "__spectator__");
  return {
    ...base,
    viewerPlayerId: "__spectator__",
    viewerKind: "spectator",
    pendingResolution: toSpectatorPendingResolution(state),
  };
}
