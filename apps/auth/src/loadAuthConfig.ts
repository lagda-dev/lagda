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
  })
  .refine((env) => Boolean(env.AUTH_DATABASE_URL ?? env.DATABASE_URL), {
    message: "Either AUTH_DATABASE_URL or DATABASE_URL must be set",
    path: ["AUTH_DATABASE_URL"],
  })

export type AuthServiceConfig = {
  databaseUrl: string
  baseUrl: string
  port: number
}

export const loadAuthConfig = (env: NodeJS.ProcessEnv = process.env): AuthServiceConfig => {
  const parsed = authConfigSchema.safeParse(env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    throw new Error(`Invalid auth configuration: ${issues}`)
  }

  const { AUTH_DATABASE_URL, DATABASE_URL, AUTH_BASE_URL, PORT } = parsed.data
  const databaseUrl = AUTH_DATABASE_URL ?? DATABASE_URL
  if (!databaseUrl) {
    throw new Error("Invalid auth configuration: AUTH_DATABASE_URL: Either AUTH_DATABASE_URL or DATABASE_URL must be set")
  }

  return { databaseUrl, baseUrl: AUTH_BASE_URL, port: PORT }
}
