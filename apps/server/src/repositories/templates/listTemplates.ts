import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { TemplateRecord } from "../types"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// List templates scoped to the caller's org via the owning entity.
export const listTemplates =
  (db: LagdaDatabase, paginate: Paginate) =>
  (orgId: string, query: PaginationQuery): Promise<Page<TemplateRecord>> =>
    paginate({
      operation: "listTemplates",
      query,
      runRows: async (limit, cursor) => {
        let builder = db
          .selectFrom("templates")
          .innerJoin("entities", "entities.id", "templates.entity_id")
          .select(["templates.id as id", "templates.entity_id as entityId", "templates.name as name"])
          .where("entities.org_id", "=", orgId)
          .orderBy("templates.id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("templates.id", ">", cursor)
        return builder.execute()
      },
      toCursor: (template) => template.id,
    })
