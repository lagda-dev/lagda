import type { SyncRunRecord } from "../types"

export const SYNC_RUN_COLUMNS = ["id", "org_id", "status", "template_id", "counts", "created_at"] as const

type SyncRunRow = {
  id: string
  org_id: string
  status: SyncRunRecord["status"]
  template_id: string | null
  counts: unknown
  created_at: Date
}

// One place to translate a sync_runs row into the domain record (list/get/create/cancel share it).
export const toSyncRunRecord = (row: SyncRunRow): SyncRunRecord => ({
  id: row.id,
  organizationId: row.org_id,
  status: row.status,
  templateId: row.template_id,
  counts: row.counts as Record<string, number>,
  createdAt: row.created_at.toISOString(),
})
