import { getErrorMessage } from "@lagda/core"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { CreateTemplateInput, TemplateRecord } from "../types"
import { entityBelongsToOrg } from "../shared/ownership"
import type { LagdaDatabase } from "../shared/paginate"

// Create a template under an entity the caller's org owns. When the entity is not in the tenant we
// return null (a 404) rather than inserting an orphan row in another org.
export const createTemplate =
  (db: LagdaDatabase) =>
  async (input: CreateTemplateInput): Promise<TemplateRecord | null> => {
    const isOwned = await entityBelongsToOrg(db, input.orgId, input.entityId)
    if (!isOwned) return null
    recordQuery()
    try {
      const row = await db
        .insertInto("templates")
        .values({ entity_id: input.entityId, name: input.name, mjml_source: input.mjmlSource })
        .returning(["id", "entity_id as entityId", "name"])
        .executeTakeFirstOrThrow()
      return row
    } catch (error) {
      throw new Error(`Failed to create template: ${getErrorMessage(error)}`)
    }
  }
