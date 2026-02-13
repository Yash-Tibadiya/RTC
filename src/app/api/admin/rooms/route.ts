import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rooms } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const allRooms = await db
      .select()
      .from(rooms)
      .orderBy(desc(rooms.createdAt));

    if (allRooms.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    const pipeline = redis.pipeline();
    allRooms.forEach((room) => {
      pipeline.ttl(`meta:${room.roomId}`);
    });

    const ttls = await pipeline.exec<number[]>();

    const activeRooms = allRooms.filter((_, index) => {
      const ttl = ttls[index];
      return ttl !== -2 && ttl !== 0;
    });

    const total = activeRooms.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedRooms = activeRooms.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedRooms,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 },
    );
  }
}
