import { createPackageVitestConfig } from "../../vitest.shared"

export default createPackageVitestConfig({ coverageExclude: ["src/auth-contract.ts"] })
