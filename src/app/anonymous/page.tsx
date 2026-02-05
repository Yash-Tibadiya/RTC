"use client";

import { useState } from "react";
import { api } from "@/lib/eden";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useUsername } from "@/hooks/use-username";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TTL_OPTIONS = [
  { value: 600, label: "10 min" },
  { value: 1800, label: "30 min" },
  { value: 3600, label: "1 hr" },
  { value: 43200, label: "12 hr" },
  { value: 86400, label: "24 hr" },
] as const;

export default function AnonymousLobby() {
  return (
    <Suspense>
      <Lobby />
    </Suspense>
  );
}

function Lobby() {
  const router = useRouter();
  const { username } = useUsername();
  const [selectedTtl, setSelectedTtl] = useState<number>(600);

  const searchParams = useSearchParams();
  const wasDestroyed = searchParams.get("destroyed") === "true";
  const error = searchParams.get("error");

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await api.room.create.post(
        {},
        { query: { ttl: String(selectedTtl) } },
      );

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  return (
    <main className="flex flex-col lg:flex-row min-h-[calc(100svh-11rem)] h-full w-full justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8">
        {wasDestroyed && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM DESTROYED</p>
            <p className="text-zinc-500 text-xs mt-1">
              All messages were permanently deleted.
            </p>
          </div>
        )}
        {error === "room-not-found" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM NOT FOUND</p>
            <p className="text-zinc-500 text-xs mt-1">
              This room may have expired or never existed.
            </p>
          </div>
        )}
        {error === "room-full" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM FULL</p>
            <p className="text-zinc-500 text-xs mt-1">
              This room is at maximum capacity.
            </p>
          </div>
        )}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">
            {">"}private_chat
          </h1>
          <p className="text-zinc-500 text-sm">
            A private, self-destructing chat room.
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center text-zinc-500">
                Your Identity
              </label>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-400 font-mono">
                  {username}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-zinc-500">
                Room Expiry
              </label>
              <Tabs
                value={String(selectedTtl)}
                onValueChange={(value) => setSelectedTtl(Number(value))}
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-5">
                  {TTL_OPTIONS.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={String(option.value)}
                    >
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <Button variant="trc" onClick={() => createRoom()}>
              CREATE SECURE ROOM
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
