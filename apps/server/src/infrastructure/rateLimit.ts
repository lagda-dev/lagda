import { rateLimiter } from "hono-rate-limiter"
import type { Context, MiddlewareHandler } from "hono"

// Default rate limiting on every route (§4), keyed per bearer token when present and per IP
// otherwise, with a stricter budget on auth/write endpoints. Thin wrapper over `hono-rate-limiter`;
// excluded from coverage because it is exercised by integration tests against the running app.

// Env-configurable knobs. Generous read defaults, tighter write defaults. All windows are in ms.
export type RateLimitConfig = {
  windowMs: number
  globalLimit: number
  writeLimit: number
}

const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_GLOBAL_LIMIT = 120
const DEFAULT_WRITE_LIMIT = 30

const toPositiveInt = (raw: string | undefined, fallback: number): number => {
  if (raw === undefined) {
    return fallback
  }
  const parsed = Number.parseInt(raw, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

// Read the rate-limit knobs from the environment, falling back to safe defaults.
export const loadRateLimitConfig = (env: NodeJS.ProcessEnv = process.env): RateLimitConfig => ({
  windowMs: toPositiveInt(env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
  globalLimit: toPositiveInt(env.RATE_LIMIT_GLOBAL, DEFAULT_GLOBAL_LIMIT),
  writeLimit: toPositiveInt(env.RATE_LIMIT_WRITE, DEFAULT_WRITE_LIMIT),
})

// Prefer the bearer token as the rate-limit key (per-token budget); fall back to the client IP so
// unauthenticated traffic is still bounded per source.
const keyFromTokenOrIp = (ctx: Context): string => {
  const authorization = ctx.req.header("authorization")
  if (authorization !== undefined && authorization.startsWith("Bearer ")) {
    return `token:${authorization.slice("Bearer ".length)}`
  }
  const forwardedFor = ctx.req.header("x-forwarded-for")
  const clientIp = forwardedFor?.split(",")[0]?.trim()
  return `ip:${clientIp ?? "unknown"}`
}

// The global per-token/per-IP limiter applied to every route.
export const createGlobalRateLimit = (config: RateLimitConfig): MiddlewareHandler =>
  rateLimiter({
    windowMs: config.windowMs,
    limit: config.globalLimit,
    standardHeaders: "draft-7",
    keyGenerator: keyFromTokenOrIp,
  })

// The stricter limiter for auth/write endpoints (POST/cancel).
export const createWriteRateLimit = (config: RateLimitConfig): MiddlewareHandler =>
  rateLimiter({
    windowMs: config.windowMs,
    limit: config.writeLimit,
    standardHeaders: "draft-7",
    keyGenerator: keyFromTokenOrIp,
  })
