import { describe, expect, it, vi } from "vitest"
import { resolveOtpSender } from "../resolveOtpSender"

// A fake mailer so no socket is opened and we can assert the sender delivers through it.
const fakeMailer = () => {
  const send = vi.fn().mockResolvedValue(undefined)
  return { mailer: { send }, send }
}

describe("resolveOtpSender", () => {
  it("returns an email-backed sender when a mailer is available", async () => {
    // Arrange
    const { mailer, send } = fakeMailer()
    const sender = resolveOtpSender({ NODE_ENV: "production" } as NodeJS.ProcessEnv, () => mailer)

    // Act
    await sender({ email: "user@example.com", otp: "246810", type: "sign-in" })

    // Assert — delivered via the mailer, with rendered OTP copy
    expect(send).toHaveBeenCalledOnce()
    const message = send.mock.calls[0]?.[0]
    expect(message).toMatchObject({ to: "user@example.com" })
    expect(message.text).toContain("246810")
  })

  it("fails fast in production when no mailer is available", () => {
    expect(() => resolveOtpSender({ NODE_ENV: "production" } as NodeJS.ProcessEnv, () => null)).toThrow("OTP email is not configured")
  })

  it("falls back to the dev logging sender outside production when no mailer is available", () => {
    const sender = resolveOtpSender({ NODE_ENV: "development" } as NodeJS.ProcessEnv, () => null)
    expect(typeof sender).toBe("function")
  })
})
