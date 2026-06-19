import { Hono } from "hono"
import { describe, expect, it } from "vitest"
import { createMetrics } from "../metrics"
import { metricsHandler } from "../metricsHandler"

// The /metrics handler renders the registry's exposition text with the registry content-type. Mounted
// on a tiny Hono app so the test exercises the real Hono response path.

describe("metricsHandler", () => {
  it("returns the exposition text with the registry content-type", async () => {
    // Arrange
    const metrics = createMetrics()
    metrics.recordSyncRun("succeeded")
    const app = new Hono().get("/metrics", metricsHandler(metrics))

    // Act
    const response = await app.request("/metrics")
    const body = await response.text()

    // Assert
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe(metrics.registry.contentType)
    expect(body).toContain('sync_runs_total{outcome="succeeded"} 1')
  })
})
