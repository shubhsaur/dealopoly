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
  const [spotlightCardId, setSpotlightCardId] = useState<string>("action-debt-collector");

  const SPOTLIGHT_PREVIEWS = [
    { id: "action-debt-collector", label: "💰 Debt Collector (Refined Match)" },
    { id: "wild-multicolor", label: "🌈 Wild All-Set (Refined Match)" },
    { id: "action-force-deal", label: "🔄 Forced Deal (Match)" },
    { id: "action-deal-breaker", label: "💥 Deal Breaker (Match)" },
    { id: "action-sly-deal", label: "🕵️ Sly Deal (Match)" },
    { id: "money-2m", label: "💰 $2M Money (Match)" },
    { id: "action-just-say-no", label: "🚫 Just Say No (Match)" },
    { id: "action-double-the-rent", label: "💰 Double The Rent (Match)" },
    { id: "rent-wild", label: "🌈 Multicolor Wild Rent (Match)" },
    { id: "money-3m", label: "💰 $3M Money (Match)" },
    { id: "money-5m", label: "💰 $5M Money (Match)" },
    { id: "money-1m", label: "💵 $1M Money (Match)" },
    { id: "money-10m", label: "💰 $10M Money (Match)" },
    { id: "action-house", label: "🏠 House (Match)" },
    { id: "action-hotel", label: "🏨 Hotel (Match)" },
    { id: "action-its-my-birthday", label: "🎂 It's Your Birthday (Match)" },
    { id: "action-pass-go", label: "🎲 Pass Go (Match)" },
    { id: "money-4m", label: "💵 $4M Money (Match)" },
    { id: "rent-red-yellow", label: "🔥 Rent: Red / Yellow (Match)" },
    { id: "rent-green-dark-blue", label: "🌲 Rent: Green / Dark Blue (Match)" },
    { id: "rent-brown-light-blue", label: "🍂 Rent: Brown / Light Blue (Match)" },
    { id: "rent-pink-orange", label: "🌸 Rent: Pink / Orange (Match)" },
    { id: "rent-railroad-utility", label: "🚂 Rent: Railroad / Utility (Match)" },
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
                {spotlightCard?.id === "action-just-say-no"
                  ? "Just Say No Action Card Design Verification"
                  : spotlightCard?.id === "action-double-the-rent"
                  ? "Double The Rent Action Card Design Verification"
                  : spotlightCard?.id === "rent-wild"
                  ? "Multicolor Wild Rent Card Design Verification"
                  : spotlightCard?.id === "action-house"
                  ? "House Action Card Design Verification"
                  : spotlightCard?.id === "action-hotel"
                  ? "Hotel Action Card Design Verification"
                  : spotlightCard?.id === "action-its-my-birthday"
                  ? "It's Your Birthday Action Card Design Verification"
                  : spotlightCard?.id === "action-pass-go"
                  ? "Pass Go Action Card Design Verification"
                  : spotlightCard?.id === "money-3m"
                  ? "$3M Money Card Design Verification"
                  : spotlightCard?.id === "money-5m"
                  ? "$5M Money Card Design Verification"
                  : spotlightCard?.id === "money-1m"
                  ? "$1M Money Card Design Verification"
                  : spotlightCard?.id === "money-10m"
                  ? "$10M Money Card Design Verification"
                  : spotlightCard?.type === "money"
                  ? "$4M Money Card Design Verification"
                  : spotlightCard?.id === "wild-multicolor"
                  ? "Wild Property (All Sets) Card Design Verification"
                  : spotlightCard?.type === "rent"
                  ? spotlightCard?.id === "rent-wild"
                    ? "Multicolor Wild Rent Card Design Verification"
                    : `Rent Card Design Verification (${spotlightCard?.name?.replace("Rent (", "")?.replace(")", "") || "Dual-Color"})`
                  : "Property Cards Design Verification"}
              </h2>
              <p className="hasbro-verification-desc">
                Faithfully reconstructed based on official Hasbro Monopoly Deal reference cards.
                Select any card below to verify the new Just Say No, Double The Rent, Multicolor Wild Rent, $3M Money, $5M Money, $1M Money, Wild (All Sets), $10M Money, House, Hotel, Birthday, Pass Go, $4M Money, or Rent action cards across the deck.
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
                {spotlightCard?.id === "action-debt-collector" ? (
                  <>
                    Sky blue cardstock margin, inner black frame with delicate pale cyan/ice security gradient and chevron guilloche, top-left <strong>ᴹ3</strong> coin, 3D <strong>ACTION</strong> header with cyan extrusion shadow and translucent diagonal shard, central circular baby-blue badge with <strong>DEBT COLLECTOR</strong> typography, waist-up portrait of Rich Uncle Pennybags holding a white walking cane and fanned green Monopoly banknotes with <strong>ᴹ</strong> currency mark, and bottom <strong>Collect ᴹ5 from any player.</strong> rules text.
                  </>
                ) : spotlightCard?.id === "action-sly-deal" ? (
                  <>
                    Sky blue cardstock margin, inner black frame with delicate pale cyan/ice security gradient and chevron guilloche, top-left <strong>ᴹ3</strong> coin, 3D <strong>ACTION</strong> header with cyan extrusion shadow and translucent diagonal shard, central circular baby-blue badge with running burglar Uncle Pennybags wearing black eye mask and carrying an orange burlap money sack with <strong>ᴹ</strong> currency mark, bold <strong>SLY DEAL</strong> typography, and bottom <strong>Steal one property from any player &amp; place it in front of you. You may not steal a property that&apos;s part of a complete set.</strong> rules text.
                  </>
                ) : spotlightCard?.id === "money-2m" ? (
                  <>
                    Vibrant rose/bubblegum pink cardstock margin, inner black frame with delicate pastel blush pink gradient ground and pink herringbone chevron guilloche, top-left <strong>ᴹ2</strong> coin, Rich Uncle Pennybags line-art watermark in deep crimson/rose, giant center circle badge with triple-layer contour <strong>2</strong> and double-barred <strong>ᴹ</strong>, black <strong>DEALOPOLY ® BRAND</strong> pill with rose typography, and deep rose bottom ghost watermarks.
                  </>
                ) : spotlightCard?.id === "action-just-say-no" ? (
                  <>
                    Vibrant grass green cardstock margin, inner black frame with spring green chevron guilloche, top-left <strong>ᴹ4</strong> coin, 3D <strong>ACTION</strong> header with green extrusion shadow, central circular green badge with <strong>JUST SAY</strong>, comic speech bubble with <strong>NO</strong>, Rich Uncle Pennybags smugly folding his arms with white-gloved hand, and bottom <strong>Cancel an action card played against you.</strong> rules text.
                  </>
                ) : spotlightCard?.id === "action-double-the-rent" ? (
                  <>
                    Clean ivory/cream cardstock margin, inner black frame with iridescent pastel chevron guilloche, top-left <strong>ᴹ1</strong> coin, 3D comic-book <strong>ACTION</strong> header with black extrusion shadow, central circular badge with dual orange money sacks featuring double-barred <strong>ᴹ</strong> marks and radiance bursts, bold 2-line <strong>DOUBLE THE RENT</strong> title, and bottom <strong>Play with a rent card. Collect double the rent!</strong> rules text.
                  </>
                ) : spotlightCard?.id === "rent-wild" ? (
                  <>
                    Sky blue cardstock margin, inner black frame with cyan gradient ground and chevron security guilloche, top-left <strong>ᴹ3</strong> coin, 3D <strong>ACTION</strong> header with sky blue extrusion, central concentric badge with <strong>RENT</strong>, continuous 7-color rainbow spectrum with 3D Monopoly cash stack, <strong>CHOOSE ANY COLOR</strong> banner, and authentic 4-line single-player rent collection rules.
                  </>
                ) : spotlightCard?.id === "action-house" ? (
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
                ) : spotlightCard?.id === "money-3m" ? (
                  <>
                    Vibrant cyan/sky blue cardstock margin, inner black frame with soft sky blue gradient ground and blue herringbone guilloche, top-left <strong>ᴹ3</strong> coin, Rich Uncle Pennybags line-art watermark in deep cyan, giant center circle badge with triple-layer contour <strong>3</strong> and double-barred <strong>ᴹ</strong>, black <strong>DEALOPOLY ® BRAND</strong> pill with sky blue typography, and deep cyan bottom ghost watermarks.
                  </>
                ) : spotlightCard?.id === "money-5m" ? (
                  <>
                    Vibrant violet/purple cardstock margin, inner black frame with soft lilac gradient ground and purple herringbone guilloche, top-left <strong>ᴹ5</strong> coin, Rich Uncle Pennybags line-art watermark in violet outline, giant center circle badge with triple-layer contour <strong>5</strong> and double-barred <strong>ᴹ</strong>, black <strong>DEALOPOLY ® BRAND</strong> pill with purple typography, and deep purple bottom ghost watermarks.
                  </>
                ) : spotlightCard?.id === "money-1m" ? (
                  <>
                    Ivory/cream cardstock margin, inner black frame with iridescent pastel sage and peach gradient ground, top-left <strong>ᴹ1</strong> coin, Rich Uncle Pennybags line-art watermark in sage outline, giant center circle badge with triple-layer contour <strong>1</strong> and double-barred <strong>ᴹ</strong>, black <strong>DEALOPOLY ® BRAND</strong> pill with white typography, and soft sage/peach bottom ghost watermarks.
                  </>
                ) : spotlightCard?.id === "money-10m" ? (
                  <>
                    Vibrant orange cardstock margin, inner black frame with warm apricot gradient and orange herringbone guilloche, top-left <strong>ᴹ10</strong> coin, Rich Uncle Pennybags line-art watermark in burnt orange, giant center circle badge with triple-layer contour <strong>10</strong> and double-barred <strong>ᴹ</strong>, black <strong>DEALOPOLY ® BRAND</strong> pill, and bottom ghost watermarks.
                  </>
                ) : spotlightCard?.type === "money" ? (
                  <>
                    Vibrant lime green cardstock margin, inner black frame with spring green gradient and herringbone guilloche, top-left <strong>ᴹ4</strong> coin, Rich Uncle Pennybags line-art watermark, giant <strong>10.4em</strong> center badge with triple-layer contour <strong>4</strong>, black <strong>DEALOPOLY ® BRAND</strong> pill, and bottom ghost watermarks.
                  </>
                ) : spotlightCard?.id === "wild-multicolor" ? (
                  <>
                    Authentic 50/50 card layout matching official Hasbro reference: upper 50% textual representation with vibrant rainbow header, giant 3D comic <strong>WILD</strong> &amp; <strong>PROPERTY</strong>, angled black banner with large bold <strong>USE THIS CARD AS PART OF ANY SET</strong>, 3 floating mini property cards with sparkle dashes; lower 50% joyful Rich Uncle Pennybags holding his top hat tipped completely above his bald head, white walking cane, and kicking foot with motion swoosh lines.
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
                🎯 Hasbro Accuracy Checkpoints ({spotlightCard?.id === "action-force-deal" || spotlightCard?.id === "action-forced-deal" ? "Forced Deal Action Edition" : spotlightCard?.id === "action-deal-breaker" ? "Deal Breaker Action Edition" : spotlightCard?.id === "action-debt-collector" ? "Debt Collector Action Edition" : spotlightCard?.id === "action-sly-deal" ? "Sly Deal Action Edition" : spotlightCard?.id === "money-2m" ? "$2M Money Edition" : spotlightCard?.id === "action-just-say-no" ? "Just Say No Action Edition" : spotlightCard?.id === "action-double-the-rent" ? "Double The Rent Action Edition" : spotlightCard?.id === "rent-wild" ? "Multicolor Wild Rent Edition" : spotlightCard?.id === "action-house" ? "House Action Edition" : spotlightCard?.id === "action-hotel" ? "Hotel Action Edition" : spotlightCard?.id === "action-its-my-birthday" ? "Birthday Action Edition" : spotlightCard?.id === "action-pass-go" ? "Pass Go Action Edition" : spotlightCard?.type === "money" ? "Money Edition" : spotlightCard?.type === "rent" ? "Rent Edition" : "Property Edition"})
              </div>
              {spotlightCard?.id === "action-force-deal" || spotlightCard?.id === "action-forced-deal" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Sky Blue Cardstock Margin:</strong> Exact <code>#88CEF5</code> sky blue outer cardstock margin with 3D beveled edges and drop shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Top-Left ₥3 Coin Badge:</strong> Official circular coin badge with double-barred <code>₥</code> and bold numeral <code>3</code>.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D ACTION Header:</strong> Slanted white typography with sky blue extrusion shadow (<code>#72C4ED</code>) and diagonal highlight shard.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Distressed Pennybags &amp; Property Swap:</strong> Uncle Pennybags clutching head in shock with wide eyes and drooped mustache, while players swap property deeds (Red, Orange, Green) across the table.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Dual-Line FORCED DEAL Typography:</strong> Centered two-line heavy bold uppercase typography (<code>FORCED</code> and <code>DEAL</code>) in navy <code>#1B365D</code>.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Authentic 2-Tier Rules:</strong> Primary bold text <code>Swap any one of your properties with any one of another player&apos;s.</code> with secondary line <code>You may not take a property that&apos;s part of a complete set.</code></span>
                  </div>
                </>
              ) : spotlightCard?.id === "action-deal-breaker" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Lavender Cardstock Margin:</strong> Exact <code>#BF92D3</code> orchid lavender outer cardstock margin with 3D beveled edges and soft depth.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Top-Left ₥5 Coin Badge:</strong> Official circular coin badge with double-barred <code>₥</code> and bold numeral <code>5</code>.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D ACTION Header:</strong> Slanted white typography with orchid purple extrusion shadow (<code>#A478C8</code>) and diagonal highlight shard.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Burglar Uncle Pennybags with Flying Loot:</strong> Uncle Pennybags sprinting sneakily in black burglar mask with flapping coattails, an orange burlap sack, and 3 green banknotes plus 3 color-band property deeds streaming out behind him.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Dual-Line DEAL BREAKER Typography:</strong> Centered two-line bold typography (<code>DEAL</code> and <code>BREAKER</code>) inside the circular badge.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Authentic 4-Line Rules:</strong> Primary text <code>Steal a complete property set from any player, including any buildings.</code> with secondary line <code>Place it in front of you.</code></span>
                  </div>
                </>
              ) : spotlightCard?.id === "action-debt-collector" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Sky Blue Cardstock:</strong> Exact <code>#88CEF5</code> sky blue outer border margin with 3D beveled edges and drop shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Top-Left ₥3 Coin Badge:</strong> Official circular coin badge with double-barred <code>₥</code> and bold numeral <code>3</code>.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D ACTION Header:</strong> Slanted white typography with sky blue 3D extrusion shadow (<code>#72C4ED</code>) and diagonal highlight shard.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Dual-Line DEBT COLLECTOR Title:</strong> Prominent centered bold uppercase typography at the top of the central baby-blue disc.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Debt Collector Pennybags Illustration:</strong> Rich Uncle Pennybags holding a curved white walking cane in his right hand and fanned green Monopoly cash bills in his left hand.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Authentic Description:</strong> Centered bottom rules <code>Collect ₥5 from any player.</code> with double-barred <code>₥</code> currency mark.</span>
                  </div>
                </>
              ) : spotlightCard?.id === "action-sly-deal" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Sky Blue Cardstock:</strong> Exact <code>#88CEF5</code> sky blue outer border margin with 3D beveled edges and drop shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Top-Left ₥3 Coin Badge:</strong> Official circular coin badge with double-barred <code>₥</code> and bold numeral <code>3</code>.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D ACTION Header:</strong> Slanted white typography with sky blue 3D extrusion shadow (<code>#72C4ED</code>) and diagonal highlight shard.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Burglar Uncle Pennybags Illustration:</strong> Rich Uncle Pennybags sneaking in black domino mask, white top hat with black hatband, flapping coattails, and orange burlap money sack with <code>₥</code> mark.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Bold SLY DEAL Typography:</strong> Centered two-line heavy bold uppercase title in baby blue circular badge.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Authentic 2-Tier Rules:</strong> Primary bold text <code>Steal one property from any player &amp; place it in front of you.</code> with secondary restriction <code>You may not steal a property that&apos;s part of a complete set.</code></span>
                  </div>
                </>
              ) : spotlightCard?.id === "money-2m" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Vibrant Rose Pink Cardstock:</strong> Exact <code>#F84B82</code> bubblegum/rose outer border margin with embossed cardstock bevel and tactile depth.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Blush Pink Herringbone Ground:</strong> Soft security gradient spanning pastel blush and rose pink overlaid with subtle herringbone chevron guilloche.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Triple-Layer Contoured Numeral 2:</strong> Centered numeral <code>2</code> with outer black contour, rose gap boundary, and solid black inner core.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Double-Barred ₥ Currency Symbol:</strong> Positioned cleanly to the left of the numeral <code>2</code> within the center badge.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>DEALOPOLY ® BRAND Pill:</strong> Black rectangular pill with rose pink border and rose brand typography.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Rich Uncle Pennybags &amp; Dual Ghosts:</strong> Top-right line-art watermark in deep crimson/rose (<code>#A6134E</code>) with bottom ghost <code>2</code> and <code>₥</code> currency mark.</span>
                  </div>
                </>
              ) : spotlightCard?.id === "action-just-say-no" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Vibrant Grass Green Cardstock:</strong> Exact <code>#5FA81B</code> outer border margin with 3D beveled edges and drop shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Top-Left ₥4 Coin Badge:</strong> Official circular coin badge with double-barred <code>₥</code> and bold numeral <code>4</code>.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D ACTION Header:</strong> Slanted white typography with vivid green 3D extrusion block shadow (<code>#509C12</code>).</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Comic Speech Bubble with NO:</strong> Crisp white rectangular speech balloon with directional pointer tail aimed at Uncle Pennybags&apos; mouth.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Smug Uncle Pennybags Illustration:</strong> Rich Uncle Pennybags grinning with fluffy mustache and arms folded smugly across chest in black tuxedo.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Official Rules Text:</strong> Exact Hasbro rules: <code>Cancel an action card played against you.</code></span>
                  </div>
                </>
              ) : spotlightCard?.id === "action-double-the-rent" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Clean Ivory Cardstock Margin:</strong> Exact <code>#FAF9F5</code> cardstock border with 3D beveled edges and tactile drop shadows.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Top-Left ₥1 Coin Badge:</strong> Circular badge with double-barred <code>₥</code> and bold numeral <code>1</code>.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D Comic-Book ACTION Header:</strong> Slanted heavy italic typography with deep solid black isometric extrusion block shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Dual Orange Money Sacks:</strong> Two burlap currency sacks with gathered bunch tops, double-barred <code>₥</code> emblems, and radiance accent bursts.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Bold Center Typography:</strong> High-impact 2-line title: <code>DOUBLE</code> over <code>THE RENT</code>.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Official Rules Text:</strong> Authentic Hasbro rules: <code>Play with a rent card. Collect double the rent!</code></span>
                  </div>
                </>
              ) : spotlightCard?.id === "rent-wild" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Sky Blue Cardstock Margin:</strong> Exact <code>#4EBCEB</code> / <code>#50BCEE</code> cyan cardstock border with 3D beveled edges and drop shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Top-Left ₥3 Coin Badge:</strong> Official circular coin badge with double-barred <code>₥</code> and bold numeral <code>3</code>.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D ACTION Header:</strong> Slanted comic-book typography with white letters, light cyan diagonal shard, and sky blue (<code>#42A6D8</code>) 3D extrusion block shadow.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Continuous Rainbow Spectrum:</strong> Seamless 7-color spectrum band spanning red, orange, yellow, green, cyan, royal blue, and purple.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3D Monopoly Cash Stack:</strong> Isometric green banknote stack with official Monopoly <code>₥</code> logo and white paper band.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>CHOOSE ANY COLOR &amp; 1-Player Rules:</strong> Accurate Hasbro text: <code>Choose any one player and collect rent from that player for each property you own in that color.</code></span>
                  </div>
                </>
              ) : spotlightCard?.id === "action-house" ? (
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
              ) : spotlightCard?.id === "money-3m" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Vibrant Cyan Cardstock:</strong> Exact <code>#3DB4E8</code> cyan/sky blue outer border margin with embossed cardstock bevel and tactile depth.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Sky Blue Herringbone Ground:</strong> Soft security gradient spanning cyan and sky blue overlaid with subtle blue herringbone chevron guilloche.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Triple-Layer Contoured Numeral 3:</strong> Centered numeral <code>3</code> with outer black contour, cyan gap boundary, and solid black inner core.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Double-Barred ₥ Currency Symbol:</strong> Positioned cleanly to the left of the numeral <code>3</code> within the center badge.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>DEALOPOLY ® BRAND Pill:</strong> Black rectangular pill with cyan border and cyan brand typography.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Rich Uncle Pennybags &amp; Dual Ghosts:</strong> Top-right line-art watermark in deep cyan (<code>#0E6593</code>) with bottom ghost <code>3</code> and <code>₥</code> currency mark.</span>
                  </div>
                </>
              ) : spotlightCard?.id === "money-5m" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Vibrant Purple Cardstock:</strong> Exact <code>#9B5AA4</code> medium violet outer border margin with embossed cardstock bevel and tactile depth.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Lilac Herringbone Ground:</strong> Soft security gradient spanning lavender and lilac overlaid with purple herringbone chevron guilloche.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Triple-Layer Contoured Numeral 5:</strong> Centered numeral <code>5</code> with outer black contour, purple gap boundary, and solid black inner core.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Double-Barred ₥ Currency Symbol:</strong> Positioned cleanly to the left of the numeral <code>5</code> within the center badge.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>DEALOPOLY ® BRAND Pill:</strong> Black rectangular pill with purple border and typography.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Rich Uncle Pennybags &amp; Dual Ghosts:</strong> Top-right line-art watermark in violet (<code>#5C1E68</code>) with bottom ghost <code>5</code> and <code>₥</code> currency mark.</span>
                  </div>
                </>
              ) : spotlightCard?.id === "money-1m" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Warm Ivory Cardstock:</strong> Exact <code>#FAF8F2</code> warm cream outer border margin with embossed cardstock bevel and tactile depth.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Iridescent Pastel Ground:</strong> Soft security gradient with subtle pastel sage green, peach, and ivory tones overlaid with herringbone chevron guilloche.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Triple-Layer Contoured Numeral 1:</strong> Centered numeral <code>1</code> with outer black contour, ivory gap boundary, and solid black inner core.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Double-Barred ₥ Currency Symbol:</strong> Positioned cleanly to the left of the numeral <code>1</code> within the center badge.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>DEALOPOLY ® BRAND Pill:</strong> Black rectangular pill with crisp white typography and border.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Rich Uncle Pennybags &amp; Dual Ghosts:</strong> Top-right line-art watermark in sage green (<code>#4D6D47</code>) with bottom ghost <code>1</code> and <code>₥</code> currency mark.</span>
                  </div>
                </>
              ) : spotlightCard?.id === "money-10m" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Vibrant Orange Cardstock:</strong> Exact <code>#F58220</code> outer border margin with embossed cardstock bevel and tactile depth.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Triple-Layer Contoured Numeral 10:</strong> Centered numeral <code>10</code> with outer black contour, orange gap boundary, and solid black inner core.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Double-Barred ₥ Currency Symbol:</strong> Positioned cleanly to the left of the numeral <code>10</code> within the center badge.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Rich Uncle Pennybags Watermark:</strong> Authentic top-right vector line-art watermark in burnt orange outline (<code>#B34A00</code>).</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>DEALOPOLY ® BRAND Pill:</strong> Black rectangular pill with orange border and orange brand typography.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Dual Ghost Watermarks:</strong> Giant semi-transparent <code>10</code> in bottom-left and <code>₥</code> currency emblem in bottom-right.</span>
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
                    <span><strong>DEALOPOLY ® BRAND Pill:</strong> Black rectangular pill badge with lime green border sitting directly under the central badge.</span>
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
              ) : spotlightCard?.id === "wild-multicolor" ? (
                <>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>50/50 Card Split Proportion:</strong> Textual typography and angled banner cover the upper ~50% of the card; Rich Uncle Pennybags fills the lower ~50%.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Giant 3D Comic WILD Header:</strong> Slanted heavy italic wordmark with solid black 3D shadow extrusion block, rainbow sub-header <code>PROPERTY</code>, and top rainbow banner.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Enlarged Angled Black Banner:</strong> Bold angled polygon banner featuring prominent white <code>USE THIS CARD AS PART OF ANY SET</code> typography.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>3 Floating Mini Property Cards:</strong> Red, pink, and multi-color rainbow property cards fluttering in the right black field with white action sparkle dashes.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Uncle Pennybags with Hat Above Head:</strong> Mr. Monopoly joyfully holding his white-crowned top hat tipped completely above his bald head in his right hand, white walking cane in left hand, high kicking foot with motion swoosh lines, and billowing tuxedo coattails.</span>
                  </div>
                  <div className="hasbro-checkpoint-item">
                    <span className="hasbro-checkpoint-icon">✓</span>
                    <span><strong>Zero Monetary Value:</strong> Authentic Hasbro rules design with no currency coin badge (wild properties cannot be banked or paid as cash).</span>
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
                    <span><strong>Split Color Band &amp; 3D Cash Stack:</strong> {spotlightCard?.primaryColor ? spotlightCard.primaryColor.replace("-", " ").toUpperCase() : "Red"} and {spotlightCard?.secondaryColor ? spotlightCard.secondaryColor.replace("-", " ").toUpperCase() : "Yellow"} color blocks straddled by an isometric stack of Monopoly bills with striated green edges and <code>₥</code> emblem.</span>
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
