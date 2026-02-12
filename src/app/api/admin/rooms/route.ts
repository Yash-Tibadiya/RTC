import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rooms } from "@/drizzle/schema";
import { desc } from "drizzle-orm";
import { nanoid } from "nanoid";

import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const allRooms = await db
      .select()
      .from(rooms)
      .orderBy(desc(rooms.createdAt));

    if (allRooms.length === 0) {
      return NextResponse.json([]);
    }

    const pipeline = redis.pipeline();
    allRooms.forEach((room) => {
      pipeline.ttl(`meta:${room.roomId}`);
    });

    const ttls = await pipeline.exec<number[]>();

    const activeRooms = allRooms.filter((_, index) => {
      const ttl = ttls[index];
      // Filter out keys that don't exist (ttl === -2)
      // Keep keys that exist (ttl > 0 for expiring, ttl === -1 for persistent)
      // If user strictly meant "not 0", we'll filter out 0 as well if it ever returns 0 (which usually means expired)
      return ttl !== -2 && ttl !== 0;
    });

    return NextResponse.json(activeRooms);
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
