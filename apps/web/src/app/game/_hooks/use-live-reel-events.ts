"use client";

import { useState, useEffect, useRef } from "react";
import { playCoinChime } from "../../../lib/sound-effects";
import type { CardInstance } from "@dealopoly/game-engine";
import type { MaskedGameState } from "@dealopoly/game-engine";
import type { StolenAlertState } from "../_components/types";

interface LiveReelEvent {
  id: string;
  icon: string;
  title: string;
  description: string;
}

/**
 * Processes game history to produce live reel events (notable action banners)
 * and steal alerts (when you are targeted by deal-breaker / sly-deal / forced-deal).
 * Also tracks unread activity count for the drawer badge.
 */
export function useLiveReelEvents(
  gameState: MaskedGameState | null | undefined,
  actualPlayerId: string,
  isActivityDrawerOpen: boolean,
) {
  const [liveReelEvent, setLiveReelEvent] = useState<LiveReelEvent | null>(null);
  const [stolenAlert, setStolenAlert] = useState<StolenAlertState | null>(null);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const lastSeenHistoryLengthRef = useRef(0);

  // Process new history entries for reel events + steal alerts
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

        if (
          latestNotable.type === "rent_charged" ||
          (latestNotable.type === "property_played" &&
            (latestNotable as unknown as { setCompleted?: boolean }).setCompleted)
        ) {
          playCoinChime();
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

  return { liveReelEvent, stolenAlert, setStolenAlert, unreadActivityCount, setUnreadActivityCount };
}
