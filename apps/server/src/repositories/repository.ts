import type { Page, PaginationQuery } from "../infrastructure/pagination"
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
  RoleRecord,
  SyncRunRecord,
  TemplateRecord,
  UpdateEntityInput,
  UpdateOrganizationInput,
  UpdateTemplateInput,
} from "./types"

// The data-access API the routes are written against (kept apart from `types.ts`, which holds the
// record/input shapes): handlers receive a `Repository` rather than a live DB, so they are unit-testable
// against a mock (§testability). The Kysely-backed implementation is assembled in `kyselyRepository.ts`.
// Lists take a validated `PaginationQuery` and return a `Page`; detail reads return `null` when the
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
