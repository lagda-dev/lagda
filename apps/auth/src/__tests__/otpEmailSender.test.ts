import { describe, expect, it, vi } from "vitest"
import { createOtpEmailSender, renderOtpEmail } from "../otpEmailSender"

describe("renderOtpEmail", () => {
  it("uses verification copy for email-verification", () => {
    const { subject, text } = renderOtpEmail("123456", "email-verification")
    expect(subject).toContain("Verify your email")
    expect(text).toContain("123456")
  })

  it("uses reset copy for forget-password", () => {
    expect(renderOtpEmail("000111", "forget-password").subject).toContain("Reset your Lagda password")
  })

  it("uses sign-in copy for sign-in", () => {
    const { subject, text } = renderOtpEmail("987654", "sign-in")
    expect(subject).toContain("sign-in code")
    expect(text).toContain("987654")
  })
})

describe("createOtpEmailSender", () => {
  it("renders the OTP copy and delivers it through the mailer", async () => {
    // Arrange
    const send = vi.fn().mockResolvedValue(undefined)
    const sender = createOtpEmailSender({ send })

    // Act
    await sender({ email: "user@example.com", otp: "424242", type: "sign-in" })

    // Assert
    expect(send).toHaveBeenCalledOnce()
    const message = send.mock.calls[0]?.[0]
    expect(message).toMatchObject({ to: "user@example.com" })
    expect(message.subject).toContain("sign-in code")
    expect(message.text).toContain("424242")
  })
})
