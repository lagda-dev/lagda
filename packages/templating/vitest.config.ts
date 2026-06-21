import { createPackageVitestConfig } from "../../vitest.shared"

export default createPackageVitestConfig({ coverageExclude: ["src/templating.ts"] })
