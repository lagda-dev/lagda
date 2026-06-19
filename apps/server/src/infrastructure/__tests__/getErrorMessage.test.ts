import { describe, expect, it } from "vitest"
import { getErrorMessage } from "../getErrorMessage"

describe("getErrorMessage", () => {
  it("returns the message of an Error instance", () => {
    // Arrange + Act + Assert
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
  })

  it("returns a string value as-is", () => {
    // Arrange + Act + Assert
    expect(getErrorMessage("plain failure")).toBe("plain failure")
  })

  it("falls back to a generic message for unknown values", () => {
    // Arrange + Act + Assert
    expect(getErrorMessage({ unexpected: true })).toBe("Unexpected error")
    expect(getErrorMessage(undefined)).toBe("Unexpected error")
  })
})
