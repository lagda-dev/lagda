import { cancelSyncRun } from "./cancelSyncRun"
import { createSyncRun } from "./createSyncRun"
import { getSyncRun } from "./getSyncRun"
import { listDeployments } from "./listDeployments"
import { listSyncRuns } from "./listSyncRuns"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Assembly: synchronization runs + their per-employee deployments.
export const createSynchronizationsRepository = (db: LagdaDatabase, paginate: Paginate) => ({
  listSyncRuns: listSyncRuns(db, paginate),
  getSyncRun: getSyncRun(db),
  createSyncRun: createSyncRun(db),
  cancelSyncRun: cancelSyncRun(db),
  listDeployments: listDeployments(db, paginate),
})
