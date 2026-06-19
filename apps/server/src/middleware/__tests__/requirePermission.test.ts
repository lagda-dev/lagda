import { describe, expect, it, vi } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { TokenClaims } from "@lagda/auth-contract"
import { AUTH_CONTEXT_KEY } from "../authContext"
import type { AuthVariables } from "../authContext"
import { requirePermission } from "../requirePermission"

// A verifier resolving the given claims, simulating a valid token of that shape.
const verifierResolving = (claims: TokenClaims) => vi.fn(async () => claims)

const ownerClaims: TokenClaims = { sub: "u1", orgId: "o1", role: "owner", scopes: ["syncs:write", "syncs:read", "directory:read"] }
const userClaims: TokenClaims = { sub: "u2", orgId: "o1", role: "user", scopes: [] }

// Build a tiny app whose single protected route echoes the resolved claims, so a test can assert both
// the status code and that the claims reached the handler.
const buildProtectedApp = (middlewareOptions: Parameters<typeof requirePermission>[0]) =>
  new OpenAPIHono<{ Variables: AuthVariables }>()
    .use("/protected", requirePermission(middlewareOptions))
    .get("/protected", (ctx) => ctx.json({ role: ctx.get(AUTH_CONTEXT_KEY).role }))

describe("requirePermission", () => {
  it("allows a role that holds the required permission and forwards the claims", async () => {
    // Arrange
    const app = buildProtectedApp({ verifyToken: verifierResolving(ownerClaims), permission: PERMISSIONS.MANAGE_ORG })

    // Act
    const response = await app.request("/protected", { headers: { authorization: "Bearer t" } })

    // Assert
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ role: "owner" })
  })

  it("denies with 403 a role lacking the required permission (deny by default)", async () => {
    // Arrange — a plain user cannot manage the org
    const app = buildProtectedApp({ verifyToken: verifierResolving(userClaims), permission: PERMISSIONS.MANAGE_ORG })

    // Act
    const response = await app.request("/protected", { headers: { authorization: "Bearer t" } })
    const body = (await response.json()) as { error: { code: string } }

    // Assert
    expect(response.status).toBe(403)
    expect(body.error.code).toBe("forbidden")
  })

  it("returns 401 when the Authorization header is missing", async () => {
    // Arrange
    const verifyToken = vi.fn(async () => ownerClaims)
    const app = buildProtectedApp({ verifyToken, permission: PERMISSIONS.VIEW_OWN_SIGNATURE })

    // Act
    const response = await app.request("/protected")

    // Assert
    expect(response.status).toBe(401)
    expect(verifyToken).not.toHaveBeenCalled()
  })

  it("returns 401 when the token is invalid", async () => {
    // Arrange — the verifier rejects, simulating a bad signature/expired token
    const app = buildProtectedApp({ verifyToken: vi.fn(async () => Promise.reject(new Error("bad"))), permission: PERMISSIONS.VIEW_OWN_SIGNATURE })

    // Act
    const response = await app.request("/protected", { headers: { authorization: "Bearer t" } })
    const body = (await response.json()) as { error: { code: string } }

    // Assert
    expect(response.status).toBe(401)
    expect(body.error.code).toBe("unauthorized")
  })

  it("returns 401 when the bearer token is empty", async () => {
    // Arrange
    const app = buildProtectedApp({ verifyToken: vi.fn(async () => ownerClaims), permission: PERMISSIONS.VIEW_OWN_SIGNATURE })

    // Act
    const response = await app.request("/protected", { headers: { authorization: "Bearer " } })

    // Assert
    expect(response.status).toBe(401)
  })

  it("rejects claims that fail schema validation with 401", async () => {
    // Arrange — verifier resolves a malformed payload (missing orgId/role)
    const app = buildProtectedApp({ verifyToken: vi.fn(async () => ({ sub: "u1" })), permission: PERMISSIONS.VIEW_OWN_SIGNATURE })

    // Act
    const response = await app.request("/protected", { headers: { authorization: "Bearer t" } })

    // Assert
    expect(response.status).toBe(401)
  })

  it("enforces the application-token scope on public-API routes", async () => {
    // Arrange — owner has the permission but the token lacks the required scope
    const scopelessOwner: TokenClaims = { ...ownerClaims, scopes: [] }
    const app = buildProtectedApp({ verifyToken: verifierResolving(scopelessOwner), permission: PERMISSIONS.RUN_SYNCS, scope: "syncs:write" })

    // Act
    const response = await app.request("/protected", { headers: { authorization: "Bearer t" } })
    const body = (await response.json()) as { error: { code: string } }

    // Assert
    expect(response.status).toBe(403)
    expect(body.error.code).toBe("forbidden")
  })

  it("allows when both permission and scope are satisfied", async () => {
    // Arrange
    const app = buildProtectedApp({ verifyToken: verifierResolving(ownerClaims), permission: PERMISSIONS.RUN_SYNCS, scope: "syncs:write" })

    // Act
    const response = await app.request("/protected", { headers: { authorization: "Bearer t" } })

    // Assert
    expect(response.status).toBe(200)
  })

  it("denies without a logger configured (optional logging is skipped safely)", async () => {
    // Arrange — no logger passed: the `logger?.()` calls must be no-ops
    const missingTokenApp = buildProtectedApp({ verifyToken: vi.fn(async () => ownerClaims), permission: PERMISSIONS.MANAGE_ORG })
    const invalidTokenApp = buildProtectedApp({ verifyToken: vi.fn(async () => Promise.reject(new Error("bad"))), permission: PERMISSIONS.MANAGE_ORG })
    const forbiddenApp = buildProtectedApp({ verifyToken: verifierResolving(userClaims), permission: PERMISSIONS.MANAGE_ORG })

    // Act
    const missing = await missingTokenApp.request("/protected")
    const invalid = await invalidTokenApp.request("/protected", { headers: { authorization: "Bearer t" } })
    const forbidden = await forbiddenApp.request("/protected", { headers: { authorization: "Bearer t" } })

    // Assert
    expect(missing.status).toBe(401)
    expect(invalid.status).toBe(401)
    expect(forbidden.status).toBe(403)
  })

  it("invokes the structured logger on denial without leaking the token", async () => {
    // Arrange
    const logger = vi.fn()
    const app = buildProtectedApp({ verifyToken: verifierResolving(userClaims), permission: PERMISSIONS.MANAGE_ORG, logger })

    // Act
    await app.request("/protected", { headers: { authorization: "Bearer secret-token" } })

    // Assert
    expect(logger).toHaveBeenCalledWith({ operation: "requirePermission", reason: "insufficient_permission" })
    const loggedReasons = logger.mock.calls.map((call) => JSON.stringify(call[0]))
    expect(loggedReasons.some((entry) => entry.includes("secret-token"))).toBe(false)
  })

  it("logs each distinct denial reason (missing token, invalid token, missing scope)", async () => {
    // Arrange
    const missingLogger = vi.fn()
    const invalidLogger = vi.fn()
    const scopeLogger = vi.fn()
    const scopelessOwner: TokenClaims = { ...ownerClaims, scopes: [] }
    const missingApp = buildProtectedApp({ verifyToken: vi.fn(async () => ownerClaims), permission: PERMISSIONS.MANAGE_ORG, logger: missingLogger })
    const invalidApp = buildProtectedApp({
      verifyToken: vi.fn(async () => Promise.reject(new Error("bad"))),
      permission: PERMISSIONS.MANAGE_ORG,
      logger: invalidLogger,
    })
    const scopeApp = buildProtectedApp({
      verifyToken: verifierResolving(scopelessOwner),
      permission: PERMISSIONS.RUN_SYNCS,
      scope: "syncs:write",
      logger: scopeLogger,
    })

    // Act
    await missingApp.request("/protected")
    await invalidApp.request("/protected", { headers: { authorization: "Bearer t" } })
    await scopeApp.request("/protected", { headers: { authorization: "Bearer t" } })

    // Assert
    expect(missingLogger).toHaveBeenCalledWith({ operation: "requirePermission", reason: "missing_token" })
    expect(invalidLogger.mock.calls[0]?.[0].reason).toContain("invalid_token")
    expect(scopeLogger).toHaveBeenCalledWith({ operation: "requirePermission", reason: "missing_scope" })
  })
})
