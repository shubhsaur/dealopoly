import type { CardColor, CardDefinition } from "@dealopoly/shared";
import { CARD_CATALOGUE } from "@dealopoly/shared";
import type { CardInstance, PropertySet } from "@dealopoly/game-engine";

export const CARD_MAP = new Map<string, CardDefinition>(CARD_CATALOGUE.map((c) => [c.id, c]));

export function resolveCardDef(
  card: CardInstance | CardDefinition | { defId?: string; id?: string } | null | undefined,
): CardDefinition {
  if (!card) {
    return CARD_CATALOGUE[0]!;
  }
  const defId = "defId" in card && card.defId ? card.defId : "id" in card && card.id ? card.id : "";
  const fromCatalogue = CARD_MAP.get(defId);
  if (fromCatalogue) {
    return fromCatalogue;
  }
  return card as unknown as CardDefinition;
}

export const OPPONENT_PALETTES = [
  { class: "avatar-theme--purple", badge: "🟣", hex: "#c084fc" },
  { class: "avatar-theme--orange", badge: "🟠", hex: "#fb923c" },
  { class: "avatar-theme--emerald", badge: "🟢", hex: "#34d399" },
  { class: "avatar-theme--amber", badge: "🟡", hex: "#fbbf24" },
];

export interface TargetingActionState {
  card: CardInstance;
  type: "deal_breaker" | "sly_deal" | "forced_deal" | "debt_collector" | "wild_rent";
  doubleRentCardId?: string;
}

export interface StolenAlertState {
  id: string;
  attackerName: string;
  actionName: string;
  actionDefId: string;
  actionCard?: CardInstance;
  stolenCards: CardInstance[];
  swappedCard?: CardInstance;
  type: "deal_breaker" | "sly_deal" | "forced_deal";
}

export interface FlyingCardItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  rotate: number;
}
