import { describe, expect, it, vi } from "vitest"
import { resolveOtpSender } from "../resolveOtpSender"
import type { SmtpConfig } from "../smtpConfig"

const smtpEnv = { SMTP_HOST: "smtp.example.com", SMTP_FROM: "no-reply@example.com" }

// A fake transport builder so no socket is ever opened; it records the config it was handed.
const fakeTransportFactory = () => {
  const sendMail = vi.fn().mockResolvedValue({})
  const seen: SmtpConfig[] = []
  const build = (config: SmtpConfig) => {
    seen.push(config)
    return { sendMail }
  }
  return { build, sendMail, seen }
}

describe("resolveOtpSender", () => {
  it("returns an SMTP-backed sender when SMTP is configured", async () => {
    // Arrange
    const transport = fakeTransportFactory()
    const sender = resolveOtpSender({ NODE_ENV: "production", ...smtpEnv } as NodeJS.ProcessEnv, transport.build)

    // Act
    await sender({ email: "user@example.com", otp: "246810", type: "sign-in" })

    // Assert — the SMTP transport was built from the config and used to send
    expect(transport.seen[0]?.host).toBe("smtp.example.com")
    expect(transport.sendMail).toHaveBeenCalledOnce()
  })

  it("fails fast in production when SMTP is not configured", () => {
    expect(() => resolveOtpSender({ NODE_ENV: "production" } as NodeJS.ProcessEnv, fakeTransportFactory().build)).toThrow("OTP email is not configured")
  })

  it("falls back to the dev logging sender outside production when SMTP is absent", () => {
    // Arrange + Act — should not throw, returns a usable sender
    const sender = resolveOtpSender({ NODE_ENV: "development" } as NodeJS.ProcessEnv, fakeTransportFactory().build)

    // Assert
    expect(typeof sender).toBe("function")
  })
})
