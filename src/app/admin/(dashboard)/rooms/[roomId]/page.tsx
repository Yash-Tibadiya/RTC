"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Message = {
  id: number;
  messageId: string;
  sender: string;
  text: string;
  timestamp: number;
  roomId: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type MessagesResponse = {
  messages: Message[];
  pagination: Pagination;
};

export default function RoomMessagesPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [page, setPage] = useState(1);

  const {
    data: messagesData,
    isLoading,
    isError,
  } = useQuery<MessagesResponse>({
    queryKey: ["room-messages", roomId, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/rooms/${roomId}/messages?page=${page}&limit=20`,
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const messages = messagesData?.messages || [];
  const pagination = messagesData?.pagination;

  return (
    <main className="flex flex-col min-h-[calc(100svh-6rem)] sm:min-h-[calc(100svh-11rem)] border-b border-zinc-800 bg-zinc-900/10">
      <header className="border-b border-zinc-800 flex flex-col justify-center items-start bg-zinc-900/30">
        <div className="flex flex-row justify-between items-center w-full border-b border-edge p-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/rooms"
              className="text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase">
                Room Messages
              </span>
              <span className="font-bold text-zinc-100 font-mono">
                {roomId}
              </span>
            </div>

            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex-col hidden sm:flex">
              <span className="text-xs text-zinc-500 uppercase">
                Total Messages
              </span>
              <span className="text-sm font-bold text-blue-500">
                {pagination?.total || 0}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 bg-black/20">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : isError ? (
          <div className="flex justify-center py-20 text-red-500 font-mono text-sm">
            Failed to load messages.
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600 font-mono text-sm gap-2">
            <Info size={24} />
            <span>No messages found in this room.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="w-full overflow-x-auto border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/50 text-zinc-500 uppercase text-xs">
                  <tr>
                    <th className="p-3 font-medium border-b border-zinc-800 w-[180px]">
                      Sender
                    </th>
                    {/* <th className="p-3 font-medium border-b border-zinc-800 min-w-[300px]">
                      Message
                    </th> */}
                    <th className="p-3 font-medium border-b border-zinc-800 text-right w-[180px]">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30">
                  {messages.map((msg) => (
                    <tr
                      key={msg.id}
                      className="hover:bg-zinc-900/40 transition-colors group"
                    >
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${msg.sender === "system" ? "bg-zinc-500" : "bg-green-500"}`}
                          />
                          <span
                            className="text-zinc-200 truncate max-w-[450px]"
                            title={msg.sender}
                          >
                            {msg.sender}
                          </span>
                        </div>
                      </td>
                      {/* <td className="p-3 text-zinc-400 text-sm whitespace-pre-wrap wrap-break-word">
                        {msg.text || (
                          <span className="italic text-zinc-600">
                            No content
                          </span>
                        )}
                      </td> */}
                      <td className="p-3 text-zinc-500 font-mono text-xs text-right whitespace-nowrap">
                        {format(
                          new Date(Number(msg.timestamp)),
                          "MM/dd/yy HH:mm:ss",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <div className="text-xs text-zinc-500">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-zinc-800 rounded bg-zinc-900/50 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-400"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={page === pagination.totalPages}
                    className="p-2 border border-zinc-800 rounded bg-zinc-900/50 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-400"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
