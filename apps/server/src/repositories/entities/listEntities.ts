import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { EntityRecord } from "../types"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// List the org's entities (brands/business units), scoped to the caller's org and keyset-paginated.
export const listEntities =
  (db: LagdaDatabase, paginate: Paginate) =>
  (orgId: string, query: PaginationQuery): Promise<Page<EntityRecord>> =>
    paginate({
      operation: "listEntities",
      query,
      runRows: async (limit, cursor) => {
        let builder = db
          .selectFrom("entities")
          .select(["id", "org_id as organizationId", "name", "slug"])
          .where("org_id", "=", orgId)
          .orderBy("id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        return builder.execute()
      },
      toCursor: (entity) => entity.id,
    })
