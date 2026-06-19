// Telemetry must start before any instrumented module loads (§9), so this import is FIRST and its
// side effect boots the OTel SDK (a no-op when no OTLP endpoint is configured).
import { telemetry } from "./telemetry"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { loadConfig } from "@lagda/core"
import { createDatabase } from "@lagda/db"
import { createPgBossQueue } from "@lagda/jobs"
import { createLogger } from "@lagda/logger"
import { createMetrics } from "@lagda/observability"
import { createApp } from "./app"
import { createGlobalRateLimit, loadRateLimitConfig } from "./infrastructure/rateLimit"
import { createJwksVerifier, resolveJwksUrl } from "./middleware/jwksVerifier"
import { createKyselyRepository, createQueueEnqueuer } from "./repositories/kyselyRepository"

// Production wiring (excluded from coverage): resolve config, build the structured logger and the
// Prometheus registry, the real data-access repository (feeding DB-query timings into the metrics),
// the pg-boss-backed job enqueuer, the JWKS token verifier, and the rate limiter, then start the
// server. All the logic lives in tested units; this file only assembles them.

const config = loadConfig()
const logger = createLogger({ level: config.LOG_LEVEL, name: "lagda-server" })
const metrics = createMetrics()
const database = createDatabase({ DATABASE_URL: config.DATABASE_URL })
const queue = createPgBossQueue(config.DATABASE_URL ?? "")

const app = createApp(
  {
    repository: createKyselyRepository(database, metrics.recordDbQuery),
    enqueuer: createQueueEnqueuer(queue),
    verifyToken: createJwksVerifier(resolveJwksUrl()),
    recordSyncRun: metrics.recordSyncRun,
  },
  { globalRateLimit: createGlobalRateLimit(loadRateLimitConfig()), metrics, logger },
)

const isProduction = process.env.NODE_ENV === "production"
if (isProduction) {
  app.use("/*", serveStatic({ root: "./public" }))
  app.get("*", serveStatic({ path: "./public/index.html" }))
}

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ operation: "server.start", port: info.port, telemetryEnabled: telemetry.enabled })
})
