// The stored `target` is an open JSON column; cast it to the domain record shape at the boundary.
export const withParsedTarget = <T extends { target: unknown }>(row: T): Omit<T, "target"> & { target: Record<string, unknown> } => ({
  ...row,
  target: row.target as Record<string, unknown>,
})

// The columns every assignment query selects (aliased to the domain shape).
export const ASSIGNMENT_COLUMNS = [
  "assignments.id as id",
  "assignments.entity_id as entityId",
  "assignments.template_id as templateId",
  "assignments.target as target",
] as const
