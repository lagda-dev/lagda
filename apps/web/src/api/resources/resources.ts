// The public entry point for the data-access hook layer: every resource module spreads its hooks (and
// the pure fetchers, for tests) through here so consumers import from one place. Named after the layer,
// not `index.ts` (§2 file-naming).

export * from "./health"
export * from "./organizations"
export * from "./entities"
export * from "./employees"
export * from "./templates"
export * from "./assignments"
export * from "./synchronizations"
export * from "./departments"
export * from "./roles"
export * from "./auditEvents"
