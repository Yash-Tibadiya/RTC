import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rooms } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

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

    // Update Redis
    try {
      // 1. Update Room Info (Meta)
      const metaUpdates: Record<string, string> = {
        ...(roomName !== undefined && { roomName }),
        ...(description !== undefined && { description }),
      };

      if (Object.keys(metaUpdates).length > 0) {
        await redis.hset(`meta:${id}`, metaUpdates);
      }

      // 2. Update TTL
      const ttl = ttlSeconds ? Number(ttlSeconds) : undefined;
      if (ttl && ttl > 0 && ttl <= 86400) {
        await Promise.all([
          redis.expire(`meta:${id}`, ttl),
          redis.expire(`messages:${id}`, ttl),
          redis.expire(`history:${id}`, ttl),
          redis.expire(id, ttl),
        ]);
      }
    } catch (redisError) {
      console.error("Failed to update Redis:", redisError);
      // We don't fail the request if Redis update fails, but we log it.
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

import { realtime } from "@/lib/realtime";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const { id } = params;

    // 1. Emit destroy event to clients
    await realtime.channel(id).emit("chat.destroy", {
      isDestroyed: true,
    });

    // 2. Remove from Redis (this effectively "closes" the room and removes it from active list)
    await Promise.all([
      redis.del(id),
      redis.del(`meta:${id}`),
      redis.del(`messages:${id}`),
      redis.del(`history:${id}`),
    ]);

    // We do NOT delete from Postgres to keep analytics/history

    return NextResponse.json({
      success: true,
      message: "Room destroyed (Redis only)",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 },
    );
  }
}
