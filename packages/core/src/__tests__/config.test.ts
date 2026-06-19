import { describe, expect, it } from "vitest"
import { loadConfig } from "../config"

describe("loadConfig", () => {
  it("applies defaults when optional vars are absent", () => {
    // Arrange
    const env = {}

    // Act
    const config = loadConfig(env)

    // Assert
    expect(config).toEqual({ LOG_LEVEL: "info", PORT: 3000 })
  })

  it("reads and coerces provided values", () => {
    // Arrange
    const env = { LOG_LEVEL: "debug", PORT: "8080", DATABASE_URL: "postgres://localhost/lagda" }

    // Act
    const config = loadConfig(env)

    // Assert
    expect(config).toEqual({
      LOG_LEVEL: "debug",
      PORT: 8080,
      DATABASE_URL: "postgres://localhost/lagda",
    })
  })

  it("throws a descriptive error for an invalid log level", () => {
    // Arrange
    const env = { LOG_LEVEL: "verbose" }

    // Act & Assert
    expect(() => loadConfig(env)).toThrowError(/Invalid configuration: LOG_LEVEL/)
  })

  it("throws for a non-URL database url", () => {
    // Arrange
    const env = { DATABASE_URL: "not-a-url" }

    // Act & Assert
    expect(() => loadConfig(env)).toThrowError(/DATABASE_URL/)
  })
})
