import { getMigrations } from "better-auth/db"
import { auth } from "../better-auth.config"
import { getErrorMessage } from "../src/getErrorMessage"

// Applies the Better Auth schema (user, session, account, verification, jwks, organization, member,
// invitation) to Postgres programmatically — running the migrations directly avoids the interactive
// CLI confirmation prompt, which has no usable non-interactive flag in this Better Auth version and
// would otherwise hang or fail in the container migrate step.
const migrateAuthSchema = async (): Promise<void> => {
  const { runMigrations } = await getMigrations(auth.options)
  await runMigrations()
  process.stdout.write("Applied Better Auth schema\n")
}

migrateAuthSchema().catch((error) => {
  process.stderr.write(`Failed to migrate Better Auth schema: ${getErrorMessage(error)}\n`)
  process.exitCode = 1
})
