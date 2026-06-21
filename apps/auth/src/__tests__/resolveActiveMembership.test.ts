import type { Pool } from "pg"
import { describe, expect, it, vi } from "vitest"
import { activeOrganizationIdOf, resolveActiveMembership, toResolvedMembership } from "../resolveActiveMembership"

// A fake query runner that answers the active-org query and the first-membership query independently, so
// we can assert which one the resolver consults without a live database.
const fakeDatabase = (rowsByScopedOrg: Record<string, { organizationId: string; role: string }>, firstRow?: { organizationId: string; role: string }) => {
  const query = vi.fn(async (sql: string, params: unknown[]) => {
    const isScopedQuery = sql.includes('"organizationId" = $2')
    if (isScopedQuery) {
      const scoped = rowsByScopedOrg[params[1] as string]
      return { rows: scoped === undefined ? [] : [scoped] }
    }
    return { rows: firstRow === undefined ? [] : [firstRow] }
  })
  return { database: { query } as unknown as Pool, query }
}

describe("toResolvedMembership", () => {
  it("maps Better Auth's member role to our user role", () => {
    expect(toResolvedMembership({ organizationId: "org-1", role: "member" })).toEqual({ organizationId: "org-1", role: "user" })
  })

  it("passes owner/admin roles through unchanged", () => {
    expect(toResolvedMembership({ organizationId: "org-1", role: "owner" })).toEqual({ organizationId: "org-1", role: "owner" })
  })

  it("nulls out a missing membership", () => {
    expect(toResolvedMembership(undefined)).toEqual({ organizationId: null, role: null })
  })
})

describe("activeOrganizationIdOf", () => {
  it("reads a string active organization id", () => {
    expect(activeOrganizationIdOf({ activeOrganizationId: "org-b" })).toBe("org-b")
  })

  it("returns undefined when absent or not a string", () => {
    expect(activeOrganizationIdOf({})).toBeUndefined()
    expect(activeOrganizationIdOf({ activeOrganizationId: null })).toBeUndefined()
  })
})

describe("resolveActiveMembership", () => {
  it("scopes to the session's active organization, NOT the first-joined one", async () => {
    // Arrange — user is owner of org-a (joined first) and admin of org-b (active).
    const { database } = fakeDatabase({ "org-b": { organizationId: "org-b", role: "admin" } }, { organizationId: "org-a", role: "owner" })

    // Act
    const resolved = await resolveActiveMembership(database, "user-1", "org-b")

    // Assert — token must carry org-b + the org-b role, not org-a/owner.
    expect(resolved).toEqual({ organizationId: "org-b", role: "admin" })
  })

  it("falls back to the first membership when no active organization is set", async () => {
    // Arrange
    const { database } = fakeDatabase({}, { organizationId: "org-a", role: "owner" })

    // Act
    const resolved = await resolveActiveMembership(database, "user-1", undefined)

    // Assert
    expect(resolved).toEqual({ organizationId: "org-a", role: "owner" })
  })

  it("falls back to the first membership when the active organization names no membership", async () => {
    // Arrange — active org id resolves to no row (e.g. the user was removed from it).
    const { database } = fakeDatabase({}, { organizationId: "org-a", role: "user" })

    // Act
    const resolved = await resolveActiveMembership(database, "user-1", "org-stale")

    // Assert
    expect(resolved).toEqual({ organizationId: "org-a", role: "user" })
  })

  it("returns nulls when the user has no membership at all", async () => {
    // Arrange
    const { database } = fakeDatabase({}, undefined)

    // Act
    const resolved = await resolveActiveMembership(database, "user-1", undefined)

    // Assert
    expect(resolved).toEqual({ organizationId: null, role: null })
  })
})
