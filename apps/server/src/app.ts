import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { apiReference } from "@scalar/hono-api-reference"
import { httpMetrics, metricsHandler, requestLogger } from "@lagda/observability"
import type { Metrics } from "@lagda/observability"
import type { Logger } from "@lagda/logger"
import type { Context, MiddlewareHandler } from "hono"
import type { AuthVariables } from "./middleware/authContext"
import type { ApiDependencies } from "./routes/v1/dependencies"
import { registerV1Routes } from "./routes/v1/v1"

// The service identity stamped on every metric and trace from this deployable (§9).
const SERVICE_NAME = "lagda-server"

// The application monolith: the public REST API (§4) plus the system probes and the OpenAPI docs.
// `createApp` takes its dependencies injected (repository, job enqueuer, token verifier) so it is
// fully testable against mocks without a live DB or auth service; `server.ts` wires the real ones.

const HealthResponse = z
  .object({
    status: z.literal("ok"),
    service: z.literal("lagda-server"),
  })
  .openapi("HealthResponse")

const healthRoute = createRoute({
  method: "get",
  path: "/api/v1/health",
  tags: ["system"],
  summary: "Service health probe",
  responses: {
    200: {
      description: "The service is healthy",
      content: { "application/json": { schema: HealthResponse } },
    },
  },
})

// Optional cross-cutting middleware/services the host can inject. Rate limiting lives behind these so
// the app can be built in tests without the `hono-rate-limiter` dependency; observability (`metrics`
// + `logger`) is optional too so unit tests can build a lean app. `server.ts` supplies the real ones.
export type AppOptions = {
  globalRateLimit?: MiddlewareHandler
  metrics?: Metrics
  logger?: Logger
}

export const createApp = (deps: ApiDependencies, options: AppOptions = {}) => {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>()

  // Establish per-request log correlation first (§9) so every later log line carries the request id.
  if (options.logger !== undefined) {
    app.use("*", requestLogger(options.logger))
  }

  // Time every request and record the RED metrics (§9). Placed before the rate limiter so throttled
  // (429) responses are counted too.
  if (options.metrics !== undefined) {
    app.use("*", httpMetrics(SERVICE_NAME, options.metrics))
  }

  // Apply the global per-token/per-IP rate limit to every route when provided (§4).
  if (options.globalRateLimit !== undefined) {
    app.use("*", options.globalRateLimit)
  }

  // Register the public v1 resources on the OpenAPIHono app, then chain the OpenAPI health route and
  // the plain probes. `registerV1Routes` threads each resource's `.openapi(...)` result into the next
  // and returns the accumulated router, so its return type carries every `/api/v1/*` route. The
  // trailing `.openapi(...)`/`.get(...)` calls below finalize the chain `AppType` is derived from —
  // that union of route types is what the SPA's `hc<AppType>` client reads (e.g. `client.api.v1.
  // templates.$get`, `client.api.v1.synchronizations.$post`).
  const withV1 = registerV1Routes(app, deps)

  // The Prometheus scrape endpoint (§9). A no-op responder keeps `/metrics` on `AppType` when no
  // metrics registry is injected (unit tests), so the SPA's `hc<AppType>` type compiles either way.
  const injectedMetrics = options.metrics
  const renderMetrics = (ctx: Context) => (injectedMetrics !== undefined ? metricsHandler(injectedMetrics)(ctx) : ctx.text("", 200))

  const routes = withV1
    .openapi(healthRoute, (ctx) => ctx.json({ status: "ok", service: "lagda-server" }, 200))
    .get("/healthz", (ctx) => ctx.json({ status: "ok" }))
    .get("/readyz", (ctx) => ctx.json({ status: "ready" }))
    .get("/metrics", renderMetrics)

  app.doc("/api/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "Lagda API",
      version: "0.1.0",
      description: "Public REST API for the Lagda email-signature platform",
    },
  })

  app.get("/api/docs", apiReference({ spec: { url: "/api/openapi.json" } }))

  return routes
}

export type AppType = ReturnType<typeof createApp>
