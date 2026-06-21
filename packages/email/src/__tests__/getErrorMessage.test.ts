import { describe, expect, it } from "vitest"
import { getErrorMessage } from "../infrastructure/getErrorMessage"

describe("getErrorMessage", () => {
  it("returns the message of an Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
  })

  it("returns a string thrown value as-is", () => {
    expect(getErrorMessage("plain failure")).toBe("plain failure")
  })

  it("serialises any other thrown value", () => {
    expect(getErrorMessage({ code: 42 })).toBe('{"code":42}')
  })
})
