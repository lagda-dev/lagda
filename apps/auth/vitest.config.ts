import { defineConfig } from "vitest/config"

// Better Auth wiring (auth.ts), its HTTP mount (app.ts), and the process entry (server.ts) cannot be
// unit-tested without a live Postgres and a running Better Auth instance — like @lagda/db, those are
// excluded from coverage and exercised by integration/e2e tests instead. Coverage is scoped to the
// PURE, deterministic modules: application-token scope/authorization logic, the OTP sender, the local
// error helper, and the config loader.
export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: [
        "src/applicationTokens.ts",
        "src/otpSender.ts",
        "src/otpGenerator.ts",
        "src/otpEmailSender.ts",
        "src/provisionAppOrganization.ts",
        "src/resolveOtpSender.ts",
        "src/loadAuthConfig.ts",
      ],
      // server.ts/app.ts/auth.ts need a live runtime. SMTP transport mechanics now live in @lagda/email
      // (tested there); resolveOtpSender's mailer resolver is injected around in tests.
      exclude: ["src/auth.ts", "src/app.ts", "src/server.ts", "src/**/*.test.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
