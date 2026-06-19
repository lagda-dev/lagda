import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Dev proxy split (§1 two-deployable architecture): "/api/auth" must be matched BEFORE the broader
// "/api" rule so identity traffic reaches the Better Auth service (:3100) while every other "/api/*"
// call reaches the application server (:3000). Vite evaluates proxy keys by specificity, but we also
// declare the more specific key first to make the intent obvious.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api/auth": "http://localhost:3100",
      "/api": "http://localhost:3000",
    },
  },
})
