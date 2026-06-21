import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Dev proxy split (§1 two-deployable architecture): "/api/auth" must be matched BEFORE the broader
// "/api" rule so identity traffic reaches the Better Auth service while every other "/api/*" call
// reaches the application server. The targets are env-driven so the SAME config works whether the dev
// server runs on the host (localhost defaults) or inside the dockerized dev stack (compose service
// names, e.g. http://auth:3100). Vite evaluates proxy keys by specificity, but we also declare the
// more specific key first to make the intent obvious.
const authProxyTarget = process.env.AUTH_PROXY_TARGET ?? "http://localhost:3100"
const serverProxyTarget = process.env.SERVER_PROXY_TARGET ?? "http://localhost:3000"

// In Docker on macOS/Windows the bind-mount filesystem events don't reach the Linux container, so HMR
// file watching must poll. Gated on an env flag so host runs keep native (event-based) watching.
const useFilesystemPolling = process.env.VITE_USE_POLLING === "true"

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on 0.0.0.0 so the published container port reaches the dev server; harmless on the host.
    host: true,
    port: 5173,
    watch: useFilesystemPolling ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      "/api/auth": authProxyTarget,
      "/api": serverProxyTarget,
    },
  },
})
