import { pgTable, serial, text, bigint, timestamp } from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  index: serial("index").primaryKey(),
  roomId: text("room_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  ttlSeconds: bigint("ttl_seconds", { mode: "number" }),
});

export type InsertRoom = typeof rooms.$inferInsert;
export type SelectRoom = typeof rooms.$inferSelect;
