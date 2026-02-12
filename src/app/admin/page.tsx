"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Plus, Pencil, Trash2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

  // --- Queries ---
  const {
    data: rooms,
    isLoading,
    isError,
  } = useQuery<Room[]>({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });

  // --- Mutations ---
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
      setDeletingRoom(null);
    },
  });

  // --- Handlers ---
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      roomName: formData.get("roomName") as string,
      description: formData.get("description") as string,
      ttlSeconds: formData.get("ttlSeconds") as string,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRoom) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingRoom.roomId,
      roomName: formData.get("roomName") as string,
      description: formData.get("description") as string,
      ttlSeconds: formData.get("ttlSeconds") as string,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-zinc-800 selection:text-zinc-200">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[500px] w-[500px] rounded-full bg-zinc-800 opacity-20 blur-[100px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl p-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-zinc-400">Manage chat rooms and moderation.</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-white text-black hover:bg-zinc-200"
            >
              <Plus className="mr-2 h-4 w-4" /> New Room
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle>Total Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{rooms?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Room List */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>Active Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex py-8 justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : isError ? (
              <div className="text-red-500">Failed to load rooms.</div>
            ) : rooms?.length === 0 ? (
              <div className="text-zinc-500">No rooms found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 text-zinc-400">
                    <tr>
                      <th className="p-4 font-medium">Room Name</th>
                      <th className="p-4 font-medium">Room ID</th>
                      <th className="p-4 font-medium">Description</th>
                      <th className="p-4 font-medium">Created At</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {rooms?.map((room) => (
                      <tr key={room.roomId} className="hover:bg-zinc-800/50">
                        <td className="p-4 font-medium text-white">
                          {room.roomName || (
                            <span className="text-zinc-600 italic">
                              Untitled
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-zinc-300 font-mono text-xs">
                          {room.roomId}
                        </td>
                        <td className="p-4 text-zinc-400 truncate max-w-[200px]">
                          {room.description}
                        </td>
                        <td className="p-4 text-zinc-400">
                          {format(
                            new Date(room.createdAt),
                            "MMM d, yyyy HH:mm",
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingRoom(room)}
                              className="hover:bg-zinc-800"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingRoom(room)}
                              className="text-red-500 hover:bg-zinc-800 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription>
                Add a new chat room to the platform.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Room Name</label>
                <input
                  name="roomName"
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  placeholder="e.g. General Custom"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  className="flex min-h-[80px] w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  placeholder="Optional description..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">TTL (Seconds)</label>
                <input
                  name="ttlSeconds"
                  type="number"
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  placeholder="e.g. 3600"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-white text-black hover:bg-zinc-200"
                >
                  {createMutation.isPending ? "Creating..." : "Create Room"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={!!editingRoom}
          onOpenChange={(open) => !open && setEditingRoom(null)}
        >
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Room</DialogTitle>
              <DialogDescription>Update room details.</DialogDescription>
            </DialogHeader>
            {editingRoom && (
              <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Name</label>
                  <input
                    name="roomName"
                    defaultValue={editingRoom.roomName || ""}
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    placeholder="e.g. General Custom"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingRoom.description || ""}
                    className="flex min-h-[80px] w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    placeholder="Optional description..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">TTL (Seconds)</label>
                  <input
                    name="ttlSeconds"
                    type="number"
                    defaultValue={editingRoom.ttlSeconds || ""}
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                    placeholder="e.g. 3600"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingRoom(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="bg-white text-black hover:bg-zinc-200"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingRoom}
          onOpenChange={(open) => !open && setDeletingRoom(null)}
        >
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Room</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-bold text-white">
                  {deletingRoom?.roomName || deletingRoom?.roomId}
                </span>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setDeletingRoom(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  deletingRoom && deleteMutation.mutate(deletingRoom.roomId)
                }
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Room"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
