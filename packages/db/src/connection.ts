// Postgres `statement_timeout`, in milliseconds — enforces the §5 "no query > 1s"
// budget at the connection-pool level. Lives here so the wiring stays declarative.
export const POSTGRES_STATEMENT_TIMEOUT_MS = 1000

// Pure guard: a Postgres connection string is mandatory. Validating it here keeps
// the failure explicit and unit-testable without opening a real connection.
export const requireDatabaseUrl = (databaseUrl: string | undefined): string => {
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("DATABASE_URL is required to connect to Postgres")
  }
  return databaseUrl
}
