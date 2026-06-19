import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { apiReference } from "@scalar/hono-api-reference"
import type { MiddlewareHandler } from "hono"
import type { AuthVariables } from "./middleware/authContext"
import type { ApiDependencies } from "./routes/v1/dependencies"
import { registerV1Routes } from "./routes/v1/v1"

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

// Optional cross-cutting middleware the host can inject. Rate limiting lives behind these so the app
// can be built in tests without the `hono-rate-limiter` dependency; `server.ts` supplies the real
// limiters.
export type AppOptions = {
  globalRateLimit?: MiddlewareHandler
}

export const createApp = (deps: ApiDependencies, options: AppOptions = {}) => {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>()

  // Apply the global per-token/per-IP rate limit to every route when provided (§4).
  if (options.globalRateLimit !== undefined) {
    app.use("*", options.globalRateLimit)
  }

  // Register the public v1 resources on the OpenAPIHono app, then chain the OpenAPI health route and
  // the plain probes. `.openapi(...)` preserves the OpenAPIHono type (so v1 registration keeps
  // working); the trailing `.get(...)` probes finalize the chain `AppType` is derived from.
  const withV1 = registerV1Routes(app, deps)

  const routes = withV1
    .openapi(healthRoute, (ctx) => ctx.json({ status: "ok", service: "lagda-server" }, 200))
    .get("/healthz", (ctx) => ctx.json({ status: "ok" }))
    .get("/readyz", (ctx) => ctx.json({ status: "ready" }))

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
