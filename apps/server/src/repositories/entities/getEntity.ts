import { recordQuery } from "../../infrastructure/queryCounter"
import type { EntityRecord } from "../types"
import type { LagdaDatabase } from "../shared/paginate"

// Read one entity scoped to the caller's org; a row outside the tenant returns null (a 404).
export const getEntity =
  (db: LagdaDatabase) =>
  async (orgId: string, id: string): Promise<EntityRecord | null> => {
    recordQuery()
    const row = await db
      .selectFrom("entities")
      .select(["id", "org_id as organizationId", "name", "slug"])
      .where("id", "=", id)
      .where("org_id", "=", orgId)
      .executeTakeFirst()
    return row ?? null
  }
