import { Button, Sidebar } from "@lagda/ui"
import type { SidebarNavItem } from "@lagda/ui"
import type { ReactNode } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { signOut, useSession } from "../auth/authClient"
import { useActiveRole } from "../auth/useActiveRole"
import { navItemsForRole } from "./navItems"

// The role-aware authenticated shell: a left Sidebar whose items are filtered by the active role, with
// the routed page rendered to its right. Nav filtering is UX only — the server is the security boundary.

const renderRouterLink = (item: SidebarNavItem, children: ReactNode): ReactNode => (
  <Link to={item.href} className="contents">
    {children}
  </Link>
)

type AppShellProps = {
  children?: ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
  const { data: session } = useSession()
  const { role } = useActiveRole()
  const location = useLocation()

  // Until the role resolves we show no nav items rather than guessing; the page area still renders.
  const navItems: SidebarNavItem[] =
    role === null
      ? []
      : navItemsForRole(role).map((item) => ({
          label: item.label,
          href: item.href,
          isActive: location.pathname === item.href,
        }))

  const userEmail = session?.user.email ?? ""

  return (
    <div className="flex h-screen">
      <Sidebar
        header="Lagda"
        items={navItems}
        renderLink={renderRouterLink}
        footer={
          <div className="space-y-2">
            {userEmail.length > 0 && <p className="px-3 text-xs text-muted-foreground">{userEmail}</p>}
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        }
      />
      <main className="flex-1 overflow-y-auto">{children !== undefined ? children : <Outlet />}</main>
    </div>
  )
}
