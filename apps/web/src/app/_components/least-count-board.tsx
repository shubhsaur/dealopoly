"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardCard } from "./standard-card";
import type {
  MaskedLeastCountGameState,
  LeastCountCard,
} from "@dealopoly/game-engine";
import {
  calculateHandScore,
  validateDiscardCombination,
} from "@dealopoly/game-engine";
import { useSettings } from "../../lib/use-settings";

interface LeastCountBoardProps {
  gameState: MaskedLeastCountGameState;
  localPlayerId: string;
  onDiscard: (cardIds: string[]) => void;
  onDraw: (source: "deck" | "discard") => void;
  onDeclareShow: () => void;
  onStartNextRound?: () => void;
  onLeaveGame?: () => void;
}

export const LeastCountBoard: React.FC<LeastCountBoardProps> = ({
  gameState,
  localPlayerId,
  onDiscard,
  onDraw,
  onDeclareShow,
  onStartNextRound,
  onLeaveGame,
}) => {
  const { settings } = useSettings();
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const localPlayer = gameState.players[localPlayerId];
  const isMyTurn = gameState.activePlayerId === localPlayerId;
  const isDiscardPhase = gameState.turnPhase === "discard";
  const isDrawPhase = gameState.turnPhase === "draw";
  const isRoundEnd = gameState.status === "round_end";
  const isGameOver = gameState.status === "completed";

  const handCards = useMemo(() => localPlayer?.hand || [], [localPlayer?.hand]);

  const handScore = useMemo(() => {
    return calculateHandScore(handCards);
  }, [handCards]);

  const selectedCards = useMemo(() => {
    return handCards.filter((c) => selectedCardIds.includes(c.instanceId));
  }, [handCards, selectedCardIds]);

  const discardValidation = useMemo(() => {
    return validateDiscardCombination(selectedCards);
  }, [selectedCards]);

  const canDeclareShow = isMyTurn && isDiscardPhase && handScore <= gameState.showThreshold;

  const toggleSelectCard = (instanceId: string) => {
    if (!isMyTurn || !isDiscardPhase) return;
    setSelectedCardIds((prev) =>
      prev.includes(instanceId) ? prev.filter((id) => id !== instanceId) : [...prev, instanceId],
    );
  };

  const handleDiscardClick = () => {
    if (discardValidation.valid && selectedCardIds.length > 0) {
      onDiscard(selectedCardIds);
      setSelectedCardIds([]);
    }
  };

  const opponents = useMemo(() => {
    return gameState.playerOrder
      .filter((id) => id !== localPlayerId)
      .map((id) => gameState.players[id]!)
      .filter(Boolean);
  }, [gameState.playerOrder, gameState.players, localPlayerId]);

  return (
    <div className={`least-count-board settings-felt--${settings.tableTheme} game-anim--${settings.animationSpeed}`}>
      {/* 1. Top Opponents Strip */}
      <div className="game-opponents-strip">
        {opponents.map((opp, idx) => {
          const isOppTurn = gameState.activePlayerId === opp.id;
          return (
            <div
              key={opp.id}
              className={`game-opponent-card ${isOppTurn ? "game-opponent-card--active" : ""}`}
            >
              <div className="game-opponent-avatar-wrap">
                <div className="game-opponent-avatar">
                  {opp.isBot ? "🤖" : "👤"}
                </div>
                {isOppTurn && <div className="game-opponent-turn-glow" />}
              </div>
              <div className="game-opponent-details">
                <div className="game-opponent-name">{opp.name}</div>
                <div className="game-opponent-stats-pill">
                  <span>🎴 {opp.handCount} cards</span>
                  <span>•</span>
                  <span>🏆 {opp.score} pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Center Table Arena */}
      <div className="least-count-center-stage">
        {/* Draw Pile */}
        <div className="least-count-pile-container">
          <div className="least-count-pile-label">Draw Pile ({gameState.drawPileCount})</div>
          <StandardCard
            faceDown
            variant={settings.cardBackDesign}
            size="md"
            onClick={() => isMyTurn && isDrawPhase && onDraw("deck")}
            disabled={!isMyTurn || !isDrawPhase}
            className={isMyTurn && isDrawPhase ? "standard-card--interactive" : ""}
          />
          {isMyTurn && isDrawPhase && (
            <button
              onClick={() => onDraw("deck")}
              className="button button--primary button--sm"
              style={{ marginTop: "4px" }}
            >
              Draw Deck
            </button>
          )}
        </div>

        {/* Discard Pile */}
        <div className="least-count-pile-container">
          <div className="least-count-pile-label">Discard Pile ({gameState.discardPileCount})</div>
          <div className="least-count-discard-stack">
            {gameState.lastDiscardedCards && gameState.lastDiscardedCards.length > 0 ? (
              gameState.lastDiscardedCards.map((card, i) => (
                <StandardCard
                  key={card.instanceId || i}
                  card={card}
                  size="md"
                  onClick={() => isMyTurn && isDrawPhase && onDraw("discard")}
                  disabled={!isMyTurn || !isDrawPhase}
                />
              ))
            ) : gameState.discardPileTop ? (
              <StandardCard
                card={gameState.discardPileTop}
                size="md"
                onClick={() => isMyTurn && isDrawPhase && onDraw("discard")}
                disabled={!isMyTurn || !isDrawPhase}
              />
            ) : (
              <div className="standard-card standard-card--md standard-card--disabled" />
            )}
          </div>
          {isMyTurn && isDrawPhase && (
            <button
              onClick={() => onDraw("discard")}
              className="button button--secondary button--sm"
              style={{ marginTop: "4px" }}
            >
              Take Discard
            </button>
          )}
        </div>
      </div>

      {/* 3. Turn Guidance & Hand Points Bar */}
      <div className="least-count-points-counter">
        <div className="least-count-points-text">
          Hand Points: <span className="least-count-points-value">{handScore}</span>
        </div>
        {canDeclareShow && (
          <button
            onClick={onDeclareShow}
            className="button least-count-show-btn"
          >
            ⭐ DECLARE SHOW ({handScore} pts)
          </button>
        )}
      </div>

      {/* 4. Player Hand Section */}
      <div className="game-hand-section">
        <div className="game-hand-cards-container">
          {handCards.map((card) => {
            const isSelected = selectedCardIds.includes(card.instanceId);
            return (
              <StandardCard
                key={card.instanceId}
                card={card}
                isSelected={isSelected}
                onClick={() => toggleSelectCard(card.instanceId)}
                size="md"
                disabled={!isMyTurn || !isDiscardPhase}
              />
            );
          })}
        </div>

        {/* Discard Trigger Bar */}
        {isMyTurn && isDiscardPhase && (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px" }}>
            <button
              onClick={handleDiscardClick}
              disabled={!discardValidation.valid || selectedCardIds.length === 0}
              className="button button--primary button--sm"
            >
              📥 Discard Selected ({selectedCardIds.length})
            </button>
            {selectedCardIds.length > 0 && !discardValidation.valid && (
              <span style={{ fontSize: "0.74rem", color: "#f43f5e", alignSelf: "center" }}>
                {discardValidation.reason}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 5. Round Result Modal */}
      <AnimatePresence>
        {(isRoundEnd || isGameOver) && gameState.lastShowResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="game-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="game-modal-container"
              style={{ maxWidth: "560px", padding: "24px" }}
            >
              <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0 0 6px" }}>
                  {gameState.lastShowResult.isSuccessful ? "🎉 SUCCESSFUL SHOW!" : "💥 WRONG SHOW COUNTERED!"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
                  {gameState.lastShowResult.isSuccessful
                    ? `${gameState.players[gameState.lastShowResult.callerPlayerId]?.name} had the lowest count (${gameState.lastShowResult.callerScore} pts) and scored 0!`
                    : `${gameState.players[gameState.lastShowResult.callerPlayerId]?.name} called with ${gameState.lastShowResult.callerScore} pts but was beaten by ${
                        gameState.players[gameState.lastShowResult.winnerPlayerId]?.name
                      } (${gameState.lastShowResult.lowestScore} pts)! +${gameState.wrongShowPenalty} penalty!`}
                </p>
              </div>

              {/* Player Score Table */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0" }}>
                {gameState.playerOrder.map((pid) => {
                  const p = gameState.players[pid]!;
                  const scoreInfo = gameState.lastShowResult?.playerScores[pid];
                  const isCaller = pid === gameState.lastShowResult?.callerPlayerId;
                  const isRoundWinner = pid === gameState.lastShowResult?.winnerPlayerId;

                  return (
                    <div
                      key={pid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: isRoundWinner ? "rgba(34, 197, 94, 0.12)" : "rgba(15, 23, 42, 0.6)",
                        border: isRoundWinner ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#f8fafc" }}>
                          {p.name} {isCaller ? "(Caller)" : ""} {isRoundWinner ? "👑" : ""}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                          Hand: {scoreInfo?.handScore} pts {scoreInfo?.penaltyAdded ? `(+${scoreInfo.penaltyAdded} pts)` : "(+0 pts)"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 900, fontSize: "1.1rem", color: isRoundWinner ? "#4ade80" : "#f8fafc" }}>
                          Total: {scoreInfo?.totalScore} pts
                        </div>
                        {p.isEliminated && (
                          <span style={{ fontSize: "0.68rem", color: "#f43f5e", fontWeight: 800 }}>ELIMINATED</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
                {isGameOver ? (
                  <button
                    onClick={onLeaveGame}
                    className="button button--primary"
                  >
                    Back to Lobby
                  </button>
                ) : (
                  <button
                    onClick={onStartNextRound}
                    className="button button--primary"
                  >
                    Start Next Round ➔
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
