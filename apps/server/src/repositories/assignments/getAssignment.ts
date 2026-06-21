import { recordQuery } from "../../infrastructure/queryCounter"
import type { AssignmentRecord } from "../types"
import type { LagdaDatabase } from "../shared/paginate"
import { ASSIGNMENT_COLUMNS, withParsedTarget } from "./assignmentMapper"

export const getAssignment =
  (db: LagdaDatabase) =>
  async (orgId: string, id: string): Promise<AssignmentRecord | null> => {
    recordQuery()
    const row = await db
      .selectFrom("assignments")
      .innerJoin("entities", "entities.id", "assignments.entity_id")
      .select(ASSIGNMENT_COLUMNS)
      .where("assignments.id", "=", id)
      .where("entities.org_id", "=", orgId)
      .executeTakeFirst()
    return row === undefined ? null : withParsedTarget(row)
  }
