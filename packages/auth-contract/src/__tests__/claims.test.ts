import { describe, expect, it } from "vitest"
import { applicationTokenClaimsSchema, parseClaims, tokenClaimsSchema } from "../claims"

const validUserClaims = {
  sub: "user_123",
  orgId: "org_456",
  role: "admin",
  scopes: ["syncs:read", "directory:read"],
}

describe("parseClaims", () => {
  it("returns typed claims for a well-formed payload", () => {
    // Arrange
    const raw = validUserClaims

    // Act
    const claims = parseClaims(raw)

    // Assert
    expect(claims).toEqual(validUserClaims)
  })

  it("accepts an empty scopes array for a user token", () => {
    // Arrange
    const raw = { ...validUserClaims, role: "user", scopes: [] }

    // Act
    const claims = parseClaims(raw)

    // Assert
    expect(claims.scopes).toEqual([])
  })

  it("throws a descriptive error when a required field is missing", () => {
    // Arrange
    const raw = { orgId: "org_456", role: "user", scopes: [] }

    // Act & Assert
    expect(() => parseClaims(raw)).toThrowError(/Invalid token claims: sub/)
  })

  it("throws when the role is not a known role", () => {
    // Arrange
    const raw = { ...validUserClaims, role: "superadmin" }

    // Act & Assert
    expect(() => parseClaims(raw)).toThrowError(/Invalid token claims: role/)
  })

  it("throws when a scope is outside the allowed set", () => {
    // Arrange
    const raw = { ...validUserClaims, scopes: ["employees:delete"] }

    // Act & Assert
    expect(() => parseClaims(raw)).toThrowError(/Invalid token claims: scopes/)
  })

  it("throws when given a non-object payload", () => {
    // Arrange
    const raw = "not-an-object"

    // Act & Assert
    expect(() => parseClaims(raw)).toThrowError(/Invalid token claims/)
  })
})

describe("tokenClaimsSchema", () => {
  it("rejects an empty subject", () => {
    // Arrange
    const raw = { ...validUserClaims, sub: "" }

    // Act
    const result = tokenClaimsSchema.safeParse(raw)

    // Assert
    expect(result.success).toBe(false)
  })
})

describe("applicationTokenClaimsSchema", () => {
  it("accepts an admin machine token with at least one scope", () => {
    // Arrange
    const raw = { ...validUserClaims, role: "admin", scopes: ["syncs:write"] }

    // Act
    const result = applicationTokenClaimsSchema.safeParse(raw)

    // Assert
    expect(result.success).toBe(true)
  })

  it("rejects a machine token with no scopes", () => {
    // Arrange
    const raw = { ...validUserClaims, role: "admin", scopes: [] }

    // Act
    const result = applicationTokenClaimsSchema.safeParse(raw)

    // Assert
    expect(result.success).toBe(false)
  })

  it("rejects a machine token whose role is not admin", () => {
    // Arrange
    const raw = { ...validUserClaims, role: "owner", scopes: ["syncs:write"] }

    // Act
    const result = applicationTokenClaimsSchema.safeParse(raw)

    // Assert
    expect(result.success).toBe(false)
  })
})
