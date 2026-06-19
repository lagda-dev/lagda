import { type ComponentType, type ReactNode, forwardRef } from "react"
import type { HTMLAttributes } from "react"
import { cn } from "../lib/utils"

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: ComponentType<{ className?: string }>
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(({ className, icon: Icon, title, description, action, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center", className)} {...props}>
    {Icon && (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
    )}
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
))
EmptyState.displayName = "EmptyState"
