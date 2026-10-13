import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, players, eq, and, isNull } from "@dealopoly/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));
    const sessions = Array.isArray(body?.sessions) ? body.sessions : [];

    if (sessions.length === 0) {
      return NextResponse.json({ success: true, linkedCount: 0 });
    }

    let linkedCount = 0;
    for (const item of sessions) {
      const playerId = typeof item?.playerId === "string" ? item.playerId.trim() : null;
      const sessionToken = typeof item?.token === "string" ? item.token.trim() : null;

      if (!playerId || !sessionToken) continue;

      // Verify that this player record matches the provided secret sessionToken
      // and currently has no user assigned (userId IS NULL).
      const updated = await db
        .update(players)
        .set({ userId })
        .where(
          and(
            eq(players.id, playerId),
            eq(players.sessionToken, sessionToken),
            isNull(players.userId)
          )
        )
        .returning({ id: players.id });

      if (updated.length > 0) {
        linkedCount += updated.length;
      }
    }

    return NextResponse.json({ success: true, linkedCount });
  } catch (err: unknown) {
    console.error("[MatchHistory Sync Error]", err);
    return NextResponse.json(
      { error: "Failed to sync guest matches" },
      { status: 500 }
    );
  }
}
