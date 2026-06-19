import { describe, expect, it } from "vitest"
import { createMetrics } from "../metrics"

// The metrics factory is pure: each call yields an independent registry whose exposition text carries
// exactly the metric names docker/observability expects. These tests assert names, labels, and that
// the typed recorders write the values they claim.

describe("createMetrics", () => {
  it("exposes the RED and domain metric names the dashboards expect", async () => {
    // Arrange
    const metrics = createMetrics()

    // Act
    const exposition = await metrics.registry.metrics()

    // Assert
    expect(exposition).toContain("http_requests_total")
    expect(exposition).toContain("http_request_duration_seconds")
    expect(exposition).toContain("db_query_duration_seconds")
    expect(exposition).toContain("jobs_queue_depth")
    expect(exposition).toContain("jobs_processed_total")
    expect(exposition).toContain("sync_runs_total")
  })

  it("returns an isolated registry per call so tests never share state", () => {
    // Arrange + Act
    const first = createMetrics()
    const second = createMetrics()

    // Assert
    expect(first.registry).not.toBe(second.registry)
  })

  it("records an HTTP request with the service, method, route, and status_code labels", async () => {
    // Arrange
    const metrics = createMetrics()

    // Act
    metrics.recordHttp({ service: "lagda-server", method: "GET", route: "/api/v1/employees", statusCode: 200, durationSeconds: 0.123 })
    const exposition = await metrics.registry.metrics()

    // Assert
    expect(exposition).toContain('http_requests_total{service="lagda-server",method="GET",route="/api/v1/employees",status_code="200"} 1')
    expect(exposition).toContain('http_request_duration_seconds_count{service="lagda-server",method="GET",route="/api/v1/employees"} 1')
  })

  it("records a DB query duration under the service and operation labels", async () => {
    // Arrange
    const metrics = createMetrics()

    // Act
    metrics.recordDbQuery({ service: "lagda-server", operation: "listEmployees", durationSeconds: 0.05 })
    const exposition = await metrics.registry.metrics()

    // Assert
    expect(exposition).toContain('db_query_duration_seconds_count{service="lagda-server",operation="listEmployees"} 1')
  })

  it("sets the queue depth gauge per queue", async () => {
    // Arrange
    const metrics = createMetrics()

    // Act
    metrics.setQueueDepth("syncDirectory", 7)
    const exposition = await metrics.registry.metrics()

    // Assert
    expect(exposition).toContain('jobs_queue_depth{queue="syncDirectory"} 7')
  })

  it("counts processed jobs by queue and terminal status", async () => {
    // Arrange
    const metrics = createMetrics()

    // Act
    metrics.recordJob("syncDirectory", "completed")
    metrics.recordJob("syncDirectory", "failed")
    const exposition = await metrics.registry.metrics()

    // Assert
    expect(exposition).toContain('jobs_processed_total{queue="syncDirectory",status="completed"} 1')
    expect(exposition).toContain('jobs_processed_total{queue="syncDirectory",status="failed"} 1')
  })

  it("counts synchronization runs by outcome", async () => {
    // Arrange
    const metrics = createMetrics()

    // Act
    metrics.recordSyncRun("succeeded")
    metrics.recordSyncRun("succeeded")
    metrics.recordSyncRun("partial")
    const exposition = await metrics.registry.metrics()

    // Assert
    expect(exposition).toContain('sync_runs_total{outcome="succeeded"} 2')
    expect(exposition).toContain('sync_runs_total{outcome="partial"} 1')
  })
})
