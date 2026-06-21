import { createPackageVitestConfig } from "../../vitest.shared"

// googleClient.ts is a thin SDK adapter that opens real connections (integration-tested), not a unit.
export default createPackageVitestConfig({ coverageExclude: ["src/integrations.ts", "src/google/googleClient.ts"] })
