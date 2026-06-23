import type { ColumnType, Generated, JSONColumnType } from "kysely"

// Hand-written typed schema for the application database (NOT the auth service
// schema — `apps/auth` owns its own tables via Better Auth). `kysely-codegen`
// can regenerate `database.d.ts` from a live DB; this file is the source of
// truth the rest of the codebase imports until codegen output supersedes it.

// A timestamp the DB fills on insert and we never write by hand.
type CreatedAt = ColumnType<Date, never, never>
// A timestamp the DB fills on insert and refreshes on update.
type UpdatedAt = ColumnType<Date, never, Date | undefined>

export type SyncRunStatus = "pending" | "running" | "succeeded" | "failed" | "cancelled"
export type DeploymentStatus = "pending" | "succeeded" | "failed"
export type NotificationChannelType = "slack" | "email" | "webhook"

export type OrganizationsTable = {
  id: Generated<string>
  name: string
  slug: string
  created_at: CreatedAt
  updated_at: UpdatedAt
}

export type EntitiesTable = {
  id: Generated<string>
  org_id: string
  name: string
  slug: string
  settings: JSONColumnType<Record<string, unknown>>
  created_at: CreatedAt
  updated_at: UpdatedAt
}

export type EmployeesTable = {
  id: Generated<string>
  entity_id: string
  email: string
  first_name: string | null
  last_name: string | null
  department: string | null
  job_title: string | null
  created_at: CreatedAt
  updated_at: UpdatedAt
}

export type TemplatesTable = {
  id: Generated<string>
  entity_id: string
  name: string
  mjml_source: string
  created_at: CreatedAt
  updated_at: UpdatedAt
}

export type AssignmentsTable = {
  id: Generated<string>
  entity_id: string
  template_id: string
  target: JSONColumnType<Record<string, unknown>>
  created_at: CreatedAt
  updated_at: UpdatedAt
}

export type DeploymentsTable = {
  id: Generated<string>
  sync_run_id: string
  employee_id: string
  status: ColumnType<DeploymentStatus, DeploymentStatus, DeploymentStatus>
  error: string | null
  created_at: CreatedAt
  updated_at: UpdatedAt
}

export type SyncRunsTable = {
  id: Generated<string>
  org_id: string
  target: JSONColumnType<Record<string, unknown>>
  template_id: string | null
  status: ColumnType<SyncRunStatus, SyncRunStatus, SyncRunStatus>
  counts: JSONColumnType<Record<string, number>>
  created_by: string
  created_at: CreatedAt
  updated_at: UpdatedAt
}

// Append-only: rows are inserted and never updated or deleted.
export type AuditLogTable = {
  id: Generated<string>
  org_id: string
  actor: string
  action: string
  target: string
  metadata: JSONColumnType<Record<string, unknown>>
  created_at: CreatedAt
}

export type NotificationChannelsTable = {
  id: Generated<string>
  org_id: string
  type: ColumnType<NotificationChannelType, NotificationChannelType, NotificationChannelType>
  encrypted_config: string
  subscriptions: JSONColumnType<string[]>
  created_at: CreatedAt
  updated_at: UpdatedAt
}

export type DirectoryConnectionsTable = {
  id: Generated<string>
  org_id: string
  provider: string
  encrypted_credentials: string
  created_at: CreatedAt
  updated_at: UpdatedAt
}

export type ApplicationTokensTable = {
  // Text id minted in app code (authoritative), not a DB-generated uuid.
  id: string
  org_id: string
  name: string
  scopes: JSONColumnType<string[]>
  hashed_token: string
  created_at: CreatedAt
  // Null until revoked; the revoke path writes the timestamp.
  revoked_at: ColumnType<Date | null, never, Date>
}

export type Database = {
  organizations: OrganizationsTable
  entities: EntitiesTable
  employees: EmployeesTable
  templates: TemplatesTable
  assignments: AssignmentsTable
  deployments: DeploymentsTable
  sync_runs: SyncRunsTable
  audit_log: AuditLogTable
  notification_channels: NotificationChannelsTable
  directory_connections: DirectoryConnectionsTable
  application_tokens: ApplicationTokensTable
}
