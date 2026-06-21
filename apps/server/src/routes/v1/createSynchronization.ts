import type { Context } from "hono"
import { getErrorMessage } from "@lagda/core"
import type { CreateSyncRunInput, SyncTarget } from "../../repositories/types"
import { claimsFrom, failOutcome, okOutcome } from "./handlers"
import type { Outcome } from "./handlers"
import type { SyncTargetInput } from "./syncTargetSchema"
import type { ApiDependencies } from "./dependencies"
import type { Repository } from "../../repositories/repository"

// The synchronization create step (§4): persist a `sync_run`, enqueue the directory deploy job, and
// produce the 202 outcome with the run id. The route stays a thin checklist; the orchestration lives
// here and reads as: build input → create run → enqueue → accept.

export type SyncAccepted = {
  id: string
  status: string
}

// Map the validated request target onto the domain `SyncTarget`. They share a shape; this keeps the
// boundary explicit and the discriminant intact.
const toDomainTarget = (target: SyncTargetInput): SyncTarget => target

// The entity the directory-sync job fans out over. Every variant but `org` names its own entity; an
// `org`-wide sync resolves to the org's default entity (an org id is NOT an entity id, so it must be
// resolved here rather than passed through). Throws when the org has no entity to synchronize.
const resolveTargetEntityId = async (repository: Repository, orgId: string, target: SyncTargetInput): Promise<string> => {
  if (target.kind !== "org") return target.entityId
  const defaultEntityId = await repository.findDefaultEntityId(orgId)
  if (defaultEntityId === null) throw new Error(`Organization ${orgId} has no entity to synchronize`)
  return defaultEntityId
}

export const createSynchronization = async (
  ctx: Context,
  deps: ApiDependencies,
  body: { target: SyncTargetInput; templateId?: string },
): Promise<Outcome<SyncAccepted>> => {
  const { orgId, sub } = claimsFrom(ctx)
  const createInput: CreateSyncRunInput = {
    organizationId: orgId,
    target: toDomainTarget(body.target),
    templateId: body.templateId ?? null,
    createdBy: sub,
  }

  try {
    const entityId = await resolveTargetEntityId(deps.repository, orgId, body.target)
    const syncRun = await deps.repository.createSyncRun(createInput)
    await deps.enqueuer.enqueueDirectorySync({
      organizationId: orgId,
      entityId,
      syncRunId: syncRun.id,
    })
    return okOutcome({ id: syncRun.id, status: syncRun.status })
  } catch (error) {
    // A run that never made it to the queue is a failed sync-run outcome (§9). Best-effort: the
    // terminal succeeded/partial outcomes are recorded by the job worker when the run finishes.
    deps.recordSyncRun?.("failed")
    return failOutcome("internal_error", `Failed to create synchronization: ${getErrorMessage(error)}`)
  }
}
