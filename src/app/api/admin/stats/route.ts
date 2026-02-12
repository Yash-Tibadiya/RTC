import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rooms, messages } from "@/drizzle/schema";
import { count } from "drizzle-orm";

export async function GET() {
  try {
    const [roomRes] = await db.select({ value: count() }).from(rooms);
    const [messageRes] = await db.select({ value: count() }).from(messages);

    return NextResponse.json({
      rooms: roomRes.value,
      messages: messageRes.value,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
