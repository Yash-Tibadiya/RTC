import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rooms } from "@/drizzle/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rooms);

    const total = Number(totalCount.count);

    const allRooms = await db
      .select()
      .from(rooms)
      .orderBy(desc(rooms.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      rooms: allRooms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 },
    );
  }
}
