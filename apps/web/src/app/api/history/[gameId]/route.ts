import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, games, gameEvents, players, rooms, eq, asc, inArray, or, sql } from "@dealopoly/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  props: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId } = await props.params;
    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 });
    }

    // 1. Fetch the game record
    const gameRows = await db
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
      .where(eq(games.id, gameId))
      .limit(1);

    const game = gameRows[0];
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // 2. Fetch all events for this game ordered chronologically
    const rawEvents = await db
      .select({
        id: gameEvents.id,
        sequenceNum: gameEvents.sequenceNum,
        eventType: gameEvents.eventType,
        playerId: gameEvents.playerId,
        payload: gameEvents.payload,
        occurredAt: gameEvents.occurredAt,
      })
      .from(gameEvents)
      .where(eq(gameEvents.gameId, gameId))
      .orderBy(asc(gameEvents.sequenceNum));

    // 3. Resolve all player display names for this game
    const playerIds = Array.from(
      new Set([
        ...(game.playerOrder || []),
        ...(game.winnerId ? [game.winnerId] : []),
        ...rawEvents.map((e) => e.playerId).filter(Boolean),
      ])
    ).filter(Boolean) as string[];

    const playerMap: Record<string, { id: string; name: string; isBot: boolean }> = {};
    if (playerIds.length > 0) {
      const pRows = await db
        .select({
          id: players.id,
          name: players.displayName,
          isBot: players.isBot,
        })
        .from(players)
        .where(inArray(players.id, playerIds));

      for (const p of pRows) {
        playerMap[p.id] = { id: p.id, name: p.name, isBot: p.isBot };
      }
    }

    // Format events with human-friendly message and timestamps
    const events = rawEvents.map((e) => {
      const payload = typeof e.payload === "object" && e.payload !== null ? (e.payload as Record<string, unknown>) : {};
      const playerName = e.playerId ? playerMap[e.playerId]?.name : undefined;
      const rawMsg = typeof payload["message"] === "string" ? payload["message"] : "";

      return {
        id: e.id,
        sequenceNum: e.sequenceNum,
        eventType: e.eventType,
        playerId: e.playerId,
        playerName,
        message: rawMsg || `${playerName || "Player"} performed action (${e.eventType})`,
        occurredAt: e.occurredAt,
        details: payload,
      };
    });

    return NextResponse.json({
      game: {
        id: game.id,
        gameType: game.gameType,
        seed: game.seed,
        status: game.status,
        turnCount: game.turnCount,
        playerOrder: game.playerOrder,
        winnerId: game.winnerId,
        winnerName: game.winnerId ? (playerMap[game.winnerId]?.name ?? null) : null,
        startedAt: game.startedAt,
        completedAt: game.completedAt,
        roomCode: game.roomCode,
      },
      events,
      players: playerMap,
    });
  } catch (err: unknown) {
    console.error("[MatchHistory API GameEvents Error]", err);
    return NextResponse.json(
      { error: "Failed to retrieve game events" },
      { status: 500 }
    );
  }
}
