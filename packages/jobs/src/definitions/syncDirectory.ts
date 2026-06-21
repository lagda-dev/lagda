import { z } from "zod"
import { getErrorMessage } from "@lagda/core"

// pg-boss job name. The verb is "synchronize" in code, but the resource is "directory":
// this job pulls the directory and fans out one deploy job per employee.
export const SYNC_DIRECTORY_JOB = "sync-directory"

export const syncDirectoryPayloadSchema = z.object({
  organizationId: z.string().min(1),
  entityId: z.string().min(1),
  syncRunId: z.string().min(1),
})

export type SyncDirectoryPayload = z.infer<typeof syncDirectoryPayloadSchema>

// One directory employee, as returned by the injected directory reader. Kept as a small
// local interface so this handler stays decoupled from @lagda/db and @lagda/connectors.
export type SyncDirectoryEmployee = {
  email: string
}

// A deploy job to enqueue for a single employee.
export type DeployEnqueueRequest = {
  employeeEmail: string
  syncRunId: string
}

// Dependencies are injected so the handler is decoupled and unit-testable: the parent
// wires the real directory reader and the queue's enqueue in apps/server.
export type SyncDirectoryDeps = {
  listEmployees: (organizationId: string, entityId: string) => Promise<SyncDirectoryEmployee[]>
  enqueueDeploy: (request: DeployEnqueueRequest) => Promise<void>
}

export const createSyncDirectoryHandler =
  (deps: SyncDirectoryDeps) =>
  async (payload: SyncDirectoryPayload): Promise<void> => {
    const { listEmployees, enqueueDeploy } = deps
    const { organizationId, entityId, syncRunId } = syncDirectoryPayloadSchema.parse(payload)

    const employees = await listEmployees(organizationId, entityId)
    const deployRequests = employees.map((employee): DeployEnqueueRequest => ({ employeeEmail: employee.email, syncRunId }))

    try {
      await Promise.all(deployRequests.map((request) => enqueueDeploy(request)))
    } catch (error) {
      throw new Error(`Failed to enqueue deploy jobs for sync run ${syncRunId}: ${getErrorMessage(error)}`)
    }
  }
