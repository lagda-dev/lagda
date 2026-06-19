import type { Permission } from "@lagda/auth-contract"
import { hasPermission, PERMISSIONS } from "@lagda/auth-contract"
import type { Role } from "@lagda/core"

// The full navigation catalogue. Each item declares the single permission that unlocks it, so the
// role-aware filtering below is a pure function of the §6 matrix — no role lists duplicated here.
// owner → everything (settings/members/entities/tokens/directory); admin → templates/assignments/syncs/
// employees; user → their signature/profile.
export type AppNavItem = {
  label: string
  href: string
  permission: Permission
}

const NAV_CATALOGUE: readonly AppNavItem[] = [
  { label: "Dashboard", href: "/", permission: PERMISSIONS.VIEW_OWN_SIGNATURE },
  { label: "My signature", href: "/signature", permission: PERMISSIONS.VIEW_OWN_SIGNATURE },
  { label: "Templates", href: "/templates", permission: PERMISSIONS.MANAGE_TEMPLATES },
  { label: "Assignments", href: "/assignments", permission: PERMISSIONS.MANAGE_TEMPLATES },
  { label: "Synchronizations", href: "/synchronizations", permission: PERMISSIONS.RUN_SYNCS },
  { label: "Employees", href: "/employees", permission: PERMISSIONS.READ_EMPLOYEES },
  { label: "Directory", href: "/directory", permission: PERMISSIONS.MANAGE_DIRECTORY },
  { label: "Entities", href: "/entities", permission: PERMISSIONS.MANAGE_ENTITIES },
  { label: "Members", href: "/members", permission: PERMISSIONS.MANAGE_MEMBERS },
  { label: "Tokens", href: "/tokens", permission: PERMISSIONS.MANAGE_TOKENS },
  { label: "Settings", href: "/settings", permission: PERMISSIONS.MANAGE_ORG },
] as const

// Filter the catalogue down to the items the given role may use (UX gating only — the server enforces).
export const navItemsForRole = (role: Role): readonly AppNavItem[] => NAV_CATALOGUE.filter((item) => hasPermission(role, item.permission))

export { NAV_CATALOGUE }
