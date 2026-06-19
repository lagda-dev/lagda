import { describe, expect, it } from "vitest"
import { buildRedactOptions, REDACTION_CENSOR, REDACTION_PATHS } from "../redaction"

describe("REDACTION_PATHS", () => {
  it("includes every expected PII and secret path", () => {
    // Arrange
    const expectedPaths = ["req.headers.authorization", "*.password", "*.token", "*.email", "*.encrypted_credentials", "*.webhook"]

    // Act
    const paths = [...REDACTION_PATHS]

    // Assert
    expectedPaths.forEach((expectedPath) => {
      expect(paths).toContain(expectedPath)
    })
  })

  it("does not redact safe, non-sensitive fields", () => {
    // Arrange
    const safeFields = ["requestId", "traceId", "service", "level", "operation", "*.id", "*.name"]

    // Act
    const paths = [...REDACTION_PATHS]

    // Assert
    safeFields.forEach((safeField) => {
      expect(paths).not.toContain(safeField)
    })
  })
})

describe("buildRedactOptions", () => {
  it("builds pino redact options from the default paths with a censor", () => {
    // Arrange & Act
    const options = buildRedactOptions()

    // Assert
    expect(options.paths).toEqual([...REDACTION_PATHS])
    expect(options.censor).toBe(REDACTION_CENSOR)
  })

  it("returns a fresh paths array rather than the shared constant", () => {
    // Arrange & Act
    const options = buildRedactOptions()

    // Assert
    expect(options.paths).not.toBe(REDACTION_PATHS)
  })

  it("honors a custom set of paths when provided", () => {
    // Arrange
    const customPaths = ["*.apiKey"]

    // Act
    const options = buildRedactOptions(customPaths)

    // Assert
    expect(options.paths).toEqual(["*.apiKey"])
    expect(options.censor).toBe(REDACTION_CENSOR)
  })
})
