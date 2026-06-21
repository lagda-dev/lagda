import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { AuditEventRecord } from "../types"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Org-scoped audit-log listing; timestamps are serialised to ISO strings at the boundary.
export const listAuditEvents =
  (db: LagdaDatabase, paginate: Paginate) =>
  (orgId: string, query: PaginationQuery): Promise<Page<AuditEventRecord>> =>
    paginate({
      operation: "listAuditEvents",
      query,
      runRows: async (limit, cursor) => {
        let builder = db
          .selectFrom("audit_log")
          .select(["id", "actor", "action", "target", "created_at"])
          .where("org_id", "=", orgId)
          .orderBy("id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        const rows = await builder.execute()
        return rows.map((row) => ({ id: row.id, actor: row.actor, action: row.action, target: row.target, createdAt: row.created_at.toISOString() }))
      },
      toCursor: (event) => event.id,
    })
