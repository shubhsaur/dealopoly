import type { GameState, CardInstance, PropertySet, ReactionResolution } from "../types/state.js";
import { GameEngineError } from "../types/errors.js";
import type { PaymentSubmittedEvent, ReactionSubmittedEvent, PaymentCompletedEvent, GameEvent } from "../types/events.js";
import { createNewPropertySet } from "./property.js";
import { COLOR_CONFIG } from "@dealopoly/shared";

export function getPlayerTableAssets(player: {
  bank: CardInstance[];
  propertySets: PropertySet[];
}): CardInstance[] {
  const assets: CardInstance[] = [...player.bank];
  for (const set of player.propertySets) {
    assets.push(...set.cards);
    if (set.houseCard) assets.push(set.houseCard);
    if (set.hotelCard) assets.push(set.hotelCard);
  }
  return assets.filter((c) => c.value > 0);
}

export function calculateTotalAssetValue(cards: CardInstance[]): number {
  return cards.reduce((sum, c) => sum + c.value, 0);
}

export function handlePayment(
  state: GameState,
  debtorPlayerId: string,
  paymentCardInstanceIds: string[],
  justSayNoCardInstanceId?: string,
): { nextState: GameState; events: GameEvent[] } {
  if (!state.pendingResolution || state.pendingResolution.type !== "payment") {
    throw new GameEngineError("MUST_RESOLVE_PENDING_ACTION", "No active payment resolution");
  }

  const payment = state.pendingResolution;
  const allDebtorIds =
    payment.debtorPlayerIds && payment.debtorPlayerIds.length > 0
      ? payment.debtorPlayerIds
      : [payment.debtorPlayerId, ...payment.remainingDebtors];

  // Concurrent mode: reject if this debtor already paid
  const paidDebtorIds = payment.paidDebtorIds || [];
  if (paidDebtorIds.includes(debtorPlayerId)) {
    throw new GameEngineError(
      "ALREADY_PAID",
      `${debtorPlayerId} has already submitted payment`,
    );
  }

  if (!allDebtorIds.includes(debtorPlayerId)) {
    throw new GameEngineError(
      "NOT_WAITING_FOR_YOUR_PAYMENT",
      `Payment is not expected from ${debtorPlayerId}`,
    );
  }

  const debtor = state.players[debtorPlayerId];
  const creditor = state.players[payment.creditorPlayerId];
  if (!debtor || !creditor) {
    throw new GameEngineError("TARGET_PLAYER_NOT_FOUND", "Debtor or creditor player not found");
  }

  // ==========================================
  // Handle Just Say No refusal
  // ==========================================
  if (justSayNoCardInstanceId) {
    const jsnIndex = debtor.hand.findIndex((c) => c.instanceId === justSayNoCardInstanceId);
    if (jsnIndex === -1) {
      throw new GameEngineError("CARD_NOT_IN_HAND", "Just Say No card is not in debtor's hand");
    }
    const jsnCard = debtor.hand[jsnIndex]!;
    if (jsnCard.defId !== "action-just-say-no") {
      throw new GameEngineError("INVALID_ACTION_TARGET", "Specified card is not a Just Say No card");
    }

    const updatedHand = debtor.hand.filter((c) => c.instanceId !== justSayNoCardInstanceId);

    const jsnEvent: ReactionSubmittedEvent = {
      id: `event-${Date.now()}-jsn`,
      timestamp: Date.now(),
      type: "reaction_submitted",
      playerId: debtor.id,
      passed: false,
      justSayNoCard: jsnCard,
      message: `${debtor.name} played JUST SAY NO to refuse payment for ${payment.actionCard?.name ?? payment.reason}!`,
    };

    // Create JSN sub-resolution inline (1v1 between debtor and creditor)
    // Other debtors can still pay concurrently while this resolves
    const jsnSub: ReactionResolution = {
      type: "reaction_window",
      initiatorPlayerId: debtor.id,
      targetPlayerId: payment.creditorPlayerId,
      actionCard: payment.actionCard ?? {
        instanceId: "inst-payment",
        defId: "payment-obligation",
        name: payment.reason,
        type: "action",
        value: 0,
      },
      rentAmount: payment.amountDue,
      waitingForPlayerId: payment.creditorPlayerId,
      justSayNoChainCount: 1,
      isCancelled: false,
      deadline: Date.now() + 7000,
      durationMs: 7000,
      canExtend: true,
    };

    const nextState: GameState = {
      ...state,
      players: {
        ...state.players,
        [debtor.id]: {
          ...debtor,
          hand: updatedHand,
        },
      },
      discardPile: [...state.discardPile, jsnCard],
      pendingResolution: {
        ...payment,
        jsnSubResolution: jsnSub,
      },
      history: [...state.history, jsnEvent],
    };

    return { nextState, events: [jsnEvent] };
  }

  // ==========================================
  // Process actual payment
  // ==========================================
  const tableAssets = getPlayerTableAssets(debtor);
  const totalTableValue = calculateTotalAssetValue(tableAssets);

  // Validate submitted payment cards are on the table
  const paidCards: CardInstance[] = [];
  for (const id of paymentCardInstanceIds) {
    const card = tableAssets.find((c) => c.instanceId === id);
    if (!card) {
      throw new GameEngineError(
        "CARD_NOT_IN_SET",
        `Card ${id} is not on debtor's table (hand cards cannot be used for payment)`,
      );
    }
    paidCards.push(card);
  }

  const paidValue = calculateTotalAssetValue(paidCards);

  // If debtor has enough assets to cover the debt, paidValue must be >= amountDue
  if (totalTableValue >= payment.amountDue) {
    if (paidValue < payment.amountDue) {
      throw new GameEngineError(
        "INSUFFICIENT_PAYMENT",
        `Selected cards value ($${paidValue}M) is less than amount due ($${payment.amountDue}M)`,
      );
    }
  } else {
    // If total assets < amountDue, debtor must surrender ALL table assets
    if (paidCards.length !== tableAssets.length) {
      throw new GameEngineError(
        "INSUFFICIENT_PAYMENT",
        `Debtor has insufficient assets ($${totalTableValue}M < $${payment.amountDue}M) and must surrender all cards on table.`,
      );
    }
  }

  // Remove paid cards from debtor's bank and properties
  const paidIds = new Set(paymentCardInstanceIds);
  const debtorRemainingBank = debtor.bank.filter((c) => !paidIds.has(c.instanceId));
  const debtorRemainingSets = debtor.propertySets
    .map((s) => {
      const remainingCards = s.cards.filter((c) => !paidIds.has(c.instanceId));
      const keptHouseCard = s.houseCard && !paidIds.has(s.houseCard.instanceId) ? s.houseCard : undefined;
      const keptHotelCard = s.hotelCard && !paidIds.has(s.hotelCard.instanceId) ? s.hotelCard : undefined;
      if (remainingCards.length === 0 && !keptHouseCard && !keptHotelCard) return null;
      return {
        ...s,
        cards: remainingCards,
        isComplete: remainingCards.length >= s.setSize,
        hasHouse: !!keptHouseCard,
        hasHotel: !!keptHotelCard,
        houseCard: keptHouseCard,
        hotelCard: keptHotelCard,
      };
    })
    .filter(Boolean) as PropertySet[];

  // Transfer cards to creditor
  const transferredToBank: CardInstance[] = [];
  const transferredProperties: CardInstance[] = [];

  for (const card of paidCards) {
    if (card.type === "property" || card.type === "property-wild") {
      transferredProperties.push(card);
    } else {
      transferredToBank.push(card);
    }
  }

  const creditorNewBank = [...creditor.bank, ...transferredToBank];
  const creditorNewSets = [...creditor.propertySets];

  for (const pCard of transferredProperties) {
    const color = pCard.currentColor ?? pCard.primaryColor ?? "brown";
    const matchingIdx = creditorNewSets.findIndex((s) => s.color === color && !s.isComplete);

    if (matchingIdx !== -1) {
      const targetSet = creditorNewSets[matchingIdx]!;
      const newCards = [...targetSet.cards, pCard];
      const config = COLOR_CONFIG[color];
      const setSize = config?.setSize ?? targetSet.setSize;
      creditorNewSets[matchingIdx] = {
        ...targetSet,
        cards: newCards,
        isComplete: newCards.length >= setSize,
        setSize,
        rentTiers: config?.rentTiers ?? targetSet.rentTiers,
      };
    } else {
      creditorNewSets.push(createNewPropertySet(color, pCard));
    }
  }

  const paymentEvent: PaymentSubmittedEvent = {
    id: `event-${Date.now()}-payment`,
    timestamp: Date.now(),
    type: "payment_submitted",
    creditorPlayerId: creditor.id,
    debtorPlayerId: debtor.id,
    paidCards,
    totalValue: paidValue,
    amountDue: payment.amountDue,
    message: `${debtor.name} paid $${paidValue}M to ${creditor.name} (${paidCards.length} cards).`,
  };

  // Mark this debtor as paid
  const newPaidDebtorIds = [...paidDebtorIds, debtorPlayerId];
  const remainingDebtors = allDebtorIds.filter((id) => !newPaidDebtorIds.includes(id));

  // Track this payment in the collection summary
  const currentPayment = {
    debtorPlayerId: debtor.id,
    paidCards,
    totalValue: paidValue,
    blockedByJsn: false,
  };
  const collectedPayments = [...(payment.collectedPayments || []), currentPayment];

  // Determine next pending resolution
  let nextPending: GameState["pendingResolution"] = null;
  const extraEvents: GameEvent[] = [];

  if (remainingDebtors.length > 0) {
    // Still waiting for other debtors to pay — keep payment active
    nextPending = {
      ...payment,
      debtorPlayerIds: allDebtorIds,
      debtorPlayerId: remainingDebtors[0]!,
      remainingDebtors: remainingDebtors.slice(1),
      paidDebtorIds: newPaidDebtorIds,
      collectedPayments,
    };
  } else {
    // All debtors have paid — emit completion summary
    const totalCollected = collectedPayments.reduce((sum, p) => sum + p.totalValue, 0);
    const completedEvent: PaymentCompletedEvent = {
      id: `event-${Date.now()}-payment-completed`,
      timestamp: Date.now(),
      type: "payment_completed",
      creditorPlayerId: creditor.id,
      amountDue: payment.amountDue,
      totalCollected,
      payments: collectedPayments,
      reason: payment.reason,
      actionCard: payment.actionCard,
      message: `${creditor.name} collected $${totalCollected}M from ${collectedPayments.length} player(s).`,
    };
    extraEvents.push(completedEvent);
  }
  // else: all debtors have paid, pendingResolution = null (turn can continue)

  const nextState: GameState = {
    ...state,
    players: {
      ...state.players,
      [debtor.id]: {
        ...debtor,
        bank: debtorRemainingBank,
        propertySets: debtorRemainingSets,
      },
      [creditor.id]: {
        ...creditor,
        bank: creditorNewBank,
        propertySets: creditorNewSets,
      },
    },
    pendingResolution: nextPending,
    history: [...state.history, paymentEvent, ...extraEvents],
  };

  return { nextState, events: [paymentEvent, ...extraEvents] };
}
