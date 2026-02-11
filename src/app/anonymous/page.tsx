"use client";

import { useState } from "react";
import { api } from "@/lib/eden";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useUsername } from "@/hooks/use-username";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await api.room.create.post(
        {
          ...(roomName.trim() && { roomName: roomName.trim() }),
          ...(description.trim() && { description: description.trim() }),
        },
        { query: { ttl: String(selectedTtl) } },
      );

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  return (
    <main className="flex flex-col lg:flex-row min-h-[calc(100svh-11rem)] h-full w-full justify-center items-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">
            {">"}private_chat
          </h1>
          <p className="text-zinc-500 text-sm">
            A private, self-destructing chat room.
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-md">
          <div className="flex flex-col gap-2">
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
                Room Name
                <span className="text-zinc-700 text-xs ml-2">(optional)</span>
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Team Standup"
                maxLength={100}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 p-3 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-zinc-500">
                Description
                <span className="text-zinc-700 text-xs ml-2">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this room..."
                maxLength={500}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 p-3 text-sm resize-none"
              />
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
                      className="text-xs sm:text-sm"
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
