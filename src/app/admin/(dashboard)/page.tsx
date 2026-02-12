"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Room = {
  roomId: string;
  roomName: string | null;
  description: string | null;
  ttlSeconds: number | null;
  createdAt: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  // Edit State
  const [ttlHours, setTtlHours] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState("");
  const [ttlError, setTtlError] = useState("");

  useEffect(() => {
    if (editingRoom) {
      if (editingRoom.ttlSeconds) {
        const h = Math.floor(editingRoom.ttlSeconds / 3600);
        const m = Math.floor((editingRoom.ttlSeconds % 3600) / 60);
        setTtlHours(h.toString().padStart(2, "0"));
        setTtlMinutes(m.toString().padStart(2, "0"));
      } else {
        setTtlHours("");
        setTtlMinutes("");
      }
      setTtlError("");
    }
  }, [editingRoom]);

  useEffect(() => {
    setTtlError("");
    const h = parseInt(ttlHours || "0", 10);
    const m = parseInt(ttlMinutes || "0", 10);

    if (h === 24 && m > 0) {
      setTtlError("Max duration is 24:00");
    }
  }, [ttlHours, ttlMinutes]);

  // Stats State
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
    data: rooms,
    isLoading,
    isError,
    refetch: refetchRooms,
    isRefetching,
  } = useQuery<Room[]>({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });

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
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create room");
      return res.json();
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
              Active Rooms ({rooms?.length || 0})
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
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 rounded-none! sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Create New Room</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createMutation.mutate({
                roomName: formData.get("roomName") as string,
                description: formData.get("description") as string,
                ttlSeconds: formData.get("ttlSeconds") as string,
              });
            }}
            className="grid gap-4 py-4"
          >
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-400">
                Room Name
              </label>
              <input
                name="roomName"
                className="w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="e.g. General Landing"
                maxLength={100}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-400">
                Description
              </label>
              <textarea
                name="description"
                className="min-h-[100px] w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 resize-y"
                placeholder="Room description..."
                maxLength={500}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-400">
                TTL (Seconds)
              </label>
              <input
                name="ttlSeconds"
                type="number"
                className="w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="3600"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-sm bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {createMutation.isPending ? "Creating..." : "Create Room"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog
        open={!!editingRoom}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRoom(null);
            setTtlHours("");
            setTtlMinutes("");
            setTtlError("");
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                let ttl: number | undefined = undefined;

                if (ttlHours !== "" || ttlMinutes !== "") {
                  const h = parseInt(ttlHours || "0", 10);
                  const m = parseInt(ttlMinutes || "0", 10);
                  const total = h * 3600 + m * 60;

                  if (total === 0) {
                    setTtlError("Timer cannot be 00:00");
                    return;
                  }
                  ttl = total;
                }

                updateMutation.mutate({
                  id: editingRoom.roomId,
                  roomName: formData.get("roomName") as string,
                  description: formData.get("description") as string,
                  ttlSeconds: ttl ? String(ttl) : "0",
                });
              }}
              className="grid gap-4 py-4"
            >
              <div className="grid gap-2">
                <label className="text-sm font-medium text-zinc-400">
                  Room Name
                </label>
                <input
                  name="roomName"
                  defaultValue={editingRoom.roomName || ""}
                  className="w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
                  maxLength={100}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-zinc-400">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingRoom.description || ""}
                  className="min-h-[100px] w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 resize-y"
                  maxLength={500}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-zinc-400">
                  Reset Timer (HH:MM)
                </label>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="00"
                      value={ttlHours}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!/^\d*$/.test(val)) return;
                        val = val.replace(/^0+(?=\d)/, "");
                        if (val === "" || parseInt(val) <= 24) {
                          setTtlHours(val);
                        }
                      }}
                      onBlur={() => {
                        if (ttlHours.length === 1) setTtlHours("0" + ttlHours);
                      }}
                      className="w-full text-center rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-[10px] text-zinc-500 text-center block mt-1">
                      Hours (0-24)
                    </span>
                  </div>
                  <span className="text-zinc-500 py-2 font-bold">:</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="00"
                      value={ttlMinutes}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!/^\d*$/.test(val)) return;
                        val = val.replace(/^0+(?=\d)/, "");
                        if (val === "" || parseInt(val) <= 59) {
                          setTtlMinutes(val);
                        }
                      }}
                      onBlur={() => {
                        if (ttlMinutes.length === 1)
                          setTtlMinutes("0" + ttlMinutes);
                      }}
                      className="w-full text-center rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-[10px] text-zinc-500 text-center block mt-1">
                      Mins (0-59)
                    </span>
                  </div>
                </div>
                {ttlError && (
                  <p className="text-red-500 text-xs font-bold bg-red-500/10 p-2 border border-red-500/20">
                    {ttlError}
                  </p>
                )}
              </div>
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 text-sm bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending || !!ttlError}
                  className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </DialogFooter>
            </form>
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
