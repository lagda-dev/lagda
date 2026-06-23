import { describe, expect, it, vi } from "vitest"
import type { TokenScope } from "@lagda/auth-contract"
import {
  generateTokenSecret,
  hashToken,
  listApplicationTokens,
  mintApplicationToken,
  revokeApplicationToken,
  validateScopes,
  type ApplicationTokenRecord,
  type ApplicationTokenStore,
} from "../applicationTokens"

const scopes: readonly TokenScope[] = ["syncs:read", "syncs:write"]

const fakeStore = (overrides: Partial<ApplicationTokenStore> = {}): ApplicationTokenStore => ({
  insert: vi.fn().mockResolvedValue(undefined),
  listByOrganization: vi.fn().mockResolvedValue([]),
  markRevoked: vi.fn().mockResolvedValue(null),
  ...overrides,
})

describe("validateScopes", () => {
  it("returns the scopes when all are known", () => {
    expect(validateScopes(["syncs:read"])).toEqual(["syncs:read"])
  })
  it("rejects an empty scope list", () => {
    expect(() => validateScopes([])).toThrow("at least one scope")
  })
  it("rejects unknown scopes", () => {
    expect(() => validateScopes(["syncs:read", "bogus"])).toThrow("Unknown application token scope(s): bogus")
  })
})

describe("hashToken / generateTokenSecret", () => {
  it("hashes deterministically to hex", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"))
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/)
  })
  it("generates a prefixed, unique secret", () => {
    const a = generateTokenSecret()
    const b = generateTokenSecret()
    expect(a.startsWith("lagda_at_")).toBe(true)
    expect(a).not.toBe(b)
  })
})

describe("mintApplicationToken", () => {
  it("persists a hashed record and returns the one-time plaintext", async () => {
    // Arrange
    const insert = vi.fn().mockResolvedValue(undefined)
    const mint = mintApplicationToken(fakeStore({ insert }))

    // Act
    const { record, plaintext } = await mint({ organizationId: "org1", name: "CI", scopes })

    // Assert — plaintext is returned but only its hash is stored
    expect(plaintext.startsWith("lagda_at_")).toBe(true)
    expect(record.hashedToken).toBe(hashToken(plaintext))
    expect(record.hashedToken).not.toBe(plaintext)
    expect(record).toMatchObject({ organizationId: "org1", name: "CI", scopes, revokedAt: null })
    expect(insert).toHaveBeenCalledWith(record)
  })

  it("validates scopes before persisting", async () => {
    const insert = vi.fn()
    await expect(mintApplicationToken(fakeStore({ insert }))({ organizationId: "org1", name: "x", scopes: [] })).rejects.toThrow("at least one scope")
    expect(insert).not.toHaveBeenCalled()
  })

  it("wraps a store failure with context", async () => {
    const store = fakeStore({ insert: vi.fn().mockRejectedValue(new Error("db down")) })
    await expect(mintApplicationToken(store)({ organizationId: "org1", name: "x", scopes })).rejects.toThrow("Failed to mint application token: db down")
  })
})

describe("listApplicationTokens", () => {
  it("delegates to the store, scoped to the org", async () => {
    const records: ApplicationTokenRecord[] = []
    const listByOrganization = vi.fn().mockResolvedValue(records)
    const result = await listApplicationTokens(fakeStore({ listByOrganization }))("org1")
    expect(listByOrganization).toHaveBeenCalledWith("org1")
    expect(result).toBe(records)
  })
})

describe("revokeApplicationToken", () => {
  it("marks the token revoked and returns it", async () => {
    const revoked = { id: "t1" } as ApplicationTokenRecord
    const markRevoked = vi.fn().mockResolvedValue(revoked)
    const result = await revokeApplicationToken(fakeStore({ markRevoked }))("org1", "t1")
    expect(markRevoked).toHaveBeenCalledWith("t1", "org1", expect.any(Date))
    expect(result).toBe(revoked)
  })

  it("returns null when nothing matched in the org", async () => {
    const result = await revokeApplicationToken(fakeStore())("org1", "missing")
    expect(result).toBeNull()
  })
})
