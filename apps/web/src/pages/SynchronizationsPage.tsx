import {
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Label,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lagda/ui"
import { getErrorMessage } from "../lib/getErrorMessage"
import type { BadgeProps, DataTableColumn } from "@lagda/ui"
import type { FormEvent } from "react"
import { useState } from "react"
import { useEntitiesList } from "../api/resources/entities"
import { useOrganizationsList } from "../api/resources/organizations"
import { useCancelSynchronization, useCreateSynchronization, useSynchronizationsList } from "../api/resources/synchronizations"
import type { CreateSynchronizationInput, SynchronizationsPage as SynchronizationsResponse } from "../api/resources/synchronizations"
import { useTemplatesList } from "../api/resources/templates"
import { AssignmentTargetSelector } from "../components/AssignmentTargetSelector"
import type { AssignmentTarget } from "../components/AssignmentTargetSelector"

// The synchronizations screen (RUN_SYNCS): a table of directory→signature sync runs with their status,
// a "Run synchronization" dialog (the §15 discriminated target selector + an optional template), and a
// per-row cancel for in-flight runs. The page holds only view state; the run/cancel go through typed
// mutation hooks that invalidate the synchronizations query. Role gating is UX only — the server enforces.

// A single sync run as returned by the list endpoint (id, status, templateId, counts, createdAt).
type SynchronizationRow = SynchronizationsResponse["data"][number]

// The run can be cancelled only while it is still in flight.
const isCancellable = (status: SynchronizationRow["status"]): boolean => status === "pending" || status === "running"

// Map a run status to a badge tone so the table reads at a glance.
const STATUS_BADGE_VARIANT: Record<SynchronizationRow["status"], BadgeProps["variant"]> = {
  pending: "secondary",
  running: "secondary",
  succeeded: "default",
  failed: "destructive",
  cancelled: "outline",
}

// Summarise the open counts record (e.g. `{ deployed: 5, failed: 1 }`) into a compact "5 deployed · 1
// failed" string for the table, falling back to a dash when the run has reported nothing yet.
const countsSummary = (counts: SynchronizationRow["counts"]): string => {
  const parts = Object.entries(counts).map(([label, value]) => `${value} ${label}`)
  return parts.length > 0 ? parts.join(" · ") : "—"
}

const templateNameById = (templates: { id: string; name: string }[], templateId: string | null): string =>
  templateId === null ? "—" : (templates.find((template) => template.id === templateId)?.name ?? templateId)

// The run dialog's editable state: a discriminated target plus an optional template ("" means none).
type SynchronizationDraft = {
  target: AssignmentTarget
  templateId: string
}

const NO_TEMPLATE = "none"

// Bridge the selector's `AssignmentTarget` to the server's request shape. They are identical except the
// server requires the "users" variant to carry a NON-EMPTY id list, so we rebuild it as a [first, ...]
// tuple — returning null when no user was supplied so the caller can surface a validation message.
const buildSyncTarget = (target: AssignmentTarget): CreateSynchronizationInput["target"] | null => {
  if (target.kind !== "users") return target
  const [first, ...rest] = target.userIds
  return first === undefined ? null : { kind: "users", entityId: target.entityId, userIds: [first, ...rest] }
}

export const SynchronizationsPage = () => {
  const [draft, setDraft] = useState<SynchronizationDraft | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const synchronizationsQuery = useSynchronizationsList()
  const entitiesQuery = useEntitiesList()
  const organizationsQuery = useOrganizationsList()
  const templatesQuery = useTemplatesList()
  const createSynchronization = useCreateSynchronization()
  const cancelSynchronization = useCancelSynchronization()

  const synchronizations = synchronizationsQuery.data?.data ?? []
  const entities = entitiesQuery.data?.data ?? []
  const templates = templatesQuery.data?.data ?? []
  const organizationId = organizationsQuery.data?.data[0]?.id ?? ""
  const hasSynchronizations = synchronizations.length > 0
  const canRun = entities.length > 0

  const openRun = () => {
    setErrorMessage(null)
    setDraft({ target: { kind: "entity", entityId: entities[0]?.id ?? "" }, templateId: NO_TEMPLATE })
  }

  const closeDialog = () => setDraft(null)

  const submitDraft = async (current: SynchronizationDraft) => {
    setErrorMessage(null)
    const target = buildSyncTarget(current.target)
    if (target === null) {
      setErrorMessage("Add at least one user id to synchronize specific users.")
      return
    }
    const templateId = current.templateId === NO_TEMPLATE ? undefined : current.templateId
    try {
      await createSynchronization.mutateAsync({ target, templateId })
      closeDialog()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (draft !== null) void submitDraft(draft)
  }

  const cancelRun = async (synchronization: SynchronizationRow) => {
    setErrorMessage(null)
    try {
      await cancelSynchronization.mutateAsync(synchronization.id)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const synchronizationColumns: DataTableColumn<SynchronizationRow>[] = [
    { header: "Status", cell: (synchronization) => <Badge variant={STATUS_BADGE_VARIANT[synchronization.status]}>{synchronization.status}</Badge> },
    { header: "Template", cell: (synchronization) => templateNameById(templates, synchronization.templateId) },
    { header: "Counts", cell: (synchronization) => countsSummary(synchronization.counts) },
    { header: "Started", cell: (synchronization) => new Date(synchronization.createdAt).toLocaleString() },
    {
      header: "",
      cell: (synchronization) => (
        <div className="flex justify-end">
          {isCancellable(synchronization.status) && (
            <Button variant="outline" size="sm" disabled={cancelSynchronization.isPending} onClick={() => void cancelRun(synchronization)}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <PageHeader title="Synchronizations" description="Run and review directory→signature synchronizations." />
        <Button onClick={openRun} disabled={!canRun}>
          Run synchronization
        </Button>
      </div>

      <div className="mt-6">
        {synchronizationsQuery.isPending && <p className="text-sm text-muted-foreground">Loading synchronizations…</p>}

        {synchronizationsQuery.isError && (
          <EmptyState title="Unable to load synchronizations" description="The synchronizations could not be reached. Try again in a moment." />
        )}

        {!synchronizationsQuery.isPending && !synchronizationsQuery.isError && !hasSynchronizations && (
          <EmptyState title="No synchronizations yet" description="Run a synchronization to push signatures to a target audience." />
        )}

        {!synchronizationsQuery.isError && hasSynchronizations && (
          <DataTable columns={synchronizationColumns} rows={synchronizations} getRowKey={(synchronization) => synchronization.id} />
        )}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => (open ? undefined : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run synchronization</DialogTitle>
            <DialogDescription>Choose the audience to synchronize and, optionally, a single template to apply.</DialogDescription>
          </DialogHeader>
          {draft !== null && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <AssignmentTargetSelector
                value={draft.target}
                organizationId={organizationId}
                entities={entities}
                onChange={(target) => setDraft({ ...draft, target })}
              />
              <div className="space-y-2">
                <Label htmlFor="synchronization-template">Template (optional)</Label>
                <Select value={draft.templateId} onValueChange={(templateId) => setDraft({ ...draft, templateId })}>
                  <SelectTrigger id="synchronization-template" aria-label="Synchronization template">
                    <SelectValue placeholder="No template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEMPLATE}>No template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errorMessage !== null && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSynchronization.isPending}>
                  {createSynchronization.isPending ? "Starting…" : "Run"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
