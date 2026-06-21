import type { Permission } from "@lagda/auth-contract"
import { hasPermission, PERMISSIONS } from "@lagda/auth-contract"
import type { Role } from "@lagda/core"

// The full navigation catalogue. Each item declares the single permission that unlocks it, so the
// role-aware filtering below is a pure function of the §6 matrix — no role lists duplicated here.
// owner → everything (settings/members/entities/tokens/directory); admin → templates/assignments/syncs/
// employees; user → their signature/profile.
// Each item belongs to a named section so the sidebar can render the design's grouped navigation.
export type NavSection = "Overview" | "Signatures" | "Directory" | "Organization"

export type AppNavItem = {
  label: string
  href: string
  section: NavSection
  permission: Permission
}

export type AppNavGroup = {
  label: NavSection
  items: readonly AppNavItem[]
}

// The order sections appear in the sidebar.
const SECTION_ORDER: readonly NavSection[] = ["Overview", "Signatures", "Directory", "Organization"] as const

// Only routes that exist today are listed — adding a nav item with no route 404s. The remaining
// screens (My signature, Directory, Members, Tokens) ship in later PRs; add the nav item alongside its
// route then. (TODO: restore those items as their pages land.)
const NAV_CATALOGUE: readonly AppNavItem[] = [
  { label: "Dashboard", href: "/", section: "Overview", permission: PERMISSIONS.VIEW_OWN_SIGNATURE },
  { label: "Templates", href: "/templates", section: "Signatures", permission: PERMISSIONS.MANAGE_TEMPLATES },
  { label: "Assignments", href: "/assignments", section: "Signatures", permission: PERMISSIONS.MANAGE_TEMPLATES },
  { label: "Synchronizations", href: "/synchronizations", section: "Signatures", permission: PERMISSIONS.RUN_SYNCS },
  { label: "Employees", href: "/employees", section: "Directory", permission: PERMISSIONS.READ_EMPLOYEES },
  { label: "Entities", href: "/entities", section: "Directory", permission: PERMISSIONS.MANAGE_ENTITIES },
  { label: "Audit events", href: "/audit-events", section: "Organization", permission: PERMISSIONS.MANAGE_ORG },
  { label: "Settings", href: "/settings", section: "Organization", permission: PERMISSIONS.MANAGE_ORG },
] as const

// Filter the catalogue down to the items the given role may use (UX gating only — the server enforces).
export const navItemsForRole = (role: Role): readonly AppNavItem[] => NAV_CATALOGUE.filter((item) => hasPermission(role, item.permission))

// The same allowed items, bucketed into the design's sidebar sections. Empty sections are dropped so a
// role never sees a bare section heading.
export const navGroupsForRole = (role: Role): readonly AppNavGroup[] => {
  const allowedItems = navItemsForRole(role)
  const groupsInOrder = SECTION_ORDER.map((section) => ({
    label: section,
    items: allowedItems.filter((item) => item.section === section),
  }))
  return groupsInOrder.filter((group) => group.items.length > 0)
}

export { NAV_CATALOGUE }
