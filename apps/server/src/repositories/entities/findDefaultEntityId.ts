import { recordQuery } from "../../infrastructure/queryCounter"
import type { LagdaDatabase } from "../shared/paginate"

// Resolve the org's default entity id, used to scope an org-wide synchronization onto a real entity.
// Prefer the canonical `slug = 'default'` entity every org is provisioned with (the common path, one
// query); fall back to the earliest entity so an org whose default was renamed still resolves to
// something. Null when the org has no entity at all (it was never provisioned).
export const findDefaultEntityId =
  (db: LagdaDatabase) =>
  async (orgId: string): Promise<string | null> => {
    recordQuery()
    const preferred = await db.selectFrom("entities").select("id").where("org_id", "=", orgId).where("slug", "=", "default").limit(1).executeTakeFirst()
    if (preferred !== undefined) return preferred.id

    recordQuery()
    const earliest = await db.selectFrom("entities").select("id").where("org_id", "=", orgId).orderBy("id", "asc").limit(1).executeTakeFirst()
    return earliest?.id ?? null
  }
