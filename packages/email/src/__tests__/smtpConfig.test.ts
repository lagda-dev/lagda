import { describe, expect, it } from "vitest"
import { loadSmtpConfig } from "../infrastructure/smtpConfig"

const baseEnv = { SMTP_HOST: "smtp.example.com", SMTP_FROM: "Lagda <no-reply@example.com>" }

describe("loadSmtpConfig", () => {
  it("returns null when SMTP is not configured (no SMTP_HOST)", () => {
    expect(loadSmtpConfig({} as NodeJS.ProcessEnv)).toBeNull()
    expect(loadSmtpConfig({ SMTP_HOST: "" } as NodeJS.ProcessEnv)).toBeNull()
  })

  it("parses a minimal config, defaulting port 587 and secure false, with no auth", () => {
    expect(loadSmtpConfig(baseEnv as NodeJS.ProcessEnv)).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      from: "Lagda <no-reply@example.com>",
      auth: undefined,
    })
  })

  it("coerces the port and treats SMTP_SECURE='true' as secure", () => {
    const config = loadSmtpConfig({ ...baseEnv, SMTP_PORT: "465", SMTP_SECURE: "true" } as NodeJS.ProcessEnv)
    expect(config?.port).toBe(465)
    expect(config?.secure).toBe(true)
  })

  it("includes auth when both user and password are set", () => {
    const config = loadSmtpConfig({ ...baseEnv, SMTP_USER: "apikey", SMTP_PASSWORD: "secret" } as NodeJS.ProcessEnv)
    expect(config?.auth).toEqual({ user: "apikey", password: "secret" })
  })

  it("rejects a half-configured credential pair", () => {
    expect(() => loadSmtpConfig({ ...baseEnv, SMTP_USER: "apikey" } as NodeJS.ProcessEnv)).toThrow("SMTP_USER and SMTP_PASSWORD must be set together")
  })

  it("treats EMPTY-string credentials as no auth (docker-compose passes unset vars as empty strings)", () => {
    // The zero-config compose path sets SMTP_USER/SMTP_PASSWORD to "" for a no-auth relay — that must
    // mean "no credentials", not a zero-length string that fails validation and crashes auth at boot.
    const config = loadSmtpConfig({ ...baseEnv, SMTP_USER: "", SMTP_PASSWORD: "" } as NodeJS.ProcessEnv)
    expect(config?.auth).toBeUndefined()
    expect(config?.host).toBe("smtp.example.com")
  })

  it("throws when SMTP_HOST is set but SMTP_FROM is missing", () => {
    expect(() => loadSmtpConfig({ SMTP_HOST: "smtp.example.com" } as NodeJS.ProcessEnv)).toThrow("Invalid SMTP configuration")
  })
})
