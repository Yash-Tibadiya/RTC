export const revalidate = 600;

import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  rooms as roomsTable,
  messages as messagesTable,
} from "@/drizzle/schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FlameKindling,
  Lock,
  MessageSquare,
  MessageSquareLock,
  Plus,
  Share2,
  Trash,
  User,
  Users,
  Zap,
  DoorOpen,
} from "lucide-react";

interface AnalyticsData {
  totalRooms: number;
  totalMessages: number;
}

async function getAnalytics(): Promise<AnalyticsData> {
  const [roomsResult, messagesResult] = await Promise.all([
    db.select({ count: count() }).from(roomsTable),
    db.select({ count: count() }).from(messagesTable),
  ]);

  return {
    totalRooms: roomsResult[0]?.count ?? 0,
    totalMessages: messagesResult[0]?.count ?? 0,
  };
}

const HomePage = async () => {
  const analytics = await getAnalytics();
  return (
    <main className="flex flex-col min-h-[calc(100svh-11rem)] h-full w-full p-4 md:p-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-12 md:py-16 space-y-6">
        <div className="space-y-4">
          <Badge variant="amber" className="mb-2">
            Real-Time Communication
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            <span className="text-green-500">{">"}</span>
            <span className="text-zinc-100">secure_chat</span>
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Private, encrypted, self-destructing chat rooms. No sign-ups, no
            traces, no compromises. Your conversations vanish when you&apos;re
            done.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md">
          <Link href="/anonymous" className="flex-1">
            <Button
              variant="trc"
              className="w-full group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <MessageSquareLock className="w-5 h-5 shrink-0" />
                PERSON TO PERSON
              </span>
            </Button>
          </Link>

          <div className="flex-1 relative">
            <Button
              variant="trc"
              disabled
              className="w-full opacity-60 cursor-not-allowed bg-zinc-800 hover:bg-zinc-800 text-zinc-400"
            >
              <span className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5 shrink-0" />
                GROUP CHAT
              </span>
            </Button>
            <Badge
              variant="comingSoon"
              className="absolute -top-2 -right-2 text-[10px] px-1.5"
            >
              COMING SOON...
            </Badge>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Private Rooms Card */}
          <Card className="border-zinc-800 hover:border-amber-500/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <DoorOpen className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <CardDescription className="text-xs uppercase tracking-wider text-zinc-500">
                    Private Rooms
                  </CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-zinc-100 mt-0.5">
                    {analytics.totalRooms.toLocaleString()}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-zinc-500">
                Secure rooms created to date
              </p>
            </CardContent>
          </Card>

          {/* Messages Card */}
          <Card className="border-zinc-800 hover:border-green-500/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardDescription className="text-xs uppercase tracking-wider text-zinc-500">
                    Messages Exchanged
                  </CardDescription>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-zinc-100 mt-0.5">
                    {analytics.totalMessages.toLocaleString()}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-zinc-500">
                Total messages sent & received
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
            How It Works
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Simple, secure, and ephemeral communication
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Feature 1 */}
          <Card className="group">
            <CardHeader>
              <CardAction>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Plus className="w-5 h-5 text-amber-500 shrink-0" />
                </div>
              </CardAction>
              <CardTitle>Create Room</CardTitle>
              <CardDescription>
                Generate a secure room with a unique ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">✓</span>
                  No registration required
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">✓</span>
                  Anonymous identity assigned
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">✓</span>
                  Customizable expiry time
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="group">
            <CardHeader>
              <CardAction>
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <Share2 className="w-5 h-5 text-green-500 shrink-0" />
                </div>
              </CardAction>
              <CardTitle>Share Link</CardTitle>
              <CardDescription>
                Invite others with a secure room link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">✓</span>
                  One-click link copy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">✓</span>
                  Real-time connection
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">✓</span>
                  Instant messaging
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="group">
            <CardHeader>
              <CardAction>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <FlameKindling className="w-5 h-5 text-red-500 shrink-0" />
                </div>
              </CardAction>
              <CardTitle>Self-Destruct</CardTitle>
              <CardDescription>Messages vanish automatically</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">✓</span>
                  Timer-based expiry
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">✓</span>
                  Manual destroy option
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">✓</span>
                  Zero data retention
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Room Options Section */}
      <section className="py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
            Room Options
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Configure your private chat room
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {[
            { time: "10 min", desc: "Quick conversations" },
            { time: "30 min", desc: "Brief discussions" },
            { time: "1 hr", desc: "Standard sessions" },
            { time: "12 hr", desc: "Extended chats" },
            { time: "24 hr", desc: "Full day access" },
          ].map((option) => (
            <Card
              key={option.time}
              className="text-center py-4 px-3 hover:border-amber-500/50"
            >
              <CardHeader className="p-0">
                <CardTitle className="text-amber-500 text-xl">
                  {option.time}
                </CardTitle>
                <CardDescription className="text-xs">
                  {option.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Security Features */}
      <section className="py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
            Security First
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Built with privacy at its core
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-500 shrink-0" />
                </div>
                <CardTitle className="text-base">
                  End-to-End Encryption
                </CardTitle>
              </div>
              <CardDescription className="mt-2">
                Your messages are encrypted and only visible to participants in
                the room.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-500 shrink-0" />
                </div>
                <CardTitle className="text-base">Anonymous Identity</CardTitle>
              </div>
              <CardDescription className="mt-2">
                Random usernames are generated. No personal information required
                or stored.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash className="w-5 h-5 text-red-500 shrink-0" />
                </div>
                <CardTitle className="text-base">No Data Retention</CardTitle>
              </div>
              <CardDescription className="mt-2">
                When a room expires or is destroyed, all messages are
                permanently deleted.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-500 shrink-0" />
                </div>
                <CardTitle className="text-base">Real-Time Sync</CardTitle>
              </div>
              <CardDescription className="mt-2">
                WebSocket-powered instant messaging with minimal latency and
                live updates.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-20 text-center">
        <div className="border border-zinc-800 bg-zinc-900/30 p-8 md:p-12 backdrop-blur-md max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-4">
            Ready to Start?
          </h2>
          <p className="text-zinc-500 mb-8 max-w-lg mx-auto">
            Create your private chat room in seconds. No registration, no
            tracking, just secure communication.
          </p>
          <Link href="/anonymous">
            <Button variant="trc" className="max-w-xs mx-auto">
              CREATE SECURE ROOM
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
