import { describe, expect, it } from "vitest"
import { getErrorMessage } from "../getErrorMessage"

// getErrorMessage narrows an unknown thrown value to a readable string without leaking a stack trace.

describe("getErrorMessage", () => {
  it("returns the message of an Error instance", () => {
    // Arrange + Act + Assert
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
  })

  it("returns a string value unchanged", () => {
    // Arrange + Act + Assert
    expect(getErrorMessage("plain failure")).toBe("plain failure")
  })

  it("falls back to a generic message for non-Error, non-string values", () => {
    // Arrange + Act + Assert
    expect(getErrorMessage({ unexpected: true })).toBe("Unexpected error")
  })
})
