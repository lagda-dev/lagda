import { type ComponentType, type ReactNode, forwardRef } from "react"
import type { HTMLAttributes } from "react"
import { cn } from "../lib/utils"

export interface SidebarNavItem {
  label: string
  href: string
  icon?: ComponentType<{ className?: string }>
  isActive?: boolean
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  header?: ReactNode
  items: SidebarNavItem[]
  footer?: ReactNode
  renderLink?: (item: SidebarNavItem, children: ReactNode) => ReactNode
}

const defaultRenderLink = (item: SidebarNavItem, children: ReactNode): ReactNode => (
  <a href={item.href} className="contents">
    {children}
  </a>
)

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(({ className, header, items, footer, renderLink = defaultRenderLink, ...props }, ref) => (
  <aside ref={ref} className={cn("flex h-full w-64 flex-col border-r bg-background", className)} {...props}>
    {header && <div className="flex h-14 items-center border-b px-4 font-semibold">{header}</div>}
    <nav className="flex-1 space-y-1 overflow-y-auto p-2">
      {items.map((item) => {
        const Icon = item.icon
        const content = (
          <span
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              item.isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            {item.label}
          </span>
        )
        return <div key={item.href}>{renderLink(item, content)}</div>
      })}
    </nav>
    {footer && <div className="border-t p-2">{footer}</div>}
  </aside>
))
Sidebar.displayName = "Sidebar"
