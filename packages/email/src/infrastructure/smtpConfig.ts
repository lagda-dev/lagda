import { z } from "zod"

const DEFAULT_SMTP_PORT = 587

// SMTP configuration, validated at the boundary. Presence of SMTP_HOST is what marks email "configured";
// when it is absent we return null so the caller decides the fallback (dev logging, fail-fast, …). When
// SMTP_HOST is set, the rest is validated and a clear error is thrown for a half-configured transport —
// SMTP_FROM is then required (you cannot send mail without a From address).
// An optional string env var that may arrive as an EMPTY string (docker-compose passes `${VAR:-}` as
// "", not unset) — coerce "" to undefined so an absent value is genuinely absent rather than a
// zero-length string that fails `.min(1)`. Without this, a no-auth relay (empty SMTP_USER/PASSWORD)
// would crash the auth service at boot.
const optionalEnvString = z.preprocess((value) => (typeof value === "string" && value.length === 0 ? undefined : value), z.string().min(1).optional())

const smtpConfigSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(DEFAULT_SMTP_PORT),
  // Env values are strings; treat the literal "true" as secure (implicit TLS, typically port 465).
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  SMTP_USER: optionalEnvString,
  SMTP_PASSWORD: optionalEnvString,
  SMTP_FROM: z.string().min(1),
})

export type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  from: string
  auth?: { user: string; password: string }
}

// Returns the validated SMTP config, or null when SMTP is not configured at all (no SMTP_HOST). Throws
// with a descriptive, non-leaking message when SMTP_HOST is set but the rest is invalid/incomplete.
export const loadSmtpConfig = (env: NodeJS.ProcessEnv = process.env): SmtpConfig | null => {
  if (env.SMTP_HOST === undefined || env.SMTP_HOST.length === 0) return null

  const parsed = smtpConfigSchema.safeParse(env)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    throw new Error(`Invalid SMTP configuration: ${issues}`)
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = parsed.data

  // Credentials are optional (open relays / IP-allowlisted senders need none), but they only make sense
  // as a pair: require BOTH or NEITHER, never half a credential.
  const hasUser = SMTP_USER !== undefined
  const hasPassword = SMTP_PASSWORD !== undefined
  if (hasUser !== hasPassword) {
    throw new Error("Invalid SMTP configuration: SMTP_USER and SMTP_PASSWORD must be set together")
  }

  const auth = hasUser && hasPassword ? { user: SMTP_USER, password: SMTP_PASSWORD } : undefined
  return { host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, from: SMTP_FROM, auth }
}
