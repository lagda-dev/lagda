import type { Permission } from "@lagda/auth-contract"
import { hasPermission } from "@lagda/auth-contract"
import type { ReactNode } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useActiveRole } from "./useActiveRole"

// UX gating only (NOT the security boundary — see RequireAuth). Hides routes the active role cannot use
// so a `user` is not shown owner/admin areas. The server still enforces the same matrix on every call.

type RequireRoleProps = {
  permission: Permission
  children?: ReactNode
}

// Gate a subtree on a single permission resolved from the active organization member role + the shared
// `@lagda/auth-contract` matrix. Unknown/loading role renders nothing; a denied role is redirected home.
export const RequireRole = ({ permission, children }: RequireRoleProps) => {
  const { role, isPending } = useActiveRole()

  if (isPending) return null
  if (role === null || !hasPermission(role, permission)) return <Navigate to="/" replace />

  return children !== undefined ? <>{children}</> : <Outlet />
}
