"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createGame,
  applyCommand,
  getMaskedView,
  BotController,
  type GameState,
  type MaskedGameState,
  type GameCommand,
} from "@dealopoly/game-engine";
import { parseBotDifficulty, type BotDifficulty } from "@dealopoly/shared";
import { getStoredProfile } from "./session";

export interface UseGameClientOptions {
  roomCode?: string;
  playerId?: string;
  sessionToken?: string;
  isLocalMode?: boolean;
  botCount?: number;
  botDifficulty?: BotDifficulty;
  playerName?: string;
}

const DEFAULT_BOT_ROSTER = [
  { id: "bot-atlas", name: "Bot Atlas" },
  { id: "bot-nova", name: "Bot Nova" },
  { id: "bot-orion", name: "Bot Orion" },
  { id: "bot-luna", name: "Bot Luna" },
];

export function useGameClient({
  roomCode,
  playerId: initialPlayerId,
  sessionToken,
  isLocalMode = false,
  botCount = 2,
  botDifficulty = "medium",
  playerName,
}: UseGameClientOptions) {
  const profile = getStoredProfile();
  const playerId = initialPlayerId || profile.id;
  const activePlayerName = playerName?.trim() || profile.name;

  const [isLocal, setIsLocal] = useState(isLocalMode || !roomCode || roomCode === "solo");
  const [isConnected, setIsConnected] = useState(isLocal);
  const [gameState, setGameState] = useState<MaskedGameState | null>(null);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastError) return;
    const timer = setTimeout(() => setLastError(null), 4000);
    return () => clearTimeout(timer);
  }, [lastError]);

  // Local State Machine
  const localGameRef = useRef<GameState | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WebSocket Reference for Multiplayer
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize Local Game
  const initLocalGame = useCallback(() => {
    setIsLocal(true);
    setIsConnected(true);
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

    const rawGame = createGame({
      gameId: `solo-${Date.now()}`,
      players,
    });

    localGameRef.current = rawGame;
    setGameState(getMaskedView(rawGame, playerId));
  }, [playerId, activePlayerName, botCount]);

  // Local Bot Execution Loop
  const triggerLocalBotStep = useCallback(() => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
    }

    const raw = localGameRef.current;
    const hasPendingAction = !!raw?.pendingResolution;
    // Faster response (350ms) for reactions/payments/discards so turns feel snappy
    const defaultDelay = botDifficulty === "easy" ? 1100 : botDifficulty === "hard" ? 450 : 750;
    const delay = hasPendingAction ? 350 : defaultDelay;

    botTimerRef.current = setTimeout(() => {
      const currentRaw = localGameRef.current;
      if (!currentRaw || currentRaw.status !== "in_progress") return;

      // Determine which bot needs to act
      let targetBotId: string | null = null;

      if (currentRaw.pendingResolution?.type === "reaction_window") {
        const waitingId = currentRaw.pendingResolution.waitingForPlayerId;
        if (currentRaw.players[waitingId]?.isBot) {
          targetBotId = waitingId;
        }
      } else if (currentRaw.pendingResolution?.type === "payment") {
        const debtorId = currentRaw.pendingResolution.debtorPlayerId;
        if (currentRaw.players[debtorId]?.isBot) {
          targetBotId = debtorId;
        }
      } else if (currentRaw.pendingResolution?.type === "discard") {
        const pId = currentRaw.pendingResolution.playerId;
        if (currentRaw.players[pId]?.isBot) {
          targetBotId = pId;
        }
      } else if (currentRaw.players[currentRaw.turn.activePlayerId]?.isBot) {
        targetBotId = currentRaw.turn.activePlayerId;
      }

      if (!targetBotId) return;

      const botCommand = BotController.getNextBotAction(
        currentRaw,
        targetBotId,
        parseBotDifficulty(botDifficulty),
      );
      if (botCommand) {
        try {
          const result = applyCommand(currentRaw, botCommand);
          localGameRef.current = result.nextState;
          setGameState(getMaskedView(result.nextState, playerId));

          // Chain next bot step
          triggerLocalBotStep();
        } catch (err) {
          console.error("Local bot command execution failed:", err, botCommand);
          // Fallback auto-recovery: if bot failed to submit payment, auto-surrender table assets
          if (currentRaw.pendingResolution?.type === "payment" && currentRaw.pendingResolution.debtorPlayerId === targetBotId) {
            try {
              const debtor = currentRaw.players[targetBotId];
              const fallbackCards = debtor ? [...debtor.bank, ...debtor.propertySets.flatMap((s) => s.cards)].filter((c) => c.value > 0).map((c) => c.instanceId) : [];
              const fallbackCmd: GameCommand = {
                type: "submit_payment",
                playerId: targetBotId,
                paymentCardInstanceIds: fallbackCards,
              };
              const result = applyCommand(currentRaw, fallbackCmd);
              localGameRef.current = result.nextState;
              setGameState(getMaskedView(result.nextState, playerId));
              triggerLocalBotStep();
            } catch (fallbackErr) {
              console.error("Fallback bot payment error:", fallbackErr);
            }
          } else if (currentRaw.pendingResolution?.type === "reaction_window" && currentRaw.pendingResolution.waitingForPlayerId === targetBotId) {
            try {
              const fallbackCmd: GameCommand = {
                type: "submit_reaction",
                playerId: targetBotId,
                action: "pass",
              };
              const result = applyCommand(currentRaw, fallbackCmd);
              localGameRef.current = result.nextState;
              setGameState(getMaskedView(result.nextState, playerId));
              triggerLocalBotStep();
            } catch (fallbackErr) {
              console.error("Fallback bot reaction error:", fallbackErr);
            }
          }
        }
      }
    }, delay);
  }, [playerId, botDifficulty]);

  // Apply Command (Local or Remote)
  const sendCommand = useCallback(
    (command: GameCommand) => {
      if (isLocal) {
        const raw = localGameRef.current;
        if (!raw) return;

        try {
          const result = applyCommand(raw, command);
          localGameRef.current = result.nextState;
          setGameState(getMaskedView(result.nextState, playerId));
          setLastError(null);

          // Trigger bot reactions/turns if needed
          triggerLocalBotStep();
        } catch (err: unknown) {
          setLastError(err instanceof Error ? err.message : "Invalid move");
        }
      } else {
        // Send via WebSocket
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: "COMMAND", command }));
        }
      }
    },
    [isLocal, playerId, triggerLocalBotStep],
  );

  // Setup mode
  useEffect(() => {
    if (isLocalMode || !roomCode || roomCode === "solo") {
      initLocalGame();
      return;
    }

    // Multiplayer mode via WebSocket
    setIsLocal(false);
    setIsConnected(false);

    const serverUrl =
      process.env.NEXT_PUBLIC_WS_BASE ||
      (process.env.NEXT_PUBLIC_GAME_SERVER_URL
        ? process.env.NEXT_PUBLIC_GAME_SERVER_URL.replace(/^http/, "ws") + "/ws"
        : null);

    const wsBase =
      serverUrl ||
      (typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "ws://localhost:4000/ws"
        : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);

    const url = `${wsBase}?room=${encodeURIComponent(roomCode)}&player=${encodeURIComponent(
      playerId,
    )}&token=${encodeURIComponent(sessionToken || "guest")}`;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    let pingInterval: ReturnType<typeof setInterval>;

    ws.onopen = () => {
      setIsConnected(true);
      setLastError(null);

      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "GAME_STATE") {
          setGameState(msg.state);
        } else if (msg.type === "ROOM_STATE") {
          setRoomInfo(msg.room);
        } else if (msg.type === "ERROR") {
          if (msg.code === "ROOM_DESTROYED") {
             if (typeof window !== "undefined") {
               window.location.href = `/?error=${encodeURIComponent(msg.message)}`;
             }
          } else {
             setLastError(msg.message);
          }
        }
      } catch {
        // Ignore parse error
      }
    };

    ws.onerror = () => {
      setLastError("Connection error. Ensure the game server is running.");
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingInterval) clearInterval(pingInterval);
    };

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      ws.close();
    };
  }, [roomCode, playerId, sessionToken, isLocalMode, initLocalGame]);

  return {
    isLocal,
    isConnected,
    gameState,
    roomInfo,
    lastError,
    sendCommand,
    switchToLocalBotMode: initLocalGame,
  };
}
