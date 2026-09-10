"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTimeout } from "./use-timers";
import { DEFAULT_BOT_ROSTER } from "./constants";
import {
  createLeastCountGame,
  handleDiscardCards,
  handleDrawCard,
  handleDeclareShow,
  handleStartNextRound,
  getMaskedLeastCountView,
  LeastCountBotController,
  type LeastCountGameState,
  type MaskedLeastCountGameState,
  type LeastCountCommand,
} from "@dealopoly/game-engine";
import { getStoredProfile } from "./session";

export interface LeastCountLogEntry {
  id: string;
  timestamp: string;
  playerName: string;
  isBot: boolean;
  type: "discard" | "draw" | "show" | "round_start" | "round_end";
  title: string;
  description: string;
  icon: string;
}

export interface UseLeastCountClientOptions {
  roomCode?: string;
  playerId?: string;
  isLocalMode?: boolean;
  botCount?: number;
  playerName?: string;
}

export function useLeastCountClient({
  roomCode,
  playerId: initialPlayerId,
  isLocalMode = true,
  botCount = 2,
  playerName,
}: UseLeastCountClientOptions) {
  const profile = getStoredProfile();
  const playerId = initialPlayerId || profile.id;
  const activePlayerName = playerName?.trim() || profile.name || "Player";

  const [gameState, setGameState] = useState<MaskedLeastCountGameState | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<LeastCountLogEntry[]>([]);
  const [liveReelEvent, setLiveReelEvent] = useState<{
    id: string;
    icon: string;
    title: string;
    description: string;
  } | null>(null);

  const localGameRef = useRef<LeastCountGameState | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveReelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useTimeout(() => setLastError(null), lastError ? 4000 : null, lastError);

  const addLogEntry = useCallback((entry: Omit<LeastCountLogEntry, "id" | "timestamp">) => {
    const newEntry: LeastCountLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    setActionLog((prev) => [newEntry, ...prev.slice(0, 49)]);

    // Trigger Live Reel Toast
    setLiveReelEvent({
      id: newEntry.id,
      icon: newEntry.icon,
      title: newEntry.title,
      description: newEntry.description,
    });

    if (liveReelTimerRef.current) clearTimeout(liveReelTimerRef.current);
    liveReelTimerRef.current = setTimeout(() => setLiveReelEvent(null), 3500);
  }, []);

  const syncState = useCallback(() => {
    if (!localGameRef.current) return;
    const masked = getMaskedLeastCountView(localGameRef.current, playerId);
    setGameState(masked);
  }, [playerId]);

  const initLocalGame = useCallback(() => {
    setLastError(null);
    const safeCount = Math.min(Math.max(botCount, 1), 4);
    const chosenBots = DEFAULT_BOT_ROSTER.slice(0, safeCount).map((b) => ({
      id: b.id,
      name: b.name,
      isBot: true,
    }));

    const players = [
      { id: playerId, name: activePlayerName, isBot: false },
      ...chosenBots,
    ];

    const game = createLeastCountGame({
      players,
      seed: Date.now(),
    });

    localGameRef.current = game;
    setActionLog([
      {
        id: `init-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        playerName: "Game Master",
        isBot: true,
        type: "round_start",
        title: "Match Commenced",
        description: `Round 1 started with ${players.length} players! SHOW threshold is ≤ ${game.showThreshold} pts.`,
        icon: "play_circle",
      },
    ]);
    syncState();
  }, [botCount, playerId, activePlayerName, syncState]);

  // Bot Turn Automation Loop
  useEffect(() => {
    if (!localGameRef.current) return;
    const state = localGameRef.current;

    if (state.status === "completed" || state.status === "round_end") return;

    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }

    const activePlayer = state.players[state.activePlayerId];
    if (activePlayer && activePlayer.isBot && state.status === "in_progress") {
      botTimerRef.current = setTimeout(() => {
        if (!localGameRef.current) return;
        const currentActive = localGameRef.current.players[localGameRef.current.activePlayerId];
        if (!currentActive || !currentActive.isBot) return;

        const botAction = LeastCountBotController.getNextBotAction(
          localGameRef.current,
          localGameRef.current.activePlayerId,
        );

        if (botAction) {
          try {
            if (botAction.type === "declare_show") {
              const res = handleDeclareShow(localGameRef.current, botAction.playerId);
              localGameRef.current = res.state;
              addLogEntry({
                playerName: currentActive.name,
                isBot: true,
                type: "show",
                title: "SHOW Declared!",
                description: `${currentActive.name} called SHOW! Evaluating table hands...`,
                icon: "campaign",
              });
            } else if (botAction.type === "discard_cards") {
              const cardSummary = `${botAction.cardInstanceIds.length} card(s)`;
              const res = handleDiscardCards(
                localGameRef.current,
                botAction.playerId,
                botAction.cardInstanceIds,
              );
              localGameRef.current = res.state;
              addLogEntry({
                playerName: currentActive.name,
                isBot: true,
                type: "discard",
                title: "Cards Discarded",
                description: `${currentActive.name} discarded ${cardSummary}`,
                icon: "input",
              });
            } else if (botAction.type === "draw_card") {
              const res = handleDrawCard(
                localGameRef.current,
                botAction.playerId,
                botAction.source,
              );
              localGameRef.current = res.state;
              addLogEntry({
                playerName: currentActive.name,
                isBot: true,
                type: "draw",
                title: "Card Drawn",
                description: `${currentActive.name} took from ${botAction.source === "deck" ? "Draw Deck" : "Discard Pile"}`,
                icon: "style",
              });
            }
            syncState();
          } catch (err: any) {
            console.error("Bot action error:", err);
          }
        }
      }, 750);
    }

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [gameState, syncState, addLogEntry]);

  useEffect(() => {
    initLocalGame();
  }, [initLocalGame]);

  const discardCards = useCallback((cardIds: string[]) => {
    if (!localGameRef.current) return;
    try {
      const res = handleDiscardCards(localGameRef.current, playerId, cardIds);
      localGameRef.current = res.state;
      addLogEntry({
        playerName: activePlayerName,
        isBot: false,
        type: "discard",
        title: "You Discarded",
        description: `You dropped ${cardIds.length} card(s) onto the discard pile.`,
        icon: "input",
      });
      syncState();
    } catch (err: any) {
      setLastError(err.message || "Failed to discard cards");
    }
  }, [playerId, activePlayerName, syncState, addLogEntry]);

  const drawCard = useCallback((source: "deck" | "discard") => {
    if (!localGameRef.current) return;
    try {
      const res = handleDrawCard(localGameRef.current, playerId, source);
      localGameRef.current = res.state;
      addLogEntry({
        playerName: activePlayerName,
        isBot: false,
        type: "draw",
        title: "You Drew a Card",
        description: `You drew a card from the ${source === "deck" ? "Draw Deck" : "Discard Pile"}.`,
        icon: "style",
      });
      syncState();
    } catch (err: any) {
      setLastError(err.message || "Failed to draw card");
    }
  }, [playerId, activePlayerName, syncState, addLogEntry]);

  const declareShow = useCallback(() => {
    if (!localGameRef.current) return;
    try {
      const res = handleDeclareShow(localGameRef.current, playerId);
      localGameRef.current = res.state;
      addLogEntry({
        playerName: activePlayerName,
        isBot: false,
        type: "show",
        title: "You Declared SHOW!",
        description: `You declared SHOW with your hand count!`,
        icon: "campaign",
      });
      syncState();
    } catch (err: any) {
      setLastError(err.message || "Cannot declare Show");
    }
  }, [playerId, activePlayerName, syncState, addLogEntry]);

  const startNextRound = useCallback(() => {
    if (!localGameRef.current) return;
    try {
      const res = handleStartNextRound(localGameRef.current, playerId);
      localGameRef.current = res.state;
      addLogEntry({
        playerName: "Game Master",
        isBot: true,
        type: "round_start",
        title: `Round ${localGameRef.current.roundNumber} Started`,
        description: "New round dealt! All player hands replenished.",
        icon: "refresh",
      });
      syncState();
    } catch (err: any) {
      setLastError(err.message || "Cannot start next round");
    }
  }, [playerId, syncState, addLogEntry]);

  return {
    gameState,
    discardCards,
    drawCard,
    declareShow,
    startNextRound,
    resetGame: initLocalGame,
    lastError,
    actionLog,
    liveReelEvent,
  };
}
