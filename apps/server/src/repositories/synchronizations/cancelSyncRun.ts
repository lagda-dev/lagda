import type { SyncRunStatus } from "../types"
import type { CancelSyncRunResult } from "../repository"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { LagdaDatabase } from "../shared/paginate"
import { SYNC_RUN_COLUMNS, toSyncRunRecord } from "./syncRunMapper"

// Only a run still in flight may be cancelled. Cancelling a terminal run must NOT rewrite its status
// (that would corrupt history and counts), so we report it as not-cancellable instead.
const TERMINAL_STATUSES: SyncRunStatus[] = ["succeeded", "failed", "cancelled"]
const CANCELLABLE_STATUSES: SyncRunStatus[] = ["pending", "running"]

export const cancelSyncRun =
  (db: LagdaDatabase) =>
  async (orgId: string, id: string): Promise<CancelSyncRunResult> => {
    recordQuery()
    const existing = await db.selectFrom("sync_runs").select(SYNC_RUN_COLUMNS).where("id", "=", id).where("org_id", "=", orgId).executeTakeFirst()
    if (existing === undefined) return { outcome: "not_found" }
    if (TERMINAL_STATUSES.includes(existing.status)) return { outcome: "not_cancellable", run: toSyncRunRecord(existing) }

    recordQuery()
    // Re-assert the non-terminal status in the UPDATE so a run that finished between the read and the
    // write (a race) is not clobbered; an empty result means it just became terminal — not cancellable.
    const cancelled = await db
      .updateTable("sync_runs")
      .set({ status: "cancelled" })
      .where("id", "=", id)
      .where("org_id", "=", orgId)
      .where("status", "in", CANCELLABLE_STATUSES)
      .returning(SYNC_RUN_COLUMNS)
      .executeTakeFirst()
    if (cancelled === undefined) return { outcome: "not_found" }
    return { outcome: "cancelled", run: toSyncRunRecord(cancelled) }
  }
