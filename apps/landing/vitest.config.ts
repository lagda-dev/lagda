import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// The landing site renders React Testing Library components, so the tests need a DOM. jsdom + the
// jest-dom matchers are wired here, mirroring apps/web's test setup.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
})
