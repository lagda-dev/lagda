import { getErrorMessage } from "@lagda/core"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { EntityRecord, UpdateEntityInput } from "../types"
import type { LagdaDatabase } from "../shared/paginate"

// Update an entity scoped to the caller's org; a row outside the tenant matches nothing and returns
// null (a 404). Only provided fields change.
export const updateEntity =
  (db: LagdaDatabase) =>
  async (input: UpdateEntityInput): Promise<EntityRecord | null> => {
    recordQuery()
    try {
      const withName = input.name === undefined ? {} : { name: input.name }
      const changes = input.slug === undefined ? withName : { ...withName, slug: input.slug }
      const row = await db
        .updateTable("entities")
        .set(changes)
        .where("id", "=", input.id)
        .where("org_id", "=", input.orgId)
        .returning(["id", "org_id as organizationId", "name", "slug"])
        .executeTakeFirst()
      return row ?? null
    } catch (error) {
      throw new Error(`Failed to update entity ${input.id}: ${getErrorMessage(error)}`)
    }
  }
