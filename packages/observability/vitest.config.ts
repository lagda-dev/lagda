import { createPackageVitestConfig } from "../../vitest.shared"

// telemetry.ts needs a live OTLP collector; the entry barrel is just re-exports — both integration/trivial.
export default createPackageVitestConfig({ coverageExclude: ["src/telemetry.ts", "src/observability.ts"] })
