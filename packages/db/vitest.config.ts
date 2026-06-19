import { defineConfig } from "vitest/config"

// Live-connection code (db.ts, migrate.ts) cannot be unit-tested without a real
// database, so coverage is scoped to the pure modules only — the connection guards.
// Everything that opens a connection or touches the filesystem migrator is excluded
// and is exercised by integration/e2e tests instead.
export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/connection.ts"],
      exclude: ["src/db.ts", "src/migrate.ts", "src/database.d.ts", "src/schema.ts", "src/migrations/**", "src/**/*.test.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
