import type { GameState, CardInstance, PropertySet } from "../types/state.js";
import { GameEngineError } from "../types/errors.js";
import type { PaymentSubmittedEvent, GameEvent } from "../types/events.js";
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
): { nextState: GameState; events: GameEvent[] } {
  if (!state.pendingResolution || state.pendingResolution.type !== "payment") {
    throw new GameEngineError("MUST_RESOLVE_PENDING_ACTION", "No active payment resolution");
  }

  const payment = state.pendingResolution;
  if (debtorPlayerId !== payment.debtorPlayerId) {
    throw new GameEngineError(
      "NOT_WAITING_FOR_YOUR_PAYMENT",
      `Payment is expected from ${payment.debtorPlayerId}, not ${debtorPlayerId}`,
    );
  }

  const debtor = state.players[debtorPlayerId];
  const creditor = state.players[payment.creditorPlayerId];
  if (!debtor || !creditor) {
    throw new GameEngineError("TARGET_PLAYER_NOT_FOUND", "Debtor or creditor player not found");
  }

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

  let nextPending: GameState["pendingResolution"] = null;

  // If there are more debtors in queue (e.g. Birthday / Multi-player Rent)
  if (payment.remainingDebtors.length > 0) {
    const nextDebtorId = payment.remainingDebtors[0]!;
    const remaining = payment.remainingDebtors.slice(1);

    nextPending = {
      type: "reaction_window",
      initiatorPlayerId: payment.creditorPlayerId,
      targetPlayerId: nextDebtorId,
      actionCard: {
        instanceId: "inst-payment",
        defId: "payment-obligation",
        name: payment.reason,
        type: "action",
        value: 0,
      },
      rentAmount: payment.amountDue,
      waitingForPlayerId: nextDebtorId,
      justSayNoChainCount: 0,
      isCancelled: false,
      remainingTargets: remaining,
      deadline: Date.now() + 7000,
      durationMs: 7000,
      canExtend: true,
    };
  }

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
    history: [...state.history, paymentEvent],
  };

  return { nextState, events: [paymentEvent] };
}
