// Telemetry must start before any instrumented module loads (§9), so this import is FIRST and its
// side effect boots the OTel SDK (a no-op when no OTLP endpoint is configured).
import { telemetry } from "./telemetry"
import { serve } from "@hono/node-server"
import { createLogger } from "@lagda/logger"
import { createMetrics } from "@lagda/observability"
import { createApp } from "./app"
import { createAuth } from "./auth"
import { loadAuthConfig } from "./loadAuthConfig"

const config = loadAuthConfig()
const logger = createLogger({ name: "lagda-auth" })
const metrics = createMetrics()
const auth = createAuth({ databaseUrl: config.databaseUrl, baseUrl: config.baseUrl })
const app = createApp(auth, { metrics, logger })

serve({ fetch: app.fetch, port: config.port }, (info) => {
  logger.info({ operation: "server.start", port: info.port, telemetryEnabled: telemetry.enabled })
})
