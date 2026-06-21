import type { Role } from "@lagda/core"

// The §6 RBAC matrix expressed as a single source of truth. Every protected route maps to one of
// these named permissions; the server-side `requirePermission` middleware enforces them deny-by-default.
export const PERMISSIONS = {
  MANAGE_ORG: "manage_org",
  MANAGE_ENTITIES: "manage_entities",
  MANAGE_MEMBERS: "manage_members",
  MANAGE_TOKENS: "manage_tokens",
  MANAGE_DIRECTORY: "manage_directory",
  MANAGE_TEMPLATES: "manage_templates",
  RUN_SYNCS: "run_syncs",
  READ_EMPLOYEES: "read_employees",
  VIEW_OWN_SIGNATURE: "view_own_signature",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Scopes carried by machine-to-machine application tokens. They narrow what a token may do beyond
// the role-based matrix and are enforced on every public `/api/v1` route.
export type TokenScope = "syncs:write" | "syncs:read" | "directory:read"

export const TOKEN_SCOPES = ["syncs:write", "syncs:read", "directory:read"] as const

// Owner sees everything; admin manages templates/assignments + application tokens, runs and reads syncs,
// reads employees, and can view their own signature; a plain user can only view their own signature.
const OWNER_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.MANAGE_ORG,
  PERMISSIONS.MANAGE_ENTITIES,
  PERMISSIONS.MANAGE_MEMBERS,
  PERMISSIONS.MANAGE_TOKENS,
  PERMISSIONS.MANAGE_DIRECTORY,
  PERMISSIONS.MANAGE_TEMPLATES,
  PERMISSIONS.RUN_SYNCS,
  PERMISSIONS.READ_EMPLOYEES,
  PERMISSIONS.VIEW_OWN_SIGNATURE,
] as const

const ADMIN_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.MANAGE_TEMPLATES,
  PERMISSIONS.MANAGE_TOKENS,
  PERMISSIONS.RUN_SYNCS,
  PERMISSIONS.READ_EMPLOYEES,
  PERMISSIONS.VIEW_OWN_SIGNATURE,
] as const

const USER_PERMISSIONS: readonly Permission[] = [PERMISSIONS.VIEW_OWN_SIGNATURE] as const

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: OWNER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  user: USER_PERMISSIONS,
} as const

export const hasPermission = (role: Role, permission: Permission): boolean => ROLE_PERMISSIONS[role].includes(permission)

// Token scopes follow from permissions, not from the role directly, so the two never drift: whoever may
// RUN_SYNCS may read/write syncs; whoever may MANAGE_DIRECTORY may read the directory. A human session's
// JWT carries the scopes its role implies (so the SAME scope gate protects both humans on the SPA and
// machine application tokens); a plain user implies no scopes.
const PERMISSION_SCOPES: Partial<Record<Permission, readonly TokenScope[]>> = {
  [PERMISSIONS.RUN_SYNCS]: ["syncs:write", "syncs:read"],
  [PERMISSIONS.MANAGE_DIRECTORY]: ["directory:read"],
}

// The de-duplicated set of scopes a role is entitled to, derived from its permissions.
export const scopesForRole = (role: Role): TokenScope[] => [...new Set(ROLE_PERMISSIONS[role].flatMap((permission) => PERMISSION_SCOPES[permission] ?? []))]
