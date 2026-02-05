"use client";

import { api } from "@/lib/eden";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useUsername } from "@/hooks/use-username";
import { useRealtime } from "@/lib/realtime-client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import PlugConnectedXIcon from "@/components/ui/plug-connected-x-icon";
import { Message } from "@/lib/realtime";

function formatTimeRemaining(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const RoomPage = () => {
  const params = useParams();
  const roomId = params.roomId as string;

  const router = useRouter();

  const { username } = useUsername();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [copyStatus, setCopyStatus] = useState("COPY");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await api.room.ttl.get({ query: { roomId } });
      return res.data;
    },
  });

  useEffect(() => {
    if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl);
  }, [ttlData]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return;

    if (timeRemaining === 0) {
      router.push("/anonymous?destroyed=true");
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, router]);

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["messages", roomId],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await api.messages.get({
        query: { roomId, limit: "20", offset: String(pageParam) },
      });
      return res.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.hasMore) return undefined;
      // Calculate total messages fetched so far
      const totalFetched = allPages.reduce(
        (sum, page) => sum + (page?.messages?.length || 0),
        0,
      );
      return totalFetched;
    },
    initialPageParam: 0,
  });

  // Flatten all messages from all pages
  // Pages are [newest, older, oldest], so reverse to get [oldest, older, newest]
  // Messages within each page are already in chronological order (oldest to newest)
  const allMessages = messagesData?.pages
    .slice()
    .reverse()
    .flatMap((page) => page?.messages || []) as Message[] | undefined;

  // Auto-scroll to bottom on initial load only
  useEffect(() => {
    if (isInitialLoad && allMessages && allMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      setIsInitialLoad(false);
    }
  }, [allMessages, isInitialLoad]);

  // Scroll to bottom when new message arrives (not when loading older messages)
  const prevMessageCount = useRef(0);
  useEffect(() => {
    if (allMessages && allMessages.length > prevMessageCount.current) {
      // Only scroll if we received new messages at the end (not loading older ones)
      if (!isFetchingNextPage) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      prevMessageCount.current = allMessages.length;
    }
  }, [allMessages, isFetchingNextPage]);

  // Handle scroll to load more messages
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // If scrolled near top (within 50px), load more
    if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      const prevScrollHeight = container.scrollHeight;
      fetchNextPage().then(() => {
        // Maintain scroll position after loading older messages
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight;
        });
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await api.messages.post(
        { sender: username, text },
        { query: { roomId } },
      );

      setInput("");
    },
  });

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: (event) => {
      if (event.event === "chat.message") {
        refetch();
      }

      if (event.event === "chat.destroy") {
        router.push("/anonymous?destroyed=true");
      }
    },
  });

  const { mutate: destroyRoom, isPending: isDestroying } = useMutation({
    mutationFn: async () => {
      await api.room.delete(null, { query: { roomId } });
    },
  });

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopyStatus("COPIED!");
    setTimeout(() => setCopyStatus("COPY"), 2000);
  };

  return (
    <main className="flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/30">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 uppercase">Room ID</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500 truncate">
                {roomId.slice(0, 10) + "..."}
              </span>
              <button
                onClick={copyLink}
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 uppercase">
              Self-Destruct
            </span>
            <span
              className={`text-sm font-bold flex items-center gap-2 ${
                timeRemaining !== null && timeRemaining < 60
                  ? "text-red-500"
                  : "text-amber-500"
              }`}
            >
              {timeRemaining !== null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>
        </div>

        <button
          onClick={() => destroyRoom()}
          disabled={isDestroying}
          className="text-xs bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <PlugConnectedXIcon />
          DESTROY NOW
        </button>
      </header>

      {/* MESSAGES */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 thin-scrollbar"
      >
        {/* Loader at top for loading older messages */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        )}

        {/* Show "load more" hint if there are more messages */}
        {hasNextPage && !isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-zinc-600">
              Scroll up for older messages
            </span>
          </div>
        )}

        {allMessages?.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-sm font-mono">
              No messages yet, start the conversation.
            </p>
          </div>
        )}

        {allMessages?.map((msg) => (
          <div key={msg.id} className="flex flex-col items-start">
            <div className="max-w-[80%] group">
              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className={`text-xs font-bold ${msg.sender === username ? "text-green-500" : "text-blue-500"}`}
                >
                  {msg.sender === username ? "YOU" : msg.sender}
                </span>

                <span className="text-[10px] text-zinc-600">
                  {format(msg.timestamp, "HH:mm:ss")}
                </span>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed break-all">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 animate-pulse">
              {">"}
            </span>

            <input
              autoFocus
              type="text"
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ text: input });
                  inputRef.current?.focus();
                }
              }}
              placeholder="Type message..."
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3 pl-8 pr-4 text-sm"
            />
          </div>

          <button
            onClick={() => {
              sendMessage({ text: input });
              inputRef.current?.focus();
            }}
            disabled={!input.trim() || isSending}
            className="bg-zinc-800 text-zinc-400 px-6 text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  );
};

export default RoomPage;
