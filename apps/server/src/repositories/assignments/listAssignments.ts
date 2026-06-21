import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { AssignmentRecord } from "../types"
import type { LagdaDatabase, Paginate } from "../shared/paginate"
import { ASSIGNMENT_COLUMNS, withParsedTarget } from "./assignmentMapper"

// List assignments scoped to the caller's org via the owning entity.
export const listAssignments =
  (db: LagdaDatabase, paginate: Paginate) =>
  (orgId: string, query: PaginationQuery): Promise<Page<AssignmentRecord>> =>
    paginate({
      operation: "listAssignments",
      query,
      runRows: async (limit, cursor) => {
        let builder = db
          .selectFrom("assignments")
          .innerJoin("entities", "entities.id", "assignments.entity_id")
          .select(ASSIGNMENT_COLUMNS)
          .where("entities.org_id", "=", orgId)
          .orderBy("assignments.id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("assignments.id", ">", cursor)
        return builder.execute()
      },
      toCursor: (assignment) => assignment.id,
    }).then((page) => ({ ...page, data: page.data.map(withParsedTarget) }))
