import { createPackageVitestConfig } from "../../vitest.shared"

// Only connection.ts holds unit-testable logic; the Kysely client, migrator, schema, and migrations are
// exercised by integration tests against a real Postgres, so coverage is scoped to that one module.
export default createPackageVitestConfig({ coverageInclude: ["src/connection.ts"] })
