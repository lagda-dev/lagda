import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { apiReference } from "@scalar/hono-api-reference"

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

export const createApp = () => {
  const app = new OpenAPIHono()

  const routes = app
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
