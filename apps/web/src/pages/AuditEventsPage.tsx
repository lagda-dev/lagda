import { Button, DataTable, EmptyState, PageHeader } from "@lagda/ui"
import type { DataTableColumn } from "@lagda/ui"
import { useState } from "react"
import { useAuditEventsList } from "../api/resources/auditEvents"
import type { AuditEvent } from "../api/resources/auditEvents"

// The audit log screen: a read-only, cursor-paginated table of audit events (owner-only, MANAGE_ORG).
// Read-only by design — the log is append-only (§8). View state is just the active cursor.

// Render an ISO timestamp as a human-readable local time, falling back to the raw value if it is not a
// parseable date rather than throwing.
const formatTime = (isoTimestamp: string): string => {
  const parsed = new Date(isoTimestamp)
  return Number.isNaN(parsed.getTime()) ? isoTimestamp : parsed.toLocaleString()
}

const auditEventColumns: DataTableColumn<AuditEvent>[] = [
  { header: "Actor", cell: (event) => event.actor },
  { header: "Action", cell: (event) => event.action },
  { header: "Target", cell: (event) => event.target },
  { header: "Time", cell: (event) => formatTime(event.createdAt) },
]

export const AuditEventsPage = () => {
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const auditEventsQuery = useAuditEventsList({ cursor })

  const events = auditEventsQuery.data?.data ?? []
  const nextCursor = auditEventsQuery.data?.nextCursor ?? null
  const hasEvents = events.length > 0

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader title="Audit events" description="A read-only view of the append-only audit log." />

      <div className="mt-6">
        {auditEventsQuery.isPending && <p className="text-sm text-muted-foreground">Loading audit events…</p>}

        {auditEventsQuery.isError && (
          <EmptyState title="Unable to load audit events" description="The audit log could not be reached. Try again in a moment." />
        )}

        {!auditEventsQuery.isPending && !auditEventsQuery.isError && !hasEvents && (
          <EmptyState title="No audit events yet" description="Directory reads and signature writes will appear here." />
        )}

        {!auditEventsQuery.isError && hasEvents && (
          <>
            <DataTable columns={auditEventColumns} rows={events} getRowKey={(event) => event.id} />
            {nextCursor !== null && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setCursor(nextCursor)} disabled={auditEventsQuery.isFetching}>
                  {auditEventsQuery.isFetching ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
