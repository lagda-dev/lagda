import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { SyncRunRecord } from "../types"
import type { LagdaDatabase, Paginate } from "../shared/paginate"
import { SYNC_RUN_COLUMNS, toSyncRunRecord } from "./syncRunMapper"

export const listSyncRuns =
  (db: LagdaDatabase, paginate: Paginate) =>
  (orgId: string, query: PaginationQuery): Promise<Page<SyncRunRecord>> =>
    paginate({
      operation: "listSyncRuns",
      query,
      runRows: async (limit, cursor) => {
        let builder = db.selectFrom("sync_runs").select(SYNC_RUN_COLUMNS).where("org_id", "=", orgId).orderBy("id").limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        const rows = await builder.execute()
        return rows.map(toSyncRunRecord)
      },
      toCursor: (run) => run.id,
    })
