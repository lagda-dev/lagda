import type { Page, PaginationQuery } from "../infrastructure/pagination"

// The synchronization run lifecycle, mirrored from the `@lagda/db` schema's `SyncRunStatus`. Inlined
// here (not imported) because the public API contract is the source of truth for the wire shape and
// the db package does not re-export the literal union from its entry point.
export type SyncRunStatus = "pending" | "running" | "succeeded" | "failed" | "cancelled"

// The data-access contract every route handler depends on. Handlers receive a `Repository` rather
// than a live DB, so they are unit-testable against a mock (§testability). The Kysely-backed
// implementation lives in `kyselyRepository.ts` and is excluded from coverage. Domain shapes here
// are the lean projections the public API returns — never raw DB rows.

// --- Domain projections (lean, API-facing) ---

export type OrganizationRecord = {
  id: string
  name: string
  slug: string
}

export type EntityRecord = {
  id: string
  organizationId: string
  name: string
  slug: string
}

export type EmployeeRecord = {
  id: string
  entityId: string
  email: string
  firstName: string | null
  lastName: string | null
  department: string | null
  jobTitle: string | null
}

export type TemplateRecord = {
  id: string
  entityId: string
  name: string
}

export type AssignmentRecord = {
  id: string
  entityId: string
  templateId: string
  target: Record<string, unknown>
}

export type DepartmentRecord = {
  name: string
}

export type RoleRecord = {
  name: string
}

export type AuditEventRecord = {
  id: string
  actor: string
  action: string
  target: string
  createdAt: string
}

export type SyncRunRecord = {
  id: string
  organizationId: string
  status: SyncRunStatus
  templateId: string | null
  counts: Record<string, number>
  createdAt: string
}

export type DeploymentRecord = {
  id: string
  syncRunId: string
  employeeId: string
  status: "pending" | "succeeded" | "failed"
  error: string | null
}

// --- §15 discriminated target selector ---
// A synchronization targets exactly one of: a whole org, one entity, a department within an entity,
// a role, or an explicit list of users. The discriminant `kind` makes the variant unambiguous and
// lets handlers and the data layer narrow safely.
export type SyncTarget =
  | { kind: "org"; organizationId: string }
  | { kind: "entity"; entityId: string }
  | { kind: "department"; entityId: string; department: string }
  | { kind: "role"; entityId: string; role: string }
  | { kind: "users"; entityId: string; userIds: string[] }

// What creating a synchronization needs from the caller. The repository persists a `sync_run` and
// returns its id; the route then enqueues the deploy jobs.
export type CreateSyncRunInput = {
  organizationId: string
  target: SyncTarget
  templateId: string | null
  createdBy: string
}

// --- Write inputs (lean, API-facing) ---
// Each write input carries the caller's `orgId` so the data layer can enforce tenant scoping (a
// template/assignment is reachable only through an entity in the caller's org). `null` results from a
// write mean "not found in this tenant" — the handler turns that into a 404.

// Create a template under an entity the caller's org owns. `mjmlSource` is the MJML body (§4).
export type CreateTemplateInput = {
  orgId: string
  entityId: string
  name: string
  mjmlSource: string
}

// Patch a template's editable fields; only the provided fields change (immutable partial update).
export type UpdateTemplateInput = {
  orgId: string
  id: string
  name?: string
  mjmlSource?: string
}

// Bind a template to a target audience under an entity the caller's org owns.
export type CreateAssignmentInput = {
  orgId: string
  entityId: string
  templateId: string
  target: Record<string, unknown>
}

// Create an entity (brand/business unit) under the caller's org.
export type CreateEntityInput = {
  orgId: string
  name: string
  slug: string
}

// Patch an entity's editable fields; only the provided fields change.
export type UpdateEntityInput = {
  orgId: string
  id: string
  name?: string
  slug?: string
}

// Patch the caller's own organization (settings/name). Scoped to `id === orgId` in the data layer so
// one tenant cannot mutate another.
export type UpdateOrganizationInput = {
  orgId: string
  id: string
  name?: string
}

// --- The contract ---
// Lists take a validated `PaginationQuery` and return a `Page`. Detail reads return `null` when the
// resource does not exist (the handler translates that to a 404 envelope).
export type Repository = {
  listOrganizations: (orgId: string, query: PaginationQuery) => Promise<Page<OrganizationRecord>>
  getOrganization: (orgId: string, id: string) => Promise<OrganizationRecord | null>
  updateOrganization: (input: UpdateOrganizationInput) => Promise<OrganizationRecord | null>

  listEntities: (orgId: string, query: PaginationQuery) => Promise<Page<EntityRecord>>
  getEntity: (orgId: string, id: string) => Promise<EntityRecord | null>
  createEntity: (input: CreateEntityInput) => Promise<EntityRecord>
  updateEntity: (input: UpdateEntityInput) => Promise<EntityRecord | null>

  listEmployees: (orgId: string, query: PaginationQuery) => Promise<Page<EmployeeRecord>>
  getEmployee: (orgId: string, id: string) => Promise<EmployeeRecord | null>

  listTemplates: (orgId: string, query: PaginationQuery) => Promise<Page<TemplateRecord>>
  getTemplate: (orgId: string, id: string) => Promise<TemplateRecord | null>
  createTemplate: (input: CreateTemplateInput) => Promise<TemplateRecord | null>
  updateTemplate: (input: UpdateTemplateInput) => Promise<TemplateRecord | null>
  deleteTemplate: (orgId: string, id: string) => Promise<boolean>

  listAssignments: (orgId: string, query: PaginationQuery) => Promise<Page<AssignmentRecord>>
  getAssignment: (orgId: string, id: string) => Promise<AssignmentRecord | null>
  createAssignment: (input: CreateAssignmentInput) => Promise<AssignmentRecord | null>
  deleteAssignment: (orgId: string, id: string) => Promise<boolean>

  listDepartments: (orgId: string, query: PaginationQuery) => Promise<Page<DepartmentRecord>>
  listRoles: (orgId: string, query: PaginationQuery) => Promise<Page<RoleRecord>>
  listAuditEvents: (orgId: string, query: PaginationQuery) => Promise<Page<AuditEventRecord>>

  listSyncRuns: (orgId: string, query: PaginationQuery) => Promise<Page<SyncRunRecord>>
  getSyncRun: (orgId: string, id: string) => Promise<SyncRunRecord | null>
  createSyncRun: (input: CreateSyncRunInput) => Promise<SyncRunRecord>
  cancelSyncRun: (orgId: string, id: string) => Promise<SyncRunRecord | null>
  listDeployments: (orgId: string, syncRunId: string, query: PaginationQuery) => Promise<Page<DeploymentRecord>>
}

// The job-enqueue surface a synchronization route needs. Injected so the route is decoupled from the
// concrete pg-boss queue and unit-testable with a spy.
export type SyncEnqueuer = {
  enqueueDirectorySync: (input: { organizationId: string; entityId: string; syncRunId: string }) => Promise<void>
}
