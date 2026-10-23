"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { getLandingPath, getGameLabel, getCardsPath } from "../../lib/constants";
import { Brand } from "./brand";
import type { GameState, MaskedGameState, CardInstance, PropertySet } from "@dealopoly/game-engine";
import { COLOR_CONFIG } from "@dealopoly/shared";
import { playVictoryFanfare, triggerHaptic } from "../../lib/sound-effects";
import { VictoryConfetti } from "./victory-confetti";

interface GameOverSummaryProps {
  gameState: GameState | MaskedGameState;
  currentPlayerId: string;
  onPlayAgain?: () => void;
  roomCode?: string;
  isBotMode?: boolean;
  gameType?: string;
}

interface RankedPlayer {
  rank: number;
  id: string;
  name: string;
  isYou: boolean;
  isBot: boolean;
  bankTotal: number;
  completedSetsCount: number;
  completedSets: PropertySet[];
  incompleteSets: PropertySet[];
  propertySets: PropertySet[];
  totalWealth: number;
  isWinner: boolean;
  hand?: CardInstance[];
  handCount: number;
}

interface HighlightItem {
  id: string;
  turnNumber?: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  tag: string;
  title: string;
  description: string;
}

function getCardBadgeInfo(card: CardInstance) {
  const type = card.type;
  let icon = "style";
  let bg = "rgba(255, 255, 255, 0.08)";
  let color = "#E1E3E4";
  let border = "rgba(255, 255, 255, 0.15)";
  let label = card.name;
  let isWild = false;
  let isHouse = false;
  let isHotel = false;

  if (type === "action") {
    icon = "bolt";
    bg = "rgba(245, 158, 11, 0.16)";
    color = "#FCD34D";
    border = "rgba(245, 158, 11, 0.35)";
    if (card.defId === "action-deal-breaker") {
      icon = "gavel";
      color = "#FCA5A5";
      bg = "rgba(239, 68, 68, 0.22)";
      border = "rgba(239, 68, 68, 0.5)";
    } else if (card.defId === "action-just-say-no") {
      icon = "shield";
      color = "#93C5FD";
      bg = "rgba(59, 130, 246, 0.22)";
      border = "rgba(59, 130, 246, 0.5)";
    } else if (card.defId === "action-house" || card.defId === "action-hotel") {
      icon = card.defId === "action-hotel" ? "apartment" : "cottage";
      bg = "rgba(239, 68, 68, 0.16)";
      color = "#FCA5A5";
      border = "rgba(239, 68, 68, 0.35)";
      if (card.defId === "action-house") isHouse = true;
      if (card.defId === "action-hotel") isHotel = true;
    }
    label = `${card.name} ($${card.value}M)`;
  } else if (type === "rent") {
    icon = "payments";
    bg = "rgba(16, 185, 129, 0.16)";
    color = "#6EE7B7";
    border = "rgba(16, 185, 129, 0.35)";
    label = `${card.name} ($${card.value}M)`;
  } else if (type === "money") {
    icon = "attach_money";
    bg = "rgba(34, 197, 94, 0.16)";
    color = "#86EFAC";
    border = "rgba(34, 197, 94, 0.35)";
    label = `$${card.value}M Cash`;
  } else if (type === "property" || type === "property-wild") {
    icon = type === "property-wild" ? "sync_alt" : "home";
    isWild = type === "property-wild";
    const cColor = card.currentColor || card.primaryColor;
    if (cColor && COLOR_CONFIG[cColor]) {
      bg = `${COLOR_CONFIG[cColor].hex}25`;
      border = `${COLOR_CONFIG[cColor].hex}66`;
      color = COLOR_CONFIG[cColor].textHex === "#111415" ? "#FDE047" : COLOR_CONFIG[cColor].hex;
    }
    label = `${card.name} ($${card.value}M)`;
  }

  return { icon, bg, color, border, label, name: card.name, value: card.value, isWild, isHouse, isHotel };
}

function SetsShowcase({
  completedSets,
  incompleteSets,
  completedSetsCount,
  isWinner,
}: {
  completedSets: PropertySet[];
  incompleteSets: PropertySet[];
  completedSetsCount: number;
  isWinner: boolean;
}) {
  return (
    <div className="victory-sets-showcase">
      {/* Summary Badge */}
      <div className="victory-sets-summary-bar">
        <span
          className={`victory-sets-counter-badge ${isWinner ? "victory-sets-counter-badge--winner" : ""}`}
        >
          {completedSetsCount >= 3 ? "🏆 3 / 3 COMPLETED (WINNER)" : `${completedSetsCount} / 3 Sets Completed`}
        </span>
      </div>

      {/* Completed Sets in Highlight */}
      {completedSets.length > 0 && (
        <div className="victory-completed-sets-list">
          {completedSets.map((s) => {
            const cfg = COLOR_CONFIG[s.color] ?? { hex: "#0055A4", textHex: "#FFF", name: s.color };
            return (
              <div
                key={s.setId}
                className="victory-completed-set-card"
                style={{
                  borderColor: cfg.hex,
                  boxShadow: `0 0 12px ${cfg.hex}33`,
                }}
              >
                <div className="victory-completed-set-header">
                  <span
                    className="victory-completed-set-banner"
                    style={{
                      backgroundColor: cfg.hex,
                      color: cfg.textHex,
                    }}
                  >
                    ★ {cfg.name.toUpperCase()} SET ({s.cards.length}/{s.setSize})
                  </span>
                  <span className="victory-completed-badge-pill">COMPLETE</span>
                </div>

                <div className="victory-completed-set-cards">
                  {s.cards.map((c) => {
                    const isWild = c.type === "property-wild";
                    return (
                      <span
                        key={c.instanceId}
                        className={`victory-card-mini-pill ${isWild ? "victory-card-mini-pill--wild" : ""}`}
                        title={`${c.name} • Value $${c.value}M`}
                      >
                        <span
                          className="victory-card-mini-stripe"
                          style={{
                            backgroundColor: cfg.hex,
                          }}
                        />
                        {isWild && <span className="victory-card-wild-icon">🔀</span>}
                        <span className="victory-card-name-text">{c.name}</span>
                        <span className="victory-card-val-tag">${c.value}M</span>
                      </span>
                    );
                  })}
                  {s.hasHouse && (
                    <span className="victory-card-mini-pill victory-card-mini-pill--building victory-card-mini-pill--house">
                      <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>home</span>
                      <span>House (+${s.houseCard?.value ?? 3}M)</span>
                    </span>
                  )}
                  {s.hasHotel && (
                    <span className="victory-card-mini-pill victory-card-mini-pill--building victory-card-mini-pill--hotel">
                      <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>apartment</span>
                      <span>Hotel (+${s.hotelCard?.value ?? 4}M)</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-progress Sets */}
      {incompleteSets.length > 0 && (
        <div className="victory-partial-sets-wrap">
          <span className="victory-partial-sets-title">
            In Progress:
          </span>
          <div className="victory-partial-sets-list">
            {incompleteSets.map((s) => {
              const cfg = COLOR_CONFIG[s.color] ?? { hex: "#8c919d", name: s.color };
              return (
                <span
                  key={s.setId}
                  className="victory-partial-set-pill"
                  title={`${cfg.name} (${s.cards.length}/${s.setSize}): ${s.cards.map((c) => c.name).join(", ")}`}
                >
                  <span className="victory-set-dot" style={{ backgroundColor: cfg.hex }} />
                  <span>
                    {cfg.name} ({s.cards.length}/{s.setSize})
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {completedSets.length === 0 && incompleteSets.length === 0 && (
        <span className="victory-empty-sets-msg">
          No property sets placed
        </span>
      )}
    </div>
  );
}

function HandShowcase({
  hand,
  handCount,
}: {
  hand?: CardInstance[];
  handCount: number;
}) {
  if (hand && hand.length > 0) {
    return (
      <div className="victory-hand-showcase">
        <div className="victory-hand-header-tag">
          <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>pan_tool</span>
          <span>{hand.length} {hand.length === 1 ? "card" : "cards"} in hand</span>
        </div>
        <div className="victory-hand-cards-list">
          {hand.map((c) => {
            const info = getCardBadgeInfo(c);
            return (
              <span
                key={c.instanceId}
                className="victory-hand-card-chip"
                style={{
                  backgroundColor: info.bg,
                  color: info.color,
                  border: `1px solid ${info.border}`,
                }}
                title={`${c.name} (${c.type}) • Value $${c.value}M`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                  {info.icon}
                </span>
                <span className="victory-hand-chip-name">{c.name}</span>
                <span className="victory-hand-chip-value">${c.value}M</span>
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  if (hand && hand.length === 0) {
    return (
      <span className="victory-hand-empty-pill">
        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>check_circle</span>
        Empty Hand (0 cards)
      </span>
    );
  }

  return (
    <span className="victory-hand-empty-pill">
      {handCount} {handCount === 1 ? "card" : "cards"} in hand
    </span>
  );
}

export function GameOverSummary({
  gameState,
  currentPlayerId,
  onPlayAgain,
  roomCode,
  isBotMode = false,
  gameType,
}: GameOverSummaryProps) {
  const winnerId = gameState.winnerId;
  const isYouWinner = winnerId === currentPlayerId;
  const winner = winnerId ? gameState.players[winnerId] : null;

  const landingPath = getLandingPath(gameType);
  const gameName = getGameLabel(gameType);
  const cardsPath = getCardsPath(gameType);

  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    if (isYouWinner) {
      playVictoryFanfare();
      triggerHaptic("success");
    }
  }, [isYouWinner]);

  // Compute standings
  const rankedPlayers = useMemo<RankedPlayer[]>(() => {
    const playersList = Object.values(gameState.players).map((p: any) => {
      const bankTotal =
        typeof p.bankTotal === "number"
          ? p.bankTotal
          : (p.bank || []).reduce((sum: number, c: CardInstance) => sum + (c.value || 0), 0);
      
      let propValue = 0;
      (p.propertySets || []).forEach((s: PropertySet) => {
        (s.cards || []).forEach((c: CardInstance) => {
          propValue += c.value || 0;
        });
        if (s.houseCard) propValue += s.houseCard.value || 0;
        if (s.hotelCard) propValue += s.hotelCard.value || 0;
      });

      const totalWealth = bankTotal + propValue;
      const completedSets = (p.propertySets || []).filter((s: PropertySet) => s.isComplete);
      const incompleteSets = (p.propertySets || []).filter((s: PropertySet) => !s.isComplete);
      const isWinner = p.id === winnerId;
      const hand = p.hand;
      const handCount = p.hand ? p.hand.length : (p.handCount ?? 0);

      return {
        id: p.id,
        name: p.name,
        isYou: p.id === currentPlayerId,
        isBot: !!p.isBot,
        bankTotal,
        completedSetsCount: completedSets.length,
        completedSets,
        incompleteSets,
        propertySets: p.propertySets || [],
        totalWealth,
        isWinner,
        hand,
        handCount,
      };
    });

    // Sort: Winner always 1st, then by completed sets, then by total wealth, then by bank
    playersList.sort((a, b) => {
      if (a.isWinner) return -1;
      if (b.isWinner) return 1;
      if (b.completedSetsCount !== a.completedSetsCount) {
        return b.completedSetsCount - a.completedSetsCount;
      }
      return b.totalWealth - a.totalWealth;
    });

    return playersList.map((p, idx) => ({
      ...p,
      rank: idx + 1,
    }));
  }, [gameState.players, winnerId, currentPlayerId]);

  // Compute highlights from history
  const highlights = useMemo<HighlightItem[]>(() => {
    const items: HighlightItem[] = [];

    let currentTurnNum = 1;
    gameState.history.forEach((evt) => {
      if (evt.type === "turn_started" && "turnNumber" in evt) {
        currentTurnNum = (evt as { turnNumber: number }).turnNumber;
      }

      const pName = evt.playerId ? gameState.players[evt.playerId]?.name || "A player" : "A player";
      const isYou = evt.playerId === currentPlayerId;
      const actorName = isYou ? "You" : pName;

      // 1. Action Played (Deal Breaker, Sly Deal, Force Deal, Debt Collector, Birthday)
      if (evt.type === "action_played" && "actionCard" in evt) {
        const action = (evt as { actionCard: CardInstance; targetPlayerId?: string }).actionCard;
        const targetName = (evt as { targetPlayerId?: string }).targetPlayerId
          ? gameState.players[(evt as { targetPlayerId?: string }).targetPlayerId!]?.name || "an opponent"
          : "";

        if (action.defId === "action-deal-breaker") {
          items.push({
            id: evt.id,
            turnNumber: currentTurnNum,
            icon: "gavel",
            iconBg: "rgba(239, 68, 68, 0.2)",
            iconColor: "#fca5a5",
            tag: "DEAL BREAKER",
            title: `${actorName} stole a full set!`,
            description: `${actorName} played Deal Breaker${targetName ? ` against ${targetName}` : ""}.`,
          });
        } else if (action.defId === "action-sly-deal") {
          items.push({
            id: evt.id,
            turnNumber: currentTurnNum,
            icon: "swords",
            iconBg: "rgba(249, 115, 22, 0.2)",
            iconColor: "#fdba74",
            tag: "SLY DEAL",
            title: `${actorName} stole a property`,
            description: `${actorName} snatched a card${targetName ? ` from ${targetName}` : ""}.`,
          });
        } else if (action.defId === "action-force-deal" || action.defId === "action-forced-deal") {
          items.push({
            id: evt.id,
            turnNumber: currentTurnNum,
            icon: "sync_alt",
            iconBg: "rgba(168, 200, 255, 0.2)",
            iconColor: "#a8c8ff",
            tag: "FORCE DEAL",
            title: `${actorName} forced a property swap`,
            description: `${actorName} traded properties${targetName ? ` with ${targetName}` : ""}.`,
          });
        } else if (action.defId === "action-debt-collector") {
          items.push({
            id: evt.id,
            turnNumber: currentTurnNum,
            icon: "payments",
            iconBg: "rgba(39, 166, 68, 0.2)",
            iconColor: "#66df75",
            tag: "DEBT COLLECTOR",
            title: `${actorName} collected $5M`,
            description: `${actorName} demanded $5M debt collection.`,
          });
        }
      }

      // 2. Rent Charged
      if (evt.type === "rent_charged" && "amount" in evt) {
        const rentEvt = evt as { amount: number; color?: string; isDoubled?: boolean };
        if (rentEvt.amount >= 3) {
          items.push({
            id: evt.id,
            turnNumber: currentTurnNum,
            icon: "payments",
            iconBg: "rgba(39, 166, 68, 0.2)",
            iconColor: "#66df75",
            tag: rentEvt.isDoubled ? "DOUBLE RENT" : "RENT",
            title: `${actorName} charged $${rentEvt.amount}M Rent`,
            description: `${rentEvt.isDoubled ? "Double rent! " : ""}Charged $${rentEvt.amount}M on ${rentEvt.color || "property"} set.`,
          });
        }
      }

      // 3. Property Set Completed
      if (evt.type === "property_played" && "setCompleted" in evt && (evt as { setCompleted: boolean }).setCompleted) {
        const propEvt = evt as { color?: string };
        items.push({
          id: evt.id,
          turnNumber: currentTurnNum,
          icon: "star",
          iconBg: "rgba(255, 183, 125, 0.2)",
          iconColor: "#ffb77d",
          tag: "SET COMPLETED",
          title: `${actorName} completed a set!`,
          description: `Formed a complete ${propEvt.color?.toUpperCase() || ""} property set.`,
        });
      }

      // 4. Just Say No
      if (evt.type === "reaction_submitted" && "reactionCard" in evt) {
        items.push({
          id: evt.id,
          turnNumber: currentTurnNum,
          icon: "shield",
          iconBg: "rgba(168, 200, 255, 0.2)",
          iconColor: "#a8c8ff",
          tag: "JUST SAY NO",
          title: `${actorName} played Just Say No!`,
          description: `Blocked an opponent's action with a reaction counter.`,
        });
      }
    });

    // Fallbacks if history had few events
    if (items.length === 0) {
      items.push({
        id: "fb-1",
        turnNumber: 1,
        icon: "stars",
        iconBg: "rgba(168, 200, 255, 0.2)",
        iconColor: "#a8c8ff",
        tag: "MATCH CONCLUSION",
        title: `${winner?.name || "Winner"} captured the victory!`,
        description: `Achieved 3 full property sets to claim the championship.`,
      });
    }

    return items.slice(-6).reverse();
  }, [gameState.history, gameState.players, currentPlayerId, winner]);

  const winnerRanked = rankedPlayers.find((p) => p.isWinner) || rankedPlayers[0];

  return (
    <div className="victory-page-wrapper">
      {/* Falling Confetti Rain strictly for Winner (Finite, dense, silk-smooth canvas animation) */}
      {isYouWinner && <VictoryConfetti durationMs={4800} particleCount={200} />}

      {/* Top App Bar Header */}
      <header className="victory-top-bar">
        <div className="victory-top-brand">
          <Brand className="brand brand--app" />
        </div>
        <div className="victory-top-actions">
          <Link
            href={landingPath}
            className="victory-icon-btn"
            title={`Return to ${gameName}`}
          >
            <span className="material-symbols-outlined">home</span>
          </Link>
          <Link href={cardsPath} className="victory-icon-btn" title="Card Catalogue">
            <span className="material-symbols-outlined">style</span>
          </Link>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="victory-main-container">
        {/* Hero Winner Showcase Banner */}
        <section className="victory-hero-section">
          <div className="victory-hero-glow" />
          <h1 className={`victory-hero-title ${isYouWinner ? "victory-hero-title--won" : "victory-hero-title--over"}`}>
            {isYouWinner ? "VICTORY" : "GAME OVER"}
          </h1>

          <div className="victory-winner-card-container">
            <div className="victory-winner-card">
            <div className="victory-avatar-wrapper">
              {/* Dealopoly Championship Crown */}
              <div className="victory-champion-crown" aria-label="Dealopoly Champion Crown">
                <svg
                  className="victory-crown-svg"
                  viewBox="0 0 120 76"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="crown-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF2A8" />
                      <stop offset="28%" stopColor="#F59E0B" />
                      <stop offset="70%" stopColor="#D97706" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                    <linearGradient id="crown-gold-bright" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFBEB" />
                      <stop offset="50%" stopColor="#FCD34D" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                    <linearGradient id="crown-brand-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0055a4" />
                      <stop offset="100%" stopColor="#002d5c" />
                    </linearGradient>
                    <filter id="crown-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#F59E0B" floodOpacity="0.55" />
                    </filter>
                  </defs>

                  {/* Back Crown Rim */}
                  <path
                    d="M16 46 C16 46 60 54 104 46 L100 38 C60 44 20 38 20 38 Z"
                    fill="#B45309"
                    opacity="0.6"
                  />

                  {/* Main Crown Body */}
                  <path
                    d="M12 40 L24 14 L44 30 L60 4 L76 30 L96 14 L108 40 C108 50 12 50 12 40 Z"
                    fill="url(#crown-gold-grad)"
                    stroke="#B45309"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    filter="url(#crown-glow-filter)"
                  />

                  {/* Inner Crown Highlights */}
                  <path
                    d="M16 38 L26 18 L42 30 L60 10 L78 30 L94 18 L104 38"
                    fill="none"
                    stroke="url(#crown-gold-bright)"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />

                  {/* Crown Jewels on Peaks */}
                  <circle cx="24" cy="13" r="4.5" fill="#EF4444" stroke="#FFF" strokeWidth="1" />
                  <circle cx="44" cy="29" r="3.5" fill="#3B82F6" stroke="#FFF" strokeWidth="1" />
                  <circle cx="60" cy="4" r="6" fill="#FCD34D" stroke="#FFF" strokeWidth="1.5" />
                  <polygon points="60,1 62,4 60,7 58,4" fill="#FFF" />
                  <circle cx="76" cy="29" r="3.5" fill="#10B981" stroke="#FFF" strokeWidth="1" />
                  <circle cx="96" cy="13" r="4.5" fill="#EF4444" stroke="#FFF" strokeWidth="1" />

                  {/* Crown Base Band */}
                  <rect
                    x="16"
                    y="40"
                    width="88"
                    height="12"
                    rx="6"
                    fill="url(#crown-gold-bright)"
                    stroke="#B45309"
                    strokeWidth="1.5"
                  />

                  {/* Dealopoly Brand Medallion in Center */}
                  <g transform="translate(46, 32)">
                    <circle cx="14" cy="14" r="14" fill="url(#crown-gold-grad)" stroke="#FFF" strokeWidth="1.5" />
                    <circle cx="14" cy="14" r="11" fill="url(#crown-brand-blue)" />
                    {/* Dealopoly Signature "D" */}
                    <text
                      x="14"
                      y="19"
                      textAnchor="middle"
                      fill="#FFF"
                      fontSize="14"
                      fontWeight="900"
                      fontFamily="var(--display), system-ui, sans-serif"
                      letterSpacing="-0.5"
                    >
                      D
                    </text>
                  </g>

                  {/* Dealopoly Golden Ribbon Label */}
                  <g transform="translate(30, 54)">
                    <rect x="0" y="0" width="60" height="13" rx="3" fill="#002d5c" stroke="#F59E0B" strokeWidth="1" />
                    <text
                      x="30"
                      y="9.5"
                      textAnchor="middle"
                      fill="#FCD34D"
                      fontSize="7.5"
                      fontWeight="900"
                      fontFamily="var(--display), system-ui, sans-serif"
                      letterSpacing="0.8"
                    >
                      DEALOPOLY
                    </text>
                  </g>

                  {/* Sparkle Glints */}
                  <g transform="translate(14, 2)">
                    <path d="M6 0 L7 4 L11 5 L7 6 L6 10 L5 6 L1 5 L5 4 Z" fill="#FFF" opacity="0.95" />
                  </g>
                  <g transform="translate(94, 26)">
                    <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill="#FFF" opacity="0.9" />
                  </g>
                </svg>
              </div>

              <div className="victory-avatar-circle">
                <span className={`avatar ${winnerRanked?.isYou ? "avatar--you" : winnerRanked?.isBot ? "avatar--pink" : "avatar--blue"}`} style={{ width: "100%", height: "100%", fontSize: "2.4rem" }}>
                  {winnerRanked?.name[0]?.toUpperCase() || "W"}
                </span>
              </div>
              <div className="victory-winner-pill">
                <span>WINNER!</span>
              </div>
            </div>

            <h2 className="victory-winner-name">
              {winnerRanked?.name} {winnerRanked?.isYou && "(You)"}
            </h2>

            <div className="victory-wealth-badge">
              <span className="victory-wealth-main">Total Wealth: ${winnerRanked?.totalWealth || 0}M</span>
              <span className="victory-wealth-sub">
                (${winnerRanked?.bankTotal || 0}M Bank • {winnerRanked?.completedSetsCount || 3} Sets Completed)
              </span>
            </div>
          </div>
        </div>
      </section>

        {/* Standings and Highlights Grid */}
        <div className="victory-grid-layout">
          {/* Left Column: Final Standings Scoreboard */}
          <section className="victory-standings-panel">
            <div className="victory-panel-header">
              <div className="victory-panel-title-wrap">
                <div className="victory-panel-icon-badge">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    leaderboard
                  </span>
                </div>
                <div>
                  <h3 className="victory-panel-title">Final Standings</h3>
                  <p className="victory-panel-subtitle">
                    Official tournament scoreboard • Completed property sets & showdown hands
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Scroll Cue */}
            <div className="victory-table-scroll-hint">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>swap_horiz</span>
              <span>Swipe horizontally to view full match showdown</span>
            </div>

            {/* Responsive Tabular Layout for both Desktop and Mobile */}
            <div className="victory-table-wrap">
              <table className="victory-table">
                <thead>
                  <tr>
                    <th style={{ width: "65px" }}>Rank</th>
                    <th style={{ width: "175px" }}>Player</th>
                    <th style={{ width: "135px", textAlign: "right" }}>Wealth & Bank</th>
                    <th style={{ minWidth: "320px" }}>Completed Sets & Properties</th>
                    <th style={{ minWidth: "250px" }}>Cards in Hand</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedPlayers.map((p) => {
                    const isRank1 = p.rank === 1;
                    return (
                      <tr
                        key={p.id}
                        className={`victory-row ${isRank1 ? "victory-row--winner" : ""} ${p.isYou ? "victory-row--you" : ""}`}
                      >
                        <td className="victory-col-rank">
                          <span className={`victory-rank-badge victory-rank-badge--${p.rank}`}>
                            {p.rank === 1 ? "1st 👑" : p.rank === 2 ? "2nd" : p.rank === 3 ? "3rd" : `${p.rank}th`}
                          </span>
                        </td>
                        <td className="victory-col-player">
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              className={`avatar ${p.isYou ? "avatar--you" : p.isBot ? "avatar--pink" : "avatar--blue"}`}
                              style={{ width: "34px", height: "34px", fontSize: "0.85rem", flexShrink: 0 }}
                            >
                              {p.name[0]?.toUpperCase()}
                            </span>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <strong style={{ color: isRank1 ? "var(--primary)" : "var(--text)", fontSize: "0.9rem" }}>
                                  {p.name}
                                </strong>
                                {p.isYou && <span className="victory-you-badge">YOU</span>}
                              </div>
                              {isRank1 && (
                                <span className="victory-champion-tag">
                                  👑 Champion
                                </span>
                              )}
                              {p.isBot && <small style={{ color: "var(--subtle)", fontSize: "0.68rem" }}>Bot AI</small>}
                            </div>
                          </div>
                        </td>
                        <td className="victory-col-bank" style={{ textAlign: "right" }}>
                          <div className="victory-wealth-cell">
                            <span className="victory-wealth-number">${p.totalWealth}M</span>
                            <span className="victory-wealth-subtext">Bank: ${p.bankTotal}M</span>
                          </div>
                        </td>
                        <td className="victory-col-sets">
                          <SetsShowcase
                            completedSets={p.completedSets}
                            incompleteSets={p.incompleteSets}
                            completedSetsCount={p.completedSetsCount}
                            isWinner={isRank1}
                          />
                        </td>
                        <td className="victory-col-hand">
                          <HandShowcase hand={p.hand} handCount={p.handCount} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right Column: Game Highlights */}
          <section className="victory-highlights-panel">
            <div className="victory-panel-header">
              <span className="material-symbols-outlined" style={{ color: "var(--tertiary)" }}>
                movie
              </span>
              <h3>Game Highlights</h3>
            </div>

            <div className="victory-highlights-list">
              {highlights.map((h) => (
                <div key={h.id} className="victory-highlight-card">
                  <div
                    className="victory-highlight-icon-wrap"
                    style={{ backgroundColor: h.iconBg, color: h.iconColor }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      {h.icon}
                    </span>
                  </div>
                  <div className="victory-highlight-body">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span className="victory-highlight-turn">
                        {h.turnNumber ? `Turn ${h.turnNumber}` : "Key Move"}
                      </span>
                      <span className="victory-highlight-tag" style={{ color: h.iconColor }}>
                        {h.tag}
                      </span>
                    </div>
                    <strong className="victory-highlight-title">{h.title}</strong>
                    <p className="victory-highlight-desc">{h.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Bottom Actions CTA */}
        <section className="victory-actions-section">
          {onPlayAgain ? (
            <button
              type="button"
              onClick={() => {
                if (isReplaying) return;
                setIsReplaying(true);
                onPlayAgain();
              }}
              disabled={isReplaying}
              className="button button--primary victory-btn-play-again"
              style={isReplaying ? { opacity: 0.7, cursor: "wait" } : undefined}
            >
              <span className="material-symbols-outlined">{isReplaying ? "hourglass_empty" : "replay"}</span>
              <span>{isReplaying ? "Returning to Lobby..." : "Play Again"}</span>
            </button>
          ) : (
            <Link
              href={isBotMode ? `/game?mode=bot&game=${gameType === "least_count" ? "lowdeck" : (gameType || "monodeal")}` : (roomCode ? `/lobby?room=${roomCode}` : landingPath)}
              className="button button--primary victory-btn-play-again"
            >
              <span className="material-symbols-outlined">replay</span>
              <span>Play Again</span>
            </Link>
          )}

          <Link
            href="/history"
            className="button button--ghost victory-btn-lobby"
          >
            <span className="material-symbols-outlined">history</span>
            <span>Match History</span>
          </Link>

          <Link
            href={`/leaderboard?game=${gameType || "monodeal"}`}
            className="button button--ghost victory-btn-lobby"
          >
            <span className="material-symbols-outlined">leaderboard</span>
            <span>Leaderboard</span>
          </Link>

          <Link
            href={landingPath}
            className="button button--ghost victory-btn-lobby"
          >
            <span className="material-symbols-outlined">home</span>
            <span>Return to Home</span>
          </Link>
        </section>
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <nav className="victory-mobile-bottom-nav">
        <Link href={landingPath} className="victory-bottom-nav-item victory-bottom-nav-item--active">
          <span className="material-symbols-outlined">home</span>
          <span>Home</span>
        </Link>
        <Link href="/history" className="victory-bottom-nav-item">
          <span className="material-symbols-outlined">history</span>
          <span>History</span>
        </Link>
        <Link href={`/leaderboard?game=${gameType || "monodeal"}`} className="victory-bottom-nav-item">
          <span className="material-symbols-outlined">leaderboard</span>
          <span>Ranking</span>
        </Link>
        <Link href={cardsPath} className="victory-bottom-nav-item">
          <span className="material-symbols-outlined">style</span>
          <span>Cards</span>
        </Link>
      </nav>
    </div>
  );
}
