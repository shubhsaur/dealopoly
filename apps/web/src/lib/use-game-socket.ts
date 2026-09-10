"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BotDifficulty } from "@dealopoly/shared";
import type { MaskedGameState, GameCommand, GameEvent } from "@dealopoly/game-engine";
import { useTimeout } from "./use-timers";
import { getWsBase } from "./constants";

export interface PublicRoomSeat {
  seatIndex: number;
  playerId: string;
  name: string;
  isBot: boolean;
  isConnected: boolean;
  difficulty?: BotDifficulty;
  disconnectDeadline?: number;
}

export interface PublicRoomInfo {
  code: string;
  hostPlayerId: string;
  status: "lobby" | "in_progress" | "completed";
  seats: PublicRoomSeat[];
  maxSeats: number;
  isStarted: boolean;
  isPrivate?: boolean;
  spectatorCount: number;
  gameType?: string;
  config?: Record<string, unknown>;
  hostDisconnectedUntil?: number;
}

export interface UseGameSocketOptions {
  roomCode: string;
  playerId: string;
  sessionToken: string;
  onGameStarted?: () => void;
}

export interface UseSpectatorSocketOptions {
  roomCode: string;
  spectatorId: string;
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
  const [roomDestroyedMessage, setRoomDestroyedMessage] = useState<string | null>(null);
  const [deviceTransferred, setDeviceTransferred] = useState(false);

  useTimeout(() => setLastError(null), lastError ? 4000 : null, lastError);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onGameStartedRef = useRef(onGameStarted);
  useEffect(() => {
    onGameStartedRef.current = onGameStarted;
  }, [onGameStarted]);

  useEffect(() => {
    if (!roomCode || !playerId || !sessionToken) return;

    const wsBase = getWsBase();
    // Only room code in URL — auth credentials sent via first message
    const url = `${wsBase}?room=${encodeURIComponent(roomCode)}`;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      // Send AUTH as the first message — server waits for this before processing anything
      ws.send(JSON.stringify({ type: "AUTH", player: playerId, token: sessionToken }));

      // Heartbeat ping every 10s — server responds with PONG + ROOM_STATE so clients
      // self-heal any missed push (e.g. player joining while host had a hiccup)
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 10000);
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
            if (msg.code === "ROOM_DESTROYED") {
              setRoomDestroyedMessage(msg.message || "The lobby was closed.");
            } else if (msg.code === "DEVICE_TRANSFERRED") {
              setDeviceTransferred(true);
            } else {
              setLastError(msg.message);
            }
            break;

          case "PONG":
            setIsConnected(true);
            setLastError(null);
            break;
        }
      } catch {
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

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(4000, "LEAVE_GAME");
      } else {
        socketRef.current.close();
      }
    }
  }, []);

  return {
    isConnected,
    roomInfo,
    gameState,
    events,
    lastError,
    roomDestroyedMessage,
    deviceTransferred,
    sendCommand,
    startGame,
    addBot,
    removePlayer,
    leaveRoom,
  };
}

export function useSpectatorSocket({
  roomCode,
  spectatorId,
  onGameStarted,
}: UseSpectatorSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState<PublicRoomInfo | null>(null);
  const [gameState, setGameState] = useState<MaskedGameState | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [roomDestroyedMessage, setRoomDestroyedMessage] = useState<string | null>(null);

  useTimeout(() => setLastError(null), lastError ? 4000 : null, lastError);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onGameStartedRef = useRef(onGameStarted);
  useEffect(() => {
    onGameStartedRef.current = onGameStarted;
  }, [onGameStarted]);

  useEffect(() => {
    if (!roomCode || !spectatorId) return;

    const wsBase = getWsBase();
    const url = `${wsBase}?room=${encodeURIComponent(roomCode)}`;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      // Send spectator AUTH as first message
      ws.send(JSON.stringify({ type: "AUTH", spectator: spectatorId }));

      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 10000);
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
            if (msg.code === "ROOM_DESTROYED") {
              setRoomDestroyedMessage(msg.message || "The lobby was closed.");
            } else {
              setLastError(msg.message);
            }
            break;

          case "PONG":
            setIsConnected(true);
            setLastError(null);
            break;
        }
      } catch {
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
  }, [roomCode, spectatorId]);

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(4000, "LEAVE_SPECTATE");
      } else {
        socketRef.current.close();
      }
    }
  }, []);

  return {
    isConnected,
    roomInfo,
    gameState,
    events,
    lastError,
    roomDestroyedMessage,
    leaveRoom,
  };
}
