import { createPackageVitestConfig } from "../../vitest.shared"

// queue.ts is a thin pg-boss adapter that opens a real Postgres connection (integration-tested); the
// handlers are unit-tested against injected mock deps, so the entry barrel is excluded too.
export default createPackageVitestConfig({ coverageExclude: ["src/jobs.ts", "src/queue.ts"] })
