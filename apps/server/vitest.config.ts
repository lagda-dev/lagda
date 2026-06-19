import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Workspace packages are consumed as TypeScript source. The aliases point each `@lagda/*` import at
// its named entry file so tests resolve without a build step (mirrors the tsconfig `paths` story in
// §2). `@lagda/db` and `@lagda/jobs` are only imported by the coverage-excluded live wiring, but the
// aliases keep type resolution and any direct imports honest.
const resolveFromHere = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@lagda/auth-contract": resolveFromHere("../../packages/auth-contract/src/auth-contract.ts"),
      "@lagda/core": resolveFromHere("../../packages/core/src/core.ts"),
      "@lagda/db": resolveFromHere("../../packages/db/src/db.ts"),
      "@lagda/jobs": resolveFromHere("../../packages/jobs/src/jobs.ts"),
      "@lagda/logger": resolveFromHere("../../packages/logger/src/logger.ts"),
      "@lagda/observability": resolveFromHere("../../packages/observability/src/observability.ts"),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Excluded from coverage:
      // - server.ts: production wiring, started by integration not unit tests.
      // - repositories/kyselyRepository.ts: requires a live Postgres; verified by integration tests.
      //   Handlers are unit-tested against the mock repository instead.
      // - middleware/jwksVerifier.ts: performs real network JWKS fetches (jose); the RBAC decision
      //   logic is unit-tested against an injected mock verifier.
      // - infrastructure/rateLimit.ts: thin wrapper over `hono-rate-limiter`, exercised against the
      //   running app in integration tests.
      exclude: [
        "src/**/__tests__/**",
        "src/**/*.test.ts",
        "src/server.ts",
        // telemetry.ts: import-first OTel bootstrap; needs a live OTLP collector, so it is verified
        // by the package's no-op path rather than unit tests here.
        "src/telemetry.ts",
        "src/repositories/kyselyRepository.ts",
        "src/middleware/jwksVerifier.ts",
        "src/infrastructure/rateLimit.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
