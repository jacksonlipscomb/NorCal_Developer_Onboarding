import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// SPA only. The app talks directly to Supabase (auth + PostgREST) from the browser;
// there is no edge/API tier. Vite builds the client bundle into dist/.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Default unit suite is the fast, Docker-free tests under src/. The RLS integration
  // suite (tests/) needs a live Supabase stack and runs via `npm run test:rls`.
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
