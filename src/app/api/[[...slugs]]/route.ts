import z from "zod";
import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { authMiddleware } from "./auth";
import { Message, realtime } from "@/lib/realtime";
import { db } from "@/drizzle/db";
import {
  rooms as roomsTable,
  messages as messagesTable,
} from "@/drizzle/schema";

const ROOM_TTL_SECONDS = 60 * 60; // Default 1 hour

const rooms = new Elysia({
  prefix: "/room",
})
  .post(
    "/create",
    async ({ query, body }) => {
      const roomId = nanoid();
      let ttl = query.ttl ? Number(query.ttl) : ROOM_TTL_SECONDS;

      // Validate TTL: Must be between 1 and 86400 seconds (24 hours)
      if (ttl <= 0 || ttl > 86400) {
        ttl = ROOM_TTL_SECONDS;
      }

      const roomName = body?.roomName || null;
      const description = body?.description || null;

      await redis.hset(`meta:${roomId}`, {
        connected: [],
        createdAt: Date.now(),
        ...(roomName && { roomName }),
        ...(description && { description }),
      });

      await redis.expire(`meta:${roomId}`, ttl);

      // Analytics: Store room in PostgreSQL
      await db.insert(roomsTable).values({
        roomId,
        roomName,
        description,
        ttlSeconds: ttl,
      });

      return { roomId };
    },
    {
      query: z.object({
        ttl: z.string().optional(),
      }),
      body: z.object({
        roomName: z.string().max(100).optional(),
        description: z.string().max(500).optional(),
      }),
    },
  )
  .use(authMiddleware)
  .get(
    "/ttl",
    async ({ auth }) => {
      const ttl = await redis.ttl(`meta:${auth.roomId}`);

      return { ttl: ttl > 0 ? ttl : 0 };
    },
    {
      query: z.object({
        roomId: z.string(),
      }),
    },
  )
  .get(
    "/info",
    async ({ auth }) => {
      const meta = await redis.hgetall<{
        roomName?: string;
        description?: string;
      }>(`meta:${auth.roomId}`);

      return {
        roomName: meta?.roomName ? String(meta.roomName) : null,
        description: meta?.description ? String(meta.description) : null,
      };
    },
    {
      query: z.object({
        roomId: z.string(),
      }),
    },
  )
  .delete(
    "/",
    async ({ auth }) => {
      await realtime.channel(auth.roomId).emit("chat.destroy", {
        isDestroyed: true,
      });

      await Promise.all([
        redis.del(auth.roomId),
        redis.del(`meta:${auth.roomId}`),
        redis.del(`messages:${auth.roomId}`),
      ]);
    },
    {
      query: z.object({
        roomId: z.string(),
      }),
    },
  )
  .patch(
    "/update",
    async ({ auth, body, set }) => {
      try {
        const { roomName, description, ttl } = body;
        console.log("Update request:", {
          roomId: auth.roomId,
          roomName,
          description,
          ttl,
        });

        const updates: Record<string, string> = {
          ...(roomName !== undefined && { roomName }),
          ...(description !== undefined && { description }),
        };

        if (Object.keys(updates).length > 0) {
          await redis.hset(`meta:${auth.roomId}`, updates);
        }

        if (ttl !== undefined) {
          // Validate TTL: Must be positive and not exceed 24 hours (86400s)
          if (ttl > 0 && ttl <= 86400) {
            await Promise.all([
              redis.expire(`meta:${auth.roomId}`, ttl),
              redis.expire(`messages:${auth.roomId}`, ttl),
              redis.expire(`history:${auth.roomId}`, ttl),
            ]);

            // Update analytics DB
            await db
              .update(roomsTable)
              .set({ ttlSeconds: ttl })
              .where(eq(roomsTable.roomId, auth.roomId));

            console.log(`Updated TTL for room ${auth.roomId} to ${ttl}`);
          }
        }

        return { roomName, description, ttl };
      } catch (error) {
        console.error("Update error:", error);
        set.status = 500;
        return { error: String(error) };
      }
    },
    {
      query: z.object({
        roomId: z.string(),
      }),
      body: z.object({
        roomName: z.string().max(100).optional(),
        description: z.string().max(500).optional(),
        ttl: z.number().optional(),
      }),
    },
  );

const messages = new Elysia({ prefix: "/messages" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, auth }) => {
      const { sender, text } = body;
      const { roomId } = auth;

      const roomExists = await redis.exists(`meta:${roomId}`);
      if (!roomExists) {
        throw new Error("Room not found");
      }

      const message: Message = {
        id: nanoid(),
        sender,
        text,
        timestamp: Date.now(),
        roomId,
      };

      // add message to history : push message in ordered list
      await redis.rpush(`messages:${roomId}`, {
        ...message,
        token: auth.token,
      });

      // Analytics: Store message metadata in PostgreSQL
      await db.insert(messagesTable).values({
        messageId: message.id,
        sender: message.sender,
        timestamp: message.timestamp,
        roomId: message.roomId,
      });

      await realtime.channel(roomId).emit("chat.message", message);

      // last send message to user
      const remaining = await redis.ttl(`meta:${roomId}`);

      await Promise.all([
        redis.expire(`messages:${roomId}`, remaining),
        redis.expire(`history:${roomId}`, remaining),
        redis.expire(roomId, remaining),
      ]);
    },
    {
      query: z.object({
        roomId: z.string(),
      }),
      body: z.object({
        sender: z.string().max(100),
        text: z.string().max(1000).min(1),
      }),
    },
  )
  .get(
    "/",
    async ({ auth, query }) => {
      const limit = query.limit ? Number(query.limit) : 50;
      const offset = query.offset ? Number(query.offset) : 0;

      // Get total count first
      const totalCount = await redis.llen(`messages:${auth.roomId}`);

      // Calculate range for fetching from the end (newest messages)
      // Messages are stored oldest first, so we need to get from the end
      const start = Math.max(0, totalCount - offset - limit);
      const end = Math.max(0, totalCount - offset - 1);

      const messages = await redis.lrange<Message>(
        `messages:${auth.roomId}`,
        start,
        end,
      );

      return {
        // remove token for other users messages
        messages: messages.map((m) => ({
          ...m,
          token: m.token === auth.token ? auth.token : undefined,
        })),
        hasMore: start > 0,
        totalCount,
      };
    },
    {
      query: z.object({
        roomId: z.string(),
        limit: z.string().optional(),
        offset: z.string().optional(),
      }),
    },
  );

import { analytics } from "./analytics";

export const app = new Elysia({ prefix: "/api" })
  .use(rooms)
  .use(messages)
  .use(analytics);

export type App = typeof app;

export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
