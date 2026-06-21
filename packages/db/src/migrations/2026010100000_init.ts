import { type Kysely, sql } from "kysely"

// Initial application schema: organizations, entities, employees, templates,
// assignments, sync_runs, deployments, audit_log, notification_channels,
// directory_connections. Every column used in a filter/sort/FK join gets an
// index (§5). Postgres is the default and only fully-supported dialect, so this
// migration targets Postgres types (uuid, jsonb, timestamptz).

const createOrganizations = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("organizations")
    // Text id, not a generated UUID: the app organization shares the identity of the Better Auth
    // organization (a nanoid), so a JWT's orgId maps directly onto these rows. The seed inserts it.
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("slug", "text", (col) => col.notNull().unique())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
}

const createEntities = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("entities")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("org_id", "text", (col) => col.notNull().references("organizations.id").onDelete("cascade"))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("slug", "text", (col) => col.notNull())
    .addColumn("settings", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex("entities_org_id_index").on("entities").column("org_id").execute()
}

const createEmployees = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("employees")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("entity_id", "uuid", (col) => col.notNull().references("entities.id").onDelete("cascade"))
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("first_name", "text")
    .addColumn("last_name", "text")
    .addColumn("department", "text")
    .addColumn("job_title", "text")
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex("employees_entity_id_index").on("employees").column("entity_id").execute()
  await db.schema.createIndex("employees_email_index").on("employees").column("email").execute()
  await db.schema.createIndex("employees_department_index").on("employees").column("department").execute()
}

const createTemplates = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("templates")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("entity_id", "uuid", (col) => col.notNull().references("entities.id").onDelete("cascade"))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("mjml_source", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex("templates_entity_id_index").on("templates").column("entity_id").execute()
}

const createAssignments = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("assignments")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("entity_id", "uuid", (col) => col.notNull().references("entities.id").onDelete("cascade"))
    .addColumn("template_id", "uuid", (col) => col.notNull().references("templates.id").onDelete("cascade"))
    .addColumn("target", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex("assignments_entity_id_index").on("assignments").column("entity_id").execute()
  await db.schema.createIndex("assignments_template_id_index").on("assignments").column("template_id").execute()
}

const createSyncRuns = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("sync_runs")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("org_id", "text", (col) => col.notNull().references("organizations.id").onDelete("cascade"))
    .addColumn("target", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn("template_id", "uuid", (col) => col.references("templates.id").onDelete("set null"))
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("counts", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    // Text, not uuid: this holds the Better Auth user id (a nanoid) from the JWT `sub`, the same
    // identity scheme as organizations.id — never a generated uuid.
    .addColumn("created_by", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex("sync_runs_org_id_index").on("sync_runs").column("org_id").execute()
  await db.schema.createIndex("sync_runs_template_id_index").on("sync_runs").column("template_id").execute()
  await db.schema.createIndex("sync_runs_status_index").on("sync_runs").column("status").execute()
  await db.schema.createIndex("sync_runs_created_at_index").on("sync_runs").column("created_at").execute()
}

const createDeployments = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("deployments")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("sync_run_id", "uuid", (col) => col.notNull().references("sync_runs.id").onDelete("cascade"))
    .addColumn("employee_id", "uuid", (col) => col.notNull().references("employees.id").onDelete("cascade"))
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("error", "text")
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex("deployments_sync_run_id_index").on("deployments").column("sync_run_id").execute()
  await db.schema.createIndex("deployments_employee_id_index").on("deployments").column("employee_id").execute()
  await db.schema.createIndex("deployments_status_index").on("deployments").column("status").execute()
}

const createAuditLog = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("audit_log")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("org_id", "text", (col) => col.notNull().references("organizations.id").onDelete("cascade"))
    .addColumn("actor", "text", (col) => col.notNull())
    .addColumn("action", "text", (col) => col.notNull())
    .addColumn("target", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex("audit_log_org_id_index").on("audit_log").column("org_id").execute()
  await db.schema.createIndex("audit_log_action_index").on("audit_log").column("action").execute()
  await db.schema.createIndex("audit_log_created_at_index").on("audit_log").column("created_at").execute()
}

const createNotificationChannels = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("notification_channels")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("org_id", "text", (col) => col.notNull().references("organizations.id").onDelete("cascade"))
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("encrypted_config", "text", (col) => col.notNull())
    .addColumn("subscriptions", "jsonb", (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex("notification_channels_org_id_index").on("notification_channels").column("org_id").execute()
  await db.schema.createIndex("notification_channels_type_index").on("notification_channels").column("type").execute()
}

const createDirectoryConnections = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("directory_connections")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("org_id", "text", (col) => col.notNull().references("organizations.id").onDelete("cascade"))
    .addColumn("provider", "text", (col) => col.notNull())
    .addColumn("encrypted_credentials", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex("directory_connections_org_id_index").on("directory_connections").column("org_id").execute()
  await db.schema.createIndex("directory_connections_provider_index").on("directory_connections").column("provider").execute()
}

// Tables are created parent-first so foreign keys always reference an existing
// table; the reverse order is used in `down`.
export const up = async (db: Kysely<unknown>): Promise<void> => {
  await createOrganizations(db)
  await createEntities(db)
  await createEmployees(db)
  await createTemplates(db)
  await createAssignments(db)
  await createSyncRuns(db)
  await createDeployments(db)
  await createAuditLog(db)
  await createNotificationChannels(db)
  await createDirectoryConnections(db)
}

export const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable("directory_connections").ifExists().execute()
  await db.schema.dropTable("notification_channels").ifExists().execute()
  await db.schema.dropTable("audit_log").ifExists().execute()
  await db.schema.dropTable("deployments").ifExists().execute()
  await db.schema.dropTable("sync_runs").ifExists().execute()
  await db.schema.dropTable("assignments").ifExists().execute()
  await db.schema.dropTable("templates").ifExists().execute()
  await db.schema.dropTable("employees").ifExists().execute()
  await db.schema.dropTable("entities").ifExists().execute()
  await db.schema.dropTable("organizations").ifExists().execute()
}
