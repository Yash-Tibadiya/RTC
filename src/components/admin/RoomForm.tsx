import { useState, useEffect } from "react";
import { DialogFooter } from "@/components/ui/dialog";

export interface RoomFormData {
  roomName: string;
  description: string;
  ttlSeconds: string;
}

interface RoomFormProps {
  initialData?: {
    roomName?: string | null;
    description?: string | null;
    ttlSeconds?: number | null;
  };
  onSubmit: (data: RoomFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export function RoomForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: RoomFormProps) {
  const [roomName, setRoomName] = useState(initialData?.roomName || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [ttlHours, setTtlHours] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState("");
  const [ttlError, setTtlError] = useState("");

  // Initialize TTL from initialData
  useEffect(() => {
    if (initialData?.ttlSeconds) {
      const h = Math.floor(initialData.ttlSeconds / 3600);
      const m = Math.floor((initialData.ttlSeconds % 3600) / 60);
      setTtlHours(h.toString().padStart(2, "0"));
      setTtlMinutes(m.toString().padStart(2, "0"));
    } else if (initialData) {
      // If initialData exists but ttlSeconds is null/0, reset to empty
      setTtlHours("");
      setTtlMinutes("");
    } else {
      // Default only for creation if you wanted a default, but for now empty
    }
  }, [initialData]);

  // Validate TTL
  useEffect(() => {
    setTtlError("");
    const h = parseInt(ttlHours || "0", 10);
    const m = parseInt(ttlMinutes || "0", 10);

    if (ttlHours === "" && ttlMinutes === "") {
      setTtlError("Timer is required");
    } else if (h === 24 && m > 0) {
      setTtlError("Max duration is 24:00");
    } else if ((ttlHours !== "" || ttlMinutes !== "") && h === 0 && m === 0) {
      setTtlError("Timer cannot be 00:00");
    }
  }, [ttlHours, ttlMinutes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (ttlHours === "" && ttlMinutes === "") {
      setTtlError("Timer is required");
      return;
    }

    let ttl = 0;
    if (ttlHours !== "" || ttlMinutes !== "") {
      const h = parseInt(ttlHours || "0", 10);
      const m = parseInt(ttlMinutes || "0", 10);
      ttl = h * 3600 + m * 60;

      if (ttl === 0) {
        setTtlError("Timer cannot be 00:00");
        return;
      }
    }

    onSubmit({
      roomName,
      description,
      ttlSeconds: ttl > 0 ? String(ttl) : "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-400">Room Name</label>
        <input
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700"
          placeholder="e.g. General Landing"
          maxLength={100}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-400">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px] w-full rounded-none border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 shadow-sm placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 resize-y"
          placeholder="Room description..."
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
                if (ttlMinutes.length === 1) setTtlMinutes("0" + ttlMinutes);
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
          onClick={onCancel}
          className="px-4 py-2 text-sm bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !!ttlError}
          className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </DialogFooter>
    </form>
  );
}
