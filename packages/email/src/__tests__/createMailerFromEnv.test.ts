import { describe, expect, it, vi } from "vitest"
import { createMailerFromEnv } from "../createMailerFromEnv"

const smtpEnv = { SMTP_HOST: "smtp.example.com", SMTP_FROM: "no-reply@example.com" }

describe("createMailerFromEnv", () => {
  it("returns null when SMTP is not configured", () => {
    expect(createMailerFromEnv({} as NodeJS.ProcessEnv, () => ({ sendMail: vi.fn() }))).toBeNull()
  })

  it("assembles an SMTP mailer from config, built via the injected transport", async () => {
    // Arrange
    const sendMail = vi.fn().mockResolvedValue({})
    const seen: unknown[] = []
    const buildTransport = (config: unknown) => {
      seen.push(config)
      return { sendMail }
    }

    // Act
    const mailer = createMailerFromEnv(smtpEnv as NodeJS.ProcessEnv, buildTransport)
    await mailer?.send({ to: "user@example.com", subject: "Hi", text: "body" })

    // Assert — config was passed to the transport builder, and the mailer sends through it
    expect(seen).toHaveLength(1)
    expect(sendMail).toHaveBeenCalledOnce()
  })
})
