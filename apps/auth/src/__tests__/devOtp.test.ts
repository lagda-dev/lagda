import { describe, expect, it } from "vitest"
import { isDevOtpEnabled } from "../devOtp"

describe("isDevOtpEnabled", () => {
  it("is off by default when the flag is unset (fail-closed)", () => {
    expect(isDevOtpEnabled({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBe(false)
  })

  it('is off when the flag is any value other than the literal "true"', () => {
    expect(isDevOtpEnabled({ NODE_ENV: "development", AUTH_DEV_FIXED_OTP: "1" } as NodeJS.ProcessEnv)).toBe(false)
    expect(isDevOtpEnabled({ NODE_ENV: "development", AUTH_DEV_FIXED_OTP: "yes" } as NodeJS.ProcessEnv)).toBe(false)
  })

  it("is on outside production when explicitly opted in", () => {
    expect(isDevOtpEnabled({ NODE_ENV: "development", AUTH_DEV_FIXED_OTP: "true" } as NodeJS.ProcessEnv)).toBe(true)
  })

  it("throws (refuses to start) when opted in under NODE_ENV=production", () => {
    expect(() => isDevOtpEnabled({ NODE_ENV: "production", AUTH_DEV_FIXED_OTP: "true" } as NodeJS.ProcessEnv)).toThrow("must not be enabled in production")
  })

  it("stays off in production when the flag is unset, without throwing", () => {
    expect(isDevOtpEnabled({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBe(false)
  })
})
