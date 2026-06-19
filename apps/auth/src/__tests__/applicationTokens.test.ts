import { describe, expect, it, vi } from "vitest"
import type { TokenScope } from "@lagda/auth-contract"
import type { Role } from "@lagda/core"
import {
  canManageApplicationTokens,
  generateTokenSecret,
  hashToken,
  listApplicationTokens,
  mintApplicationToken,
  revokeApplicationToken,
  validateScopes,
} from "../applicationTokens"
import type { ApplicationTokenRecord, ApplicationTokenStore } from "../applicationTokens"

const createStubStore = (overrides: Partial<ApplicationTokenStore> = {}): ApplicationTokenStore => ({
  insert: vi.fn(async () => undefined),
  listByOrganization: vi.fn(async () => []),
  markRevoked: vi.fn(async () => null),
  ...overrides,
})

const buildRecord = (overrides: Partial<ApplicationTokenRecord> = {}): ApplicationTokenRecord => ({
  id: "tok_1",
  organizationId: "org_1",
  name: "ci-token",
  scopes: ["syncs:read"],
  hashedToken: hashToken("plain"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  revokedAt: null,
  ...overrides,
})

describe("canManageApplicationTokens", () => {
  it("allows owner to manage application tokens", () => {
    // Arrange
    const role: Role = "owner"

    // Act
    const result = canManageApplicationTokens(role)

    // Assert
    expect(result).toBe(true)
  })

  it("allows admin to manage application tokens", () => {
    expect(canManageApplicationTokens("admin")).toBe(true)
  })

  it("denies a plain user from managing application tokens", () => {
    expect(canManageApplicationTokens("user")).toBe(false)
  })
})

describe("validateScopes", () => {
  it("returns the scopes unchanged when all are known", () => {
    // Arrange
    const requested = ["syncs:read", "directory:read"]

    // Act
    const validated = validateScopes(requested)

    // Assert
    expect(validated).toEqual(["syncs:read", "directory:read"])
  })

  it("throws when no scopes are requested", () => {
    expect(() => validateScopes([])).toThrowError("Application token requires at least one scope")
  })

  it("throws and names the unknown scope(s)", () => {
    expect(() => validateScopes(["syncs:read", "bogus:scope"])).toThrowError("Unknown application token scope(s): bogus:scope")
  })
})

describe("hashToken & generateTokenSecret", () => {
  it("hashes deterministically for the same input", () => {
    expect(hashToken("same")).toBe(hashToken("same"))
  })

  it("produces different hashes for different inputs", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"))
  })

  it("generates prefixed, high-entropy, unique secrets", () => {
    // Act
    const first = generateTokenSecret()
    const second = generateTokenSecret()

    // Assert
    expect(first.startsWith("lagda_at_")).toBe(true)
    expect(first).not.toBe(second)
  })
})

describe("mintApplicationToken", () => {
  it("mints a hashed, org-bound token and returns the one-time plaintext for an owner", async () => {
    // Arrange
    const store = createStubStore()
    const mint = mintApplicationToken(store)

    // Act
    const { record, plaintext } = await mint("owner", { organizationId: "org_1", name: "ci", scopes: ["syncs:write"] })

    // Assert
    expect(plaintext.startsWith("lagda_at_")).toBe(true)
    expect(record.organizationId).toBe("org_1")
    expect(record.scopes).toEqual(["syncs:write"])
    expect(record.hashedToken).toBe(hashToken(plaintext))
    expect(record.revokedAt).toBeNull()
    expect(store.insert).toHaveBeenCalledOnce()
  })

  it("denies minting for a plain user", async () => {
    // Arrange
    const store = createStubStore()
    const mint = mintApplicationToken(store)

    // Act + Assert
    await expect(mint("user", { organizationId: "org_1", name: "x", scopes: ["syncs:read"] })).rejects.toThrowError(
      "Forbidden: only owners and admins may mint application tokens",
    )
    expect(store.insert).not.toHaveBeenCalled()
  })

  it("rejects an unknown scope before persisting", async () => {
    const store = createStubStore()
    const mint = mintApplicationToken(store)

    await expect(mint("admin", { organizationId: "org_1", name: "x", scopes: ["nope"] as unknown as readonly TokenScope[] })).rejects.toThrowError(
      "Unknown application token scope(s): nope",
    )
    expect(store.insert).not.toHaveBeenCalled()
  })

  it("wraps a storage failure with context", async () => {
    const store = createStubStore({
      insert: vi.fn(async () => {
        throw new Error("db down")
      }),
    })
    const mint = mintApplicationToken(store)

    await expect(mint("owner", { organizationId: "org_1", name: "x", scopes: ["syncs:read"] })).rejects.toThrowError(
      "Failed to mint application token: db down",
    )
  })
})

describe("listApplicationTokens", () => {
  it("returns the org's tokens for an admin", async () => {
    // Arrange
    const records = [buildRecord()]
    const store = createStubStore({ listByOrganization: vi.fn(async () => records) })
    const list = listApplicationTokens(store)

    // Act
    const result = await list("admin", "org_1")

    // Assert
    expect(result).toEqual(records)
    expect(store.listByOrganization).toHaveBeenCalledWith("org_1")
  })

  it("denies listing for a plain user", async () => {
    const store = createStubStore()
    const list = listApplicationTokens(store)

    await expect(list("user", "org_1")).rejects.toThrowError("Forbidden: only owners and admins may list application tokens")
  })

  it("wraps a storage failure with context", async () => {
    const store = createStubStore({
      listByOrganization: vi.fn(async () => {
        throw new Error("timeout")
      }),
    })
    const list = listApplicationTokens(store)

    await expect(list("owner", "org_1")).rejects.toThrowError("Failed to list application tokens: timeout")
  })
})

describe("revokeApplicationToken", () => {
  it("revokes an existing token for an owner", async () => {
    // Arrange
    const revokedRecord = buildRecord({ revokedAt: new Date("2026-02-01T00:00:00.000Z") })
    const store = createStubStore({ markRevoked: vi.fn(async () => revokedRecord) })
    const revoke = revokeApplicationToken(store)

    // Act
    const result = await revoke("owner", "org_1", "tok_1")

    // Assert
    expect(result.revokedAt).not.toBeNull()
    expect(store.markRevoked).toHaveBeenCalledWith("tok_1", "org_1", expect.any(Date))
  })

  it("denies revoking for a plain user", async () => {
    const store = createStubStore()
    const revoke = revokeApplicationToken(store)

    await expect(revoke("user", "org_1", "tok_1")).rejects.toThrowError("Forbidden: only owners and admins may revoke application tokens")
  })

  it("throws when the token is not found in the org", async () => {
    const store = createStubStore({ markRevoked: vi.fn(async () => null) })
    const revoke = revokeApplicationToken(store)

    await expect(revoke("admin", "org_1", "missing")).rejects.toThrowError("Failed to revoke application token: Application token not found: missing")
  })

  it("wraps a storage failure with context", async () => {
    const store = createStubStore({
      markRevoked: vi.fn(async () => {
        throw new Error("conn reset")
      }),
    })
    const revoke = revokeApplicationToken(store)

    await expect(revoke("owner", "org_1", "tok_1")).rejects.toThrowError("Failed to revoke application token: conn reset")
  })
})
