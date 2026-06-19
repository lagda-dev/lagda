import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // queue.ts is excluded: it is a thin adapter over the `pg-boss` SDK that opens a real
      // Postgres connection — it is verified by integration, not unit tests. Handlers are
      // tested in isolation against injected mock deps, so the barrel is excluded too.
      exclude: ["src/**/__tests__/**", "src/**/*.test.ts", "src/jobs.ts", "src/queue.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
