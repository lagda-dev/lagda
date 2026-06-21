import { getErrorMessage } from "@lagda/core"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { LagdaDatabase } from "../shared/paginate"

// Delete an assignment scoped to the caller's org via its entity. Reports whether a row was removed
// so the handler answers 204 (deleted) or 404 (nothing matched in this tenant).
export const deleteAssignment =
  (db: LagdaDatabase) =>
  async (orgId: string, id: string): Promise<boolean> => {
    recordQuery()
    try {
      const ownedEntityIds = db.selectFrom("entities").select("id").where("org_id", "=", orgId)
      const result = await db.deleteFrom("assignments").where("id", "=", id).where("entity_id", "in", ownedEntityIds).executeTakeFirst()
      return result.numDeletedRows > 0n
    } catch (error) {
      throw new Error(`Failed to delete assignment ${id}: ${getErrorMessage(error)}`)
    }
  }
