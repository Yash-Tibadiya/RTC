"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  RefreshCcw,
  LayoutList,
  Copy,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/eden";
import { useDebounce } from "@/hooks/use-debounce";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RoomForm } from "@/components/admin/RoomForm";
import { keepPreviousData } from "@tanstack/react-query";
import { useEffect } from "react";

type Room = {
  roomId: string;
  roomName: string | null;
  description: string | null;
  ttlSeconds: number | null;
  createdAt: string;
};

type PaginatedResponse = {
  data: Room[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  // Rooms Query
  const {
    data: roomsData,
    isLoading,
    isError,
    refetch: refetchRooms,
    isRefetching,
  } = useQuery<PaginatedResponse>({
    queryKey: ["admin-rooms", page, limit, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await fetch(`/api/admin/rooms?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  const rooms = roomsData?.data;
  const pagination = roomsData?.pagination;

  const handleRefresh = () => {
    refetchRooms();
    refetchStats();
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: {
      roomName: string;
      description: string;
      ttlSeconds: string;
    }) => {
      const { data: resData, error } = await api.room.create.post(
        {
          roomName: data.roomName,
          description: data.description,
        },
        { query: { ttl: data.ttlSeconds } }, // Ensure ttl is passed as string if expected by EDEN or convert
      );

      if (error) throw new Error("Failed to create room");
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      roomName: string;
      description: string;
      ttlSeconds: string;
    }) => {
      const res = await fetch(`/api/admin/rooms/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          roomName: data.roomName,
          description: data.description,
          ttlSeconds: data.ttlSeconds,
        }),
      });
      if (!res.ok) throw new Error("Failed to update room");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setEditingRoom(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/rooms/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete room");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setDeletingRoom(null);
    },
  });

  const handleCopyLink = (roomId: string) => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <main className="flex flex-col min-h-[calc(100svh-6rem)] sm:min-h-[calc(100svh-11rem)] border-b border-zinc-800 bg-zinc-900/10">
      {/* Admin Header */}
      <header className="border-b border-zinc-800 flex flex-col justify-center items-start bg-zinc-900/30">
        <div className="flex flex-row justify-between items-center w-full border-b border-edge p-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase">
                Admin Panel
              </span>
              <span className="font-bold text-zinc-100">DASHBOARD</span>
            </div>

            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex-col hidden sm:flex">
              <span className="text-xs text-zinc-500 uppercase">
                Total Rooms
              </span>
              <span className="text-sm font-bold text-green-500">
                {stats?.rooms || 0}
              </span>
            </div>

            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex-col hidden sm:flex">
              <span className="text-xs text-zinc-500 uppercase">
                Total Messages
              </span>
              <span className="text-sm font-bold text-blue-500">
                {stats?.messages || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                placeholder="Search active rooms..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-9 pr-3 px-3 py-[7px] text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>

            <button
              onClick={handleRefresh}
              className={`p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer`}
              title="Refresh Data"
            >
              <RefreshCcw
                size={16}
                className={isRefetching ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => router.push("/admin/rooms")}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-zinc-400 hover:text-white font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <LayoutList size={14} />
              <span className="hidden sm:inline">ALL ROOMS</span>
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="text-xs bg-zinc-800 hover:bg-green-600 px-3 py-2 text-zinc-400 hover:text-white font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">NEW ROOM</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-xs bg-zinc-800 hover:bg-red-600 px-3 py-2 text-zinc-400 hover:text-white font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">LOGOUT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Room List Content */}
      <div className="flex-1 p-4 bg-black/20">
        <div className="flex flex-col gap-4 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100">
              Active Rooms ({pagination?.total || 0})
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              Rooms expire after 24 hours of inactivity
            </span>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : isError ? (
          <div className="flex justify-center py-20 text-red-500 font-mono text-sm">
            Failed to load rooms.
          </div>
        ) : rooms?.length === 0 ? (
          <div className="flex justify-center py-20 text-zinc-600 font-mono text-sm">
            No active rooms found.
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
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
                    <th className="p-3 font-medium border-b border-zinc-800 hidden md:table-cell">
                      Created
                    </th>
                    <th className="p-3 font-medium border-b border-zinc-800 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30">
                  {rooms?.map((room) => (
                    <tr
                      key={room.roomId}
                      className="hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="p-3 font-medium">
                        <div className="flex flex-col">
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
                      <td className="p-3 text-zinc-500 font-mono text-xs hidden md:table-cell">
                        {format(new Date(room.createdAt), "MM/dd/yy HH:mm")}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleCopyLink(room.roomId)}
                            className="p-1.5 text-zinc-500 hover:text-blue-500 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Copy Link"
                          >
                            {copiedId === room.roomId ? (
                              <Check size={14} className="text-green-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingRoom(room)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingRoom(room)}
                            className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
                <div className="flex items-center gap-2">
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

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 rounded-none! sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Create New Room</DialogTitle>
          </DialogHeader>
          <RoomForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setIsCreateOpen(false)}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Room"
          />
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog
        open={!!editingRoom}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRoom(null);
          }
        }}
      >
        <DialogContent className="border-zinc-800 bg-zinc-900 rounded-none! sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Edit Room Details
            </DialogTitle>
          </DialogHeader>
          {editingRoom && (
            <RoomForm
              initialData={editingRoom}
              onSubmit={(data) => {
                updateMutation.mutate({
                  id: editingRoom.roomId,
                  roomName: data.roomName,
                  description: data.description,
                  ttlSeconds: data.ttlSeconds,
                });
              }}
              onCancel={() => setEditingRoom(null)}
              isSubmitting={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog
        open={!!deletingRoom}
        onOpenChange={(open) => !open && setDeletingRoom(null)}
      >
        <DialogContent className="border-zinc-800 bg-zinc-900 rounded-none! sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Delete Room</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-zinc-400 text-sm">
              Are you sure you want to delete{" "}
              <span className="font-bold text-zinc-100">
                {deletingRoom?.roomName || deletingRoom?.roomId}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDeletingRoom(null)}
              className="px-4 py-2 text-sm bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                deletingRoom && deleteMutation.mutate(deletingRoom.roomId)
              }
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Room"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
