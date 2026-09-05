"use client";

import Link from "next/link";
import { MarketingNav } from "../../_components/marketing-nav";
import { MarketingFooter } from "../../_components/marketing-footer";
import { useState, useMemo } from "react";
import {
  CARD_CATALOGUE,
  TOTAL_CARDS_IN_DECK,
  COLOR_CONFIG,
  type CardColor,
  type CardType,
  type CardDefinition,
} from "@dealopoly/shared";
import { Card } from "../../_components/card";
import { BackButton } from "../../_components/back-button";

const TYPE_TABS: { label: string; value: CardType | "all"; count: number }[] = [
  { label: "All Cards", value: "all", count: TOTAL_CARDS_IN_DECK },
  {
    label: "Properties",
    value: "property",
    count: CARD_CATALOGUE.filter((c) => c.type === "property").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
  {
    label: "Wilds",
    value: "property-wild",
    count: CARD_CATALOGUE.filter((c) => c.type === "property-wild").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
  {
    label: "Actions",
    value: "action",
    count: CARD_CATALOGUE.filter((c) => c.type === "action").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
  {
    label: "Rent",
    value: "rent",
    count: CARD_CATALOGUE.filter((c) => c.type === "rent").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
  {
    label: "Money",
    value: "money",
    count: CARD_CATALOGUE.filter((c) => c.type === "money").reduce(
      (a, c) => a + c.count,
      0,
    ),
  },
];

const COLOR_FILTERS: { label: string; color: CardColor | "all" }[] = [
  { label: "All Colors", color: "all" },
  { label: "Brown", color: "brown" },
  { label: "Light Blue", color: "light-blue" },
  { label: "Pink", color: "pink" },
  { label: "Orange", color: "orange" },
  { label: "Red", color: "red" },
  { label: "Yellow", color: "yellow" },
  { label: "Green", color: "green" },
  { label: "Dark Blue", color: "dark-blue" },
  { label: "Railroad", color: "railroad" },
  { label: "Utility", color: "utility" },
];

export default function MonodealCardCataloguePage() {
  const [selectedType, setSelectedType] = useState<CardType | "all">("all");
  const [selectedColor, setSelectedColor] = useState<CardColor | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [prototypeSize, setPrototypeSize] = useState<"sm" | "md" | "lg">("md");
  const [spotlightCardId, setSpotlightCardId] = useState<string>("action-house");

  const SPOTLIGHT_PREVIEWS = [
    { id: "action-house", label: "🏠 House (New Match)" },
    { id: "action-hotel", label: "🏨 Hotel (New Match)" },
    { id: "action-its-my-birthday", label: "🎂 It's Your Birthday (Match)" },
    { id: "action-pass-go", label: "🎲 Pass Go (Match)" },
    { id: "money-4m", label: "💵 $4M Money (Match)" },
    { id: "rent-red-yellow", label: "🔥 Rent: Red / Yellow (Match)" },
    { id: "prop-park-lane", label: "Park Place (Dark Blue 2-Tier)" },
    { id: "prop-trafalgar-square", label: "Trafalgar Sq (Red 3-Tier)" },
    { id: "prop-reading-railroad", label: "Reading Railroad (4-Tier)" },
    { id: "prop-electric-company", label: "Electric Co (Utility Sage)" },
    { id: "prop-mediterranean-avenue", label: "Mediterranean Ave (Brown)" },
    { id: "prop-northumberland-avenue", label: "Northumberland (Pink Long)" },
  ];

  const spotlightCard = useMemo(
    () => CARD_CATALOGUE.find((c) => c.id === spotlightCardId) || CARD_CATALOGUE.find((c) => c.id === "action-house")!,
    [spotlightCardId],
  );

  const filteredCards = useMemo(() => {
    return CARD_CATALOGUE.filter((card) => {
      // Type filter
      if (selectedType !== "all" && card.type !== selectedType) {
        return false;
      }
      // Color filter
      if (selectedColor !== "all") {
        const isExactColor = card.primaryColor === selectedColor;
        const isSecondaryColor =
          "secondaryColor" in card && card.secondaryColor === selectedColor;
        if (!isExactColor && !isSecondaryColor) {
          return false;
        }
      }
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(query);
        const matchesDesc = card.description?.toLowerCase().includes(query);
        const matchesColor = card.primaryColor?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesColor) {
          return false;
        }
      }
      return true;
    });
  }, [selectedType, selectedColor, searchQuery]);

  const totalFilteredCopies = useMemo(() => {
    return filteredCards.reduce((acc, c) => acc + c.count, 0);
  }, [filteredCards]);

  return (
    <div className="catalogue-page">
      {/* Monodeal Navigation */}
      <MarketingNav game="monodeal" activeTab="cards" />

      {/* Main Container */}
      <main className="catalogue-container">
        {/* Page Title & Stats */}
        <section className="catalogue-header">
          <div className="catalogue-header-copy">
            <BackButton fallbackUrl="/monodeal" label="Back to Monodeal" variant="subtle" style={{ marginBottom: "10px" }} />
            <h1>Monodeal Card Catalogue</h1>
            <p>
              Explore the complete 110-card deck with authentic color schemes,
              rent multipliers, and card mechanics matching the classic game.
            </p>
          </div>

          <div className="catalogue-stats-box">
            <div>
              <div className="catalogue-stat-val catalogue-stat-val--blue">
                {totalFilteredCopies}
              </div>
              <div className="catalogue-stat-lbl">Cards Shown</div>
            </div>
            <div className="catalogue-stat-divider" />
            <div>
              <div className="catalogue-stat-val catalogue-stat-val--green">
                {filteredCards.length}
              </div>
              <div className="catalogue-stat-lbl">Unique Types</div>
            </div>
            <div className="catalogue-stat-divider" />
            <div>
              <div className="catalogue-stat-val" style={{ color: "var(--tertiary)" }}>
                110
              </div>
              <div className="catalogue-stat-lbl">Total Deck</div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Hasbro Monopoly Deal Match - Prototype Verification Spotlight */}
        {/* ============================================================ */}
        <section className="hasbro-verification-box">
          <div className="hasbro-verification-header">
            <div>
              <div className="hasbro-verification-badge">
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  verified
                </span>
                Hasbro Monopoly Deal Design Match
              </div>
              <h2 className="hasbro-verification-title">
                {spotlightCard?.id === "action-house"
                  ? "House Action Card Design Verification"
                  : spotlightCard?.id === "action-hotel"
                  ? "Hotel Action Card Design Verification"
                  : spotlightCard?.id === "action-its-my-birthday"
                  ? "It's Your Birthday Action Card Design Verification"
                  : spotlightCard?.id === "action-pass-go"
                  ? "Pass Go Action Card Design Verification"
                  : spotlightCard?.type === "money"
                  ? "$4M Money Card Design Verification"
                  : spotlightCard?.type === "rent"
                  ? "Rent Card Design Verification (Red / Yellow)"
                  : "Property Cards Design Verification"}
              </h2>
              <p className="hasbro-verification-desc">
                Faithfully reconstructed based on official Hasbro Monopoly Deal reference cards.
                Select any card below to verify the new House, Hotel, Birthday, Pass Go, $4M Money, or Rent action cards across the deck.
              </p>

              {/* Card Switcher Tabs */}
              <div className="hasbro-card-select-tabs" role="tablist" aria-label="Select card to verify">
                {SPOTLIGHT_PREVIEWS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSpotlightCardId(p.id)}
                    className={`hasbro-card-select-btn ${
                      spotlightCardId === p.id ? "hasbro-card-select-btn--active" : ""
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Size Selector */}
            <div className="hasbro-size-selector" aria-label="Card preview size">
              {(["sm", "md", "lg"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrototypeSize(s)}
                  className={`hasbro-size-btn ${
                    prototypeSize === s ? "hasbro-size-btn--active" : ""
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="hasbro-verification-comparison">
            {/* New Recreated Hasbro Card */}
            <div className="hasbro-comparison-card-wrap hasbro-comparison-card-wrap--active">
              <span className="hasbro-comparison-tag" style={{ color: "#60A5FA" }}>
                ✨ New Recreated Hasbro Design
              </span>
              {spotlightCard && (
                <Card
                  card={spotlightCard}
                  size={prototypeSize}
                  designVariant="hasbro"
                  isInteractive={true}
                />
              )}
              <span className="hasbro-comparison-caption">
                {spotlightCard?.id === "action-house" ? (
                  <>
                    Vibrant cyan/sky blue cardstock margin, inner black frame with cyan herringbone chevron guilloche, top-left <strong>ᴹ3</strong> coin, 3D comic-book <strong>ACTION</strong> header, central circular badge with green Monopoly house illustration and bold <strong>HOUSE</strong> title, and bottom multi-tier rules text.
                  </>
                ) : spotlightCard?.id === "action-hotel" ? (
                  <>
                    Vibrant chartreuse/lime green cardstock margin, inner black frame with lime herringbone chevron guilloche, top-left <strong>ᴹ4</strong> coin, 3D comic-book <strong>ACTION</strong> header, central circular badge with red Monopoly hotel illustration and bold <strong>HOTEL</strong> title, and bottom <strong>The house stays.</strong> rules text.
                  </>
                ) : spotlightCard?.id === "action-its-my-birthday" ? (
                  <>
                    Vibrant hot pink cardstock margin, inner black frame with pink herringbone chevron guilloche, top-left <strong>ᴹ2</strong> coin, 3D comic-book <strong>ACTION</strong> header, central circular badge with <strong>IT&apos;S YOUR BIRTHDAY</strong>, two-layer frosted birthday cake with 3 lit candles and radiance bursts, and bottom <strong>Collect ᴹ2 from each player.</strong> rules text.
                  </>
                ) : spotlightCard?.id === "action-pass-go" ? (
                  <>
                    White cardstock margin, inner black frame with iridescent pastel chevron guilloche, top-left <strong>ᴹ1</strong> coin, 3D comic-book <strong>ACTION</strong> header with black extrusion shadow, central circular badge with <strong>PASS</strong>, iconic square-shouldered Monopoly <strong>GO</strong> wordmark, leftward-pointing red arrow with notched fletching, and bottom <strong>Draw 2 cards.</strong> rules text.
                  </>
                ) : spotlightCard?.type === "money" ? (
                  <>
                    Vibrant lime green cardstock margin, inner black frame with spring green gradient and herringbone guilloche, top-left <strong>ᴹ4</strong> coin, Rich Uncle Pennybags line-art watermark, giant <strong>10.4em</strong> center badge with triple-layer contour <strong>4</strong>, black <strong>MONOPOLY ® BRAND</strong> pill, and bottom ghost watermarks.
                  </>
                ) : spotlightCard?.type === "rent" ? (
                  <>
                    White cardstock margin, inner black frame with pastel guilloche herringbone security texture, official <strong>ᴹ1</strong> coin, slanted 3D <strong>ACTION</strong> header with black extrusion block, and central concentric badge with 3D Monopoly cash stack.
                  </>
                ) : (
                  <>
                    White border margin, inner debossed black frame, official double-barred <strong>ᴹ</strong> coin, <strong>PROPERTIES OWNED</strong> / <strong>RENT</strong> table with mini card icons, radiating burst dashes &amp; <strong>COMPLETE SET</strong> indicator.
                  </>
                )}
              </span>
            </div>

            {/* Previous Dealopoly Design */}
            <div className="hasbro-comparison-card-wrap">
              <span className="hasbro-comparison-tag" style={{ color: "#9CA3AF" }}>
                🏛️ Previous Dealopoly Style
              </span>
              {spotlightCard && (
                <Card
                  card={spotlightCard}
                  size={prototypeSize}
                  designVariant="classic"
                  isInteractive={true}
                />
              )}
              <span className="hasbro-comparison-caption">
                Previous arched cutout header with star shield, money bag rent column, and bottom city skyline plinth.
              </span>
            </div>

            {/* Design Checkpoints */}
            <div className="hasbro-comparison-checkpoints">
              <div style={{ fontWeight: 800, color: "#FFFFFF", marginBottom: "4px", fontSize: "0.88rem" }}>
                🎯 Hasbro Accuracy Checkpoints ({spotlightCard?.id === "action-house" ? "House Action Edition" : spotlightCard?.id === "action-hotel" ? "Hotel Action Edition" : spotlightCard?.id === "action-its-my-birthday" ? "Birthday Action Edition" : spotlightCard?.id === "action-pass-go" ? "Pass Go Action Edition" : spotlightCard?.type === "money" ? "Money Edition" : spotlightCard?.type === "rent" ? "Rent Edition" : "Property Edition"})
              </div>
              {spotlightCard?.id === "action-house" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Vibrant Cyan Cardstock:</strong> Exact <code>#4EBCEB</code> sky blue outer cardstock margin with 3D beveled edges and tactile drop shadows.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Green Monopoly House Illustration:</strong> 3D pitched gable roof with chimney, front grooved wall paneling, and center door.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D Comic-Book ACTION Header:</strong> Slanted heavy italic typography with solid black isometric extrusion block shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Official Coin &amp; Rent Bonus:</strong> Top-left <code>₥3</code> coin badge and centered rules adding <code>₥3</code> to rent on complete sets.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Restriction Subtitle:</strong> Authentic Hasbro subtitle: <code>May not be placed on railroads or utilities.</code></span>
                  </div>
                </>
              ) : spotlightCard?.id === "action-hotel" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Chartreuse Lime Cardstock:</strong> Exact <code>#78C425</code> lime outer cardstock margin with 3D beveled edges and tactile drop shadows.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Red Monopoly Hotel Illustration:</strong> 3D pitched roof with central chimney and vertical grooved architectural columns.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D Comic-Book ACTION Header:</strong> Slanted heavy italic typography with deep solid black isometric extrusion block shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Official Coin &amp; Rent Bonus:</strong> Top-left <code>₥4</code> coin badge and centered rules adding <code>₥4</code> to rent on property sets with a house.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Key Hasbro Caveat:</strong> Authentic closing notice: <code>The house stays.</code></span>
                  </div>
                </>
              ) : spotlightCard?.id === "action-its-my-birthday" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Vibrant Hot Pink Cardstock:</strong> Exact <code>#F04374</code> raspberry/pink cardstock margin with 3D beveled edges and tactile drop shadows.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Frosted Birthday Cake Illustration:</strong> Two-layer sponge cake on an oval platter with white frosting drip cap, 3 lit candles, yellow flames, and radial accent bursts.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D Comic-Book ACTION Header:</strong> Slanted heavy italic typography with deep solid black isometric extrusion block shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Dual-Line Center Title:</strong> Compact bold <code>IT&apos;S YOUR</code> over heavy bold <code>BIRTHDAY</code> with crisp letter spacing.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Official Coin &amp; Rules:</strong> Top-left <code>₥2</code> coin badge and centered bottom <code>Collect ₥2 from each player.</code> description with inline <code>₥</code> currency mark.</span>
                  </div>
                </>
              ) : spotlightCard?.id === "action-pass-go" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Iconic Monopoly GO Typography:</strong> Custom geometric square-shouldered vector letters for 'G' and 'O' matching the classic Monopoly board space.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Leftward Red Arrow with Fletching:</strong> Pointing to the left across the board with sharp triangular head, horizontal shaft, and notched rear tail feathers.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D Comic-Book ACTION Header:</strong> Slanted heavy italic typography with deep solid black isometric extrusion block shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Pastel Chevron Guilloche:</strong> Subtle herringbone security texture over soft iridescent lilac, mint, and peach gradient.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Official Coin &amp; Rules:</strong> Top-left <code>₥1</code> coin badge and centered bottom <code>Draw 2 cards.</code> description.</span>
                  </div>
                </>
              ) : spotlightCard?.type === "money" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Vibrant Lime Cardstock:</strong> Exact <code>#70C63E</code> outer border margin with embossed cardstock bevel and tactile depth.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Triple-Layer Contoured Numeral 4:</strong> Giant central numeral featuring outer heavy black stroke, lime gap boundary, and solid black inner core.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>MONOPOLY ® BRAND Pill:</strong> Black rectangular pill badge with lime green border sitting directly under the central badge.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Rich Uncle Pennybags Watermark:</strong> Authentic top-right vector line-art watermark showing top hat, mustache, bowtie, and cane.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Dual Ghost Watermarks:</strong> Giant semi-transparent <code>4</code> in bottom-left and <code>₥</code> currency emblem in bottom-right.</span>
                  </div>
                </>
              ) : spotlightCard?.type === "rent" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D Comic-Book ACTION Header:</strong> Slanted heavy italic typography with deep solid black isometric extrusion block shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Concentric Circular Badge:</strong> Outer black circle, white spacer gap ring, and inner black frame encircling the RENT banner.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Split Color Band &amp; 3D Cash Stack:</strong> Red and Yellow color blocks straddled by an isometric stack of Monopoly bills with striated green edges and <code>₥</code> emblem.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Authentic 4-Line Hasbro Rules Text:</strong> <code>Collect rent from each player for each property you own in that color.</code></span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Pastel Guilloche Security Background:</strong> Subtle herringbone chevron texture over soft iridescent lilac, mint, and peach gradient.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Authentic ᴹ Currency Symbol:</strong> Double-barred Monopoly currency mark in top-left coin badge and rent rows.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Multi-Tier Dynamic Spacing:</strong> 2-tier, 3-tier, and 4-tier cards scale mini icons and rent typography cleanly without overlap.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>True Hasbro Palette:</strong> Exact royal blue, utility sage green (<code>#B8DBBE</code>), anthracite railroads, and high-contrast numerals.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Stacked Mini Cards &amp; Burst Dashes:</strong> Multi-layer card fans with radiating burst dashes and italic <code>COMPLETE SET</code> on complete set rows only.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D Embossed Depth:</strong> Outer beveled cardstock highlights, inner debossed parchment frame, and tactile drop shadows.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Category Tabs */}
        <div className="catalogue-tabs" role="tablist">
          {TYPE_TABS.map((tab) => {
            const isActive = selectedType === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedType(tab.value)}
                className={`catalogue-tab-btn ${
                  isActive ? "catalogue-tab-btn--active" : ""
                }`}
                role="tab"
                aria-selected={isActive}
              >
                <span>{tab.label}</span>
                <span className="catalogue-tab-count">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Filters Toolbar */}
        <div className="catalogue-toolbar">
          {/* Color Chips */}
          <div className="catalogue-colors">
            {COLOR_FILTERS.map((f) => {
              const isSelected = selectedColor === f.color;
              const config =
                f.color !== "all" ? COLOR_CONFIG[f.color] : undefined;
              return (
                <button
                  key={f.color}
                  onClick={() => setSelectedColor(f.color)}
                  className={`catalogue-color-chip ${
                    isSelected ? "catalogue-color-chip--active" : ""
                  }`}
                >
                  {config && (
                    <span
                      className="color-dot"
                      style={{ backgroundColor: config.hex }}
                    />
                  )}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="catalogue-search-wrap">
            <span className="material-symbols-outlined catalogue-search-icon">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards, rent, effects..."
              className="catalogue-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="catalogue-search-clear"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  close
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Card Gallery Grid */}
        {filteredCards.length === 0 ? (
          <div className="catalogue-empty">
            <span className="material-symbols-outlined catalogue-empty-icon">
              sentiment_dissatisfied
            </span>
            <h3>No cards matched your filter</h3>
            <p style={{ color: "var(--muted)", marginTop: "4px" }}>
              Try clearing your search query or choosing another color/category.
            </p>
          </div>
        ) : (
          <div className="catalogue-grid">
            {filteredCards.map((card) => (
              <article key={card.id} className="catalogue-card-container">
                {/* Visual Dealopoly Card */}
                <Card
                  card={card}
                  size="md"
                  isInteractive={false}
                />

                {/* Card Meta Footer */}
                <div className="catalogue-card-footer">
                  <span className="catalogue-copy-badge">
                    {card.count} {card.count === 1 ? "copy" : "copies"}
                  </span>
                  <span className="catalogue-value-badge">
                    {card.value > 0 ? `$${card.value}M Bank` : "No $ Value"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <MarketingFooter game="monodeal" />
    </div>
  );
}
