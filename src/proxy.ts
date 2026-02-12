import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis"; // Ensure this path is correct alias
import { nanoid } from "nanoid";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Admin Logic
  // --------------------------------------------------------------------------
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    // Allow login/logout API endpoints
    if (path === "/api/admin/login" || path === "/api/admin/logout") {
      return NextResponse.next();
    }

    const isAdmin =
      request.cookies.get("admin_authenticated")?.value === "true";

    // Handle Admin UI Routes
    if (path.startsWith("/admin")) {
      if (path === "/admin/login") {
        if (isAdmin) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.next();
      }
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }

    // Handle Admin API Routes
    if (path.startsWith("/api/admin")) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // If authenticated admin, proceed
    return NextResponse.next();
  }

  // 2. Room Proxy Logic (Merged from src/proxy.ts)
  // --------------------------------------------------------------------------
  if (path.startsWith("/room/")) {
    const roomMatch = path.match(/^\/room\/([^/]+)$/);

    if (!roomMatch) {
      return NextResponse.redirect(
        new URL("/status?code=404&heading=Invalid URL", request.url),
      );
    }

    const roomId = roomMatch[1];

    // Check if room exists in Redis
    const meta = await redis.hgetall<{
      connected: string[];
      createdAt: number;
    }>(`meta:${roomId}`);

    if (!meta) {
      return NextResponse.redirect(
        new URL("/status?code=404&heading=Room Not Found", request.url),
      );
    }

    // Check if user is already joined
    const existingToken = request.cookies.get("x-auth-token")?.value;

    if (
      existingToken &&
      meta.connected &&
      meta.connected.includes(existingToken)
    ) {
      return NextResponse.next();
    }

    // Check capacity (2 users max)
    const connectedCount = meta.connected ? meta.connected.length : 0;
    if (connectedCount >= 2) {
      return NextResponse.redirect(
        new URL("/status?code=FULL&heading=Room Full", request.url),
      );
    }

    // Log new user in
    const response = NextResponse.next();
    const token = nanoid();

    response.cookies.set("x-auth-token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    const newConnected = meta.connected ? [...meta.connected, token] : [token];
    await redis.hset(`meta:${roomId}`, {
      connected: newConnected,
    });

    return response;
  }

  // Default behavior for other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/room/:path*", // Matches /room/123, /room/abc, etc.
  ],
};
