"use client";

import { useState, use, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CardLoader } from "../_components/card-loader";
import { GameOverSummary } from "../_components/game-over-summary";
import { LeastCountGameView } from "../_components/least-count-game-view";
import { getStoredProfile, getRoomSession } from "../../lib/session";
import { useGameClient } from "../../lib/use-game-client";
import { useRealisticProgress } from "../../lib/use-realistic-progress";
import type { CardColor } from "@dealopoly/shared";
import type { CardInstance, PropertySet } from "@dealopoly/game-engine";

// Consolidated Modular Sub-Components (4 Domain Modules + Types)
import type { TargetingActionState, StolenAlertState, FlyingCardItem } from "./_components/types";
import { GameHeader, CenterStage, OpponentsStrip, PropertyField, PlayerBank, PlayerHand } from "./_components/game-board";
import { ReactionModal, PaymentModal, DiscardModal, BankVaultModal, StealNotificationModal, OpponentInspectorModal } from "./_components/game-modals";
import { ActionBottomSheet, TargetingModal, ReorganizeWildModal, MoveBuildingModal } from "./_components/game-actions";
import { ActivityDrawer, MobileMenuDrawer, ExitDialog, HostDisconnectedModal, RoomDestroyedModal } from "./_components/game-drawers";

export default function GamePage(props: {
  searchParams?: Promise<{
    room?: string;
    game?: string;
    mode?: string;
    bots?: string;
    difficulty?: "easy" | "medium" | "hard" | "expert";
    player?: string;
    name?: string;
    isHost?: string;
  }>;
}) {
  const searchParams = props.searchParams ? use(props.searchParams) : undefined;
  const gameType = searchParams?.game || "monodeal";
  const urlRoomCode = searchParams?.room;
  const urlPlayerId = searchParams?.player;
  const isBotMode = searchParams?.mode === "bot" || !urlRoomCode || urlRoomCode === "solo";
  const botCount = searchParams?.bots ? parseInt(searchParams.bots, 10) : undefined;
  const botDifficulty = searchParams?.difficulty;
  const customPlayerName = searchParams?.name;
  const isHostParam = searchParams?.isHost === "true";

  const { data: authSession } = useSession();
  const profile = getStoredProfile();
  const session = urlRoomCode ? getRoomSession(urlRoomCode, urlPlayerId) : null;
  const playerId = session?.playerId || urlPlayerId || profile.id;
  const sessionToken = session?.token;

  if (gameType === "least_count") {
    return (
      <LeastCountGameView
        roomCode={urlRoomCode}
        isBotMode={isBotMode}
        botCount={botCount}
        playerName={customPlayerName}
        playerId={playerId}
        isHost={isHostParam}
      />
    );
  }

  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  const [selectedWildRentColor, setSelectedWildRentColor] = useState<CardColor | null>(null);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [liveReelEvent, setLiveReelEvent] = useState<{
    id: string;
    icon: string;
    title: string;
    description: string;
  } | null>(null);
  const lastSeenHistoryLengthRef = useRef(0);

  const [targetingAction, setTargetingAction] = useState<TargetingActionState | null>(null);
  const [selectedForcedDealOfferedId, setSelectedForcedDealOfferedId] = useState<string | null>(null);
  const [paymentSelectedIds, setPaymentSelectedIds] = useState<string[]>([]);
  const [discardSelectedIds, setDiscardSelectedIds] = useState<string[]>([]);
  const [reorganizeTarget, setReorganizeTarget] = useState<{
    card: CardInstance;
    fromSet: PropertySet;
  } | null>(null);
  const [moveBuildingTarget, setMoveBuildingTarget] = useState<{
    buildingType: "house" | "hotel";
    fromSet: PropertySet;
  } | null>(null);
  const [stolenAlert, setStolenAlert] = useState<StolenAlertState | null>(null);
  const [viewingOpponentId, setViewingOpponentId] = useState<string | null>(null);
  const [viewingBankPlayerId, setViewingBankPlayerId] = useState<string | null>(null);
  const [reactionRemainingSeconds, setReactionRemainingSeconds] = useState<number | null>(null);

  // Card Draw Flight Animation State
  const [flyingCards, setFlyingCards] = useState<FlyingCardItem[]>([]);
  const drawPileRef = useRef<HTMLDivElement>(null);
  const handContainerRef = useRef<HTMLDivElement>(null);
  const prevHandCountRef = useRef<number>(0);
  const isAnimatingDrawRef = useRef<boolean>(false);
  const lastManualDrawTimestampRef = useRef<number>(0);

  const {
    isLocal,
    isConnected,
    gameState,
    roomInfo,
    roomDestroyedMessage,
    lastError,
    sendCommand,
    leaveGame,
    switchToLocalBotMode,
  } = useGameClient({
    roomCode: isBotMode ? "solo" : urlRoomCode,
    playerId,
    sessionToken,
    isLocalMode: isBotMode,
    botCount,
    botDifficulty,
    playerName: customPlayerName,
  });

  const you = gameState?.players?.[playerId] || (gameState?.players ? Object.values(gameState.players).find((p) => !p.isBot) || Object.values(gameState.players)[0] : undefined);
  const actualPlayerId = you?.id || playerId;
  const isYourTurn = gameState?.turn?.activePlayerId === actualPlayerId;

  const isHost =
    isHostParam ||
    (Boolean(roomInfo?.hostPlayerId) &&
      (roomInfo?.hostPlayerId === actualPlayerId || roomInfo?.hostPlayerId === playerId));

  const [isHostWarningDismissed, setIsHostWarningDismissed] = useState(false);
  const [hostSecondsRemaining, setHostSecondsRemaining] = useState<number>(0);
  const [clientRoomEnded, setClientRoomEnded] = useState(false);

  // Clear any active card selection when it is not your turn
  useEffect(() => {
    if (!isYourTurn) {
      setSelectedCard(null);
    }
  }, [isYourTurn]);

  // Live countdown timer for host disconnect
  const fallbackHostDeadlineRef = useRef<number | null>(null);

  useEffect(() => {
    const hostSeat = roomInfo?.seats?.find((s: any) => s.playerId === roomInfo?.hostPlayerId);
    const isHostOffline = Boolean(
      roomInfo?.hostDisconnectedUntil || (hostSeat && hostSeat.isConnected === false)
    );

    if (!isHostOffline) {
      fallbackHostDeadlineRef.current = null;
      setHostSecondsRemaining(0);
      setIsHostWarningDismissed(false);
      setClientRoomEnded(false);
      return;
    }

    let deadline = roomInfo?.hostDisconnectedUntil ?? hostSeat?.disconnectDeadline;
    if (!deadline) {
      if (!fallbackHostDeadlineRef.current) {
        fallbackHostDeadlineRef.current = Date.now() + 5 * 60 * 1000;
      }
      deadline = fallbackHostDeadlineRef.current;
    } else {
      fallbackHostDeadlineRef.current = deadline;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadline! - Date.now()) / 1000));
      setHostSecondsRemaining(remaining);
      if (!isHost && remaining <= 0) {
        setClientRoomEnded(true);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 500);
    return () => clearInterval(timer);
  }, [isHost, roomInfo?.hostDisconnectedUntil, roomInfo?.seats, roomInfo?.hostPlayerId]);

  // Live countdown timer for reaction windows
  const hasAutoPassedReactionRef = useRef(false);
  useEffect(() => {
    if (gameState?.pendingResolution?.type === "reaction_window") {
      hasAutoPassedReactionRef.current = false;
      const deadline = (gameState.pendingResolution as any).deadline ?? (Date.now() + 7000);
      const isWaitingForYou = gameState.pendingResolution.waitingForPlayerId === actualPlayerId;

      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setReactionRemainingSeconds(remaining);
        if (remaining <= 0 && isWaitingForYou && !hasAutoPassedReactionRef.current) {
          hasAutoPassedReactionRef.current = true;
          sendCommand({
            type: "submit_reaction",
            playerId: actualPlayerId,
            action: "pass",
          });
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 200);
      return () => clearInterval(interval);
    } else {
      setReactionRemainingSeconds(null);
      hasAutoPassedReactionRef.current = false;
    }
  }, [gameState?.pendingResolution, actualPlayerId, sendCommand]);

  useEffect(() => {
    if (!gameState?.history || gameState.history.length === 0) return;
    const historyLen = gameState.history.length;

    if (historyLen > lastSeenHistoryLengthRef.current) {
      const newEvents = gameState.history.slice(lastSeenHistoryLengthRef.current);
      lastSeenHistoryLengthRef.current = historyLen;

      if (!isActivityDrawerOpen) {
        setUnreadActivityCount((prev) => prev + newEvents.length);
      }

      const latestNotable = [...newEvents].reverse().find((evt) =>
        ["action_played", "rent_charged", "property_played", "game_won", "card_banked"].includes(evt.type)
      );

      if (latestNotable) {
        let icon = "bolt";
        let title = "ACTION PLAYED";

        if (latestNotable.type === "action_played") {
          const actionDefId = (latestNotable as unknown as { actionCard?: CardInstance }).actionCard?.defId;
          if (actionDefId === "action-deal-breaker") {
            icon = "gavel";
            title = "⚡ DEAL BREAKER!";
          } else if (actionDefId === "action-just-say-no") {
            icon = "shield";
            title = "🛡️ JUST SAY NO!";
          } else if (actionDefId === "action-forced-deal" || actionDefId === "action-force-deal") {
            icon = "swap_horiz";
            title = "🔄 FORCED DEAL";
          } else if (actionDefId === "action-sly-deal") {
            icon = "visibility";
            title = "🕵️ SLY DEAL";
          } else if (actionDefId === "action-debt-collector") {
            icon = "payments";
            title = "💵 DEBT COLLECTOR";
          } else if (actionDefId === "action-its-my-birthday") {
            icon = "cake";
            title = "🎂 IT'S MY BIRTHDAY!";
          } else if (actionDefId === "action-pass-go") {
            icon = "fast_forward";
            title = "🚀 PASS GO (+2 Cards)";
          }
        } else if (latestNotable.type === "rent_charged") {
          icon = "monetization_on";
          title = "💸 RENT COLLECTED";
        } else if (latestNotable.type === "property_played") {
          if ((latestNotable as unknown as { setCompleted?: boolean }).setCompleted) {
            icon = "star";
            title = "🎉 FULL SET COMPLETED!";
          } else {
            icon = "domain";
            title = "🏠 PROPERTY PLAYED";
          }
        } else if (latestNotable.type === "game_won") {
          icon = "emoji_events";
          title = "👑 VICTORY!";
        }

        setLiveReelEvent({
          id: latestNotable.id,
          icon,
          title,
          description: latestNotable.message,
        });
      }

      for (const evt of newEvents) {
        if (evt.type === "action_played" || evt.type === "action_resolved") {
          const actionEvt = evt as unknown as {
            playerId?: string;
            initiatorPlayerId?: string;
            targetPlayerId?: string;
            actionCard?: CardInstance;
            stolenCards?: CardInstance[];
            swappedCard?: CardInstance;
          };

          const targetPlayerId = actionEvt.targetPlayerId;
          const attackerId = actionEvt.playerId || actionEvt.initiatorPlayerId;

          if (targetPlayerId === actualPlayerId && attackerId && attackerId !== actualPlayerId) {
            const defId = actionEvt.actionCard?.defId;
            if (
              defId === "action-deal-breaker" ||
              defId === "action-sly-deal" ||
              defId === "action-forced-deal" ||
              defId === "action-force-deal"
            ) {
              const isPendingReaction = gameState?.pendingResolution?.type === "reaction_window";
              if (evt.type === "action_resolved" || !isPendingReaction) {
                const attackerName = gameState.players[attackerId]?.name || "Opponent";
                const actionType =
                  defId === "action-deal-breaker"
                    ? "deal_breaker"
                    : defId === "action-sly-deal"
                    ? "sly_deal"
                    : "forced_deal";

                const actionName =
                  actionType === "deal_breaker"
                    ? "Deal Breaker"
                    : actionType === "sly_deal"
                    ? "Sly Deal"
                    : "Forced Deal";

                setStolenAlert({
                  id: evt.id,
                  attackerName,
                  actionName,
                  actionDefId: defId,
                  actionCard: actionEvt.actionCard,
                  stolenCards: actionEvt.stolenCards || [],
                  swappedCard: actionEvt.swappedCard,
                  type: actionType,
                });
              }
            }
          }
        }
      }
    }
  }, [gameState?.history, gameState?.pendingResolution, isActivityDrawerOpen, actualPlayerId, gameState?.players]);

  // Auto-dismiss liveReelEvent after 1 second
  useEffect(() => {
    if (!liveReelEvent) return;
    const timer = setTimeout(() => {
      setLiveReelEvent(null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [liveReelEvent]);

  const triggerDrawAnimation = (count: number = 2) => {
    if (!drawPileRef.current || !handContainerRef.current) return;
    if (isAnimatingDrawRef.current) return;

    isAnimatingDrawRef.current = true;
    const drawRect = drawPileRef.current.getBoundingClientRect();
    const handRect = handContainerRef.current.getBoundingClientRect();

    const startX = drawRect.left + (drawRect.width - 84) / 2;
    const startY = drawRect.top + (drawRect.height - 122) / 2;

    const targetCenterX = handRect.left + handRect.width / 2 - 42;
    const targetCenterY = handRect.top + 16;

    const newCards: FlyingCardItem[] = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const spreadOffset = (i - (count - 1) / 2) * 36;
      const endX = targetCenterX + spreadOffset;
      const endY = targetCenterY;
      const rotate = (i - (count - 1) / 2) * 9;

      newCards.push({
        id: `fly-${now}-${i}-${Math.random()}`,
        startX,
        startY,
        endX,
        endY,
        delay: i * 0.15,
        rotate,
      });
    }

    setFlyingCards(newCards);

    // Fail-safe cleanup to guarantee ref and state reset even if animation callbacks drop
    const totalDuration = (count * 0.15 + 0.85) * 1000;
    setTimeout(() => {
      isAnimatingDrawRef.current = false;
      setFlyingCards([]);
    }, totalDuration);
  };

  // Watch for passive hand draws (e.g. Pass Go action card played during action phase)
  useEffect(() => {
    const currentHandCount = you?.hand?.length || 0;
    const prevCount = prevHandCountRef.current;
    prevHandCountRef.current = currentHandCount;

    // Check if a manual draw from the main deck occurred recently (< 2500ms)
    const isRecentManualDraw = Date.now() - lastManualDrawTimestampRef.current < 2500;

    if (prevCount > 0 && currentHandCount > prevCount && isYourTurn && !isRecentManualDraw) {
      const drawnCount = currentHandCount - prevCount;
      if (!isAnimatingDrawRef.current) {
        triggerDrawAnimation(Math.min(drawnCount, 5));
      }
    }
  }, [you?.hand?.length, isYourTurn]);

  // Automatically end turn when player has played all 3 actions and no pending resolution is in flight
  useEffect(() => {
    if (!gameState || gameState.status !== "in_progress") return;

    const isCurrentActive = isYourTurn && gameState.turn?.activePlayerId === actualPlayerId;
    const isActionPhase = gameState.turn?.phase === "action";
    const allActionsUsed = gameState.turn?.actionsRemaining === 0;
    const noPendingAction = !gameState.pendingResolution;

    if (isCurrentActive && isActionPhase && allActionsUsed && noPendingAction) {
      const timer = setTimeout(() => {
        if (
          gameState.status === "in_progress" &&
          gameState.turn?.activePlayerId === actualPlayerId &&
          gameState.turn?.phase === "action" &&
          gameState.turn?.actionsRemaining === 0 &&
          !gameState.pendingResolution
        ) {
          sendCommand({ type: "end_turn", playerId: actualPlayerId });
          setSelectedCard(null);
        }
      }, 550);

      return () => clearTimeout(timer);
    }
  }, [
    gameState?.status,
    gameState?.turn?.activePlayerId,
    gameState?.turn?.phase,
    gameState?.turn?.actionsRemaining,
    gameState?.pendingResolution,
    isYourTurn,
    actualPlayerId,
    sendCommand,
  ]);

  const landingPath =
    gameType === "least_count" ||
    gameType === "lowdeck" ||
    roomInfo?.gameType === "least_count" ||
    roomInfo?.gameType === "lowdeck"
      ? "/lowdeck"
      : "/monodeal";

  const handleExitGame = useCallback(() => {
    if (!isBotMode) {
      leaveGame();
    }
    setTimeout(() => {
      window.location.href = landingPath;
    }, 50);
  }, [isBotMode, leaveGame, landingPath]);

  const handlePlayAgain = () => {
    if (isBotMode) {
      window.location.href = `/game?mode=bot&game=${gameType}`;
    } else if (urlRoomCode) {
      window.location.href = `/lobby?room=${urlRoomCode}`;
    } else {
      window.location.href = landingPath;
    }
  };

  const isGameReady = Boolean(gameState);
  const { progress, isComplete, isFinished } = useRealisticProgress({
    isReady: isGameReady,
    initialProgress: 20,
    completionDelayMs: 300,
  });

  const getGameLoaderText = () => {
    if (isComplete) return "Table Ready!";
    if (isConnected) return "Dealing Cards...";
    return "Connecting to Game Table...";
  };

  if (!gameState || !isFinished) {
    return (
      <CardLoader
        fullScreen
        game={gameType === "least_count" ? "lowdeck" : "monodeal"}
        size="lg"
        text={getGameLoaderText()}
        progress={progress}
        isComplete={isComplete}
      />
    );
  }

  if (gameState.status === "completed") {
    return (
      <GameOverSummary
        gameState={gameState}
        currentPlayerId={actualPlayerId}
        onPlayAgain={handlePlayAgain}
        roomCode={urlRoomCode}
        isBotMode={isBotMode}
        gameType={gameType}
      />
    );
  }

  const activePlayer = gameState.players[gameState.turn.activePlayerId];
  const pending = gameState.pendingResolution;

  const opponents = gameState.playerOrder
    .filter((id) => id !== actualPlayerId)
    .map((id) => gameState.players[id]!);

  // Action Handlers
  const handleDraw = () => {
    if (!isYourTurn || gameState.turn.phase !== "draw" || gameState.pendingResolution) return;
    if (isAnimatingDrawRef.current) return;

    lastManualDrawTimestampRef.current = Date.now();
    triggerDrawAnimation(2);
    sendCommand({ type: "draw_cards", playerId: actualPlayerId });
  };

  const handleBankCard = (card: CardInstance) => {
    if (gameState.pendingResolution) return;
    sendCommand({ type: "bank_card", playerId: actualPlayerId, cardInstanceId: card.instanceId });
    setSelectedCard(null);
  };

  const handlePlayProperty = (card: CardInstance, chosenColor?: CardColor, targetSetId?: string) => {
    if (gameState.pendingResolution) return;
    sendCommand({
      type: "play_property",
      playerId: actualPlayerId,
      cardInstanceId: card.instanceId,
      chosenColor,
      targetSetId,
    });
    setSelectedCard(null);
  };

  const handlePlayAction = (
    card: CardInstance,
    targetPlayerId?: string,
    targetSetId?: string,
    targetCardInstanceId?: string,
    offeredCardInstanceId?: string,
  ) => {
    if (gameState.pendingResolution) return;
    sendCommand({
      type: "play_action",
      playerId: actualPlayerId,
      cardInstanceId: card.instanceId,
      targetPlayerId,
      targetSetId,
      targetCardInstanceId,
      offeredCardInstanceId,
    });
    setSelectedCard(null);
    setTargetingAction(null);
    setSelectedForcedDealOfferedId(null);
  };

  const handlePlayRent = (
    card: CardInstance,
    chosenColor: CardColor,
    targetPlayerId?: string,
    doubleRentCardInstanceId?: string,
  ) => {
    if (gameState.pendingResolution) return;
    sendCommand({
      type: "play_rent",
      playerId: actualPlayerId,
      rentCardInstanceId: card.instanceId,
      chosenColor,
      targetPlayerId,
      doubleRentCardInstanceId,
    });
    setSelectedCard(null);
    setTargetingAction(null);
    setSelectedWildRentColor(null);
  };

  const handleEndTurn = () => {
    if (gameState.pendingResolution) return;
    sendCommand({ type: "end_turn", playerId: actualPlayerId });
    setSelectedCard(null);
  };

  const handleReaction = (action: "just_say_no" | "pass" | "extend_timer", jsnCardId?: string) => {
    sendCommand({
      type: "submit_reaction",
      playerId: actualPlayerId,
      action,
      justSayNoCardInstanceId: jsnCardId,
    });
  };

  const handlePaymentSubmit = () => {
    sendCommand({
      type: "submit_payment",
      playerId: actualPlayerId,
      paymentCardInstanceIds: paymentSelectedIds,
    });
    setPaymentSelectedIds([]);
  };

  const handleDiscardSubmit = () => {
    sendCommand({
      type: "discard_cards",
      playerId: actualPlayerId,
      cardInstanceIds: discardSelectedIds,
    });
    setDiscardSelectedIds([]);
  };

  const handleReorganizeWild = (cardInstanceId: string, fromSetId: string, newColor: CardColor) => {
    sendCommand({
      type: "reorganize_wild",
      playerId: actualPlayerId,
      cardInstanceId,
      fromSetId,
      newColor,
    });
  };

  const handleMoveBuilding = (buildingType: "house" | "hotel", fromSetId: string, toSetId: string) => {
    sendCommand({
      type: "move_building",
      playerId: actualPlayerId,
      buildingType,
      fromSetId,
      toSetId,
    });
  };

  return (
    <div className="game-table-shell">
      <div className="texture-overlay" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }} />

      {/* Top App Bar */}
      <GameHeader
        roomCode={urlRoomCode}
        isYourTurn={isYourTurn}
        gameState={gameState}
        activePlayer={activePlayer}
        isConnected={isConnected}
        isLocal={isLocal}
        unreadActivityCount={unreadActivityCount}
        hostSecondsRemaining={!isHost ? hostSecondsRemaining : 0}
        roomInfo={roomInfo}
        onOpenHostModal={() => setIsHostWarningDismissed(false)}
        onOpenActivityDrawer={() => {
          setIsActivityDrawerOpen(true);
          setUnreadActivityCount(0);
        }}
        onOpenExitDialog={() => setIsExitDialogOpen(true)}
      />

      {/* Error Notification Bar */}
      {lastError && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            background: "#93000a",
            border: "1px solid #ffb4ab",
            color: "#ffdad6",
            padding: "6px 16px",
            borderRadius: "999px",
            fontSize: "0.78rem",
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          }}
        >
          {lastError}
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="game-layout-grid">
        <main className="game-main-arena">
          <OpponentsStrip
            opponents={opponents}
            gameState={gameState}
            roomInfo={roomInfo}
            hostSecondsRemaining={!isHost ? hostSecondsRemaining : 0}
            onSelectOpponent={(oppId) => setViewingOpponentId(oppId)}
          />

          <CenterStage
            drawPileRef={drawPileRef}
            isYourTurn={isYourTurn}
            gameState={gameState}
            activePlayer={activePlayer}
            reactionRemainingSeconds={reactionRemainingSeconds}
            liveReelEvent={liveReelEvent}
            flyingCards={flyingCards}
            setFlyingCards={setFlyingCards}
            isAnimatingDrawRef={isAnimatingDrawRef}
            onDraw={handleDraw}
          />

          <div className="game-player-table-stage">
            <div className="game-player-assets-row">
              <PlayerBank
                bankCount={you?.bank?.length || 0}
                bankTotal={you?.bankTotal || 0}
                onOpenVault={() => setViewingBankPlayerId(actualPlayerId)}
              />

              <PropertyField
                you={you || null}
                isYourTurn={isYourTurn}
                gameState={gameState}
                onReorganizeTarget={setReorganizeTarget}
                onMoveBuildingTarget={setMoveBuildingTarget}
              />
            </div>

            <PlayerHand
              handContainerRef={handContainerRef}
              you={you || null}
              isYourTurn={isYourTurn}
              gameState={gameState}
              selectedCard={selectedCard}
              setSelectedCard={setSelectedCard}
              onEndTurn={handleEndTurn}
            />
          </div>
        </main>
      </div>

      {/* Action Choice Bottom Sheet */}
      <ActionBottomSheet
        selectedCard={selectedCard}
        you={you || null}
        gameState={gameState}
        onClose={() => setSelectedCard(null)}
        onPlayProperty={handlePlayProperty}
        onBankCard={handleBankCard}
        onPlayAction={handlePlayAction}
        onPlayRent={handlePlayRent}
        onSetTargetingAction={setTargetingAction}
        setSelectedWildRentColor={setSelectedWildRentColor}
      />

      {/* Target Selection Modal */}
      <TargetingModal
        targetingAction={targetingAction}
        you={you || null}
        opponents={opponents}
        gameState={gameState}
        selectedWildRentColor={selectedWildRentColor}
        setSelectedWildRentColor={setSelectedWildRentColor}
        selectedForcedDealOfferedId={selectedForcedDealOfferedId}
        setSelectedForcedDealOfferedId={setSelectedForcedDealOfferedId}
        setTargetingAction={setTargetingAction}
        onPlayAction={handlePlayAction}
        onPlayRent={handlePlayRent}
      />

      {/* Reaction Window Modal */}
      {pending?.type === "reaction_window" && (
        <ReactionModal
          pending={pending}
          actualPlayerId={actualPlayerId}
          gameState={gameState}
          you={you || null}
          reactionRemainingSeconds={reactionRemainingSeconds}
          onReaction={handleReaction}
        />
      )}

      {/* Payment Resolution Modal */}
      {pending?.type === "payment" && (
        <PaymentModal
          pending={pending}
          actualPlayerId={actualPlayerId}
          gameState={gameState}
          you={you || null}
          paymentSelectedIds={paymentSelectedIds}
          setPaymentSelectedIds={setPaymentSelectedIds}
          onSubmitPayment={handlePaymentSubmit}
        />
      )}

      {/* Discard Resolution Modal */}
      {pending?.type === "discard" && (
        <DiscardModal
          pending={pending}
          actualPlayerId={actualPlayerId}
          you={you || null}
          discardSelectedIds={discardSelectedIds}
          setDiscardSelectedIds={setDiscardSelectedIds}
          onSubmitDiscard={handleDiscardSubmit}
        />
      )}

      {/* Bank Vault Modal */}
      <BankVaultModal
        viewingBankPlayerId={viewingBankPlayerId}
        actualPlayerId={actualPlayerId}
        you={you || null}
        gameState={gameState}
        onClose={() => setViewingBankPlayerId(null)}
      />

      {/* Targeted Steal Notification Modal */}
      <StealNotificationModal
        stolenAlert={stolenAlert}
        onDismiss={() => setStolenAlert(null)}
      />

      {/* Opponent Table View Modal */}
      <OpponentInspectorModal
        viewingOpponentId={viewingOpponentId}
        opponents={opponents}
        onClose={() => setViewingOpponentId(null)}
        onOpenBank={(oppId) => setViewingBankPlayerId(oppId)}
      />

      {/* Rearrange Wildcard Modal */}
      <ReorganizeWildModal
        reorganizeTarget={reorganizeTarget}
        you={you || null}
        onClose={() => setReorganizeTarget(null)}
        onReorganize={handleReorganizeWild}
      />

      {/* Move Building Modal */}
      <MoveBuildingModal
        moveBuildingTarget={moveBuildingTarget}
        you={you || null}
        onClose={() => setMoveBuildingTarget(null)}
        onMoveBuilding={handleMoveBuilding}
      />

      {/* Mobile Navigation Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        playerName={you?.name}
        isLocal={isLocal}
        roomCode={urlRoomCode}
        isConnected={isConnected}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenExitDialog={() => setIsExitDialogOpen(true)}
      />

      {/* Host Disconnected Warning Modal (shown only 30s before lobby destruction) */}
      <HostDisconnectedModal
        isOpen={!isHost && hostSecondsRemaining > 0 && hostSecondsRemaining <= 30 && !isHostWarningDismissed}
        secondsRemaining={hostSecondsRemaining}
        onDismiss={() => setIsHostWarningDismissed(true)}
      />

      {/* Room Destroyed / Game Closed Modal */}
      <RoomDestroyedModal
        isOpen={Boolean(roomDestroyedMessage || clientRoomEnded)}
        message={roomDestroyedMessage || "The game was abandoned due to host inactivity."}
        gameType={gameType}
        onExit={handleExitGame}
      />

      {/* Exit Game Confirmation Dialog */}
      <ExitDialog
        isOpen={isExitDialogOpen}
        isBotMode={isBotMode}
        isHost={isHost}
        gameType={gameType}
        onClose={() => setIsExitDialogOpen(false)}
        onConfirmExit={handleExitGame}
      />

      {/* Activity Drawer */}
      <ActivityDrawer
        isOpen={isActivityDrawerOpen}
        history={gameState.history}
        onClose={() => setIsActivityDrawerOpen(false)}
      />
    </div>
  );
}
