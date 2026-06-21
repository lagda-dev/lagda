import { Pool } from "pg"
import { createAuth } from "../src/auth"
import { getErrorMessage } from "../src/getErrorMessage"
import { loadAuthConfig } from "../src/loadAuthConfig"
import { provisionAppOrganization } from "../src/provisionAppOrganization"

// Zero-config first-run seed (Phase B, Wave 2). Creates the first organization and its owner user so a
// fresh `docker compose up` lands on a usable instance with no manual setup. It is fully IDEMPOTENT:
// if an organization already exists, it does nothing — re-running never produces a duplicate org/owner.
//
// SECURITY — these are DEV-ONLY default credentials. They are intentionally well-known so the stack
// boots with zero config. Change them on any real deployment via the env overrides documented below.
// TODO(security): rotate SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD before exposing this instance publicly.

const DEFAULT_OWNER_EMAIL = "owner@lagda.local"
const DEFAULT_OWNER_PASSWORD = "lagda-dev-owner"
const DEFAULT_OWNER_NAME = "Lagda Owner"
const DEFAULT_ORGANIZATION_NAME = "Lagda"
const DEFAULT_ORGANIZATION_SLUG = "lagda"

type SeedCredentials = {
  ownerEmail: string
  ownerPassword: string
  ownerName: string
  organizationName: string
  organizationSlug: string
}

// Read the seed inputs from the environment, falling back to the documented dev-only defaults so the
// happy path needs zero config while a real deployment can override every value.
const loadSeedCredentials = (env: NodeJS.ProcessEnv = process.env): SeedCredentials => ({
  ownerEmail: env.SEED_OWNER_EMAIL ?? DEFAULT_OWNER_EMAIL,
  ownerPassword: env.SEED_OWNER_PASSWORD ?? DEFAULT_OWNER_PASSWORD,
  ownerName: env.SEED_OWNER_NAME ?? DEFAULT_OWNER_NAME,
  organizationName: env.SEED_ORGANIZATION_NAME ?? DEFAULT_ORGANIZATION_NAME,
  organizationSlug: env.SEED_ORGANIZATION_SLUG ?? DEFAULT_ORGANIZATION_SLUG,
})

// The idempotency guard: if any organization already exists, the instance is already seeded.
const hasExistingOrganization = async (pool: Pool): Promise<boolean> => {
  try {
    const result = await pool.query<{ count: string }>(`select count(*)::text as count from "organization"`)
    const count = Number(result.rows[0]?.count ?? "0")
    return count > 0
  } catch (error) {
    throw new Error(`Failed to check for an existing organization: ${getErrorMessage(error)}`)
  }
}

// Create the owner account. A pre-existing account (email already taken) is treated as success so the
// step stays idempotent across partial re-runs. Email verification is required to sign in, so the next
// step marks the owner verified directly — there is no inbox in the zero-config path.
const ensureOwnerAccount = async (auth: ReturnType<typeof createAuth>, credentials: SeedCredentials): Promise<void> => {
  const { ownerEmail, ownerPassword, ownerName } = credentials
  try {
    await auth.api.signUpEmail({ body: { email: ownerEmail, password: ownerPassword, name: ownerName } })
  } catch (error) {
    const message = getErrorMessage(error)
    const alreadyExists = message.toLowerCase().includes("exist") || message.toLowerCase().includes("already")
    if (!alreadyExists) {
      throw new Error(`Failed to create the owner account: ${message}`)
    }
  }
}

// Mark the owner's email verified directly in Postgres so the zero-config seed can sign in without a
// real email transport (the OTP-required invariant only blocks interactive logins). Idempotent UPDATE.
const markOwnerVerified = async (pool: Pool, ownerEmail: string): Promise<void> => {
  try {
    await pool.query(`update "user" set "emailVerified" = true where "email" = $1`, [ownerEmail])
  } catch (error) {
    throw new Error(`Failed to mark the owner as verified: ${getErrorMessage(error)}`)
  }
}

// Sign the owner in to obtain a session, then create the first organization as that owner. Better Auth's
// organization plugin assigns the creator the `owner` role (creatorRole), which is exactly the §6 rule.
const createFirstOrganization = async (auth: ReturnType<typeof createAuth>, credentials: SeedCredentials): Promise<void> => {
  const { ownerEmail, ownerPassword, organizationName, organizationSlug } = credentials
  try {
    const signIn = await auth.api.signInEmail({ body: { email: ownerEmail, password: ownerPassword } })
    const sessionToken = signIn.token
    if (!sessionToken) {
      throw new Error("owner sign-in returned no session token")
    }
    await auth.api.createOrganization({
      body: { name: organizationName, slug: organizationSlug },
      headers: { authorization: `Bearer ${sessionToken}` },
    })
  } catch (error) {
    throw new Error(`Failed to create the first organization: ${getErrorMessage(error)}`)
  }
}

// Mirror the Better Auth organization into the app's own `organizations` table using the SAME id (read
// back from the auth `organization` row by slug), via the shared idempotent provisioner. The org-create
// hook in auth.ts also provisions on create; this keeps the seed self-sufficient and both are idempotent.
const provisionSeedAppOrganization = async (pool: Pool, credentials: SeedCredentials): Promise<void> => {
  const found = await pool.query<{ id: string }>(`select id from "organization" where slug = $1 limit 1`, [credentials.organizationSlug])
  const [organization] = found.rows
  if (organization === undefined) {
    throw new Error("Failed to provision the app organization: could not resolve the created organization id")
  }
  await provisionAppOrganization(pool, { id: organization.id, name: credentials.organizationName, slug: credentials.organizationSlug })
}

// Orchestrate the seed as a clean checklist: guard, create owner, verify owner, create the org.
const seedFirstOrganization = async (): Promise<void> => {
  const config = loadAuthConfig()
  const auth = createAuth({ databaseUrl: config.databaseUrl, baseUrl: config.baseUrl })
  const pool = new Pool({ connectionString: config.databaseUrl })
  const credentials = loadSeedCredentials()

  try {
    if (await hasExistingOrganization(pool)) {
      process.stdout.write("seed: an organization already exists — nothing to do\n")
      return
    }

    await ensureOwnerAccount(auth, credentials)
    await markOwnerVerified(pool, credentials.ownerEmail)
    await createFirstOrganization(auth, credentials)
    await provisionSeedAppOrganization(pool, credentials)

    process.stdout.write(`seed: created organization "${credentials.organizationName}" with owner ${credentials.ownerEmail}\n`)
  } finally {
    await pool.end()
  }
}

seedFirstOrganization().catch((error) => {
  process.stderr.write(`${getErrorMessage(error)}\n`)
  process.exitCode = 1
})
