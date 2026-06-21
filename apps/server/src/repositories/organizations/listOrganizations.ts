import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { OrganizationRecord } from "../types"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// List the caller's org (a tenant only ever sees its own). Keyset-paginated on id.
export const listOrganizations =
  (db: LagdaDatabase, paginate: Paginate) =>
  (orgId: string, query: PaginationQuery): Promise<Page<OrganizationRecord>> =>
    paginate({
      operation: "listOrganizations",
      query,
      runRows: async (limit, cursor) => {
        let builder = db.selectFrom("organizations").select(["id", "name", "slug"]).where("id", "=", orgId).orderBy("id").limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        return builder.execute()
      },
      toCursor: (org) => org.id,
    })
