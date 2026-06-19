import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// The SPA tests render React Testing Library components, so they need a DOM. jsdom + the jest-dom
// matchers are wired here. No strict coverage gate for the SPA — visual/e2e cover it later (task scope).
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
})
