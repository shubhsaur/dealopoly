import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users, eq, ne, ilike, and } from "@dealopoly/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    if (!tag) {
      return NextResponse.json({ error: "Missing tag parameter" }, { status: 400 });
    }

    let cleanTag = tag.trim();
    if (!cleanTag.startsWith("@") && !cleanTag.includes("#")) {
      cleanTag = `@${cleanTag}`;
    }

    const session = await auth();
    const currentUserId = session?.user?.id;

    // Check if another user already has this tag
    const conditions = [ilike(users.customTag, cleanTag)];
    if (currentUserId) {
      conditions.push(ne(users.id, currentUserId));
    }

    const existing = await db
      .select({ id: users.id, customTag: users.customTag })
      .from(users)
      .where(and(...conditions))
      .limit(1);

    const isTaken = existing.length > 0;

    return NextResponse.json({
      tag: cleanTag,
      available: !isTaken,
    });
  } catch (error) {
    console.error("[Profile Tag Check Error]", error);
    return NextResponse.json({ error: "Failed to check tag availability" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, customTag } = body;

    const updates: Partial<{ name: string; customTag: string }> = {};
    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim().slice(0, 32);
    }
    if (typeof customTag === "string" && customTag.trim()) {
      let tag = customTag.trim();
      if (!tag.startsWith("@") && !tag.includes("#")) {
        tag = `@${tag}`;
      }
      tag = tag.slice(0, 32);

      // Check if tag is already taken by another user
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(and(ilike(users.customTag, tag), ne(users.id, session.user.id)))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "This tag has already been taken. Please choose another one." },
          { status: 409 },
        );
      }

      updates.customTag = tag;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No changes provided" });
    }

    await db.update(users).set(updates).where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error("[Profile Update API Error]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
