import { describe, expect, it } from "vitest"
import { createApp } from "../app"
import { buildDeps } from "./fixtures"

// The app boots with injected dependencies; these cover the unauthenticated system surface (probes,
// health, OpenAPI doc) that needs no bearer token.

describe("createApp", () => {
  it("returns a healthy payload on GET /api/v1/health", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await app.request("/api/v1/health")

    // Assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ok", service: "lagda-server" })
  })

  it("answers the liveness probe on GET /healthz", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await app.request("/healthz")

    // Assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ok" })
  })

  it("answers the readiness probe on GET /readyz", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await app.request("/readyz")

    // Assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ready" })
  })

  it("exposes the generated OpenAPI document", async () => {
    // Arrange
    const app = createApp(buildDeps())

    // Act
    const response = await app.request("/api/openapi.json")
    const document = (await response.json()) as { info: { title: string }; paths: Record<string, unknown> }

    // Assert
    expect(response.status).toBe(200)
    expect(document.info.title).toBe("Lagda API")
    expect(document.paths["/api/v1/synchronizations"]).toBeDefined()
    expect(document.paths["/api/v1/employees"]).toBeDefined()
  })

  it("applies an injected global rate-limit middleware to every route", async () => {
    // Arrange — a middleware that blocks everything proves the global hook is wired
    const blockEverything = async () => new Response("blocked", { status: 429 })
    const app = createApp(buildDeps(), { globalRateLimit: blockEverything })

    // Act
    const response = await app.request("/healthz")

    // Assert
    expect(response.status).toBe(429)
  })
})
