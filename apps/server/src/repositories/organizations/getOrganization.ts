import { recordQuery } from "../../infrastructure/queryCounter"
import type { OrganizationRecord } from "../types"
import type { LagdaDatabase } from "../shared/paginate"

// Read the caller's own org. The `id !== orgId` guard means one tenant can never read another's.
export const getOrganization =
  (db: LagdaDatabase) =>
  async (orgId: string, id: string): Promise<OrganizationRecord | null> => {
    if (id !== orgId) return null
    recordQuery()
    const row = await db.selectFrom("organizations").select(["id", "name", "slug"]).where("id", "=", id).executeTakeFirst()
    return row ?? null
  }
