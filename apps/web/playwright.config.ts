import { defineConfig, devices } from "@playwright/test"

// Playwright drives the real running app (not jsdom): the functional smoke (e2e/smoke.spec.ts) and the
// Argos visual snapshots (e2e/visual/). The base URL is env-driven so the same specs run against the
// local dev server (Vite :5173) or the CI stack served by `docker compose up` (:3000).
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173"

export default defineConfig({
  testDir: "e2e",
  // CI is the source of truth: no implicit retries locally, two in CI to absorb cold-start flakiness,
  // and forbid stray test.only landing in a PR.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
