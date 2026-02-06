import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slugs]]/route";
import { config } from "@/config/config";

export const api = treaty<App>(config.baseUrl!).api;
