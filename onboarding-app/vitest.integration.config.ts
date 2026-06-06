import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

// Integration suite: hits a live local Supabase stack (Docker) to prove data-layer RLS.
// Run with `npm run test:rls` after `supabase start`. Kept out of the default `npm test`
// (which is scoped to src/ in vite.config.ts) so unit runs stay fast and Docker-free.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
