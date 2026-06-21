import type { Context } from "hono"
import { getErrorMessage } from "@lagda/core"
import type { SyncRunRecord } from "../../repositories/types"
import { claimsFrom, failOutcome, okOutcome } from "./handlers"
import type { Outcome } from "./handlers"
import type { ApiDependencies } from "./dependencies"

// Cancel a synchronization run (§4). The repository reports one of three outcomes; this maps them to
// the right §4 status: a missing run → 404, a run that is already terminal → 409 (cancelling it would
// corrupt its recorded outcome), and a cancellable run → 200 with the cancelled record.
export const cancelSynchronization = async (ctx: Context, deps: ApiDependencies, id: string): Promise<Outcome<SyncRunRecord>> => {
  const { orgId } = claimsFrom(ctx)
  try {
    const result = await deps.repository.cancelSyncRun(orgId, id)
    if (result.outcome === "not_found") return failOutcome("not_found", "Synchronization not found")
    if (result.outcome === "not_cancellable") return failOutcome("conflict", `Cannot cancel a synchronization that is already ${result.run.status}`)
    return okOutcome(result.run)
  } catch (error) {
    return failOutcome("internal_error", `Failed to cancel synchronization: ${getErrorMessage(error)}`)
  }
}
