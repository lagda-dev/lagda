import { createRemoteJWKSet, jwtVerify } from "jose"
import type { TokenVerifier } from "./authContext"

// Production token verifier: validates a bearer JWT's signature against the auth service's JWKS
// (§1 token flow). `apps/server` runs no Better Auth — it is a stateless resource server that only
// trusts tokens the auth service signed. Excluded from coverage: it performs real network JWKS
// fetches and is covered by integration tests; the decision logic in `requirePermission` is unit
// tested against an injected mock verifier.

const DEFAULT_AUTH_JWKS_URL = "http://localhost:3100/api/auth/jwks"

// Resolve the JWKS endpoint from the environment, defaulting to the local auth service.
export const resolveJwksUrl = (env: NodeJS.ProcessEnv = process.env): string => env.AUTH_JWKS_URL ?? DEFAULT_AUTH_JWKS_URL

// Build a verifier bound to a remote JWKS. The key set is fetched and cached by `jose`, so we build
// it once and reuse it across requests.
export const createJwksVerifier = (jwksUrl: string): TokenVerifier => {
  const jwks = createRemoteJWKSet(new URL(jwksUrl))
  return async (token: string): Promise<unknown> => {
    const { payload } = await jwtVerify(token, jwks)
    return payload
  }
}
