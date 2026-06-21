import type { Pool } from "pg"
import { getErrorMessage } from "./getErrorMessage"

// The minimal shape needed to mirror a Better Auth organization into the app schema.
export type AppOrganizationInput = {
  id: string
  name: string
  slug: string
}

// Mirror a Better Auth organization into the application's OWN schema: an `organizations` row that
// shares the SAME id (so a JWT's orgId maps straight onto app data) plus a `Default` entity for
// templates/assignments/employees to attach to. Both inserts are idempotent (on conflict / where not
// exists), so this is safe to call from the first-run seed AND from the organization-create hook that
// fires when a user signs up and creates their own organization.
export const provisionAppOrganization = async (database: Pool, organization: AppOrganizationInput): Promise<void> => {
  try {
    await database.query(`insert into "organizations" (id, name, slug) values ($1, $2, $3) on conflict (id) do nothing`, [
      organization.id,
      organization.name,
      organization.slug,
    ])
    await database.query(
      `insert into "entities" (org_id, name, slug) select $1, 'Default', 'default' where not exists (select 1 from "entities" where org_id = $1)`,
      [organization.id],
    )
  } catch (error) {
    throw new Error(`Failed to provision the app organization: ${getErrorMessage(error)}`)
  }
}
