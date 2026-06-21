import { describe, expect, it } from "vitest"
import { getErrorMessage } from "../getErrorMessage"

describe("getErrorMessage", () => {
  it("returns the message of an Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
  })

  it("returns a string thrown value as-is", () => {
    expect(getErrorMessage("plain failure")).toBe("plain failure")
  })

  it("serialises a plain object", () => {
    expect(getErrorMessage({ code: 42 })).toBe('{"code":42}')
  })

  it("never returns undefined for an unserialisable-to-string value", () => {
    expect(getErrorMessage(undefined)).toBe("undefined")
  })

  it("falls back to String() on a circular value instead of throwing", () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(getErrorMessage(circular)).toBe("[object Object]")
  })
})
