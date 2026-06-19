import { describe, expect, it } from "vitest"
import { createApp } from "../app"

describe("createApp", () => {
  it("returns a healthy payload on GET /api/v1/health", async () => {
    // Arrange
    const app = createApp()

    // Act
    const response = await app.request("/api/v1/health")

    // Assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ok", service: "lagda-server" })
  })

  it("answers the liveness probe on GET /healthz", async () => {
    // Arrange
    const app = createApp()

    // Act
    const response = await app.request("/healthz")

    // Assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ok" })
  })

  it("answers the readiness probe on GET /readyz", async () => {
    // Arrange
    const app = createApp()

    // Act
    const response = await app.request("/readyz")

    // Assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ready" })
  })

  it("exposes the generated OpenAPI document", async () => {
    // Arrange
    const app = createApp()

    // Act
    const response = await app.request("/api/openapi.json")
    const document = (await response.json()) as { info: { title: string } }

    // Assert
    expect(response.status).toBe(200)
    expect(document.info.title).toBe("Lagda API")
  })
})
