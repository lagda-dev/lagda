import { recordQuery } from "../../infrastructure/queryCounter"
import type { TemplateRecord } from "../types"
import type { LagdaDatabase } from "../shared/paginate"

export const getTemplate =
  (db: LagdaDatabase) =>
  async (orgId: string, id: string): Promise<TemplateRecord | null> => {
    recordQuery()
    const row = await db
      .selectFrom("templates")
      .innerJoin("entities", "entities.id", "templates.entity_id")
      .select(["templates.id as id", "templates.entity_id as entityId", "templates.name as name"])
      .where("templates.id", "=", id)
      .where("entities.org_id", "=", orgId)
      .executeTakeFirst()
    return row ?? null
  }
