import { describe, expect, it, vi } from "vitest"
import { createSmtpMailer } from "../mailers/smtpMailer"

describe("createSmtpMailer", () => {
  it("sends the message from the configured address to the recipient", async () => {
    // Arrange
    const sendMail = vi.fn().mockResolvedValue({})
    const mailer = createSmtpMailer({ sendMail }, "Lagda <no-reply@example.com>")

    // Act
    await mailer.send({ to: "user@example.com", subject: "Hi", text: "body 424242" })

    // Assert
    expect(sendMail).toHaveBeenCalledWith({ from: "Lagda <no-reply@example.com>", to: "user@example.com", subject: "Hi", text: "body 424242" })
  })

  it("wraps a transport failure with context", async () => {
    // Arrange
    const sendMail = vi.fn().mockRejectedValue(new Error("connection refused"))
    const mailer = createSmtpMailer({ sendMail }, "no-reply@example.com")

    // Act + Assert
    await expect(mailer.send({ to: "user@example.com", subject: "Hi", text: "x" })).rejects.toThrow(
      "Failed to send email to user@example.com: connection refused",
    )
  })
})
