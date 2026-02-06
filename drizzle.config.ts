import { defineConfig } from "drizzle-kit";
import { config } from "@/config/config";

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: config.databaseUrl!,
  },
});