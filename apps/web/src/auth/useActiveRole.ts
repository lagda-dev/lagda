import type { Role } from "@lagda/core"
import { useQuery } from "@tanstack/react-query"
import { organization, useSession } from "./authClient"

// Resolve the current user's role within their active organization via the Better Auth organization
// plugin (`getActiveMember()` → the active `member` with its `role`). Better Auth roles map 1:1 to
// ours (owner/admin/member), where `member` is our `user` (apps/auth/src/auth.ts comment).
const ACTIVE_ROLE_QUERY_KEY = ["activeMemberRole"] as const

const toLagdaRole = (rawRole: string | string[] | null | undefined): Role | null => {
  const primaryRole = Array.isArray(rawRole) ? rawRole[0] : rawRole
  if (primaryRole === "owner") return "owner"
  if (primaryRole === "admin") return "admin"
  if (primaryRole === "member" || primaryRole === "user") return "user"
  return null
}

const fetchActiveRole = async (): Promise<Role | null> => {
  const { data, error } = await organization.getActiveMember()
  if (error !== null) throw new Error(`Failed to resolve active member role: ${error.message ?? "unknown error"}`)
  return toLagdaRole(data?.role)
}

type ActiveRoleState = {
  role: Role | null
  isPending: boolean
  isError: boolean
}

// The role is only meaningful for an authenticated session, so we gate the query on the session being
// present. Returns a small explicit state object rather than the raw query result (storytelling).
export const useActiveRole = (): ActiveRoleState => {
  const { data: session } = useSession()
  const isAuthenticated = session !== null && session !== undefined

  const roleQuery = useQuery({
    queryKey: ACTIVE_ROLE_QUERY_KEY,
    queryFn: fetchActiveRole,
    enabled: isAuthenticated,
  })

  return {
    role: roleQuery.data ?? null,
    isPending: isAuthenticated && roleQuery.isPending,
    isError: roleQuery.isError,
  }
}

export { toLagdaRole }
