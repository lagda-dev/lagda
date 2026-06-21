import { z } from "zod"

const DEFAULT_AUTH_PORT = 3100

// Validate the auth service environment at the boundary and fail fast with a descriptive,
// non-leaking error. The identity store prefers its own AUTH_DATABASE_URL; if unset it falls back to
// the shared DATABASE_URL. AUTH_BASE_URL is the JWT issuer/audience and the server's JWKS origin.
const authConfigSchema = z
  .object({
    AUTH_DATABASE_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url().optional(),
    AUTH_BASE_URL: z.string().url().default(`http://localhost:${DEFAULT_AUTH_PORT}`),
    PORT: z.coerce.number().int().positive().default(DEFAULT_AUTH_PORT),
    // Comma-separated list of additional origins allowed to call the auth service cross-origin (the SPA's
    // public origin in production). Better Auth 403s any origin not trusted, so this MUST be set for a
    // self-hosted SPA served from a real domain; unset falls back to the localhost dev defaults.
    TRUSTED_ORIGINS: z.string().optional(),
  })
  .refine((env) => Boolean(env.AUTH_DATABASE_URL ?? env.DATABASE_URL), {
    message: "Either AUTH_DATABASE_URL or DATABASE_URL must be set",
    path: ["AUTH_DATABASE_URL"],
  })

export type AuthServiceConfig = {
  databaseUrl: string
  baseUrl: string
  port: number
  trustedOrigins?: string[]
}

// Split a comma-separated origins list into trimmed, non-empty entries; undefined when nothing is set so
// the caller can apply its own defaults.
const parseTrustedOrigins = (raw: string | undefined): string[] | undefined => {
  if (raw === undefined) return undefined
  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
  return origins.length > 0 ? origins : undefined
}

export const loadAuthConfig = (env: NodeJS.ProcessEnv = process.env): AuthServiceConfig => {
  const parsed = authConfigSchema.safeParse(env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    throw new Error(`Invalid auth configuration: ${issues}`)
  }

  const { AUTH_DATABASE_URL, DATABASE_URL, AUTH_BASE_URL, PORT, TRUSTED_ORIGINS } = parsed.data
  const databaseUrl = AUTH_DATABASE_URL ?? DATABASE_URL
  if (!databaseUrl) {
    throw new Error("Invalid auth configuration: AUTH_DATABASE_URL: Either AUTH_DATABASE_URL or DATABASE_URL must be set")
  }

  return { databaseUrl, baseUrl: AUTH_BASE_URL, port: PORT, trustedOrigins: parseTrustedOrigins(TRUSTED_ORIGINS) }
}
