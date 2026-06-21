import { recordQuery } from "../../infrastructure/queryCounter"
import type { SyncRunRecord } from "../types"
import type { LagdaDatabase } from "../shared/paginate"
import { SYNC_RUN_COLUMNS, toSyncRunRecord } from "./syncRunMapper"

export const getSyncRun =
  (db: LagdaDatabase) =>
  async (orgId: string, id: string): Promise<SyncRunRecord | null> => {
    recordQuery()
    const row = await db.selectFrom("sync_runs").select(SYNC_RUN_COLUMNS).where("id", "=", id).where("org_id", "=", orgId).executeTakeFirst()
    return row === undefined ? null : toSyncRunRecord(row)
  }
