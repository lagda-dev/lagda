import { describe, expect, it } from "vitest"
import { loadAuthConfig } from "../loadAuthConfig"

describe("loadAuthConfig", () => {
  it("prefers AUTH_DATABASE_URL over DATABASE_URL", () => {
    // Arrange
    const env = {
      AUTH_DATABASE_URL: "postgres://auth-host/auth",
      DATABASE_URL: "postgres://app-host/app",
    } as NodeJS.ProcessEnv

    // Act
    const config = loadAuthConfig(env)

    // Assert
    expect(config.databaseUrl).toBe("postgres://auth-host/auth")
  })

  it("falls back to DATABASE_URL when AUTH_DATABASE_URL is unset", () => {
    const env = { DATABASE_URL: "postgres://app-host/app" } as NodeJS.ProcessEnv

    const config = loadAuthConfig(env)

    expect(config.databaseUrl).toBe("postgres://app-host/app")
  })

  it("defaults the base URL and port to the 3100 auth service", () => {
    // Arrange
    const env = { DATABASE_URL: "postgres://app-host/app" } as NodeJS.ProcessEnv

    // Act
    const config = loadAuthConfig(env)

    // Assert
    expect(config.baseUrl).toBe("http://localhost:3100")
    expect(config.port).toBe(3100)
  })

  it("reads an explicit base URL and port from the environment", () => {
    const env = {
      DATABASE_URL: "postgres://app-host/app",
      AUTH_BASE_URL: "https://auth.lagda.dev",
      PORT: "4000",
    } as NodeJS.ProcessEnv

    const config = loadAuthConfig(env)

    expect(config.baseUrl).toBe("https://auth.lagda.dev")
    expect(config.port).toBe(4000)
  })

  it("leaves trustedOrigins undefined when TRUSTED_ORIGINS is unset", () => {
    const env = { DATABASE_URL: "postgres://app-host/app" } as NodeJS.ProcessEnv

    const config = loadAuthConfig(env)

    expect(config.trustedOrigins).toBeUndefined()
  })

  it("parses a comma-separated TRUSTED_ORIGINS list, trimming blanks", () => {
    const env = {
      DATABASE_URL: "postgres://app-host/app",
      TRUSTED_ORIGINS: "https://app.lagda.dev, https://admin.lagda.dev ,",
    } as NodeJS.ProcessEnv

    const config = loadAuthConfig(env)

    expect(config.trustedOrigins).toEqual(["https://app.lagda.dev", "https://admin.lagda.dev"])
  })

  it("treats a blank TRUSTED_ORIGINS as unset", () => {
    const env = { DATABASE_URL: "postgres://app-host/app", TRUSTED_ORIGINS: "  ,  " } as NodeJS.ProcessEnv

    const config = loadAuthConfig(env)

    expect(config.trustedOrigins).toBeUndefined()
  })

  it("throws a descriptive error when no database URL is set", () => {
    const env = {} as NodeJS.ProcessEnv

    expect(() => loadAuthConfig(env)).toThrowError(/Either AUTH_DATABASE_URL or DATABASE_URL must be set/)
  })

  it("throws when a provided database URL is malformed", () => {
    const env = { AUTH_DATABASE_URL: "not-a-url" } as NodeJS.ProcessEnv

    expect(() => loadAuthConfig(env)).toThrowError(/Invalid auth configuration/)
  })
})
