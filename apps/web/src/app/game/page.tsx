"use client";

import { useState, use, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useHostDisconnectTimer } from "../../lib/use-game-timers";
import { getLandingPath } from "../../lib/constants";
import { ErrorBar, GameTableShell } from "../_components/dialog-shell";
import { CardLoader } from "../_components/card-loader";
import { GameOverSummary } from "../_components/game-over-summary";
import { LeastCountGameView } from "../_components/least-count-game-view";
import { getStoredProfile, getRoomSession } from "../../lib/session";
import { useGameClient } from "../../lib/use-game-client";
import { useSpectatorSocket } from "../../lib/use-game-socket";
import { useRealisticProgress } from "../../lib/use-realistic-progress";
import { useSettings } from "../../lib/use-settings";
import { playCardSwoosh, triggerHaptic } from "../../lib/sound-effects";
import type { CardInstance, PropertySet } from "@dealopoly/game-engine";

// Extracted game-page hooks (Phase 3)
import { useGameAudio } from "./_hooks/use-game-audio";
import { useTurnNotification } from "./_hooks/use-turn-notification";
import { useReactionTimer } from "./_hooks/use-reaction-timer";
import { useLiveReelEvents } from "./_hooks/use-live-reel-events";
import { useGameActions } from "./_hooks/use-game-actions";

// Consolidated Modular Sub-Components (4 Domain Modules + Types)
import type { FlyingCardItem } from "./_components/types";
import { GameHeader, CenterStage, OpponentsStrip, PropertyField, PlayerBank, PlayerHand } from "./_components/game-board";
import { ReactionModal, PaymentModal, DiscardModal, BankVaultModal, StealNotificationModal, OpponentInspectorModal, YourPropertiesModal } from "./_components/modals";
import { ActionBottomSheet, TargetingModal, ReorganizeWildModal, MoveBuildingModal } from "./_components/actions";
import { ActivityDrawer, MobileMenuDrawer, ExitDialog, HostDisconnectedModal, RoomDestroyedModal, DeviceTransferredModal, ConfirmActionModal } from "./_components/game-drawers";
import { QuickReactionDock, ReactionBurstsOverlay } from "../_components/emoji-reactions";
import { GameSettingsDialog } from "../_components/game-settings-dialog";

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
    spectator?: string;
  }>;
}) {
  const searchParams = props.searchParams ? use(props.searchParams) : undefined;
  const gameType = searchParams?.game || "monodeal";
  const urlRoomCode = searchParams?.room;
  const urlSpectatorId = searchParams?.spectator;

  const urlPlayerId = searchParams?.player;
  const isBotMode = searchParams?.mode === "bot" || !urlRoomCode || urlRoomCode === "solo";
  const botCount = searchParams?.bots ? parseInt(searchParams.bots, 10) : undefined;
  const { data: authSession } = useSession();
  const { settings } = useSettings();
  const botDifficulty = searchParams?.difficulty || settings.defaultBotDifficulty;
  const customPlayerName = searchParams?.name;
  const isHostParam = searchParams?.isHost === "true";
  const profile = getStoredProfile();
  const session = urlRoomCode ? getRoomSession(urlRoomCode, urlPlayerId) : null;
  const playerId = session?.playerId || urlPlayerId || profile.id;
  const sessionToken = session?.token;

  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewingOpponentId, setViewingOpponentId] = useState<string | null>(null);
  const [isViewingYourProperties, setIsViewingYourProperties] = useState(false);
  const [viewingBankPlayerId, setViewingBankPlayerId] = useState<string | null>(null);

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
    deviceTransferred,
    lastError,
    sendCommand,
    leaveGame,
    switchToLocalBotMode,
    sendReaction,
    reactionBursts,
    dismissReactionBurst,
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
  const { hostSecondsRemaining, isClientRoomEnded } = useHostDisconnectTimer(roomInfo, isHost);
  const [clientRoomEnded, setClientRoomEnded] = useState(false);

  // Extracted hooks (Phase 3 — audio, notifications, timers, events, actions)
  useGameAudio(settings);
  useTurnNotification(isYourTurn, gameState?.status, actualPlayerId, gameState?.pendingResolution);
  const reactionRemainingSeconds = useReactionTimer(gameState?.pendingResolution, actualPlayerId, sendCommand);
  const { liveReelEvent, stolenAlert, setStolenAlert, unreadActivityCount, setUnreadActivityCount } =
    useLiveReelEvents(gameState, actualPlayerId, isActivityDrawerOpen);

  // Action state + handlers (extracted hook)
  const {
    targetingAction,
    setTargetingAction,
    selectedForcedDealOfferedId,
    setSelectedForcedDealOfferedId,
    selectedWildRentColor,
    setSelectedWildRentColor,
    paymentSelectedIds,
    setPaymentSelectedIds,
    discardSelectedIds,
    setDiscardSelectedIds,
    pendingConfirmAction,
    setPendingConfirmAction,
    reorganizeTarget,
    setReorganizeTarget,
    moveBuildingTarget,
    setMoveBuildingTarget,
    handleBankCard,
    handlePlayProperty,
    executePlayAction,
    handlePlayAction,
    handlePlayRent,
    handleEndTurn,
    handleReaction,
    handlePaymentSubmit,
    handleDiscardSubmit,
    handleReorganizeWild,
    handleMoveBuilding,
  } = useGameActions({
    gameState: gameState ?? null,
    actualPlayerId,
    isYourTurn,
    sendCommand,
    setSelectedCard,
    confirmPlayAction: settings.confirmPlayAction,
    autoPassTimer: settings.autoPassTimer,
  });

  // Sync clientRoomEnded from the host disconnect timer hook
  useEffect(() => {
    if (isClientRoomEnded) setClientRoomEnded(true);
  }, [isClientRoomEnded]);

  // Reset warning state when host comes back online
  useEffect(() => {
    if (hostSecondsRemaining === 0 && !isClientRoomEnded) {
      setIsHostWarningDismissed(false);
      setClientRoomEnded(false);
    }
  }, [hostSecondsRemaining, isClientRoomEnded]);

  const triggerDrawAnimation = (count: number = 2) => {
    if (!drawPileRef.current || !handContainerRef.current) return;
    if (isAnimatingDrawRef.current) return;

    isAnimatingDrawRef.current = true;
    playCardSwoosh();
    triggerHaptic("light");
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

  const landingPath = getLandingPath(roomInfo?.gameType || gameType);

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

  // Spectator mode renders a read-only view using a separate hook
  if (urlSpectatorId && urlRoomCode) {
    return <SpectatorGameView roomCode={urlRoomCode} spectatorId={urlSpectatorId} gameType={gameType} />;
  }

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

  const handleDraw = () => {
    if (!isYourTurn || gameState.turn.phase !== "draw" || gameState.pendingResolution) return;
    if (isAnimatingDrawRef.current) return;

    lastManualDrawTimestampRef.current = Date.now();
    triggerDrawAnimation(2);
    triggerHaptic("light");
    sendCommand({ type: "draw_cards", playerId: actualPlayerId });
  };

  return (
    <GameTableShell tableTheme={settings.tableTheme} animationSpeed={settings.animationSpeed}>

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
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Error Notification Bar */}
      <ErrorBar error={lastError} />

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
                onOpenPropertiesModal={() => setIsViewingYourProperties(true)}
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
          onClose={() => {
            triggerHaptic("light");
            sendCommand({ type: "cancel_discard", playerId: actualPlayerId });
            setDiscardSelectedIds([]);
          }}
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

      {/* Your Properties Table Modal */}
      <YourPropertiesModal
        isOpen={isViewingYourProperties}
        you={you || null}
        isYourTurn={isYourTurn}
        gameState={gameState}
        onClose={() => setIsViewingYourProperties(false)}
        onOpenBank={(playerId) => setViewingBankPlayerId(playerId)}
        onReorganizeTarget={setReorganizeTarget}
        onMoveBuildingTarget={setMoveBuildingTarget}
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
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* In-Game Settings Dialog (Desktop Modal + Mobile Sheet) */}
      <GameSettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gameType={gameType}
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

      {/* Device Transferred Modal */}
      <DeviceTransferredModal
        isOpen={deviceTransferred}
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

      {/* Confirm Action Play Dialog */}
      <ConfirmActionModal
        isOpen={Boolean(pendingConfirmAction)}
        cardName={pendingConfirmAction?.card.name || "Action Card"}
        cardDescription={pendingConfirmAction?.card.description}
        card={pendingConfirmAction?.card}
        onConfirm={() => {
          if (pendingConfirmAction) {
            executePlayAction(
              pendingConfirmAction.card,
              pendingConfirmAction.targetPlayerId,
              pendingConfirmAction.targetSetId,
              pendingConfirmAction.targetCardInstanceId,
              pendingConfirmAction.offeredCardInstanceId,
            );
          }
        }}
        onCancel={() => setPendingConfirmAction(null)}
      />

      {/* Activity Drawer */}
      <ActivityDrawer
        isOpen={isActivityDrawerOpen}
        history={gameState.history}
        onClose={() => setIsActivityDrawerOpen(false)}
      />

      {/* In-Game Emoji Reactions & Floating Bursts */}
      <QuickReactionDock onReact={sendReaction} />
      <ReactionBurstsOverlay
        bursts={reactionBursts}
        onBurstComplete={dismissReactionBurst}
      />
    </GameTableShell>
  );
}

// ---------------------------------------------------------------------------
// Spectator Game View — read-only observer
// ---------------------------------------------------------------------------

function SpectatorGameView({
  roomCode,
  spectatorId,
  gameType,
}: {
  roomCode: string;
  spectatorId: string;
  gameType: string;
}) {
  const { isConnected, roomInfo, gameState, lastError, roomDestroyedMessage, leaveRoom } =
    useSpectatorSocket({ roomCode, spectatorId });
  const { settings } = useSettings();
  const drawPileRef = useRef<HTMLDivElement>(null);
  const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
  const [viewingBankPlayerId, setViewingBankPlayerId] = useState<string | null>(null);

  const isGameReady = Boolean(gameState);
  const { progress, isComplete, isFinished } = useRealisticProgress({
    isReady: isGameReady,
    initialProgress: 20,
    completionDelayMs: 300,
  });

  const getLoaderText = () => {
    if (isComplete) return "Table Ready!";
    if (isConnected) return "Dealing Cards...";
    return "Connecting as Spectator...";
  };

  if (!gameState || !isFinished) {
    return (
      <CardLoader
        fullScreen
        game={gameType === "least_count" ? "lowdeck" : "monodeal"}
        size="lg"
        text={getLoaderText()}
        progress={progress}
        isComplete={isComplete}
      />
    );
  }

  const activePlayer = gameState.players[gameState.turn.activePlayerId];
  const allPlayers = gameState.playerOrder.map((id) => gameState.players[id]!);

  const handleExit = () => {
    leaveRoom();
    setTimeout(() => {
      window.location.href = getLandingPath(gameType);
    }, 50);
  };

  return (
    <GameTableShell tableTheme={settings.tableTheme} animationSpeed={settings.animationSpeed}>

      {/* Spectator Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          position: "relative",
          zIndex: 10,
          borderBottom: "1px solid var(--outline-variant)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              color: "#38bdf8",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>
            SPECTATOR
          </span>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
            Room {roomCode}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            className={`hero-badge ${isConnected ? "hero-badge--online" : ""}`}
            style={{ padding: "6px 12px", borderRadius: "999px" }}
          >
            <span
              className="badge-dot"
              style={{ background: isConnected ? "#10b981" : "#f59e0b" }}
            />
            <span className="badge-text">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
          <button
            className="button"
            onClick={handleExit}
            style={{
              padding: "6px 14px",
              fontSize: "0.8rem",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
            }}
          >
            Leave
          </button>
        </div>
      </header>

      {/* Error Bar */}
      <ErrorBar error={lastError} />

      {/* Turn Status */}
      <div
        style={{
          textAlign: "center",
          padding: "8px 16px",
          background: "rgba(0,0,0,0.2)",
          borderBottom: "1px solid var(--outline-variant)",
        }}
      >
        {gameState.status === "in_progress" ? (
          <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>
            <b style={{ color: "var(--primary)" }}>{activePlayer?.name}</b>
            {gameState.turn?.phase === "draw"
              ? " is drawing cards..."
              : gameState.turn?.phase === "action"
                ? ` — ${gameState.turn.actionsRemaining} action(s) left`
                : " is playing..."}
          </span>
        ) : (
          <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>
            Waiting for game to start...
          </span>
        )}
      </div>

      {/* Main Board — show all players as opponents */}
      <div className="game-layout-grid">
        <main className="game-main-arena">
          <OpponentsStrip
            opponents={allPlayers}
            gameState={gameState}
            roomInfo={roomInfo}
            hostSecondsRemaining={0}
            onSelectOpponent={(id) => setViewingPlayerId(id)}
          />

          <CenterStage
            drawPileRef={drawPileRef}
            isYourTurn={false}
            gameState={gameState}
            activePlayer={activePlayer}
            reactionRemainingSeconds={null}
            liveReelEvent={null}
            flyingCards={[]}
            setFlyingCards={() => {}}
            isAnimatingDrawRef={{ current: false }}
            onDraw={() => {}}
          />

          {/* Spectator info panel replaces player hand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "clamp(12px, 3vw, 24px)",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {allPlayers.map((p) => (
              <div
                key={p.id}
                onClick={() => setViewingPlayerId(p.id)}
                role="button"
                tabIndex={0}
                title={`View ${p.name}'s table`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--outline-variant)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "var(--outline-variant)";
                }}
              >
                <span
                  className={`avatar ${p.isBot ? "avatar--pink" : "avatar--blue"}`}
                  style={{ width: "28px", height: "28px", fontSize: "0.75rem" }}
                >
                  {p.name[0]?.toUpperCase()}
                </span>
                <div>
                  <b>{p.name}</b>
                  <div style={{ color: "var(--on-surface-variant)", fontSize: "0.7rem" }}>
                    {p.bankTotal}M · {p.propertySets?.length || 0} set(s) · {p.handCount || 0} cards
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Player Inspector Modal — spectator can view any player's table */}
      <OpponentInspectorModal
        viewingOpponentId={viewingPlayerId}
        opponents={allPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          handCount: p.handCount ?? 0,
          bankTotal: p.bankTotal,
          bank: p.bank,
          propertySets: p.propertySets,
        }))}
        onClose={() => setViewingPlayerId(null)}
        onOpenBank={(pid) => {
          setViewingPlayerId(null);
          setViewingBankPlayerId(pid);
        }}
      />

      {/* Bank Vault Modal — spectator can view any player's banked cards */}
      <BankVaultModal
        viewingBankPlayerId={viewingBankPlayerId}
        actualPlayerId={viewingBankPlayerId || ""}
        you={viewingBankPlayerId ? (() => {
          const p = gameState.players[viewingBankPlayerId];
          return p ? { id: p.id, name: p.name, bank: p.bank, bankTotal: p.bankTotal } : null;
        })() : null}
        gameState={gameState}
        onClose={() => setViewingBankPlayerId(null)}
      />

      {/* Room Destroyed Modal */}
      <RoomDestroyedModal
        isOpen={Boolean(roomDestroyedMessage)}
        message={roomDestroyedMessage || "The game was closed."}
        gameType={gameType}
        onExit={handleExit}
      />
    </GameTableShell>
  );
}
