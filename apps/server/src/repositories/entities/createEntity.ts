import { getErrorMessage } from "@lagda/core"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { CreateEntityInput, EntityRecord } from "../types"
import type { LagdaDatabase } from "../shared/paginate"

// Create an entity under the caller's org. `org_id` is taken from the trusted claims, never the body,
// so the new entity always lands in the caller's tenant.
export const createEntity =
  (db: LagdaDatabase) =>
  async (input: CreateEntityInput): Promise<EntityRecord> => {
    recordQuery()
    try {
      const row = await db
        .insertInto("entities")
        .values({ org_id: input.orgId, name: input.name, slug: input.slug, settings: JSON.stringify({}) })
        .returning(["id", "org_id as organizationId", "name", "slug"])
        .executeTakeFirstOrThrow()
      return row
    } catch (error) {
      throw new Error(`Failed to create entity: ${getErrorMessage(error)}`)
    }
  }
