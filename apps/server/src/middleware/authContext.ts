import type { TokenClaims } from "@lagda/auth-contract"

// The authenticated principal a protected handler can read after `requirePermission` has run. Stored
// on the Hono context under `AUTH_CONTEXT_KEY`. We expose the parsed, trusted claims so handlers
// resolve the org/role without re-verifying the token.
export const AUTH_CONTEXT_KEY = "authClaims"

export type AuthVariables = {
  [AUTH_CONTEXT_KEY]: TokenClaims
}

// A token verifier abstracts the signature check away from the decision logic so the middleware is
// unit-testable with a mock and the real JWKS verification (jose) lives in its own module. It either
// returns the raw, still-untrusted claims payload, or throws on an invalid/expired token.
export type TokenVerifier = (token: string) => Promise<unknown>
