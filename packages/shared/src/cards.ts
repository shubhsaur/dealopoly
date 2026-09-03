export type CardColor =
  | "brown"
  | "light-blue"
  | "pink"
  | "orange"
  | "red"
  | "yellow"
  | "green"
  | "dark-blue"
  | "railroad"
  | "utility"
  | "all";

export type CardType =
  | "property"
  | "property-wild"
  | "action"
  | "rent"
  | "money"
  | "rule";

export interface PropertyRent {
  setCount: number;
  rent: number;
  isComplete?: boolean;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  value: number; // in millions ($M)
  count: number; // total copies in 110-card deck
  primaryColor?: CardColor;
  secondaryColor?: CardColor;
  setSize?: number;
  rentTiers?: PropertyRent[];
  description?: string;
  tagline?: string;
  icon?: string;
  isWild?: boolean;
  colors?: CardColor[];
  imageUrl?: string;
}

export const COLOR_CONFIG: Record<
  CardColor,
  {
    name: string;
    hex: string;
    darkHex: string;
    textHex: string;
    setSize: number;
    rentTiers: number[];
  }
> = {
  brown: {
    name: "Brown",
    hex: "#8B4513",
    darkHex: "#54280B",
    textHex: "#FFFFFF",
    setSize: 2,
    rentTiers: [1, 2],
  },
  "light-blue": {
    name: "Light Blue",
    hex: "#87CEEB",
    darkHex: "#4BA3C7",
    textHex: "#111415",
    setSize: 3,
    rentTiers: [1, 2, 3],
  },
  pink: {
    name: "Pink",
    hex: "#D83A8F",
    darkHex: "#9B1A61",
    textHex: "#FFFFFF",
    setSize: 3,
    rentTiers: [1, 2, 4],
  },
  orange: {
    name: "Orange",
    hex: "#F28C28",
    darkHex: "#B85C0A",
    textHex: "#111415",
    setSize: 3,
    rentTiers: [1, 3, 5],
  },
  red: {
    name: "Red",
    hex: "#ED1B24",
    darkHex: "#9E0E14",
    textHex: "#FFFFFF",
    setSize: 3,
    rentTiers: [2, 3, 6],
  },
  yellow: {
    name: "Yellow",
    hex: "#FFDE00",
    darkHex: "#B89F00",
    textHex: "#111415",
    setSize: 3,
    rentTiers: [2, 4, 6],
  },
  green: {
    name: "Green",
    hex: "#008000",
    darkHex: "#004D00",
    textHex: "#FFFFFF",
    setSize: 3,
    rentTiers: [2, 4, 7],
  },
  "dark-blue": {
    name: "Dark Blue",
    hex: "#0055A4",
    darkHex: "#003061",
    textHex: "#FFFFFF",
    setSize: 2,
    rentTiers: [3, 8],
  },
  railroad: {
    name: "Railroad",
    hex: "#2D3436",
    darkHex: "#131718",
    textHex: "#FFFFFF",
    setSize: 4,
    rentTiers: [1, 2, 3, 4],
  },
  utility: {
    name: "Utility",
    hex: "#7F8C8D",
    darkHex: "#4A5253",
    textHex: "#FFFFFF",
    setSize: 2,
    rentTiers: [1, 2],
  },
  all: {
    name: "Multi-color",
    hex: "#6C5CE7",
    darkHex: "#4834D4",
    textHex: "#FFFFFF",
    setSize: 0,
    rentTiers: [],
  },
};

export const PROPERTY_COLORS: CardColor[] = (
  Object.keys(COLOR_CONFIG) as CardColor[]
).filter((color) => color !== "all");

export const CARD_CATALOGUE: CardDefinition[] = [
  // ==========================================
  // PROPERTY CARDS (28 total copies)
  // ==========================================
  // Brown (2)
  {
    id: "prop-mediterranean-avenue",
    name: "Mediterranean Avenue",
    type: "property",
    primaryColor: "brown",
    value: 1,
    count: 1,
    setSize: 2,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-baltic-avenue",
    name: "Baltic Avenue",
    type: "property",
    primaryColor: "brown",
    value: 1,
    count: 1,
    setSize: 2,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },

  // Light Blue (3)
  {
    id: "prop-the-angel-islington",
    name: "The Angel Islington",
    type: "property",
    primaryColor: "light-blue",
    value: 1,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 3, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-euston-road",
    name: "Euston Road",
    type: "property",
    primaryColor: "light-blue",
    value: 1,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 3, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-pentonville-road",
    name: "Pentonville Road",
    type: "property",
    primaryColor: "light-blue",
    value: 1,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 3, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },

  // Pink (3)
  {
    id: "prop-pall-mall",
    name: "Pall Mall",
    type: "property",
    primaryColor: "pink",
    value: 2,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 4, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-whitehall",
    name: "Whitehall",
    type: "property",
    primaryColor: "pink",
    value: 2,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 4, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-northumberland-avenue",
    name: "Northumberland Avenue",
    type: "property",
    primaryColor: "pink",
    value: 2,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 4, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },

  // Orange (3)
  {
    id: "prop-bow-street",
    name: "Bow Street",
    type: "property",
    primaryColor: "orange",
    value: 2,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 3 },
      { setCount: 3, rent: 5, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-marlborough-street",
    name: "Marlborough Street",
    type: "property",
    primaryColor: "orange",
    value: 2,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 3 },
      { setCount: 3, rent: 5, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-vine-street",
    name: "Vine Street",
    type: "property",
    primaryColor: "orange",
    value: 2,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 3 },
      { setCount: 3, rent: 5, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },

  // Red (3)
  {
    id: "prop-strand",
    name: "Strand",
    type: "property",
    primaryColor: "red",
    value: 3,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 2 },
      { setCount: 2, rent: 3 },
      { setCount: 3, rent: 6, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-fleet-street",
    name: "Fleet Street",
    type: "property",
    primaryColor: "red",
    value: 3,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 2 },
      { setCount: 2, rent: 3 },
      { setCount: 3, rent: 6, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-trafalgar-square",
    name: "Trafalgar Square",
    type: "property",
    primaryColor: "red",
    value: 3,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 2 },
      { setCount: 2, rent: 3 },
      { setCount: 3, rent: 6, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },

  // Yellow (3)
  {
    id: "prop-leicester-square",
    name: "Leicester Square",
    type: "property",
    primaryColor: "yellow",
    value: 3,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 2 },
      { setCount: 2, rent: 4 },
      { setCount: 3, rent: 6, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-coventry-street",
    name: "Coventry Street",
    type: "property",
    primaryColor: "yellow",
    value: 3,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 2 },
      { setCount: 2, rent: 4 },
      { setCount: 3, rent: 6, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-piccadilly",
    name: "Piccadilly",
    type: "property",
    primaryColor: "yellow",
    value: 3,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 2 },
      { setCount: 2, rent: 4 },
      { setCount: 3, rent: 6, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },

  // Green (3)
  {
    id: "prop-regent-street",
    name: "Regent Street",
    type: "property",
    primaryColor: "green",
    value: 4,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 2 },
      { setCount: 2, rent: 4 },
      { setCount: 3, rent: 7, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-oxford-street",
    name: "Oxford Street",
    type: "property",
    primaryColor: "green",
    value: 4,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 2 },
      { setCount: 2, rent: 4 },
      { setCount: 3, rent: 7, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-bond-street",
    name: "Bond Street",
    type: "property",
    primaryColor: "green",
    value: 4,
    count: 1,
    setSize: 3,
    rentTiers: [
      { setCount: 1, rent: 2 },
      { setCount: 2, rent: 4 },
      { setCount: 3, rent: 7, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },

  // Dark Blue (2)
  {
    id: "prop-park-lane",
    name: "Park Lane",
    type: "property",
    primaryColor: "dark-blue",
    value: 4,
    count: 1,
    setSize: 2,
    rentTiers: [
      { setCount: 1, rent: 3 },
      { setCount: 2, rent: 8, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },
  {
    id: "prop-mayfair",
    name: "Mayfair",
    type: "property",
    primaryColor: "dark-blue",
    value: 4,
    count: 1,
    setSize: 2,
    rentTiers: [
      { setCount: 1, rent: 3 },
      { setCount: 2, rent: 8, isComplete: true },
    ],
    tagline: "PROPERTY",
    icon: "location_city",
  },

  // Railroads (4)
  {
    id: "prop-reading-railroad",
    name: "Reading Railroad",
    type: "property",
    primaryColor: "railroad",
    value: 2,
    count: 1,
    setSize: 4,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 3 },
      { setCount: 4, rent: 4, isComplete: true },
    ],
    tagline: "RAILROAD",
    icon: "train",
  },
  {
    id: "prop-pennsylvania-railroad",
    name: "Pennsylvania Railroad",
    type: "property",
    primaryColor: "railroad",
    value: 2,
    count: 1,
    setSize: 4,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 3 },
      { setCount: 4, rent: 4, isComplete: true },
    ],
    tagline: "RAILROAD",
    icon: "train",
  },
  {
    id: "prop-b-and-o-railroad",
    name: "B. & O. Railroad",
    type: "property",
    primaryColor: "railroad",
    value: 2,
    count: 1,
    setSize: 4,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 3 },
      { setCount: 4, rent: 4, isComplete: true },
    ],
    tagline: "RAILROAD",
    icon: "train",
  },
  {
    id: "prop-short-line",
    name: "Short Line",
    type: "property",
    primaryColor: "railroad",
    value: 2,
    count: 1,
    setSize: 4,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2 },
      { setCount: 3, rent: 3 },
      { setCount: 4, rent: 4, isComplete: true },
    ],
    tagline: "RAILROAD",
    icon: "train",
  },

  // Utilities (2)
  {
    id: "prop-electric-company",
    name: "Electric Company",
    type: "property",
    primaryColor: "utility",
    value: 2,
    count: 1,
    setSize: 2,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2, isComplete: true },
    ],
    tagline: "UTILITY",
    icon: "bolt",
  },
  {
    id: "prop-water-works",
    name: "Water Works",
    type: "property",
    primaryColor: "utility",
    value: 2,
    count: 1,
    setSize: 2,
    rentTiers: [
      { setCount: 1, rent: 1 },
      { setCount: 2, rent: 2, isComplete: true },
    ],
    tagline: "UTILITY",
    icon: "water_drop",
  },

  // ==========================================
  // PROPERTY WILD CARDS (11 total copies)
  // ==========================================
  {
    id: "wild-multicolor",
    name: "Property Wild Card (All)",
    type: "property-wild",
    primaryColor: "all",
    value: 0,
    count: 2,
    isWild: true,
    tagline: "PROPERTY WILD CARD",
    description:
      "This card can be used as part of any property set. This card has no monetary value.",
    icon: "auto_awesome",
  },
  {
    id: "wild-light-blue-brown",
    name: "Property Wild Card",
    type: "property-wild",
    primaryColor: "light-blue",
    secondaryColor: "brown",
    value: 1,
    count: 1,
    isWild: true,
    tagline: "PROPERTY WILD CARD",
    description: "Swap between Light Blue and Brown on your turn.",
    icon: "swap_horiz",
  },
  {
    id: "wild-light-blue-railroad",
    name: "Property Wild Card",
    type: "property-wild",
    primaryColor: "light-blue",
    secondaryColor: "railroad",
    value: 4,
    count: 1,
    isWild: true,
    tagline: "PROPERTY WILD CARD",
    description: "Swap between Light Blue and Railroad on your turn.",
    icon: "swap_horiz",
  },
  {
    id: "wild-dark-blue-green",
    name: "Property Wild Card",
    type: "property-wild",
    primaryColor: "dark-blue",
    secondaryColor: "green",
    value: 4,
    count: 1,
    isWild: true,
    tagline: "PROPERTY WILD CARD",
    description: "Swap between Dark Blue and Green on your turn.",
    icon: "swap_horiz",
  },
  {
    id: "wild-pink-orange",
    name: "Property Wild Card",
    type: "property-wild",
    primaryColor: "pink",
    secondaryColor: "orange",
    value: 2,
    count: 2,
    isWild: true,
    tagline: "PROPERTY WILD CARD",
    description: "Swap between Pink and Orange on your turn.",
    icon: "swap_horiz",
  },
  {
    id: "wild-red-yellow",
    name: "Property Wild Card",
    type: "property-wild",
    primaryColor: "red",
    secondaryColor: "yellow",
    value: 3,
    count: 2,
    isWild: true,
    tagline: "PROPERTY WILD CARD",
    description: "Swap between Red and Yellow on your turn.",
    icon: "swap_horiz",
  },
  {
    id: "wild-utility-railroad",
    name: "Property Wild Card",
    type: "property-wild",
    primaryColor: "utility",
    secondaryColor: "railroad",
    value: 2,
    count: 1,
    isWild: true,
    tagline: "PROPERTY WILD CARD",
    description: "Swap between Utility and Railroad on your turn.",
    icon: "swap_horiz",
  },
  {
    id: "wild-green-railroad",
    name: "Property Wild Card",
    type: "property-wild",
    primaryColor: "green",
    secondaryColor: "railroad",
    value: 4,
    count: 1,
    isWild: true,
    tagline: "PROPERTY WILD CARD",
    description: "Swap between Green and Railroad on your turn.",
    icon: "swap_horiz",
  },

  // ==========================================
  // ACTION CARDS (34 total copies)
  // ==========================================
  {
    id: "action-deal-breaker",
    name: "Deal Breaker",
    type: "action",
    value: 5,
    count: 2,
    tagline: "ACTION",
    description:
      "Steal a complete set of properties from any player. (Includes any buildings).",
    icon: "handshake",
  },
  {
    id: "action-just-say-no",
    name: "Just Say No",
    type: "action",
    value: 4,
    count: 3,
    tagline: "ACTION",
    description:
      "Use at any time to cancel an action played against you. Can also cancel another Just Say No!",
    icon: "block",
  },
  {
    id: "action-sly-deal",
    name: "Sly Deal",
    type: "action",
    value: 3,
    count: 3,
    tagline: "ACTION",
    description:
      "Steal a single property from any player. (Cannot steal from a complete set).",
    icon: "swap_horiz",
  },
  {
    id: "action-force-deal",
    name: "Force Deal",
    type: "action",
    value: 3,
    count: 3,
    tagline: "ACTION",
    description:
      "Swap any single property you own for one owned by an opponent. (Cannot swap from complete sets).",
    icon: "published_with_changes",
  },
  {
    id: "action-debt-collector",
    name: "Debt Collector",
    type: "action",
    value: 3,
    count: 3,
    tagline: "ACTION",
    description: "Force any one player to pay you $5M.",
    icon: "request_quote",
  },
  {
    id: "action-its-my-birthday",
    name: "It's My Birthday",
    type: "action",
    value: 2,
    count: 3,
    tagline: "ACTION",
    description: "All players must pay you $2M as a birthday gift.",
    icon: "cake",
  },
  {
    id: "action-pass-go",
    name: "Pass Go",
    type: "action",
    value: 1,
    count: 10,
    tagline: "ACTION",
    description: "Draw 2 extra cards from the draw pile.",
    icon: "add_card",
  },
  {
    id: "action-double-the-rent",
    name: "Double The Rent",
    type: "action",
    value: 1,
    count: 2,
    tagline: "ACTION",
    description: "Play with a Rent card to double the total rent charged.",
    icon: "close",
  },
  {
    id: "action-house",
    name: "House",
    type: "action",
    value: 3,
    count: 3,
    tagline: "ACTION",
    description:
      "Add onto any full property set to add $3M to the rent value. (Limit 1 House per set).",
    icon: "home",
  },
  {
    id: "action-hotel",
    name: "Hotel",
    type: "action",
    value: 4,
    count: 2,
    tagline: "ACTION",
    description:
      "Add onto any full property set that already has a House to add $4M to the rent value. (Limit 1 Hotel per set).",
    icon: "apartment",
  },

  // ==========================================
  // RENT CARDS (13 total copies)
  // ==========================================
  {
    id: "rent-green-dark-blue",
    name: "Rent (Green / Dark Blue)",
    type: "rent",
    primaryColor: "green",
    secondaryColor: "dark-blue",
    value: 1,
    count: 2,
    tagline: "RENT",
    description:
      "All players pay you rent for properties you own in Green or Dark Blue.",
    icon: "payments",
  },
  {
    id: "rent-brown-light-blue",
    name: "Rent (Brown / Light Blue)",
    type: "rent",
    primaryColor: "brown",
    secondaryColor: "light-blue",
    value: 1,
    count: 2,
    tagline: "RENT",
    description:
      "All players pay you rent for properties you own in Brown or Light Blue.",
    icon: "payments",
  },
  {
    id: "rent-pink-orange",
    name: "Rent (Pink / Orange)",
    type: "rent",
    primaryColor: "pink",
    secondaryColor: "orange",
    value: 1,
    count: 2,
    tagline: "RENT",
    description:
      "All players pay you rent for properties you own in Pink or Orange.",
    icon: "payments",
  },
  {
    id: "rent-red-yellow",
    name: "Rent (Red / Yellow)",
    type: "rent",
    primaryColor: "red",
    secondaryColor: "yellow",
    value: 1,
    count: 2,
    tagline: "RENT",
    description:
      "All players pay you rent for properties you own in Red or Yellow.",
    icon: "payments",
  },
  {
    id: "rent-railroad-utility",
    name: "Rent (Railroad / Utility)",
    type: "rent",
    primaryColor: "railroad",
    secondaryColor: "utility",
    value: 1,
    count: 2,
    tagline: "RENT",
    description:
      "All players pay you rent for properties you own in Railroad or Utility.",
    icon: "payments",
  },
  {
    id: "rent-wild",
    name: "Wild Rent (Any Color)",
    type: "rent",
    primaryColor: "all",
    value: 3,
    count: 3,
    tagline: "WILD RENT",
    description:
      "Force ANY ONE player to pay you rent for any property set you own.",
    icon: "paid",
  },

  // ==========================================
  // MONEY CARDS (20 total copies)
  // ==========================================
  {
    id: "money-1m",
    name: "$1M Money Card",
    type: "money",
    value: 1,
    count: 6,
    tagline: "MONEY",
    description: "Deposit into your bank or use to pay debts and rent.",
    icon: "attach_money",
  },
  {
    id: "money-2m",
    name: "$2M Money Card",
    type: "money",
    value: 2,
    count: 5,
    tagline: "MONEY",
    description: "Deposit into your bank or use to pay debts and rent.",
    icon: "attach_money",
  },
  {
    id: "money-3m",
    name: "$3M Money Card",
    type: "money",
    value: 3,
    count: 3,
    tagline: "MONEY",
    description: "Deposit into your bank or use to pay debts and rent.",
    icon: "attach_money",
  },
  {
    id: "money-4m",
    name: "$4M Money Card",
    type: "money",
    value: 4,
    count: 3,
    tagline: "MONEY",
    description: "Deposit into your bank or use to pay debts and rent.",
    icon: "attach_money",
  },
  {
    id: "money-5m",
    name: "$5M Money Card",
    type: "money",
    value: 5,
    count: 2,
    tagline: "MONEY",
    description: "Deposit into your bank or use to pay debts and rent.",
    icon: "attach_money",
  },
  {
    id: "money-10m",
    name: "$10M Money Card",
    type: "money",
    value: 10,
    count: 1,
    tagline: "MONEY",
    description: "Deposit into your bank or use to pay debts and rent.",
    icon: "attach_money",
  },

  // ==========================================
  // RULE / REFERENCE CARDS (4 total copies)
  // ==========================================
  {
    id: "rule-quick-start",
    name: "Quick Start Rules",
    type: "rule",
    value: 0,
    count: 4,
    tagline: "RULES",
    description:
      "1. Draw 2 cards per turn. 2. Play up to 3 cards (Bank, Property, or Action). 3. First to complete 3 full property sets wins!",
    icon: "menu_book",
  },
];

export const TOTAL_CARDS_IN_DECK = CARD_CATALOGUE.reduce(
  (acc, card) => acc + card.count,
  0,
);
