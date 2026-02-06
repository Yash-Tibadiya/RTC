import { treaty } from "@elysiajs/eden";
import type { app } from "../app/api/[[...slugs]]/route";
import { config } from "@/config/config";

export const api = treaty<typeof app>(config.baseUrl!).api;
