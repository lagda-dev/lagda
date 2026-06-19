import type { AppType } from "@lagda/server"
import { hc } from "hono/client"
import { fetchBearerToken } from "../auth/authClient"

// The typed Hono RPC client for the application server (apps/server on :3000, proxied at "/api" in dev).
// Unlike the auth client, the app server runs NO Better Auth — it is a stateless resource server that
// verifies a JWKS-signed JWT against the auth service's JWKS. That JWT is the one minted by the jwt
// plugin via `authClient.token()` — NOT Better Auth's session token — so every request here carries it
// as `Authorization: Bearer <token>` (token flow per §1).

// A short in-memory cache for the minted JWT so we don't hit the auth service on every API call. The
// JWT outlives this window comfortably (Better Auth's default expiry is minutes), so a brief cache is
// safe; on expiry we simply mint a fresh one.
const JWT_CACHE_TTL_MS = 60_000
let cachedJwt: { token: string; expiresAt: number } | null = null

// Resolve the application JWT for an outgoing request: reuse the in-memory token while fresh, otherwise
// mint a new one via the jwt client plugin. Failures degrade to an unauthenticated request, which the
// server rejects (deny-by-default §6).
const resolveBearerToken = async (now: number): Promise<string | null> => {
  if (cachedJwt !== null && cachedJwt.expiresAt > now) return cachedJwt.token
  try {
    const token = await fetchBearerToken()
    cachedJwt = { token, expiresAt: now + JWT_CACHE_TTL_MS }
    return token
  } catch {
    cachedJwt = null
    return null
  }
}

// A fetch wrapper that injects the bearer token before delegating to the platform fetch. Kept as a thin
// boundary so the `hc<AppType>` typing below stays fully intact.
const authorizedFetch: typeof fetch = async (input, init) => {
  const bearerToken = await resolveBearerToken(Date.now())
  const headers = new Headers(init?.headers)
  if (bearerToken !== null) headers.set("Authorization", `Bearer ${bearerToken}`)
  return fetch(input, { ...init, headers })
}

export const api = hc<AppType>("/", { fetch: authorizedFetch })
