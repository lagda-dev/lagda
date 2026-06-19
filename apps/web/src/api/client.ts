import type { AppType } from "@lagda/server"
import { hc } from "hono/client"
import { BEARER_TOKEN_STORAGE_KEY, fetchBearerToken } from "../auth/authClient"

// The typed Hono RPC client for the application server (apps/server on :3000, proxied at "/api" in dev).
// Unlike the auth client, the app server runs NO Better Auth — it is a stateless resource server that
// verifies the bearer JWT against the auth service's JWKS. So every request here must carry the JWT as
// `Authorization: Bearer <token>` (token flow per §1).

const readCachedBearerToken = (): string | null => {
  try {
    return localStorage.getItem(BEARER_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

// Resolve a bearer token for an outgoing request: reuse the cached one captured during auth flows, and
// fall back to minting a fresh JWT via the jwt client plugin when the cache is empty. Failures bubble
// up with context — an unauthenticated request will be rejected by the server (deny-by-default §6).
const resolveBearerToken = async (): Promise<string | null> => {
  const cachedToken = readCachedBearerToken()
  if (cachedToken !== null && cachedToken.length > 0) return cachedToken
  try {
    return await fetchBearerToken()
  } catch {
    // No session / token unavailable: send the request without a bearer and let the server enforce.
    return null
  }
}

// A fetch wrapper that injects the bearer token before delegating to the platform fetch. Kept as a thin
// boundary so the `hc<AppType>` typing below stays fully intact.
const authorizedFetch: typeof fetch = async (input, init) => {
  const bearerToken = await resolveBearerToken()
  const headers = new Headers(init?.headers)
  if (bearerToken !== null) headers.set("Authorization", `Bearer ${bearerToken}`)
  return fetch(input, { ...init, headers })
}

export const api = hc<AppType>("/", { fetch: authorizedFetch })
