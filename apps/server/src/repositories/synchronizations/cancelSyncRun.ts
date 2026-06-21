import { recordQuery } from "../../infrastructure/queryCounter"
import type { SyncRunRecord } from "../types"
import type { LagdaDatabase } from "../shared/paginate"
import { SYNC_RUN_COLUMNS, toSyncRunRecord } from "./syncRunMapper"

export const cancelSyncRun =
  (db: LagdaDatabase) =>
  async (orgId: string, id: string): Promise<SyncRunRecord | null> => {
    recordQuery()
    const row = await db
      .updateTable("sync_runs")
      .set({ status: "cancelled" })
      .where("id", "=", id)
      .where("org_id", "=", orgId)
      .returning(SYNC_RUN_COLUMNS)
      .executeTakeFirst()
    return row === undefined ? null : toSyncRunRecord(row)
  }
