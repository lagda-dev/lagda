import { describe, expect, it } from "vitest"
import { POSTGRES_STATEMENT_TIMEOUT_MS, requireDatabaseUrl } from "../connection"

describe("requireDatabaseUrl", () => {
  it("returns the connection string when present", () => {
    // Arrange
    const databaseUrl = "postgres://localhost:5432/lagda"

    // Act
    const result = requireDatabaseUrl(databaseUrl)

    // Assert
    expect(result).toBe(databaseUrl)
  })

  it("throws when the connection string is undefined", () => {
    // Act & Assert
    expect(() => requireDatabaseUrl(undefined)).toThrowError(/DATABASE_URL is required/)
  })

  it("throws when the connection string is empty", () => {
    // Act & Assert
    expect(() => requireDatabaseUrl("")).toThrowError(/DATABASE_URL is required/)
  })
})

describe("POSTGRES_STATEMENT_TIMEOUT_MS", () => {
  it("enforces the one-second query budget", () => {
    expect(POSTGRES_STATEMENT_TIMEOUT_MS).toBe(1000)
  })
})
