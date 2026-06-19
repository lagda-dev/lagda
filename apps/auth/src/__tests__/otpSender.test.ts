import { afterEach, describe, expect, it, vi } from "vitest"
import { createLoggingOtpSender } from "../otpSender"

describe("createLoggingOtpSender", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("never leaks the OTP or the full email in production", async () => {
    // Arrange
    vi.stubEnv("NODE_ENV", "production")
    const write = vi.fn()
    const sender = createLoggingOtpSender(write)

    // Act
    await sender({ email: "alice@example.com", otp: "123456", type: "sign-in" })

    // Assert
    const line = write.mock.calls[0]?.[0] as string
    expect(line).toContain("type=sign-in")
    expect(line).toContain("a***@example.com")
    expect(line).toContain("otp=<redacted>")
    expect(line).not.toContain("123456")
    expect(line).not.toContain("alice@example.com")
  })

  it("prints the OTP and full email in development so local sign-in is possible", async () => {
    // Arrange
    vi.stubEnv("NODE_ENV", "development")
    const write = vi.fn()
    const sender = createLoggingOtpSender(write)

    // Act
    await sender({ email: "alice@example.com", otp: "123456", type: "sign-in" })

    // Assert
    const line = write.mock.calls[0]?.[0] as string
    expect(line).toContain("type=sign-in")
    expect(line).toContain("alice@example.com")
    expect(line).toContain("otp=123456")
  })

  it("redacts a malformed email to a non-identifying placeholder in production", async () => {
    // Arrange
    vi.stubEnv("NODE_ENV", "production")
    const write = vi.fn()
    const sender = createLoggingOtpSender(write)

    // Act
    await sender({ email: "not-an-email", otp: "000000", type: "email-verification" })

    // Assert
    const line = write.mock.calls[0]?.[0] as string
    expect(line).toContain("to=<invalid>")
  })

  it("defaults to writing to stdout when no writer is injected", async () => {
    // Arrange
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    const sender = createLoggingOtpSender()

    // Act
    await sender({ email: "bob@lagda.dev", otp: "999999", type: "forget-password" })

    // Assert
    expect(stdoutSpy).toHaveBeenCalledOnce()
    stdoutSpy.mockRestore()
  })
})
