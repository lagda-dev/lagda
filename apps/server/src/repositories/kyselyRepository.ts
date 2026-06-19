import { createDatabase } from "@lagda/db"
import type { Queue } from "@lagda/jobs"
import { SYNC_DIRECTORY_JOB } from "@lagda/jobs"
import { getErrorMessage } from "../infrastructure/getErrorMessage"
import { fetchLimitFor, toPage } from "../infrastructure/pagination"
import type { Page, PaginationQuery } from "../infrastructure/pagination"
import { recordQuery } from "../infrastructure/queryCounter"
import type {
  AssignmentRecord,
  AuditEventRecord,
  CreateSyncRunInput,
  DepartmentRecord,
  DeploymentRecord,
  EmployeeRecord,
  EntityRecord,
  OrganizationRecord,
  Repository,
  RoleRecord,
  SyncEnqueuer,
  SyncRunRecord,
  TemplateRecord,
} from "./types"

// The typed Kysely client, derived from `@lagda/db`'s factory so the server needs no direct `kysely`
// dependency — the db package owns that wiring and exposes the typed client through its return type.
type LagdaDatabase = ReturnType<typeof createDatabase>

// Kysely-backed implementation of the data-access contract, the only place the public API touches
// Postgres. Excluded from coverage in `vitest.config.ts`: it requires a live database and is verified
// by integration tests, while handlers are unit-tested against the mock repository. Every list is
// cursor-paginated on `id` (keyset) so no query is unbounded (§5), and every query is counted for the
// N+1 guard.

const ROLE_NAMES: readonly RoleRecord[] = [{ name: "owner" }, { name: "admin" }, { name: "user" }]

// Build a keyset-paginated list over a table that has an org-scoping column reachable from `org_id`.
// Returns one extra row so the page envelope can derive `nextCursor` without a count query.
const paginate = async <TItem>(
  query: PaginationQuery,
  runRows: (limit: number, cursor: string | undefined) => Promise<TItem[]>,
  toCursor: (item: TItem) => string,
): Promise<Page<TItem>> => {
  recordQuery()
  const rows = await runRows(fetchLimitFor(query.limit), query.cursor)
  return toPage(rows, query.limit, toCursor)
}

export const createKyselyRepository = (db: LagdaDatabase): Repository => {
  const listOrganizations = (orgId: string, query: PaginationQuery): Promise<Page<OrganizationRecord>> =>
    paginate(
      query,
      async (limit, cursor) => {
        let builder = db.selectFrom("organizations").select(["id", "name", "slug"]).where("id", "=", orgId).orderBy("id").limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        return builder.execute()
      },
      (org) => org.id,
    )

  const getOrganization = async (orgId: string, id: string): Promise<OrganizationRecord | null> => {
    if (id !== orgId) return null
    recordQuery()
    const row = await db.selectFrom("organizations").select(["id", "name", "slug"]).where("id", "=", id).executeTakeFirst()
    return row ?? null
  }

  const listEntities = (orgId: string, query: PaginationQuery): Promise<Page<EntityRecord>> =>
    paginate(
      query,
      async (limit, cursor) => {
        let builder = db
          .selectFrom("entities")
          .select(["id", "org_id as organizationId", "name", "slug"])
          .where("org_id", "=", orgId)
          .orderBy("id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        return builder.execute()
      },
      (entity) => entity.id,
    )

  const getEntity = async (orgId: string, id: string): Promise<EntityRecord | null> => {
    recordQuery()
    const row = await db
      .selectFrom("entities")
      .select(["id", "org_id as organizationId", "name", "slug"])
      .where("id", "=", id)
      .where("org_id", "=", orgId)
      .executeTakeFirst()
    return row ?? null
  }

  const listEmployees = (orgId: string, query: PaginationQuery): Promise<Page<EmployeeRecord>> =>
    paginate(
      query,
      async (limit, cursor) => {
        let builder = db
          .selectFrom("employees")
          .innerJoin("entities", "entities.id", "employees.entity_id")
          .select([
            "employees.id as id",
            "employees.entity_id as entityId",
            "employees.email as email",
            "employees.first_name as firstName",
            "employees.last_name as lastName",
            "employees.department as department",
            "employees.job_title as jobTitle",
          ])
          .where("entities.org_id", "=", orgId)
          .orderBy("employees.id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("employees.id", ">", cursor)
        return builder.execute()
      },
      (employee) => employee.id,
    )

  const getEmployee = async (orgId: string, id: string): Promise<EmployeeRecord | null> => {
    recordQuery()
    const row = await db
      .selectFrom("employees")
      .innerJoin("entities", "entities.id", "employees.entity_id")
      .select([
        "employees.id as id",
        "employees.entity_id as entityId",
        "employees.email as email",
        "employees.first_name as firstName",
        "employees.last_name as lastName",
        "employees.department as department",
        "employees.job_title as jobTitle",
      ])
      .where("employees.id", "=", id)
      .where("entities.org_id", "=", orgId)
      .executeTakeFirst()
    return row ?? null
  }

  const listTemplates = (orgId: string, query: PaginationQuery): Promise<Page<TemplateRecord>> =>
    paginate(
      query,
      async (limit, cursor) => {
        let builder = db
          .selectFrom("templates")
          .innerJoin("entities", "entities.id", "templates.entity_id")
          .select(["templates.id as id", "templates.entity_id as entityId", "templates.name as name"])
          .where("entities.org_id", "=", orgId)
          .orderBy("templates.id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("templates.id", ">", cursor)
        return builder.execute()
      },
      (template) => template.id,
    )

  const getTemplate = async (orgId: string, id: string): Promise<TemplateRecord | null> => {
    recordQuery()
    const row = await db
      .selectFrom("templates")
      .innerJoin("entities", "entities.id", "templates.entity_id")
      .select(["templates.id as id", "templates.entity_id as entityId", "templates.name as name"])
      .where("templates.id", "=", id)
      .where("entities.org_id", "=", orgId)
      .executeTakeFirst()
    return row ?? null
  }

  const listAssignments = (orgId: string, query: PaginationQuery): Promise<Page<AssignmentRecord>> =>
    paginate(
      query,
      async (limit, cursor) => {
        let builder = db
          .selectFrom("assignments")
          .innerJoin("entities", "entities.id", "assignments.entity_id")
          .select(["assignments.id as id", "assignments.entity_id as entityId", "assignments.template_id as templateId", "assignments.target as target"])
          .where("entities.org_id", "=", orgId)
          .orderBy("assignments.id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("assignments.id", ">", cursor)
        return builder.execute()
      },
      (assignment) => assignment.id,
    ).then((page) => ({ ...page, data: page.data.map((row) => ({ ...row, target: row.target as Record<string, unknown> })) }))

  const getAssignment = async (orgId: string, id: string): Promise<AssignmentRecord | null> => {
    recordQuery()
    const row = await db
      .selectFrom("assignments")
      .innerJoin("entities", "entities.id", "assignments.entity_id")
      .select(["assignments.id as id", "assignments.entity_id as entityId", "assignments.template_id as templateId", "assignments.target as target"])
      .where("assignments.id", "=", id)
      .where("entities.org_id", "=", orgId)
      .executeTakeFirst()
    return row === undefined ? null : { ...row, target: row.target as Record<string, unknown> }
  }

  const listDepartments = (orgId: string, query: PaginationQuery): Promise<Page<DepartmentRecord>> =>
    paginate(
      query,
      async (limit, cursor) => {
        let builder = db
          .selectFrom("employees")
          .innerJoin("entities", "entities.id", "employees.entity_id")
          .select("employees.department as name")
          .distinct()
          .where("entities.org_id", "=", orgId)
          .where("employees.department", "is not", null)
          .orderBy("employees.department")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("employees.department", ">", cursor)
        const rows = await builder.execute()
        return rows.map((row) => ({ name: row.name ?? "" }))
      },
      (department) => department.name,
    )

  const listRoles = async (_orgId: string, query: PaginationQuery): Promise<Page<RoleRecord>> => toPage(ROLE_NAMES, query.limit, (role) => role.name)

  const listAuditEvents = (orgId: string, query: PaginationQuery): Promise<Page<AuditEventRecord>> =>
    paginate(
      query,
      async (limit, cursor) => {
        let builder = db
          .selectFrom("audit_log")
          .select(["id", "actor", "action", "target", "created_at"])
          .where("org_id", "=", orgId)
          .orderBy("id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        const rows = await builder.execute()
        return rows.map((row) => ({ id: row.id, actor: row.actor, action: row.action, target: row.target, createdAt: row.created_at.toISOString() }))
      },
      (event) => event.id,
    )

  const listSyncRuns = (orgId: string, query: PaginationQuery): Promise<Page<SyncRunRecord>> =>
    paginate(
      query,
      async (limit, cursor) => {
        let builder = db
          .selectFrom("sync_runs")
          .select(["id", "org_id", "status", "template_id", "counts", "created_at"])
          .where("org_id", "=", orgId)
          .orderBy("id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        const rows = await builder.execute()
        return rows.map((row) => ({
          id: row.id,
          organizationId: row.org_id,
          status: row.status,
          templateId: row.template_id,
          counts: row.counts as Record<string, number>,
          createdAt: row.created_at.toISOString(),
        }))
      },
      (run) => run.id,
    )

  const getSyncRun = async (orgId: string, id: string): Promise<SyncRunRecord | null> => {
    recordQuery()
    const row = await db
      .selectFrom("sync_runs")
      .select(["id", "org_id", "status", "template_id", "counts", "created_at"])
      .where("id", "=", id)
      .where("org_id", "=", orgId)
      .executeTakeFirst()
    if (row === undefined) return null
    return {
      id: row.id,
      organizationId: row.org_id,
      status: row.status,
      templateId: row.template_id,
      counts: row.counts as Record<string, number>,
      createdAt: row.created_at.toISOString(),
    }
  }

  const createSyncRun = async (input: CreateSyncRunInput): Promise<SyncRunRecord> => {
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
        .returning(["id", "org_id", "status", "template_id", "counts", "created_at"])
        .executeTakeFirstOrThrow()
      return {
        id: row.id,
        organizationId: row.org_id,
        status: row.status,
        templateId: row.template_id,
        counts: row.counts as Record<string, number>,
        createdAt: row.created_at.toISOString(),
      }
    } catch (error) {
      throw new Error(`Failed to persist sync run: ${getErrorMessage(error)}`)
    }
  }

  const cancelSyncRun = async (orgId: string, id: string): Promise<SyncRunRecord | null> => {
    recordQuery()
    const row = await db
      .updateTable("sync_runs")
      .set({ status: "cancelled" })
      .where("id", "=", id)
      .where("org_id", "=", orgId)
      .returning(["id", "org_id", "status", "template_id", "counts", "created_at"])
      .executeTakeFirst()
    if (row === undefined) return null
    return {
      id: row.id,
      organizationId: row.org_id,
      status: row.status,
      templateId: row.template_id,
      counts: row.counts as Record<string, number>,
      createdAt: row.created_at.toISOString(),
    }
  }

  const listDeployments = (orgId: string, syncRunId: string, query: PaginationQuery): Promise<Page<DeploymentRecord>> =>
    paginate(
      query,
      async (limit, cursor) => {
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
      (deployment) => deployment.id,
    )

  return {
    listOrganizations,
    getOrganization,
    listEntities,
    getEntity,
    listEmployees,
    getEmployee,
    listTemplates,
    getTemplate,
    listAssignments,
    getAssignment,
    listDepartments,
    listRoles,
    listAuditEvents,
    listSyncRuns,
    getSyncRun,
    createSyncRun,
    cancelSyncRun,
    listDeployments,
  }
}

// The job enqueuer backed by the pg-boss queue. Enqueues the directory sync job that fans out one
// deploy job per employee (§jobs). Excluded from coverage alongside the repository.
export const createQueueEnqueuer = (queue: Queue): SyncEnqueuer => ({
  enqueueDirectorySync: async (input: { organizationId: string; entityId: string; syncRunId: string }): Promise<void> => {
    try {
      await queue.enqueue(SYNC_DIRECTORY_JOB, input)
    } catch (error) {
      throw new Error(`Failed to enqueue directory sync for run ${input.syncRunId}: ${getErrorMessage(error)}`)
    }
  },
})
