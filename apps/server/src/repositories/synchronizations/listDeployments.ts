import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import type { DeploymentRecord } from "../types"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

export const listDeployments =
  (db: LagdaDatabase, paginate: Paginate) =>
  (orgId: string, syncRunId: string, query: PaginationQuery): Promise<Page<DeploymentRecord>> =>
    paginate({
      operation: "listDeployments",
      query,
      runRows: async (limit, cursor) => {
        let builder = db
          .selectFrom("deployments")
          .innerJoin("sync_runs", "sync_runs.id", "deployments.sync_run_id")
          .select([
            "deployments.id as id",
            "deployments.sync_run_id as syncRunId",
            "deployments.employee_id as employeeId",
            "deployments.status as status",
            "deployments.error as error",
          ])
          .where("deployments.sync_run_id", "=", syncRunId)
          .where("sync_runs.org_id", "=", orgId)
          .orderBy("deployments.id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("deployments.id", ">", cursor)
        return builder.execute()
      },
      toCursor: (deployment) => deployment.id,
    })
