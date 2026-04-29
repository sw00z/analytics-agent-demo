import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Load .env so tests inherit DATABASE_URL etc. without having to set
    // them per-shell. The SQL safety tests don't actually hit the DB,
    // but biTools.ts pulls in lib/db/client.ts which validates the URL
    // at import time.
    setupFiles: ["dotenv/config"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
