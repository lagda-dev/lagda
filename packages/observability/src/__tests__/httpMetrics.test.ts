import { Hono } from "hono"
import { describe, expect, it } from "vitest"
import { httpMetrics } from "../httpMetrics"
import { createMetrics } from "../metrics"

// The httpMetrics middleware times each request and records RED metrics labelled by the MATCHED route
// template (not the concrete URL) to keep cardinality bounded. Exercised against a tiny Hono app.

const buildApp = (serviceName: string, metrics = createMetrics()) => {
  const app = new Hono()
  app.use("*", httpMetrics(serviceName, metrics))
  app.get("/employees/:id", (ctx) => ctx.json({ id: ctx.req.param("id") }))
  app.get("/boom", () => {
    throw new Error("handler exploded")
  })
  return { app, metrics }
}

describe("httpMetrics", () => {
  it("records a request under the matched route template, not the concrete URL", async () => {
    // Arrange
    const { app, metrics } = buildApp("lagda-server")

    // Act
    await app.request("/employees/abc-123")
    const exposition = await metrics.registry.metrics()

    // Assert — the id is collapsed into the `:id` template, so two ids share one series
    expect(exposition).toContain('http_requests_total{service="lagda-server",method="GET",route="/employees/:id",status_code="200"} 1')
    expect(exposition).not.toContain("abc-123")
  })

  it("still records the request when the downstream handler throws", async () => {
    // Arrange
    const { app, metrics } = buildApp("lagda-server")

    // Act
    const response = await app.request("/boom")
    const exposition = await metrics.registry.metrics()

    // Assert — Hono turns the thrown error into a 500, and the metric is recorded for it
    expect(response.status).toBe(500)
    expect(exposition).toContain('http_requests_total{service="lagda-server",method="GET",route="/boom",status_code="500"} 1')
  })

  it("labels unmatched routes with a fixed literal to keep cardinality bounded", async () => {
    // Arrange
    const { app, metrics } = buildApp("lagda-server")

    // Act
    await app.request("/does/not/exist")
    const exposition = await metrics.registry.metrics()

    // Assert
    expect(exposition).toContain('route="unmatched"')
    expect(exposition).not.toContain("/does/not/exist")
  })

  it("observes the request duration histogram once per request", async () => {
    // Arrange
    const { app, metrics } = buildApp("lagda-auth")

    // Act
    await app.request("/employees/1")
    const exposition = await metrics.registry.metrics()

    // Assert
    expect(exposition).toContain('http_request_duration_seconds_count{service="lagda-auth",method="GET",route="/employees/:id"} 1')
  })
})
