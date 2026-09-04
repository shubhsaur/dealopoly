"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "./brand";
import type { GameState, MaskedGameState, CardInstance, PropertySet } from "@dealopoly/game-engine";
import { COLOR_CONFIG } from "@dealopoly/shared";

interface GameOverSummaryProps {
  gameState: GameState | MaskedGameState;
  currentPlayerId: string;
  onPlayAgain?: () => void;
  roomCode?: string;
  isBotMode?: boolean;
}

interface RankedPlayer {
  rank: number;
  id: string;
  name: string;
  isYou: boolean;
  isBot: boolean;
  bankTotal: number;
  completedSetsCount: number;
  propertySets: PropertySet[];
  totalWealth: number;
  isWinner: boolean;
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

export function GameOverSummary({
  gameState,
  currentPlayerId,
  onPlayAgain,
  roomCode,
  isBotMode = false,
}: GameOverSummaryProps) {
  const winnerId = gameState.winnerId;
  const isYouWinner = winnerId === currentPlayerId;
  const winner = winnerId ? gameState.players[winnerId] : null;

  // Generate Confetti on victory (Full page)
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{ id: number; left: number; bg: string; dur: number; delay: number; isRound: boolean }>
  >([]);

  // Generate Continuous Confetti Shower for the Winner Card
  const [winnerCardConfetti, setWinnerCardConfetti] = useState<
    Array<{
      id: number;
      left: number;
      bg: string;
      dur: number;
      delay: number;
      sizeW: number;
      sizeH: number;
      isRound: boolean;
      rotate: number;
    }>
  >([]);

  useEffect(() => {
    const victoryPalette = [
      "#ffd700", // Gold
      "#f59e0b", // Amber
      "#a8c8ff", // Light Blue
      "#3b82f6", // Royal Blue
      "#66df75", // Emerald Green
      "#10b981", // Mint
      "#ff7d7d", // Coral Red
      "#ef4444", // Ruby
      "#c084fc", // Royal Violet
      "#ffffff", // Shimmer White
    ];

    // Winner Card continuous shower pieces
    const cardShower = Array.from({ length: 65 }, (_, i) => ({
      id: i,
      left: Math.random() * 110 - 5,
      bg: victoryPalette[Math.floor(Math.random() * victoryPalette.length)] ?? "#ffd700",
      dur: Math.random() * 2.2 + 2.4,
      delay: -(Math.random() * 4.6), // Negative delay so shower is already in full flow on load!
      sizeW: Math.random() * 6 + 6,
      sizeH: Math.random() * 8 + 6,
      isRound: Math.random() > 0.65,
      rotate: Math.random() * 360,
    }));
    setWinnerCardConfetti(cardShower);

    if (isYouWinner) {
      const pagePieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        bg: victoryPalette[Math.floor(Math.random() * victoryPalette.length)] ?? "#a8c8ff",
        dur: Math.random() * 2.5 + 2.5,
        delay: -(Math.random() * 3.5),
        isRound: Math.random() > 0.5,
      }));
      setConfettiPieces(pagePieces);
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
      const completedSetsCount = (p.propertySets || []).filter((s: PropertySet) => s.isComplete).length;
      const isWinner = p.id === winnerId;

      return {
        id: p.id,
        name: p.name,
        isYou: p.id === currentPlayerId,
        isBot: !!p.isBot,
        bankTotal,
        completedSetsCount,
        propertySets: p.propertySets,
        totalWealth,
        isWinner,
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
      {/* Falling Confetti Particles for Winner */}
      {isYouWinner && (
        <div className="victory-confetti-container" aria-hidden="true">
          {confettiPieces.map((c) => (
            <div
              key={c.id}
              className="victory-confetti-piece"
              style={{
                left: `${c.left}vw`,
                backgroundColor: c.bg,
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
                borderRadius: c.isRound ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      )}

      {/* Top App Bar Header */}
      <header className="victory-top-bar">
        <div className="victory-top-brand">
          <Brand className="brand brand--app" />
        </div>
        <div className="victory-top-actions">
          <Link href={isBotMode ? "/" : "/lobby"} className="victory-icon-btn" title={isBotMode ? "Return to Home" : "Back to Lobby"}>
            <span className="material-symbols-outlined">{isBotMode ? "home" : "meeting_room"}</span>
          </Link>
          <Link href="/cards" className="victory-icon-btn" title="Card Catalogue">
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
            {/* Continuous Confetti Shower under/behind the Winner Card */}
            <div className="victory-card-confetti-shower" aria-hidden="true">
              {winnerCardConfetti.map((c) => (
                <div
                  key={c.id}
                  className="victory-card-confetti-piece"
                  style={{
                    left: `${c.left}%`,
                    backgroundColor: c.bg,
                    width: `${c.sizeW}px`,
                    height: `${c.sizeH}px`,
                    animationDuration: `${c.dur}s`,
                    animationDelay: `${c.delay}s`,
                    borderRadius: c.isRound ? "50%" : "2px",
                  }}
                />
              ))}
            </div>

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
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>
                leaderboard
              </span>
              <h3>Final Standings</h3>
            </div>

            {/* Desktop Table View */}
            <div className="victory-table-wrap victory-desktop-only">
              <table className="victory-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th style={{ textAlign: "right" }}>Bank Value</th>
                    <th style={{ textAlign: "right" }}>Sets Completed</th>
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
                            <span className={`avatar ${p.isYou ? "avatar--you" : p.isBot ? "avatar--pink" : "avatar--blue"}`} style={{ width: "30px", height: "30px", fontSize: "0.8rem" }}>
                              {p.name[0]?.toUpperCase()}
                            </span>
                            <div>
                              <strong style={{ display: "block", color: isRank1 ? "var(--primary)" : "var(--text)" }}>
                                {p.name} {p.isYou && "(You)"}
                              </strong>
                              {p.isBot && <small style={{ color: "var(--subtle)", fontSize: "0.68rem" }}>Bot AI</small>}
                            </div>
                          </div>
                        </td>
                        <td className="victory-col-bank" style={{ textAlign: "right" }}>
                          <span style={{ color: "#66df75", fontWeight: 800, fontFamily: "var(--mono)" }}>
                            ${p.bankTotal}M
                          </span>
                        </td>
                        <td className="victory-col-sets" style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                            <span style={{ fontWeight: 800, color: isRank1 ? "#ffd700" : "var(--text)" }}>
                              {p.completedSetsCount} / 3
                            </span>
                            {/* Set Color Dots */}
                            <div style={{ display: "flex", gap: "3px" }}>
                              {p.propertySets.map((s) => (
                                <span
                                  key={s.setId}
                                  title={`${s.color.toUpperCase()} (${s.cards.length}/${s.setSize})${s.isComplete ? " [Complete]" : ""}`}
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: COLOR_CONFIG[s.color]?.hex || "#0055a4",
                                    border: s.isComplete ? "1.5px solid #FFFFFF" : "none",
                                    boxShadow: s.isComplete ? "0 0 4px rgba(255,255,255,0.6)" : "none",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="victory-mobile-only victory-standings-cards">
              {rankedPlayers.map((p) => {
                const isRank1 = p.rank === 1;
                return (
                  <div
                    key={p.id}
                    className={`victory-mobile-player-card ${isRank1 ? "victory-mobile-player-card--winner" : ""}`}
                  >
                    <div className="victory-mobile-player-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className={`victory-rank-badge victory-rank-badge--${p.rank}`}>
                          {p.rank === 1 ? "1" : p.rank}
                        </span>
                        <span className={`avatar ${p.isYou ? "avatar--you" : p.isBot ? "avatar--pink" : "avatar--blue"}`} style={{ width: "32px", height: "32px", fontSize: "0.8rem" }}>
                          {p.name[0]?.toUpperCase()}
                        </span>
                        <div>
                          <strong style={{ fontSize: "0.95rem", color: isRank1 ? "var(--primary)" : "var(--text)" }}>
                            {p.name} {p.isYou && "(You)"}
                          </strong>
                          {isRank1 && (
                            <span style={{ display: "block", color: "#ffd700", fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase" }}>
                              👑 Champion
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#66df75", fontWeight: 800, fontSize: "1.05rem", fontFamily: "var(--mono)" }}>
                          ${p.bankTotal}M
                        </div>
                        <span style={{ fontSize: "0.72rem", color: isRank1 ? "#ffd700" : "var(--muted)", fontWeight: 700 }}>
                          {p.completedSetsCount} {p.completedSetsCount === 1 ? "Set" : "Sets"}
                        </span>
                      </div>
                    </div>

                    {/* Table property sets mini chips */}
                    {p.propertySets.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                        {p.propertySets.map((s) => (
                          <span
                            key={s.setId}
                            className="victory-set-chip"
                            style={{
                              backgroundColor: COLOR_CONFIG[s.color]?.hex || "#0055a4",
                              border: s.isComplete ? "2px solid #FFFFFF" : "1px solid rgba(255,255,255,0.2)",
                            }}
                          >
                            {s.color.toUpperCase()} ({s.cards.length}/{s.setSize}){s.isComplete && " ★"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
              onClick={onPlayAgain}
              className="button button--primary victory-btn-play-again"
            >
              <span className="material-symbols-outlined">replay</span>
              <span>Play Again</span>
            </button>
          ) : (
            <Link
              href={isBotMode ? "/game?mode=bot" : (roomCode ? `/lobby?room=${roomCode}` : "/lobby")}
              className="button button--primary victory-btn-play-again"
            >
              <span className="material-symbols-outlined">replay</span>
              <span>Play Again</span>
            </Link>
          )}

          <Link href={isBotMode ? "/" : "/lobby"} className="button button--ghost victory-btn-lobby">
            <span className="material-symbols-outlined">{isBotMode ? "home" : "meeting_room"}</span>
            <span>{isBotMode ? "Return to Home" : "Return to Lobby"}</span>
          </Link>
        </section>
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <nav className="victory-mobile-bottom-nav">
        <Link href="/" className="victory-bottom-nav-item">
          <span className="material-symbols-outlined">home</span>
          <span>Home</span>
        </Link>
        <Link href="/lobby" className="victory-bottom-nav-item victory-bottom-nav-item--active">
          <span className="material-symbols-outlined">group</span>
          <span>Lobby</span>
        </Link>
        <Link href="/cards" className="victory-bottom-nav-item">
          <span className="material-symbols-outlined">style</span>
          <span>Cards</span>
        </Link>
      </nav>
    </div>
  );
}
