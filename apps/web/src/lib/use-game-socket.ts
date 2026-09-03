"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BotDifficulty } from "@dealopoly/shared";
import type { MaskedGameState, GameCommand, GameEvent } from "@dealopoly/game-engine";

export interface PublicRoomSeat {
  seatIndex: number;
  playerId: string;
  name: string;
  isBot: boolean;
  isConnected: boolean;
  difficulty?: BotDifficulty;
}

export interface PublicRoomInfo {
  code: string;
  hostPlayerId: string;
  status: "lobby" | "in_progress" | "completed";
  seats: PublicRoomSeat[];
  maxSeats: number;
  isStarted: boolean;
  gameType?: string;
  config?: Record<string, unknown>;
}

export interface UseGameSocketOptions {
  roomCode: string;
  playerId: string;
  sessionToken: string;
  onGameStarted?: () => void;
}

export function useGameSocket({
  roomCode,
  playerId,
  sessionToken,
  onGameStarted,
}: UseGameSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState<PublicRoomInfo | null>(null);
  const [gameState, setGameState] = useState<MaskedGameState | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastError) return;
    const timer = setTimeout(() => setLastError(null), 4000);
    return () => clearTimeout(timer);
  }, [lastError]);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onGameStartedRef = useRef(onGameStarted);
  useEffect(() => {
    onGameStartedRef.current = onGameStarted;
  }, [onGameStarted]);

  useEffect(() => {
    if (!roomCode || !playerId || !sessionToken) return;

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
    )}&token=${encodeURIComponent(sessionToken)}`;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setLastError(null);

      // Heartbeat ping
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "ROOM_STATE":
            setRoomInfo(msg.room);
            if (msg.room.isStarted && onGameStartedRef.current) {
              onGameStartedRef.current();
            }
            break;

          case "GAME_STATE":
            setGameState(msg.state);
            break;

          case "GAME_EVENT":
            setEvents((prev) => [...prev, msg.event]);
            break;

          case "ERROR":
            setLastError(msg.message);
            break;
        }
      } catch (err) {
        // Ignore JSON parse error
      }
    };

    ws.onerror = () => {
      setLastError("Connection error. Ensure the game server is running.");
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      ws.close();
    };
  }, [roomCode, playerId, sessionToken]);

  const sendCommand = useCallback((command: GameCommand) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "COMMAND", command }));
    }
  }, []);

  const startGame = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "START_GAME" }));
    }
  }, []);

  const addBot = useCallback((difficulty?: BotDifficulty) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "ADD_BOT", difficulty }));
    }
  }, []);

  const removePlayer = useCallback((targetPlayerId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "REMOVE_PLAYER", targetPlayerId }));
    }
  }, []);

  return {
    isConnected,
    roomInfo,
    gameState,
    events,
    lastError,
    sendCommand,
    startGame,
    addBot,
    removePlayer,
  };
}
