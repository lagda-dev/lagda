import { describe, expect, it, vi } from "vitest"
import { createLoggingMailer } from "../mailers/loggingMailer"

describe("createLoggingMailer", () => {
  it("writes the recipient, subject, and body to the injected sink", async () => {
    // Arrange
    const write = vi.fn()
    const mailer = createLoggingMailer(write)

    // Act
    await mailer.send({ to: "user@example.com", subject: "Your code", text: "It is 123456" })

    // Assert
    const line = write.mock.calls[0]?.[0] as string
    expect(line).toContain("to=user@example.com")
    expect(line).toContain('subject="Your code"')
    expect(line).toContain("It is 123456")
  })

  it("defaults to writing to stdout when no sink is injected", async () => {
    // Arrange
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    const mailer = createLoggingMailer()

    // Act
    await mailer.send({ to: "user@example.com", subject: "s", text: "t" })

    // Assert
    expect(stdoutSpy).toHaveBeenCalledOnce()
    stdoutSpy.mockRestore()
  })
})
