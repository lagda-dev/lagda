import { describe, expect, it } from "vitest"
import { createOtpGenerator } from "../otpGenerator"

// The fixed dev code is a deliberate convenience for the seeded account, opted in via AUTH_DEV_FIXED_OTP.
// With the flag off (the default), and always in production, every account must get a random 6-digit code.
const SIX_DIGITS = /^\d{6}$/

const devEnv = (overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv =>
  ({ NODE_ENV: "development", AUTH_DEV_FIXED_OTP: "true", ...overrides }) as NodeJS.ProcessEnv

describe("createOtpGenerator", () => {
  it("returns the fixed dev code for the seeded owner when the dev affordance is opted in", () => {
    // Arrange
    const generate = createOtpGenerator(devEnv({ SEED_OWNER_EMAIL: "owner@lagda.local" }))

    // Act
    const otp = generate({ email: "owner@lagda.local", type: "sign-in" })

    // Assert
    expect(otp).toBe("123456")
  })

  it("defaults the seeded owner email to owner@lagda.local when unset", () => {
    // Arrange
    const generate = createOtpGenerator(devEnv())

    // Act
    const otp = generate({ email: "owner@lagda.local", type: "sign-in" })

    // Assert
    expect(otp).toBe("123456")
  })

  it("honours a custom SEED_OWNER_EMAIL", () => {
    // Arrange
    const generate = createOtpGenerator(devEnv({ SEED_OWNER_EMAIL: "boss@acme.test" }))

    // Act + Assert
    expect(generate({ email: "boss@acme.test", type: "sign-in" })).toBe("123456")
  })

  it("returns a random 6-digit code for any other account even when the affordance is opted in", () => {
    // Arrange
    const generate = createOtpGenerator(devEnv({ SEED_OWNER_EMAIL: "owner@lagda.local" }))

    // Act
    const otp = generate({ email: "someone@example.com", type: "email-verification" })

    // Assert
    expect(otp).toMatch(SIX_DIGITS)
    expect(otp).not.toBe("123456")
  })

  it("fails closed: returns a random code for the seeded owner when the affordance is NOT opted in", () => {
    // Arrange — flag absent, so the default (secure) behaviour applies even in development.
    const generate = createOtpGenerator({ NODE_ENV: "development", SEED_OWNER_EMAIL: "owner@lagda.local" } as NodeJS.ProcessEnv)

    // Act
    const samples = Array.from({ length: 20 }, () => generate({ email: "owner@lagda.local", type: "sign-in" }))

    // Assert
    expect(samples.every((otp) => SIX_DIGITS.test(otp))).toBe(true)
    expect(samples.some((otp) => otp !== "123456")).toBe(true)
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
