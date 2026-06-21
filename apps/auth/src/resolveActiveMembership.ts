import type { Pool } from "pg"

// Resolve the membership + role the minted JWT should carry, in OUR vocabulary (Better Auth's `member`
// is our `user`). The resource server authorizes every call on these claims, so the organization here
// is a tenant-isolation boundary (§6). Extracted from `auth.ts` so the selection logic is unit-testable
// against a fake query runner instead of a live connection.

export type ResolvedMembership = { organizationId: string | null; role: string | null }

type MemberRow = { organizationId: string; role: string }

// Map a raw membership row into our vocabulary; null out when the user has no membership at all.
export const toResolvedMembership = (row: MemberRow | undefined): ResolvedMembership =>
  row === undefined ? { organizationId: null, role: null } : { organizationId: row.organizationId, role: row.role === "member" ? "user" : row.role }

// The active organization id Better Auth's organization plugin stores on the session row. It is not part
// of the base `Session` type (it lives on the session's open `Record<string, any>` extension), so read
// it defensively and only trust a string value.
export const activeOrganizationIdOf = (session: Record<string, unknown>): string | undefined =>
  typeof session.activeOrganizationId === "string" ? session.activeOrganizationId : undefined

// CRITICAL: scope to the session's ACTIVE organization, not "whichever org the user joined first". A user
// who belongs to several orgs and switches to org B must get a token scoped to org B with their org-B
// role — otherwise the resource server authorizes their calls against the wrong tenant with the wrong
// role. We fall back to the first membership ONLY when no active org is set (or it names no membership).
export const resolveActiveMembership = async (database: Pool, userId: string, activeOrganizationId: string | undefined): Promise<ResolvedMembership> => {
  if (activeOrganizationId !== undefined) {
    const scoped = await database.query<MemberRow>('select "organizationId", role from "member" where "userId" = $1 and "organizationId" = $2 limit 1', [
      userId,
      activeOrganizationId,
    ])
    if (scoped.rows[0] !== undefined) return toResolvedMembership(scoped.rows[0])
  }

  const firstMembership = await database.query<MemberRow>('select "organizationId", role from "member" where "userId" = $1 order by "createdAt" asc limit 1', [
    userId,
  ])
  return toResolvedMembership(firstMembership.rows[0])
}
