import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  db,
  games,
  rooms,
  roomSeats,
  players,
  users,
  eq,
  inArray,
  desc,
  and,
  or,
  isNull,
  sql,
} from "@dealopoly/db";
import { MarketingNav } from "../_components/marketing-nav";
import { MatchHistoryView, type PastGameItem } from "./_components/match-history-view";

export const dynamic = "force-dynamic";

export default async function MatchHistoryPage() {
  const session = await auth();

  if (!session?.user?.id && !session?.user?.email) {
    redirect("/login");
  }

  let userId = session?.user?.id;
  const userEmail = session?.user?.email
    ? session.user.email.toLowerCase().trim()
    : undefined;

  let pastGames: PastGameItem[] = [];
  let dbError: string | null = null;

  try {
    // Resolve userId by email if session token id was absent
    if (!userId && userEmail) {
      const [userRecord] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);
      if (userRecord) {
        userId = userRecord.id;
      }
    }

    // 1. Find all player IDs associated with this authenticated user by userId OR userEmail.
    // This guarantees that matches played under any display name remain permanently tied
    // to the player's account.
    const userPlayerConditions = [];
    if (userId) {
      userPlayerConditions.push(eq(players.userId, userId));
    }
    if (userEmail) {
      userPlayerConditions.push(eq(players.userEmail, userEmail));
    }

    const userPlayerRows =
      userPlayerConditions.length > 0
        ? await db
            .select({ id: players.id })
            .from(players)
            .where(or(...userPlayerConditions))
        : [];

    const userPlayerIds = userPlayerRows.map((p) => p.id);
    const userPlayerIdSet = new Set(userPlayerIds);

    // Opportunistically link missing userEmail or userId on existing player rows
    if (userId && userEmail) {
      void db
        .update(players)
        .set({ userEmail })
        .where(and(eq(players.userId, userId), isNull(players.userEmail)))
        .catch(() => {});
      void db
        .update(players)
        .set({ userId })
        .where(and(eq(players.userEmail, userEmail), isNull(players.userId)))
        .catch(() => {});
    }

    if (userPlayerIds.length > 0) {
      // 2. Find all rooms where the user was seated or was the room host
      const userSeats = await db
        .select({ roomId: roomSeats.roomId })
        .from(roomSeats)
        .where(inArray(roomSeats.playerId, userPlayerIds));

      const hostRooms = await db
        .select({ id: rooms.id })
        .from(rooms)
        .where(inArray(rooms.hostPlayerId, userPlayerIds));

      const allUserRoomIds = Array.from(
        new Set([
          ...userSeats.map((s) => s.roomId),
          ...hostRooms.map((r) => r.id),
        ])
      );

      // 3. Build query conditions:
      // A game is part of user history if:
      // - The user was the declared winner (games.winnerId IN userPlayerIds)
      // - The user was a seated participant (games.playerOrder overlaps with userPlayerIds)
      // - The game was played in a room the user hosted or is seated in
      const conditions = [
        inArray(games.winnerId, userPlayerIds),
        sql`${games.playerOrder} && ARRAY[${sql.join(
          userPlayerIds.map((id) => sql`${id}::uuid`),
          sql`, `
        )}]::uuid[]`,
      ];

      if (allUserRoomIds.length > 0) {
        conditions.push(inArray(games.roomId, allUserRoomIds));
      }

      // 4. Fetch the matched games
      const rawGames = await db
        .select({
          id: games.id,
          gameType: games.gameType,
          seed: games.seed,
          status: games.status,
          turnCount: games.turnCount,
          playerOrder: games.playerOrder,
          winnerId: games.winnerId,
          startedAt: games.startedAt,
          completedAt: games.completedAt,
          roomId: games.roomId,
          roomCode: rooms.code,
        })
        .from(games)
        .leftJoin(rooms, eq(games.roomId, rooms.id))
        .where(or(...conditions))
        .orderBy(desc(games.startedAt))
        .limit(50);

      // 5. Batch-resolve winner display names
      const winnerIds = Array.from(
        new Set(rawGames.map((g) => g.winnerId).filter(Boolean) as string[])
      );

      const winnerMap = new Map<string, string>();
      if (winnerIds.length > 0) {
        const winnerPlayers = await db
          .select({ id: players.id, name: players.displayName })
          .from(players)
          .where(inArray(players.id, winnerIds));

        for (const p of winnerPlayers) {
          if (p.name) {
            winnerMap.set(p.id, p.name);
          }
        }
      }

      pastGames = rawGames.map((g) => {
        const isVictory =
          g.status === "completed" && Boolean(g.winnerId && userPlayerIdSet.has(g.winnerId));

        return {
          id: g.id,
          gameType: g.gameType || "monodeal",
          seed: g.seed,
          status: g.status,
          turnCount: g.turnCount,
          startedAt: g.startedAt ? g.startedAt.toISOString() : new Date().toISOString(),
          completedAt: g.completedAt ? g.completedAt.toISOString() : null,
          winnerId: g.winnerId,
          winnerName: g.winnerId ? winnerMap.get(g.winnerId) ?? null : null,
          roomCode: g.roomCode || "UNKNOWN",
          playerCount: Array.isArray(g.playerOrder) ? g.playerOrder.length : 0,
          isVictory,
        };
      });
    }
  } catch (err: unknown) {
    console.error("[MatchHistory Page Query Error]", err);
    dbError = "Unable to connect to game history database. Please refresh or try again in a few moments.";
  }

  return (
    <div className="marketing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <MarketingNav activeTab="history" />

      {/* Main Content */}
      <MatchHistoryView games={pastGames} dbError={dbError} userId={userId ?? ""} />
    </div>
  );
}
