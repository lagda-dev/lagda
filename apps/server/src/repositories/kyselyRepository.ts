import { createDatabase } from "@lagda/db"
import type { Queue } from "@lagda/jobs"
import { SYNC_DIRECTORY_JOB } from "@lagda/jobs"
import type { DbQuerySample } from "@lagda/observability"
import { getErrorMessage } from "../infrastructure/getErrorMessage"
import { fetchLimitFor, toPage } from "../infrastructure/pagination"
import type { Page, PaginationQuery } from "../infrastructure/pagination"
import { recordQuery } from "../infrastructure/queryCounter"
import type {
  AssignmentRecord,
  AuditEventRecord,
  CreateAssignmentInput,
  CreateEntityInput,
  CreateSyncRunInput,
  CreateTemplateInput,
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
  UpdateEntityInput,
  UpdateOrganizationInput,
  UpdateTemplateInput,
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

const MILLISECONDS_PER_SECOND = 1000

// An optional recorder for `db_query_duration_seconds` (§9). Defaults to a no-op so the repository
// works without observability wired (tests, integration). `server.ts` passes the real recorder.
type RecordDbQuery = (sample: DbQuerySample) => void
const noopRecordDbQuery: RecordDbQuery = () => undefined

// The service identity stamped on DB-query timing samples.
const SERVICE_NAME = "lagda-server"

// The inputs to a keyset-paginated list: the logical `operation` name (for the DB-latency metric),
// the validated pagination query, the row fetcher, and how to derive a cursor from a row.
type PaginateInput<TItem> = {
  operation: string
  query: PaginationQuery
  runRows: (limit: number, cursor: string | undefined) => Promise<TItem[]>
  toCursor: (item: TItem) => string
}

// Build a keyset-paginated list over a table that has an org-scoping column reachable from `org_id`.
// Returns one extra row so the page envelope can derive `nextCursor` without a count query. Times the
// list query under `operation` for the DB-latency dashboard (the dominant query path, §9 best-effort).
const buildPaginate =
  (recordDbQuery: RecordDbQuery) =>
  async <TItem>({ operation, query, runRows, toCursor }: PaginateInput<TItem>): Promise<Page<TItem>> => {
    recordQuery()
    const startedAt = performance.now()
    const rows = await runRows(fetchLimitFor(query.limit), query.cursor)
    recordDbQuery({ service: SERVICE_NAME, operation, durationSeconds: (performance.now() - startedAt) / MILLISECONDS_PER_SECOND })
    return toPage(rows, query.limit, toCursor)
  }

export const createKyselyRepository = (db: LagdaDatabase, recordDbQuery: RecordDbQuery = noopRecordDbQuery): Repository => {
  const paginate = buildPaginate(recordDbQuery)

  const listOrganizations = (orgId: string, query: PaginationQuery): Promise<Page<OrganizationRecord>> =>
    paginate({
      operation: "listOrganizations",
      query,
      runRows: async (limit, cursor) => {
        let builder = db.selectFrom("organizations").select(["id", "name", "slug"]).where("id", "=", orgId).orderBy("id").limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        return builder.execute()
      },
      toCursor: (org) => org.id,
    })

  const getOrganization = async (orgId: string, id: string): Promise<OrganizationRecord | null> => {
    if (id !== orgId) return null
    recordQuery()
    const row = await db.selectFrom("organizations").select(["id", "name", "slug"]).where("id", "=", id).executeTakeFirst()
    return row ?? null
  }

  // Update the caller's own org (settings/name). The `id !== orgId` guard means one tenant can never
  // mutate another's organization even with a forged id. Only provided fields change.
  const updateOrganization = async (input: UpdateOrganizationInput): Promise<OrganizationRecord | null> => {
    if (input.id !== input.orgId) return null
    recordQuery()
    try {
      const changes = input.name === undefined ? {} : { name: input.name }
      const row = await db.updateTable("organizations").set(changes).where("id", "=", input.id).returning(["id", "name", "slug"]).executeTakeFirst()
      return row ?? null
    } catch (error) {
      throw new Error(`Failed to update organization ${input.id}: ${getErrorMessage(error)}`)
    }
  }

  const listEntities = (orgId: string, query: PaginationQuery): Promise<Page<EntityRecord>> =>
    paginate({
      operation: "listEntities",
      query,
      runRows: async (limit, cursor) => {
        let builder = db
          .selectFrom("entities")
          .select(["id", "org_id as organizationId", "name", "slug"])
          .where("org_id", "=", orgId)
          .orderBy("id")
          .limit(limit)
        if (cursor !== undefined) builder = builder.where("id", ">", cursor)
        return builder.execute()
      },
      toCursor: (entity) => entity.id,
    })

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

  // Create an entity under the caller's org. `org_id` is taken from the trusted claims, never the
  // body, so the new entity always lands in the caller's tenant.
  const createEntity = async (input: CreateEntityInput): Promise<EntityRecord> => {
    recordQuery()
    try {
      const row = await db
        .insertInto("entities")
        .values({ org_id: input.orgId, name: input.name, slug: input.slug, settings: JSON.stringify({}) })
        .returning(["id", "org_id as organizationId", "name", "slug"])
        .executeTakeFirstOrThrow()
      return row
    } catch (error) {
      throw new Error(`Failed to create entity: ${getErrorMessage(error)}`)
    }
  }

  // Update an entity scoped to the caller's org; a row outside the tenant matches nothing and returns
  // null (a 404). Only provided fields change.
  const updateEntity = async (input: UpdateEntityInput): Promise<EntityRecord | null> => {
    recordQuery()
    try {
      const withName = input.name === undefined ? {} : { name: input.name }
      const changes = input.slug === undefined ? withName : { ...withName, slug: input.slug }
      const row = await db
        .updateTable("entities")
        .set(changes)
        .where("id", "=", input.id)
        .where("org_id", "=", input.orgId)
        .returning(["id", "org_id as organizationId", "name", "slug"])
        .executeTakeFirst()
      return row ?? null
    } catch (error) {
      throw new Error(`Failed to update entity ${input.id}: ${getErrorMessage(error)}`)
    }
  }

  const listEmployees = (orgId: string, query: PaginationQuery): Promise<Page<EmployeeRecord>> =>
    paginate({
      operation: "listEmployees",
      query,
      runRows: async (limit, cursor) => {
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
      toCursor: (employee) => employee.id,
    })

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
    paginate({
      operation: "listTemplates",
      query,
      runRows: async (limit, cursor) => {
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
      toCursor: (template) => template.id,
    })

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

  // Confirm an entity belongs to the caller's org before a write references it, so a forged
  // `entityId` from another tenant cannot be targeted. Returns true when the entity is in the org.
  const entityBelongsToOrg = async (orgId: string, entityId: string): Promise<boolean> => {
    recordQuery()
    const row = await db.selectFrom("entities").select("id").where("id", "=", entityId).where("org_id", "=", orgId).executeTakeFirst()
    return row !== undefined
  }

  // Create a template under an entity the caller's org owns. When the entity is not in the tenant we
  // return null (a 404) rather than inserting an orphan row in another org.
  const createTemplate = async (input: CreateTemplateInput): Promise<TemplateRecord | null> => {
    const isOwned = await entityBelongsToOrg(input.orgId, input.entityId)
    if (!isOwned) return null
    recordQuery()
    try {
      const row = await db
        .insertInto("templates")
        .values({ entity_id: input.entityId, name: input.name, mjml_source: input.mjmlSource })
        .returning(["id", "entity_id as entityId", "name"])
        .executeTakeFirstOrThrow()
      return row
    } catch (error) {
      throw new Error(`Failed to create template: ${getErrorMessage(error)}`)
    }
  }

  // Update a template scoped to the caller's org via its entity. A subquery restricts the matched row
  // to entities in the tenant, so a template in another org matches nothing and returns null (404).
  const updateTemplate = async (input: UpdateTemplateInput): Promise<TemplateRecord | null> => {
    recordQuery()
    try {
      const withName = input.name === undefined ? {} : { name: input.name }
      const changes = input.mjmlSource === undefined ? withName : { ...withName, mjml_source: input.mjmlSource }
      const ownedEntityIds = db.selectFrom("entities").select("id").where("org_id", "=", input.orgId)
      const row = await db
        .updateTable("templates")
        .set(changes)
        .where("id", "=", input.id)
        .where("entity_id", "in", ownedEntityIds)
        .returning(["id", "entity_id as entityId", "name"])
        .executeTakeFirst()
      return row ?? null
    } catch (error) {
      throw new Error(`Failed to update template ${input.id}: ${getErrorMessage(error)}`)
    }
  }

  // Delete a template scoped to the caller's org via its entity. Reports whether a row was removed so
  // the handler can answer 204 (deleted) or 404 (nothing matched in this tenant).
  const deleteTemplate = async (orgId: string, id: string): Promise<boolean> => {
    recordQuery()
    try {
      const ownedEntityIds = db.selectFrom("entities").select("id").where("org_id", "=", orgId)
      const result = await db.deleteFrom("templates").where("id", "=", id).where("entity_id", "in", ownedEntityIds).executeTakeFirst()
      return result.numDeletedRows > 0n
    } catch (error) {
      throw new Error(`Failed to delete template ${id}: ${getErrorMessage(error)}`)
    }
  }

  const listAssignments = (orgId: string, query: PaginationQuery): Promise<Page<AssignmentRecord>> =>
    paginate({
      operation: "listAssignments",
      query,
      runRows: async (limit, cursor) => {
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
      toCursor: (assignment) => assignment.id,
    }).then((page) => ({ ...page, data: page.data.map((row) => ({ ...row, target: row.target as Record<string, unknown> })) }))

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

  // Confirm a template belongs to the caller's org (via its entity) before an assignment references
  // it, mirroring the entity ownership check. Returns true when the template is in the org.
  const templateBelongsToOrg = async (orgId: string, templateId: string): Promise<boolean> => {
    recordQuery()
    const row = await db
      .selectFrom("templates")
      .innerJoin("entities", "entities.id", "templates.entity_id")
      .select("templates.id as id")
      .where("templates.id", "=", templateId)
      .where("entities.org_id", "=", orgId)
      .executeTakeFirst()
    return row !== undefined
  }

  // Create an assignment binding a template to a target under an entity, both owned by the caller's
  // org. A forged entity or template from another tenant returns null (a 404) instead of inserting.
  const createAssignment = async (input: CreateAssignmentInput): Promise<AssignmentRecord | null> => {
    const isEntityOwned = await entityBelongsToOrg(input.orgId, input.entityId)
    if (!isEntityOwned) return null
    const isTemplateOwned = await templateBelongsToOrg(input.orgId, input.templateId)
    if (!isTemplateOwned) return null
    recordQuery()
    try {
      const row = await db
        .insertInto("assignments")
        .values({ entity_id: input.entityId, template_id: input.templateId, target: JSON.stringify(input.target) })
        .returning(["id", "entity_id as entityId", "template_id as templateId", "target"])
        .executeTakeFirstOrThrow()
      return { ...row, target: row.target as Record<string, unknown> }
    } catch (error) {
      throw new Error(`Failed to create assignment: ${getErrorMessage(error)}`)
    }
  }

  // Delete an assignment scoped to the caller's org via its entity. Reports whether a row was removed
  // so the handler answers 204 (deleted) or 404 (nothing matched in this tenant).
  const deleteAssignment = async (orgId: string, id: string): Promise<boolean> => {
    recordQuery()
    try {
      const ownedEntityIds = db.selectFrom("entities").select("id").where("org_id", "=", orgId)
      const result = await db.deleteFrom("assignments").where("id", "=", id).where("entity_id", "in", ownedEntityIds).executeTakeFirst()
      return result.numDeletedRows > 0n
    } catch (error) {
      throw new Error(`Failed to delete assignment ${id}: ${getErrorMessage(error)}`)
    }
  }

  const listDepartments = (orgId: string, query: PaginationQuery): Promise<Page<DepartmentRecord>> =>
    paginate({
      operation: "listDepartments",
      query,
      runRows: async (limit, cursor) => {
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
      toCursor: (department) => department.name,
    })

  const listRoles = async (_orgId: string, query: PaginationQuery): Promise<Page<RoleRecord>> => toPage(ROLE_NAMES, query.limit, (role) => role.name)

  const listAuditEvents = (orgId: string, query: PaginationQuery): Promise<Page<AuditEventRecord>> =>
    paginate({
      operation: "listAuditEvents",
      query,
      runRows: async (limit, cursor) => {
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
      toCursor: (event) => event.id,
    })

  const listSyncRuns = (orgId: string, query: PaginationQuery): Promise<Page<SyncRunRecord>> =>
    paginate({
      operation: "listSyncRuns",
      query,
      runRows: async (limit, cursor) => {
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
      toCursor: (run) => run.id,
    })

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

  return {
    listOrganizations,
    getOrganization,
    updateOrganization,
    listEntities,
    getEntity,
    createEntity,
    updateEntity,
    listEmployees,
    getEmployee,
    listTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    listAssignments,
    getAssignment,
    createAssignment,
    deleteAssignment,
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
