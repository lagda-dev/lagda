import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { loadConfig } from "@lagda/core"
import { createDatabase } from "@lagda/db"
import { createPgBossQueue } from "@lagda/jobs"
import { createApp } from "./app"
import { createGlobalRateLimit, loadRateLimitConfig } from "./infrastructure/rateLimit"
import { createJwksVerifier, resolveJwksUrl } from "./middleware/jwksVerifier"
import { createKyselyRepository, createQueueEnqueuer } from "./repositories/kyselyRepository"

// Production wiring (excluded from coverage): resolve config, build the real data-access repository,
// the pg-boss-backed job enqueuer, the JWKS token verifier, and the rate limiter, then start the
// server. All the logic lives in tested units; this file only assembles them.

const config = loadConfig()
const database = createDatabase({ DATABASE_URL: config.DATABASE_URL })
const queue = createPgBossQueue(config.DATABASE_URL ?? "")

const app = createApp(
  {
    repository: createKyselyRepository(database),
    enqueuer: createQueueEnqueuer(queue),
    verifyToken: createJwksVerifier(resolveJwksUrl()),
  },
  { globalRateLimit: createGlobalRateLimit(loadRateLimitConfig()) },
)

const isProduction = process.env.NODE_ENV === "production"
if (isProduction) {
  app.use("/*", serveStatic({ root: "./public" }))
  app.get("*", serveStatic({ path: "./public/index.html" }))
}

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  process.stdout.write(`lagda-server listening on http://localhost:${info.port}\n`)
})
