import { Kysely, PostgresDialect } from "kysely"
import pg from "pg"
import { POSTGRES_STATEMENT_TIMEOUT_MS, requireDatabaseUrl } from "./connection"
import { getErrorMessage } from "./infrastructure/getErrorMessage"
import type { Database } from "./schema"

export type { Database } from "./schema"
export { POSTGRES_STATEMENT_TIMEOUT_MS, requireDatabaseUrl } from "./connection"

export type CreateDatabaseConfig = {
  DATABASE_URL?: string
}

// Builds the typed Kysely client backed by Postgres — the only supported database.
// The connection string comes from DATABASE_URL and the pool sets
// statement_timeout=1000ms to enforce the §5 query budget.
export const createDatabase = ({ DATABASE_URL }: CreateDatabaseConfig): Kysely<Database> => {
  try {
    const connectionString = requireDatabaseUrl(DATABASE_URL)
    const pool = new pg.Pool({
      connectionString,
      statement_timeout: POSTGRES_STATEMENT_TIMEOUT_MS,
    })
    return new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })
  } catch (error) {
    throw new Error(`Failed to create the Postgres database client: ${getErrorMessage(error)}`)
  }
}
