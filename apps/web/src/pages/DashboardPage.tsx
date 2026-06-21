import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@lagda/ui"
import type { StatusBadgeStatus } from "@lagda/ui"
import { hasPermission, PERMISSIONS } from "@lagda/auth-contract"
import { useHealth } from "../api/hooks"
import { useSynchronizationsList } from "../api/resources/synchronizations"
import type { SynchronizationsPage as SynchronizationsResponse } from "../api/resources/synchronizations"
import { useActiveRole } from "../auth/useActiveRole"

// Dashboard rendered inside the AppShell. Data fetching goes through the shared TanStack Query hooks over
// the bearer-authenticated Hono RPC client. The synchronizations overview is only mounted for roles that
// may read syncs (RUN_SYNCS) so a plain user never triggers a 403 — UX gating mirroring the §6 matrix.

type SynchronizationRow = SynchronizationsResponse["data"][number]

// Map a run's lifecycle status to the design's functional StatusBadge tone.
const SYNC_STATUS_TO_BADGE: Record<SynchronizationRow["status"], StatusBadgeStatus> = {
  pending: "queued",
  running: "syncing",
  succeeded: "synced",
  failed: "failed",
  cancelled: "queued",
}

const countsSummary = (counts: SynchronizationRow["counts"]): string => {
  const parts = Object.entries(counts).map(([label, value]) => `${value} ${label}`)
  return parts.length > 0 ? parts.join(" · ") : "—"
}

// The runs-table placeholder copy, kept as an early-return helper so the JSX stays free of nested ternaries.
const emptyRunsMessage = (isPending: boolean, isError: boolean): string => {
  if (isPending) return "Loading runs…"
  if (isError) return "Unable to load runs."
  return "No synchronizations yet."
}

interface StatCardProps {
  label: string
  value: string
}

const StatCard = ({ label, value }: StatCardProps) => (
  <Card>
    <CardContent className="p-5">
      <div className="font-mono text-xs uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-2 font-mono text-2xl text-foreground">{value}</div>
    </CardContent>
  </Card>
)

// The recent-synchronizations overview: a few headline counts from the latest page plus the runs table.
// Isolated into its own component so its query only fires for permitted roles (it is conditionally mounted).
const RecentSynchronizations = () => {
  const synchronizationsQuery = useSynchronizationsList()
  const synchronizations = synchronizationsQuery.data?.data ?? []

  const succeededCount = synchronizations.filter((run) => run.status === "succeeded").length
  const runningCount = synchronizations.filter((run) => run.status === "running" || run.status === "pending").length
  const failedCount = synchronizations.filter((run) => run.status === "failed").length
  const recentRuns = synchronizations.slice(0, 6)

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Recent runs" value={String(synchronizations.length)} />
        <StatCard label="Succeeded" value={String(succeededCount)} />
        <StatCard label="In flight" value={String(runningCount)} />
        <StatCard label="Failed" value={String(failedCount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent synchronizations</CardTitle>
          <CardDescription>The latest directory → signature runs and their outcome.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentRuns.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">{emptyRunsMessage(synchronizationsQuery.isPending, synchronizationsQuery.isError)}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Counts</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-body">{countsSummary(run.counts)}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={SYNC_STATUS_TO_BADGE[run.status]}>{run.status}</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// The API-connection card reuses the StatusBadge to read the live health probe at a glance.
const apiHealthStatus = (isPending: boolean, isError: boolean): { status: StatusBadgeStatus; label: string } => {
  if (isPending) return { status: "queued", label: "Checking" }
  if (isError) return { status: "failed", label: "Unreachable" }
  return { status: "synced", label: "Connected" }
}

export const DashboardPage = () => {
  const healthQuery = useHealth()
  const { role } = useActiveRole()
  const canReadSyncs = role !== null && hasPermission(role, PERMISSIONS.RUN_SYNCS)
  const health = apiHealthStatus(healthQuery.isPending, healthQuery.isError)

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <PageHeader title="Dashboard" description="Open-source email-signature management." />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">API connection</CardTitle>
              <CardDescription>Typed Hono RPC call to the application service.</CardDescription>
            </div>
            <StatusBadge status={health.status}>{health.label}</StatusBadge>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-body">{healthQuery.data !== undefined ? `${healthQuery.data.service} · ${healthQuery.data.status}` : "—"}</p>
          </CardContent>
        </Card>
      </div>

      {canReadSyncs ? <RecentSynchronizations /> : null}
    </div>
  )
}
