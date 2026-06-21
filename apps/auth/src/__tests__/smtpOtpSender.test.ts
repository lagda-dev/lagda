import { describe, expect, it, vi } from "vitest"
import { createSmtpOtpSender, renderOtpEmail } from "../smtpOtpSender"

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

describe("createSmtpOtpSender", () => {
  it("sends the rendered email from the configured address to the recipient", async () => {
    // Arrange
    const sendMail = vi.fn().mockResolvedValue({})
    const sender = createSmtpOtpSender({ sendMail }, "Lagda <no-reply@example.com>")

    // Act
    await sender({ email: "user@example.com", otp: "424242", type: "sign-in" })

    // Assert
    expect(sendMail).toHaveBeenCalledTimes(1)
    const message = sendMail.mock.calls[0]?.[0]
    expect(message).toMatchObject({ from: "Lagda <no-reply@example.com>", to: "user@example.com" })
    expect(message.text).toContain("424242")
  })

  it("wraps a transport failure with context", async () => {
    // Arrange
    const sendMail = vi.fn().mockRejectedValue(new Error("connection refused"))
    const sender = createSmtpOtpSender({ sendMail }, "no-reply@example.com")

    // Act + Assert
    await expect(sender({ email: "user@example.com", otp: "1", type: "sign-in" })).rejects.toThrow(
      "Failed to send OTP email to user@example.com: connection refused",
    )
  })
})
