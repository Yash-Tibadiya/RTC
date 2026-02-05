"use client";

import { RealtimeEvents } from "./realtime";
import { createRealtime } from "@upstash/realtime/client";

export const { useRealtime } = createRealtime<RealtimeEvents>();
