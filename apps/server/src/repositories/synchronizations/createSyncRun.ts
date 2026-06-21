import { getErrorMessage } from "@lagda/core"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { CreateSyncRunInput, SyncRunRecord } from "../types"
import type { LagdaDatabase } from "../shared/paginate"
import { SYNC_RUN_COLUMNS, toSyncRunRecord } from "./syncRunMapper"

export const createSyncRun =
  (db: LagdaDatabase) =>
  async (input: CreateSyncRunInput): Promise<SyncRunRecord> => {
    recordQuery()
    try {
      const row = await db
        .insertInto("sync_runs")
        .values({
          org_id: input.organizationId,
          target: JSON.stringify(input.target),
          template_id: input.templateId,
          status: "pending",
          counts: JSON.stringify({}),
          created_by: input.createdBy,
        })
        .returning(SYNC_RUN_COLUMNS)
        .executeTakeFirstOrThrow()
      return toSyncRunRecord(row)
    } catch (error) {
      throw new Error(`Failed to persist sync run: ${getErrorMessage(error)}`)
    }
  }
