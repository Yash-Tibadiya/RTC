import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rooms } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const allRooms = await db
      .select()
      .from(rooms)
      .orderBy(desc(rooms.createdAt));
    return NextResponse.json(allRooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomName, description, ttlSeconds } = body;

    // Generate a unique roomId if one isn't provided (though usually it's auto-generated here)
    const roomId = body.roomId || nanoid(10);

    const newRoom = await db
      .insert(rooms)
      .values({
        roomId,
        roomName,
        description,
        ttlSeconds: ttlSeconds ? parseInt(ttlSeconds) : null,
      })
      .returning();

    return NextResponse.json(newRoom[0]);
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
