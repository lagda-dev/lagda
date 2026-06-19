import { describe, expect, it } from "vitest"
import { getErrorMessage } from "../infrastructure/getErrorMessage"

describe("getErrorMessage", () => {
  it("returns the message of an Error instance", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
  })

  it("returns a string value as-is", () => {
    expect(getErrorMessage("plain failure")).toBe("plain failure")
  })

  it("serializes a non-Error, non-string value to JSON", () => {
    expect(getErrorMessage({ code: 42 })).toBe('{"code":42}')
  })
})
