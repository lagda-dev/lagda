import { recordQuery } from "../../infrastructure/queryCounter"
import type { LagdaDatabase } from "./paginate"

// Cross-entity tenant-ownership checks: confirm a referenced entity/template belongs to the caller's
// org BEFORE a write targets it, so a forged id from another tenant returns null (a 404) rather than
// inserting an orphan row. Shared because templates and assignments both guard against the same forgery.

export const entityBelongsToOrg = async (db: LagdaDatabase, orgId: string, entityId: string): Promise<boolean> => {
  recordQuery()
  const row = await db.selectFrom("entities").select("id").where("id", "=", entityId).where("org_id", "=", orgId).executeTakeFirst()
  return row !== undefined
}

export const templateBelongsToOrg = async (db: LagdaDatabase, orgId: string, templateId: string): Promise<boolean> => {
  recordQuery()
  const row = await db
    .selectFrom("templates")
    .innerJoin("entities", "entities.id", "templates.entity_id")
    .select("templates.id as id")
    .where("templates.id", "=", templateId)
    .where("entities.org_id", "=", orgId)
    .executeTakeFirst()
  return row !== undefined
}
