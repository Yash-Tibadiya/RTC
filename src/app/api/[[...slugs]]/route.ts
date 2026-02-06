import z from "zod";
import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { redis } from "@/lib/redis";
import { authMiddleware } from "./auth";
import { Message, realtime } from "@/lib/realtime";
import { db } from "@/drizzle/db";
import {
  rooms as roomsTable,
  messages as messagesTable,
} from "@/drizzle/schema";

const ROOM_TTL_SECONDS = 60 * 10;
const ALLOWED_TTL_VALUES = [600, 1800, 3600, 43200, 86400] as const;

const rooms = new Elysia({
  prefix: "/room",
})
  .post(
    "/create",
    async ({ query }) => {
      const roomId = nanoid();
      const ttl = query.ttl ? Number(query.ttl) : ROOM_TTL_SECONDS;
      const validTtl = ALLOWED_TTL_VALUES.includes(
        ttl as (typeof ALLOWED_TTL_VALUES)[number],
      )
        ? ttl
        : ROOM_TTL_SECONDS;

      await redis.hset(`meta:${roomId}`, {
        connected: [],
        createdAt: Date.now(),
      });

      await redis.expire(`meta:${roomId}`, validTtl);

      // Analytics: Store room in PostgreSQL
      await db.insert(roomsTable).values({
        roomId,
        ttlSeconds: validTtl,
      });

      return { roomId };
    },
    {
      query: z.object({
        ttl: z.string().optional(),
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

export const app = new Elysia({ prefix: "/api" }).use(rooms).use(messages);

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;
