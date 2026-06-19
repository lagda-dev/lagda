import type { ReactNode } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useSession } from "./authClient"

// IMPORTANT: these guards are UX gating only — they are NOT the security boundary. The application
// server enforces every permission server-side (deny-by-default, §6). A `user` who hits an admin
// endpoint directly is still rejected by the API regardless of what the SPA renders.

type RequireAuthProps = {
  children?: ReactNode
}

// Redirect unauthenticated visitors to /login. While the session is still loading we render nothing to
// avoid a flash of either the protected content or the login screen.
export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { data: session, isPending } = useSession()

  if (isPending) return null
  if (session === null || session === undefined) return <Navigate to="/login" replace />

  return children !== undefined ? <>{children}</> : <Outlet />
}
