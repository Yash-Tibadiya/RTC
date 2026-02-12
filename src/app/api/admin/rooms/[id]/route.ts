import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rooms } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const { id } = params;

    // In strict mode or larger apps, validate body with Zod
    const body = await req.json();
    const { roomName, description, ttlSeconds } = body;

    // Use .returning() to get the updated row
    const updated = await db
      .update(rooms)
      .set({
        roomName,
        description,
        ttlSeconds: ttlSeconds ? Number(ttlSeconds) : null,
      })
      .where(eq(rooms.roomId, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const { id } = params;

    const deleted = await db
      .delete(rooms)
      .where(eq(rooms.roomId, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedRoom: deleted[0] });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 },
    );
  }
}
