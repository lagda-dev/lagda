import { getErrorMessage } from "@lagda/core"
import { SYNC_DIRECTORY_JOB } from "@lagda/jobs"
import type { Queue } from "@lagda/jobs"
import type { SyncEnqueuer } from "./repository"

// The job enqueuer backed by the pg-boss queue. Enqueues the directory sync job that fans out one
// deploy job per employee (§jobs). Excluded from coverage: it talks to a real queue (integration).
export const createQueueEnqueuer = (queue: Queue): SyncEnqueuer => ({
  enqueueDirectorySync: async (input: { organizationId: string; entityId: string; syncRunId: string }): Promise<void> => {
    try {
      await queue.enqueue(SYNC_DIRECTORY_JOB, input)
    } catch (error) {
      throw new Error(`Failed to enqueue directory sync for run ${input.syncRunId}: ${getErrorMessage(error)}`)
    }
  },
})
