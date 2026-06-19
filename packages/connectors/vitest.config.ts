import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // googleClient.ts is excluded: it is a thin wrapper over the `googleapis` SDK and is
      // verified by integration, not unit tests — the connector is tested against a mock client.
      exclude: ["src/**/__tests__/**", "src/**/*.test.ts", "src/connectors.ts", "src/google/googleClient.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
