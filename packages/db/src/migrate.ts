import { promises as fs } from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { getErrorMessage, loadConfig } from "@lagda/core"
import { FileMigrationProvider, Migrator } from "kysely"
import { createDatabase } from "./db"

const MIGRATIONS_DIRECTORY = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations")

const buildMigrator = (database: Awaited<ReturnType<typeof createDatabase>>): Migrator =>
  new Migrator({
    db: database,
    provider: new FileMigrationProvider({ fs, path, migrationFolder: MIGRATIONS_DIRECTORY }),
  })

const reportMigrationResults = (results: Awaited<ReturnType<Migrator["migrateToLatest"]>>["results"]): void => {
  const applied = results ?? []
  const lines = applied.map((result) =>
    result.status === "Error" ? `Failed to apply migration "${result.migrationName}"` : `Applied migration "${result.migrationName}"`,
  )
  if (lines.length > 0) process.stdout.write(`${lines.join("\n")}\n`)
}

// Runs all pending migrations to the latest version against the configured
// database. Invoked via `pnpm migrate` (tsx). Fails fast with a wrapped error so
// a broken migration never leaves the process pretending to have succeeded.
export const migrateToLatest = async (): Promise<void> => {
  const config = loadConfig()
  const database = createDatabase({ DATABASE_URL: config.DATABASE_URL })
  try {
    const migrator = buildMigrator(database)
    const { error, results } = await migrator.migrateToLatest()
    reportMigrationResults(results)
    if (error) throw new Error(getErrorMessage(error))
  } catch (error) {
    throw new Error(`Failed to migrate database to latest: ${getErrorMessage(error)}`)
  } finally {
    await database.destroy()
  }
}

migrateToLatest().catch((error) => {
  process.stderr.write(`${getErrorMessage(error)}\n`)
  process.exitCode = 1
})
