import { Button, Logo, Sidebar } from "@lagda/ui"
import type { SidebarNavGroup, SidebarNavItem } from "@lagda/ui"
import type { ReactNode } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { signOut, useActiveOrganization, useSession } from "../auth/authClient"
import { useActiveRole } from "../auth/useActiveRole"
import { navGroupsForRole } from "./navItems"

// The role-aware authenticated shell: a left Sidebar (brand + org identity, grouped nav filtered by the
// active role) with the routed page rendered to its right. Nav filtering is UX only — the server is the
// security boundary (§6).

const renderRouterLink = (item: SidebarNavItem, children: ReactNode): ReactNode => (
  <Link to={item.href} className="contents">
    {children}
  </Link>
)

interface OrgIdentityProps {
  name: string
  subtitle: string
}

// A compact identity card at the top of the sidebar: the org's initial as an avatar plus its name and the
// viewer's role. Presentational — org switching is a later step.
const OrgIdentity = ({ name, subtitle }: OrgIdentityProps) => (
  <div className="flex items-center gap-2.5 rounded-md border border-border bg-card p-2">
    <div className="grid size-7 shrink-0 place-items-center rounded-md bg-foreground font-mono text-sm font-semibold text-background">
      {name.charAt(0).toUpperCase()}
    </div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-semibold leading-tight text-foreground">{name}</div>
      {subtitle.length > 0 ? <div className="font-mono text-[10px] capitalize text-faint">{subtitle}</div> : null}
    </div>
  </div>
)

type AppShellProps = {
  children?: ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
  const { data: session } = useSession()
  const { data: activeOrganization } = useActiveOrganization()
  const { role } = useActiveRole()
  const location = useLocation()

  // Until the role resolves we show no nav items rather than guessing; the page area still renders.
  const navGroups: SidebarNavGroup[] =
    role === null
      ? []
      : navGroupsForRole(role).map((group) => ({
          label: group.label,
          items: group.items.map((item) => ({ label: item.label, href: item.href, isActive: location.pathname === item.href })),
        }))

  const userEmail = session?.user.email ?? ""
  const organizationName = activeOrganization?.name ?? "Your organization"

  return (
    <div className="flex h-screen">
      <Sidebar
        header={
          <div className="space-y-3">
            <div className="px-1 pt-1">
              <Logo size={22} />
            </div>
            <OrgIdentity name={organizationName} subtitle={role ?? ""} />
          </div>
        }
        groups={navGroups}
        renderLink={renderRouterLink}
        footer={
          <div className="space-y-2">
            {userEmail.length > 0 && <p className="truncate px-1 font-mono text-[11px] text-faint">{userEmail}</p>}
            <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        }
      />
      <main className="flex-1 overflow-y-auto bg-background">{children !== undefined ? children : <Outlet />}</main>
    </div>
  )
}
