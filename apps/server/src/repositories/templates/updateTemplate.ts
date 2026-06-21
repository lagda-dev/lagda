import { getErrorMessage } from "@lagda/core"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { TemplateRecord, UpdateTemplateInput } from "../types"
import type { LagdaDatabase } from "../shared/paginate"

// Update a template scoped to the caller's org via its entity. A subquery restricts the matched row
// to entities in the tenant, so a template in another org matches nothing and returns null (404).
export const updateTemplate =
  (db: LagdaDatabase) =>
  async (input: UpdateTemplateInput): Promise<TemplateRecord | null> => {
    recordQuery()
    try {
      const withName = input.name === undefined ? {} : { name: input.name }
      const changes = input.mjmlSource === undefined ? withName : { ...withName, mjml_source: input.mjmlSource }
      const ownedEntityIds = db.selectFrom("entities").select("id").where("org_id", "=", input.orgId)
      const row = await db
        .updateTable("templates")
        .set(changes)
        .where("id", "=", input.id)
        .where("entity_id", "in", ownedEntityIds)
        .returning(["id", "entity_id as entityId", "name"])
        .executeTakeFirst()
      return row ?? null
    } catch (error) {
      throw new Error(`Failed to update template ${input.id}: ${getErrorMessage(error)}`)
    }
  }
