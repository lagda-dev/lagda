import { getErrorMessage } from "@lagda/core"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { OrganizationRecord, UpdateOrganizationInput } from "../types"
import type { LagdaDatabase } from "../shared/paginate"

// Update the caller's own org (settings/name). The `id !== orgId` guard means one tenant can never
// mutate another's organization even with a forged id. Only provided fields change.
export const updateOrganization =
  (db: LagdaDatabase) =>
  async (input: UpdateOrganizationInput): Promise<OrganizationRecord | null> => {
    if (input.id !== input.orgId) return null
    recordQuery()
    try {
      const changes = input.name === undefined ? {} : { name: input.name }
      const row = await db.updateTable("organizations").set(changes).where("id", "=", input.id).returning(["id", "name", "slug"]).executeTakeFirst()
      return row ?? null
    } catch (error) {
      throw new Error(`Failed to update organization ${input.id}: ${getErrorMessage(error)}`)
    }
  }
