"use client";

import { api } from "@/lib/eden";
import { format } from "date-fns";
import { Loader2, Pencil } from "lucide-react";
import { useUsername } from "@/hooks/use-username";
import { useRealtime } from "@/lib/realtime-client";
import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useMutation,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import PlugConnectedXIcon from "@/components/ui/plug-connected-x-icon";
import { Message } from "@/lib/realtime";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRoomName, setEditRoomName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const queryClient = useQueryClient();

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await api.room.ttl.get({ query: { roomId } });
      return res.data;
    },
  });

  const { data: roomInfo } = useQuery({
    queryKey: ["roomInfo", roomId],
    queryFn: async () => {
      const res = await api.room.info.get({ query: { roomId } });
      return res.data;
    },
  });

  useEffect(() => {
    if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl);
  }, [ttlData]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return;

    if (timeRemaining === 0) {
      router.push("/status?code=GONE&heading=Room Destroyed");
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
        router.push("/status?code=GONE&heading=Room Destroyed");
      }
    },
  });

  const { mutate: destroyRoom, isPending: isDestroying } = useMutation({
    mutationFn: async () => {
      await api.room.delete(null, { query: { roomId } });
    },
  });

  const { mutate: updateRoom, isPending: isUpdating } = useMutation({
    mutationFn: async () => {
      await api.room.update.patch(
        {
          roomName: editRoomName,
          description: editDescription,
        },
        { query: { roomId } },
      );
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["roomInfo", roomId] });
    },
  });

  useEffect(() => {
    if (isEditDialogOpen && roomInfo) {
      setEditRoomName(String(roomInfo.roomName || ""));
      setEditDescription(String(roomInfo.description || ""));
    }
  }, [isEditDialogOpen, roomInfo]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopyStatus("COPIED!");
    setTimeout(() => setCopyStatus("COPY"), 2000);
  };

  return (
    <div className="flex min-h-svh max-w-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto px-2 overflow-x-hidden">
        <LayoutWrapper>
          <main className="flex flex-col min-h-[calc(100svh-6rem)] sm:min-h-[calc(100svh-11rem)] max-h-[calc(100svh-11rem)] overflow-hidden">
            <header className="border-b border-zinc-800 flex flex-col justify-center items-start bg-zinc-900/30">
              <div className="flex flex-row justify-between items-center w-full border-b border-edge p-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 uppercase">
                      {roomInfo?.roomName ? "Room" : "Room ID"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-500 truncate">
                        {roomInfo?.roomName ? (
                          <>
                            <span className="md:hidden">
                              {roomInfo.roomName.slice(0, 4)}...
                            </span>
                            <span className="hidden md:inline">
                              {roomInfo.roomName.slice(0, 10)}...
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="md:hidden">
                              {roomId.slice(0, 4)}...
                            </span>
                            <span className="hidden md:inline">
                              {roomId.slice(0, 10)}...
                            </span>
                          </>
                        )}
                      </span>
                      <button
                        onClick={copyLink}
                        className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {copyStatus}
                      </button>
                      <button
                        onClick={() => setIsEditDialogOpen(true)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <Pencil size={14} />
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
                  className="text-xs bg-zinc-800 hover:bg-red-600 px-3 py-1.5 text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <PlugConnectedXIcon />
                  <span className="hidden sm:block">DESTROY NOW</span>
                </button>
              </div>

              {roomInfo?.description && (
                <div className="max-w-[94svw] sm:max-w-[60svw] p-2">
                  {!isDescExpanded ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-500 truncate min-w-0">
                        {roomInfo.description}
                      </span>
                      {roomInfo.description.length > 20 && (
                        <button
                          onClick={() => setIsDescExpanded(true)}
                          className="text-[10px] text-green-600 hover:text-green-400 transition-colors duration-200 cursor-pointer font-medium shrink-0"
                        >
                          more
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-xs text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 px-2.5 py-1.5 leading-relaxed whitespace-pre-wrap wrap-break-word">
                        {roomInfo.description}
                      </p>
                      <button
                        onClick={() => setIsDescExpanded(false)}
                        className="text-[10px] text-green-600 hover:text-green-400 transition-colors duration-200 cursor-pointer font-medium mt-1"
                      >
                        less
                      </button>
                    </div>
                  )}
                </div>
              )}
            </header>

            {/* MESSAGES */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4"
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
                <div className="flex items-center justify-center flex-1">
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
        </LayoutWrapper>
      </main>
      <div className="sm:block hidden">
        <Footer />
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 rounded-none! sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Edit Room Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-zinc-400"
              >
                Room Name
              </label>
              <input
                id="name"
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                className="col-span-3 h-9 w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-zinc-400"
              >
                Description
              </label>
              <textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="col-span-3 min-h-[100px] w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsEditDialogOpen(false)}
              className="px-4 py-2 text-sm bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => updateRoom()}
              disabled={isUpdating}
              className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomPage;
