import { describe, expect, it, vi } from "vitest"
import { createLoggingOtpSender } from "../otpSender"

const prodEnv = { NODE_ENV: "production" } as NodeJS.ProcessEnv
const devOptedIn = { NODE_ENV: "development", AUTH_DEV_FIXED_OTP: "true" } as NodeJS.ProcessEnv
const devFlagOff = { NODE_ENV: "development" } as NodeJS.ProcessEnv

describe("createLoggingOtpSender", () => {
  it("never leaks the OTP or the full email in production", async () => {
    // Arrange
    const write = vi.fn()
    const sender = createLoggingOtpSender(prodEnv, write)

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

  it("redacts the OTP and full email outside production too when the dev affordance is OFF", async () => {
    // Arrange — a staging box with no SMTP and the flag unset must NOT leak codes/PII to its logs.
    const write = vi.fn()
    const sender = createLoggingOtpSender(devFlagOff, write)

    // Act
    await sender({ email: "alice@example.com", otp: "123456", type: "sign-in" })

    // Assert
    const line = write.mock.calls[0]?.[0] as string
    expect(line).toContain("otp=<redacted>")
    expect(line).not.toContain("123456")
    expect(line).not.toContain("alice@example.com")
  })

  it("prints the OTP and full email only when the dev affordance is explicitly opted in", async () => {
    // Arrange
    const write = vi.fn()
    const sender = createLoggingOtpSender(devOptedIn, write)

    // Act
    await sender({ email: "alice@example.com", otp: "123456", type: "sign-in" })

    // Assert
    const line = write.mock.calls[0]?.[0] as string
    expect(line).toContain("type=sign-in")
    expect(line).toContain("alice@example.com")
    expect(line).toContain("otp=123456")
  })

  it("redacts a malformed email to a non-identifying placeholder when redacting", async () => {
    // Arrange
    const write = vi.fn()
    const sender = createLoggingOtpSender(prodEnv, write)

    // Act
    await sender({ email: "not-an-email", otp: "000000", type: "email-verification" })

    // Assert
    const line = write.mock.calls[0]?.[0] as string
    expect(line).toContain("to=<invalid>")
  })

  it("defaults to writing to stdout when no writer is injected", async () => {
    // Arrange
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    const sender = createLoggingOtpSender(prodEnv)

    // Act
    await sender({ email: "bob@lagda.dev", otp: "999999", type: "forget-password" })

    // Assert
    expect(stdoutSpy).toHaveBeenCalledOnce()
    stdoutSpy.mockRestore()
  })
})
