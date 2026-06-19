import { createMiddleware } from "hono/factory"
import { hasPermission, parseClaims } from "@lagda/auth-contract"
import type { Permission, TokenClaims, TokenScope } from "@lagda/auth-contract"
import { sendApiError } from "../infrastructure/errors"
import { getErrorMessage } from "../infrastructure/getErrorMessage"
import { AUTH_CONTEXT_KEY } from "./authContext"
import type { TokenVerifier } from "./authContext"

// Server-side RBAC, deny-by-default (§6). Every protected route runs this middleware: it verifies
// the bearer token against the auth service (injected verifier → JWKS in production), parses the
// claims at the trust boundary, enforces a required permission via the §6 matrix, and — for public
// API routes — enforces the required application-token scope. The UI is never the security boundary.

// What a protected route demands: a role permission and, optionally, an application-token scope for
// the public API. Logging is structured and PII-free (§8): we never log the token or claims.
export type RequirePermissionOptions = {
  verifyToken: TokenVerifier
  permission: Permission
  scope?: TokenScope
  logger?: (entry: { operation: string; reason: string }) => void
}

// Pull the bearer token out of the Authorization header, or `null` when absent/malformed.
const extractBearerToken = (authorization: string | undefined): string | null => {
  if (authorization === undefined || !authorization.startsWith("Bearer ")) {
    return null
  }
  const token = authorization.slice("Bearer ".length).trim()
  return token.length === 0 ? null : token
}

// Verify the token and parse its claims at the boundary. Throws on any failure so the caller can
// translate it to a single 401 without leaking which step failed.
const verifyAndParseClaims = async (verifyToken: TokenVerifier, token: string): Promise<TokenClaims> => {
  const rawClaims = await verifyToken(token)
  return parseClaims(rawClaims)
}

export const requirePermission = ({ verifyToken, permission, scope, logger }: RequirePermissionOptions) =>
  createMiddleware<{ Variables: { [AUTH_CONTEXT_KEY]: TokenClaims } }>(async (ctx, next) => {
    const token = extractBearerToken(ctx.req.header("authorization"))
    if (token === null) {
      logger?.({ operation: "requirePermission", reason: "missing_token" })
      return sendApiError(ctx, "unauthorized", "Authentication required")
    }

    const claims = await verifyAndParseClaims(verifyToken, token).catch((error) => {
      logger?.({ operation: "requirePermission", reason: `invalid_token: ${getErrorMessage(error)}` })
      return null
    })
    if (claims === null) {
      return sendApiError(ctx, "unauthorized", "Invalid or expired token")
    }

    if (!hasPermission(claims.role, permission)) {
      logger?.({ operation: "requirePermission", reason: "insufficient_permission" })
      return sendApiError(ctx, "forbidden", "Insufficient permissions for this resource")
    }

    if (scope !== undefined && !claims.scopes.includes(scope)) {
      logger?.({ operation: "requirePermission", reason: "missing_scope" })
      return sendApiError(ctx, "forbidden", "Token is missing the required scope")
    }

    ctx.set(AUTH_CONTEXT_KEY, claims)
    await next()
    return undefined
  })
