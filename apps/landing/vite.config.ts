import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The landing site is a standalone static SPA — no API, so (unlike apps/web) there is no proxy.
// It runs on its own port so it can boot alongside the admin SPA (5173) under one `pnpm dev`.
const useFilesystemPolling = process.env.VITE_USE_POLLING === "true"

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on 0.0.0.0 so a published container port reaches the dev server; harmless on the host.
    host: true,
    port: 5174,
    watch: useFilesystemPolling ? { usePolling: true, interval: 300 } : undefined,
  },
})
