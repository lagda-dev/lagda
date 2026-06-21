import { type ReactNode, forwardRef } from "react"
import type { HTMLAttributes } from "react"
import { cn } from "../../lib/utils"

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(({ className, title, description, actions, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between", className)} {...props}>
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
))
PageHeader.displayName = "PageHeader"
