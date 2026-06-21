import type { Permission, TokenScope } from "@lagda/auth-contract"
import type { SyncRunOutcome } from "@lagda/observability"
import type { TokenVerifier } from "../../middleware/authContext"
import type { Repository, SyncEnqueuer } from "../../repositories/repository"
import { requirePermission } from "../../middleware/requirePermission"

// Everything the v1 routes need to be wired without reaching for globals (§DI): the data-access
// repository, the job enqueuer, the token verifier the RBAC middleware uses, and an optional sync-run
// outcome recorder (§9 observability). The app builds this once and threads it into each resource's
// route factory.
export type ApiDependencies = {
  repository: Repository
  enqueuer: SyncEnqueuer
  verifyToken: TokenVerifier
  logger?: (entry: { operation: string; reason: string }) => void
  recordSyncRun?: (outcome: SyncRunOutcome) => void
}

// A small helper that binds `requirePermission` to the shared verifier + logger so each route only
// declares the permission (and optional public-API scope) it demands. Keeps the route files free of
// repeated wiring.
export const guard = (deps: ApiDependencies, permission: Permission, scope?: TokenScope) =>
  requirePermission({ verifyToken: deps.verifyToken, permission, scope, logger: deps.logger })
