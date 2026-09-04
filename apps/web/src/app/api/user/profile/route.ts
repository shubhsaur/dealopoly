import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users, eq } from "@dealopoly/db";

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
      updates.customTag = tag.slice(0, 32);
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
