import { pgTable, serial, text, bigint } from "drizzle-orm/pg-core";
import { rooms } from "./rooms";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull(),
  sender: text("sender").notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.roomId),
});

export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessage = typeof messages.$inferSelect;
