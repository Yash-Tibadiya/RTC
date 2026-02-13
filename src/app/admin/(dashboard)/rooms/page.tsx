"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";

type Room = {
  roomId: string;
  roomName: string | null;
  description: string | null;
  ttlSeconds: number | null;
  createdAt: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type RoomsResponse = {
  rooms: Room[];
  pagination: Pagination;
};

export default function TotalRoomsPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: roomsData,
    isLoading,
    isError,
  } = useQuery<RoomsResponse>({
    queryKey: ["all-rooms", page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await fetch(`/api/admin/rooms/all?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const rooms = roomsData?.rooms || [];
  const pagination = roomsData?.pagination;

  return (
    <main className="flex flex-col min-h-[calc(100svh-6rem)] sm:min-h-[calc(100svh-11rem)] border-b border-zinc-800 bg-zinc-900/10">
      <header className="border-b border-zinc-800 flex flex-col justify-center items-start bg-zinc-900/30">
        <div className="flex flex-row justify-between items-center w-full border-b border-edge p-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase">
                Admin Panel
              </span>
              <span className="font-bold text-zinc-100">TOTAL ROOMS</span>
            </div>

            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex-col hidden sm:flex">
              <span className="text-xs text-zinc-500 uppercase">
                Total Count
              </span>
              <span className="text-sm font-bold text-blue-500">
                {pagination?.total || 0}
              </span>
            </div>
          </div>

          <div className="relative hidden md:block w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search all rooms..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md  py-[7px] pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
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
            Failed to load rooms.
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex justify-center py-20 text-zinc-600 font-mono text-sm">
            No rooms found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="w-full overflow-x-auto border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/50 text-zinc-500 uppercase text-xs">
                  <tr>
                    <th className="p-3 font-medium border-b border-zinc-800">
                      Name / ID
                    </th>
                    <th className="p-3 font-medium border-b border-zinc-800 hidden sm:table-cell">
                      Description
                    </th>
                    <th className="p-3 font-medium border-b border-zinc-800">
                      Created
                    </th>
                    <th className="p-3 font-medium border-b border-zinc-800 text-right">
                      TTL (Seconds)
                    </th>
                    <th className="p-3 font-medium border-b border-zinc-800 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30">
                  {rooms.map((room) => (
                    <tr
                      key={room.roomId}
                      className="hover:bg-zinc-900/40 transition-colors"
                      onClick={() => router.push(`/admin/rooms/${room.roomId}`)}
                    >
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          {room.roomName ? (
                            <>
                              <span className="text-zinc-200">
                                {room.roomName}
                              </span>
                              <span className="text-[10px] text-zinc-600 font-mono">
                                {room.roomId}
                              </span>
                            </>
                          ) : (
                            <span className="text-zinc-200 font-mono">
                              {room.roomId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-zinc-400 max-w-[200px] truncate hidden sm:table-cell text-xs">
                        {room.description || (
                          <span className="text-zinc-700 italic">
                            No description
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-zinc-500 font-mono text-xs">
                        {format(new Date(room.createdAt), "MM/dd/yy HH:mm")}
                      </td>
                      <td className="p-3 text-zinc-500 font-mono text-xs text-right">
                        {room.ttlSeconds !== null ? room.ttlSeconds : "-"}
                      </td>
                      <td className="p-3 text-zinc-500 font-mono text-xs text-right">
                        <Link
                          href={`/admin/rooms/${room.roomId}`}
                          className="flex justify-center items-center gap-2 hover:text-green-500 border border-zinc-800 hover:border-green-500 py-0.5"
                          title="View Messages"
                        >
                          <MessageSquare size={12} className="shrink-0" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
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
