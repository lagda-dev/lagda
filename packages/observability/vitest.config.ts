import { defineConfig } from "vitest/config"

// Coverage is scoped to the PURE, deterministic modules: the metrics factory, the metrics handler,
// the HTTP-metrics middleware, and the request logger. `telemetry.ts` is the live OTLP NodeSDK
// bootstrap — it loads the OpenTelemetry auto-instrumentations and (when configured) talks to a
// running OTLP collector, so it cannot be unit-tested without that collector and is excluded from
// coverage. It is smoke-verified by the no-op path in integration instead.
export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/__tests__/**", "src/telemetry.ts", "src/observability.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
