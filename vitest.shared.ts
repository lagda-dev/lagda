import { defineConfig } from "vitest/config"

// Shared Vitest config for the workspace packages: v8 coverage over the package source with the §testing
// 90% gate. Test files are always excluded from coverage; each package passes only what is unique to it —
// the entry barrel and any IO adapters that are verified by integration rather than unit tests, and
// (rarely) a narrowed `coverageInclude` when only part of the package is unit-testable.
const COVERAGE_THRESHOLD = 90
const ALWAYS_EXCLUDED_FROM_COVERAGE = ["src/**/*.test.ts", "src/**/__tests__/**"]

export type PackageVitestOptions = {
  coverageInclude?: string[]
  coverageExclude?: string[]
}

export const createPackageVitestConfig = ({ coverageInclude = ["src/**/*.ts"], coverageExclude = [] }: PackageVitestOptions = {}) =>
  defineConfig({
    test: {
      globals: true,
      coverage: {
        provider: "v8",
        include: coverageInclude,
        exclude: [...ALWAYS_EXCLUDED_FROM_COVERAGE, ...coverageExclude],
        thresholds: {
          lines: COVERAGE_THRESHOLD,
          functions: COVERAGE_THRESHOLD,
          branches: COVERAGE_THRESHOLD,
          statements: COVERAGE_THRESHOLD,
        },
      },
    },
  })
