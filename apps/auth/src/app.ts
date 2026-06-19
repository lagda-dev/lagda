import { httpMetrics, metricsHandler, requestLogger } from "@lagda/observability"
import type { Metrics, RequestLoggerVariables } from "@lagda/observability"
import type { Logger } from "@lagda/logger"
import { Hono } from "hono"
import type { Context } from "hono"
import type { Auth } from "./auth"

// The auth service's HTTP surface. Better Auth owns every identity route under /api/auth/* — including
// sign-in, email-OTP, organizations, JWT issuance (/api/auth/token), and the JWKS document the resource
// server verifies bearer tokens against (/api/auth/jwks). We add the liveness/readiness probes plus the
// observability surface: request-id logging, RED metrics, and the Prometheus scrape endpoint (§9).

// The service identity stamped on every metric and trace from this deployable (§9).
const SERVICE_NAME = "lagda-auth"

// The Hono context variables this app threads through middleware: the per-request child logger.
export type AuthAppVariables = RequestLoggerVariables

// Optional observability services the host injects. Both are optional so unit tests can build a lean
// app without a metrics registry or a logger; `server.ts` supplies the real ones.
export type AppOptions = {
  metrics?: Metrics
  logger?: Logger
}

export const createApp = (auth: Auth, options: AppOptions = {}) => {
  const app = new Hono<{ Variables: AuthAppVariables }>()

  // Establish per-request log correlation first (§9) so every later log line carries the request id.
  if (options.logger !== undefined) {
    app.use("*", requestLogger(options.logger))
  }

  // Time every request and record the RED metrics (§9).
  if (options.metrics !== undefined) {
    app.use("*", httpMetrics(SERVICE_NAME, options.metrics))
  }

  // The Prometheus scrape endpoint (§9). A no-op responder keeps `/metrics` on `AppType` when no
  // metrics registry is injected (unit tests).
  const injectedMetrics = options.metrics
  const renderMetrics = (ctx: Context) => (injectedMetrics !== undefined ? metricsHandler(injectedMetrics)(ctx) : ctx.text("", 200))

  const routes = app
    // Liveness: the process is up and serving. No dependencies are checked here (§9).
    .get("/healthz", (ctx) => ctx.json({ status: "ok" }))
    // Readiness: the service is ready to take traffic. The Better Auth handler owns its own pool;
    // a deeper DB ping can be added once a health hook is exposed.
    .get("/readyz", (ctx) => ctx.json({ status: "ready" }))
    // Prometheus metrics scrape endpoint.
    .get("/metrics", renderMetrics)

  // Delegate all identity/token routes (incl. the well-known JWKS at /api/auth/jwks) to Better Auth.
  app.on(["POST", "GET"], "/api/auth/*", (ctx) => auth.handler(ctx.req.raw))

  return routes
}

export type AppType = ReturnType<typeof createApp>
