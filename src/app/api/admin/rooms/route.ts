import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rooms } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

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
