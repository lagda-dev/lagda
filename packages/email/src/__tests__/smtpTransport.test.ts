import { describe, expect, it } from "vitest"
import { createSmtpTransport } from "../infrastructure/smtpTransport"

// createSmtpTransport wraps nodemailer.createTransport, which is synchronous and opens no socket, so we
// can assert it yields a usable transport (has sendMail) for both the auth and no-auth shapes.
describe("createSmtpTransport", () => {
  it("builds a transport with a sendMail method (no auth)", () => {
    const transport = createSmtpTransport({ host: "smtp.example.com", port: 587, secure: false, from: "no-reply@example.com" })
    expect(typeof transport.sendMail).toBe("function")
  })

  it("builds a transport when credentials are provided", () => {
    const transport = createSmtpTransport({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      from: "no-reply@example.com",
      auth: { user: "apikey", password: "secret" },
    })
    expect(typeof transport.sendMail).toBe("function")
  })
})
