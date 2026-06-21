import { type ComponentType, type ReactNode, forwardRef } from "react"
import type { HTMLAttributes } from "react"
import { cn } from "../lib/utils"

export interface SidebarNavItem {
  label: string
  href: string
  icon?: ComponentType<{ className?: string }>
  isActive?: boolean
}

// A labelled section of nav items (e.g. "Signatures", "Directory"). Groups are optional — a flat `items`
// list still works for simple sidebars.
export interface SidebarNavGroup {
  label?: string
  items: SidebarNavItem[]
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  header?: ReactNode
  items?: SidebarNavItem[]
  groups?: SidebarNavGroup[]
  footer?: ReactNode
  renderLink?: (item: SidebarNavItem, children: ReactNode) => ReactNode
}

const defaultRenderLink = (item: SidebarNavItem, children: ReactNode): ReactNode => (
  <a href={item.href} className="contents">
    {children}
  </a>
)

const renderNavItem = (item: SidebarNavItem, renderLink: (item: SidebarNavItem, children: ReactNode) => ReactNode): ReactNode => {
  const Icon = item.icon
  const content = (
    <span
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
        item.isActive ? "bg-hover text-foreground" : "text-muted-foreground hover:bg-hover hover:text-foreground",
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : <span className="size-[5px] shrink-0 rounded-[1.5px] bg-current opacity-45" />}
      {item.label}
    </span>
  )
  return <div key={item.href}>{renderLink(item, content)}</div>
}

const renderNavGroup = (group: SidebarNavGroup, groupKey: string, renderLink: (item: SidebarNavItem, children: ReactNode) => ReactNode): ReactNode => (
  <div key={groupKey} className="space-y-0.5">
    {group.label ? <div className="px-2.5 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-faint">{group.label}</div> : null}
    {group.items.map((item) => renderNavItem(item, renderLink))}
  </div>
)

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ className, header, items = [], groups, footer, renderLink = defaultRenderLink, ...props }, ref) => (
    <aside ref={ref} className={cn("flex h-full w-64 flex-col border-r bg-subtle", className)} {...props}>
      {header ? <div className="p-3">{header}</div> : null}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {groups
          ? groups.map((group, index) => renderNavGroup(group, group.label ?? `group-${index}`, renderLink))
          : items.map((item) => renderNavItem(item, renderLink))}
      </nav>
      {footer ? <div className="border-t border-border p-3">{footer}</div> : null}
    </aside>
  ),
)
Sidebar.displayName = "Sidebar"
