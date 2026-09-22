"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../../lib/use-settings";
import type { ChatMessage } from "../../lib/use-game-client";

interface ChatPlayer {
  id: string;
  name: string;
}

export interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentPlayerId: string;
  players: Record<string, { name: string }>;
  onSend: (text: string) => void;
}

const MAX_MESSAGE_LENGTH = 200;

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatInput({
  players,
  currentPlayerId,
  onSend,
}: {
  players: Record<string, { name: string }>;
  currentPlayerId: string;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<ChatPlayer[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const playerList = useMemo(() => {
    return Object.entries(players).map(([id, p]) => ({ id, name: p.name }));
  }, [players]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setText(value);

      const cursorPosition = e.target.selectionStart ?? value.length;
      const beforeCursor = value.slice(0, cursorPosition);
      const match = /@([^\s]*)$/.exec(beforeCursor);

      if (match) {
        const query = (match[1] ?? "").toLowerCase();
        const filtered = playerList.filter(
          (p) =>
            p.id !== currentPlayerId &&
            (p.name.toLowerCase().includes(query) ||
              p.id.toLowerCase().includes(query)),
        );
        setSuggestions(filtered.slice(0, 5));
        setActiveIndex(0);
      } else {
        setSuggestions([]);
      }
    },
    [playerList, currentPlayerId],
  );

  const insertMention = useCallback(
    (player: ChatPlayer) => {
      const input = inputRef.current;
      if (!input) return;

      const cursorPosition = input.selectionStart ?? text.length;
      const beforeCursor = text.slice(0, cursorPosition);
      const afterCursor = text.slice(cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf("@");

      if (lastAtIndex === -1) return;

      const newText = `${beforeCursor.slice(0, lastAtIndex)}@${player.name} ${afterCursor}`;
      setText(newText);
      setSuggestions([]);
      input.focus();
    },
    [text],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          const selected = suggestions[activeIndex];
          if (selected) {
            insertMention(selected);
          }
        } else if (e.key === "Escape") {
          setSuggestions([]);
        }
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const trimmed = text.trim();
        if (trimmed) {
          onSend(trimmed);
          setText("");
        }
      }
    },
    [suggestions, activeIndex, insertMention, text, onSend],
  );

  return (
    <div className="chat-input-container">
      {suggestions.length > 0 && (
        <ul className="chat-mention-suggestions">
          {suggestions.map((player, index) => (
            <li
              key={player.id}
              className={`chat-mention-suggestion ${index === activeIndex ? "active" : ""}`}
              onClick={() => insertMention(player)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className="chat-mention-suggestion-name">{player.name}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="chat-input-row">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-label="Chat message"
        />
        <button
          type="button"
          className="chat-send-btn"
          onClick={() => {
            const trimmed = text.trim();
            if (trimmed) {
              onSend(trimmed);
              setText("");
            }
          }}
          disabled={!text.trim()}
          aria-label="Send message"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  currentPlayerId,
  players,
  onSend,
}: ChatPanelProps) {
  const { settings } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const renderMessageText = useCallback(
    (text: string) => {
      const parts = text.split(/(@[^\s]+)/g);
      return parts.map((part, index) => {
        if (part.startsWith("@")) {
          const name = part.slice(1);
          const isMentioned = Object.values(players).some(
            (p) => p.name.toLowerCase() === name.toLowerCase(),
          );
          return isMentioned ? (
            <span key={index} className="chat-message-mention">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          );
        }
        return <span key={index}>{part}</span>;
      });
    },
    [players],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`chat-panel ${settings.animationSpeed === "reduced" ? "reduced-motion" : ""}`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="chat-header">
            <span className="chat-title">Table Chat</span>
            <button
              type="button"
              className="chat-close-btn"
              onClick={onClose}
              aria-label="Close chat"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="chat-empty-state">
                <span className="material-symbols-outlined">chat_bubble</span>
                <p>No messages yet. Say hello!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isSelf = msg.playerId === currentPlayerId;
              return (
                <div
                  key={msg.id}
                  className={`chat-message ${isSelf ? "self" : "other"}`}
                >
                  <div className="chat-message-meta">
                    <span className="chat-message-author">
                      {isSelf ? "You" : msg.playerName}
                    </span>
                    <span className="chat-message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="chat-message-bubble">{renderMessageText(msg.text)}</div>
                </div>
              );
            })}
          </div>

          <ChatInput players={players} currentPlayerId={currentPlayerId} onSend={onSend} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ChatToggle({
  isOpen,
  onClick,
  unreadCount,
}: {
  isOpen: boolean;
  onClick: () => void;
  unreadCount: number;
}) {
  return (
    <button
      type="button"
      className={`chat-toggle-btn ${unreadCount > 0 ? "has-new" : ""}`}
      onClick={onClick}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
        {isOpen ? "close" : "chat"}
      </span>
      {unreadCount > 0 && !isOpen && <span className="chat-unread-dot" />}
    </button>
  );
}
