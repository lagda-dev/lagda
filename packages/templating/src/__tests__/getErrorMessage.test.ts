import { describe, expect, it } from "vitest"
import { getErrorMessage } from "../getErrorMessage"

describe("getErrorMessage", () => {
  it("returns the message of an Error instance", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
  })

  it("returns a string value unchanged", () => {
    expect(getErrorMessage("plain failure")).toBe("plain failure")
  })

  it("serializes any other thrown value", () => {
    expect(getErrorMessage({ code: 42 })).toBe('{"code":42}')
  })
})
