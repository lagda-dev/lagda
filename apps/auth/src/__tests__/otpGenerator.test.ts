import { describe, expect, it } from "vitest"
import { createOtpGenerator } from "../otpGenerator"

// The fixed dev code is a deliberate convenience for the seeded test account; everything else must be a
// random 6-digit code, and production must NEVER hand out the fixed code.
const SIX_DIGITS = /^\d{6}$/

describe("createOtpGenerator", () => {
  it("returns the fixed dev code for the seeded owner outside production", () => {
    // Arrange
    const generate = createOtpGenerator({ NODE_ENV: "development", SEED_OWNER_EMAIL: "owner@lagda.local" } as NodeJS.ProcessEnv)

    // Act
    const otp = generate({ email: "owner@lagda.local", type: "sign-in" })

    // Assert
    expect(otp).toBe("123456")
  })

  it("defaults the seeded owner email to owner@lagda.local when unset", () => {
    // Arrange
    const generate = createOtpGenerator({ NODE_ENV: "development" } as NodeJS.ProcessEnv)

    // Act
    const otp = generate({ email: "owner@lagda.local", type: "sign-in" })

    // Assert
    expect(otp).toBe("123456")
  })

  it("honours a custom SEED_OWNER_EMAIL", () => {
    // Arrange
    const generate = createOtpGenerator({ NODE_ENV: "development", SEED_OWNER_EMAIL: "boss@acme.test" } as NodeJS.ProcessEnv)

    // Act + Assert
    expect(generate({ email: "boss@acme.test", type: "sign-in" })).toBe("123456")
  })

  it("returns a random 6-digit code for any other account in dev", () => {
    // Arrange
    const generate = createOtpGenerator({ NODE_ENV: "development", SEED_OWNER_EMAIL: "owner@lagda.local" } as NodeJS.ProcessEnv)

    // Act
    const otp = generate({ email: "someone@example.com", type: "email-verification" })

    // Assert
    expect(otp).toMatch(SIX_DIGITS)
    expect(otp).not.toBe("123456")
  })

  it("never returns the fixed code in production, even for the seeded owner", () => {
    // Arrange
    const generate = createOtpGenerator({ NODE_ENV: "production", SEED_OWNER_EMAIL: "owner@lagda.local" } as NodeJS.ProcessEnv)

    // Act — sample a few to be confident it is not the constant
    const samples = Array.from({ length: 20 }, () => generate({ email: "owner@lagda.local", type: "sign-in" }))

    // Assert
    expect(samples.every((otp) => SIX_DIGITS.test(otp))).toBe(true)
    expect(samples.every((otp) => otp === "123456")).toBe(false)
  })
})
