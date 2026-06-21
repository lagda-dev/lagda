import { type VariantProps, cva } from "class-variance-authority"
import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "../lib/utils"

export const statusBadgeVariants = cva("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    status: {
      synced: "border-success/25 bg-success/10 text-success",
      syncing: "border-warning/25 bg-warning/10 text-warning",
      failed: "border-destructive/25 bg-destructive/10 text-destructive",
      queued: "border-border bg-muted text-muted-foreground",
    },
  },
  defaultVariants: {
    status: "queued",
  },
})

const dotClassNameByStatus = {
  synced: "bg-success",
  syncing: "bg-warning animate-pulse-dot",
  failed: "bg-destructive",
  queued: "border-[1.5px] border-faint",
} as const

export type StatusBadgeStatus = keyof typeof dotClassNameByStatus

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof statusBadgeVariants> & { children: ReactNode }

// A functional status pill: a colored dot plus a label, drawn from the status palette
// (success / warning / destructive / neutral). "syncing" pulses to read as in-progress.
export const StatusBadge = ({ status, className, children, ...props }: StatusBadgeProps) => {
  const resolvedStatus: StatusBadgeStatus = status ?? "queued"

  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      <span className={cn("size-1.5 rounded-full", dotClassNameByStatus[resolvedStatus])} />
      {children}
    </span>
  )
}
