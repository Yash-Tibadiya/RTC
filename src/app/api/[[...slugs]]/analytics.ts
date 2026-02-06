import { Elysia } from "elysia";
import { count } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  rooms as roomsTable,
  messages as messagesTable,
} from "@/drizzle/schema";

export interface AnalyticsData {
  totalRooms: number;
  totalMessages: number;
}

export const analytics = new Elysia({ prefix: "/analytics" }).get(
  "/",
  async (): Promise<AnalyticsData> => {
    const [roomsResult, messagesResult] = await Promise.all([
      db.select({ count: count() }).from(roomsTable),
      db.select({ count: count() }).from(messagesTable),
    ]);

    return {
      totalRooms: roomsResult[0]?.count ?? 0,
      totalMessages: messagesResult[0]?.count ?? 0,
    };
  },
);
