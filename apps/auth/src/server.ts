// Telemetry must start before any instrumented module loads (§9), so this import is FIRST and its
// side effect boots the OTel SDK (a no-op when no OTLP endpoint is configured).
import { telemetry } from "./telemetry"
import { serve } from "@hono/node-server"
import { createLogger } from "@lagda/logger"
import { createMetrics } from "@lagda/observability"
import { createApp } from "./app"
import { createAuth } from "./auth"
import { loadAuthConfig } from "./loadAuthConfig"
import { resolveOtpSender } from "./resolveOtpSender"

const config = loadAuthConfig()
const logger = createLogger({ name: "lagda-auth" })
const metrics = createMetrics()
// Resolve OTP delivery before building auth: this throws (fail fast) when running in production without
// SMTP configured, so the instance never boots into a state where nobody can receive a sign-in code.
const otpSender = resolveOtpSender()
const auth = createAuth({ databaseUrl: config.databaseUrl, baseUrl: config.baseUrl, trustedOrigins: config.trustedOrigins, otpSender })
const app = createApp(auth, { metrics, logger })

serve({ fetch: app.fetch, port: config.port }, (info) => {
  logger.info({ operation: "server.start", port: info.port, telemetryEnabled: telemetry.enabled })
})
