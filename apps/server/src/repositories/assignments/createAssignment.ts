import { getErrorMessage } from "@lagda/core"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { AssignmentRecord, CreateAssignmentInput } from "../types"
import { entityBelongsToOrg, templateBelongsToOrg } from "../shared/ownership"
import type { LagdaDatabase } from "../shared/paginate"
import { withParsedTarget } from "./assignmentMapper"

// Create an assignment binding a template to a target under an entity, both owned by the caller's
// org. A forged entity or template from another tenant returns null (a 404) instead of inserting.
export const createAssignment =
  (db: LagdaDatabase) =>
  async (input: CreateAssignmentInput): Promise<AssignmentRecord | null> => {
    const isEntityOwned = await entityBelongsToOrg(db, input.orgId, input.entityId)
    if (!isEntityOwned) return null
    const isTemplateOwned = await templateBelongsToOrg(db, input.orgId, input.templateId)
    if (!isTemplateOwned) return null
    recordQuery()
    try {
      const row = await db
        .insertInto("assignments")
        .values({ entity_id: input.entityId, template_id: input.templateId, target: JSON.stringify(input.target) })
        .returning(["id", "entity_id as entityId", "template_id as templateId", "target"])
        .executeTakeFirstOrThrow()
      return withParsedTarget(row)
    } catch (error) {
      throw new Error(`Failed to create assignment: ${getErrorMessage(error)}`)
    }
  }
