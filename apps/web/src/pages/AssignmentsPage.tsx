import {
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
import type { DataTableColumn } from "@lagda/ui"
import type { FormEvent } from "react"
import { useState } from "react"
import { useCreateAssignment, useDeleteAssignment, useAssignmentsList } from "../api/resources/assignments"
import type { Assignment } from "../api/resources/assignments"
import { useEntitiesList } from "../api/resources/entities"
import { useOrganizationsList } from "../api/resources/organizations"
import { useTemplatesList } from "../api/resources/templates"
import { AssignmentTargetSelector } from "../components/AssignmentTargetSelector"
import type { AssignmentTarget } from "../components/AssignmentTargetSelector"

// The assignments screen (MANAGE_TEMPLATES): a table of template→audience bindings, with create (a
// discriminated target selector + template picker) and delete. The page holds only view state; writes go
// through typed mutation hooks that invalidate the assignments query. Role gating is UX only — the server enforces.

// Read the discriminant from an assignment's open `target` record for the list column, defaulting safely
// when the shape is unexpected (the server owns validation; this is display only).
const targetKindLabel = (target: Assignment["target"]): string => {
  const { kind } = target as { kind?: unknown }
  return typeof kind === "string" ? kind : "—"
}

const templateNameById = (templates: { id: string; name: string }[], templateId: string): string =>
  templates.find((template) => template.id === templateId)?.name ?? templateId

type AssignmentDraft = {
  templateId: string
  target: AssignmentTarget
}

export const AssignmentsPage = () => {
  const [draft, setDraft] = useState<AssignmentDraft | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Assignment | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const assignmentsQuery = useAssignmentsList()
  const entitiesQuery = useEntitiesList()
  const templatesQuery = useTemplatesList()
  const organizationsQuery = useOrganizationsList()
  const createAssignment = useCreateAssignment()
  const deleteAssignment = useDeleteAssignment()

  const assignments = assignmentsQuery.data?.data ?? []
  const entities = entitiesQuery.data?.data ?? []
  const templates = templatesQuery.data?.data ?? []
  const organizationId = organizationsQuery.data?.data[0]?.id ?? ""
  const hasAssignments = assignments.length > 0
  const canCreate = templates.length > 0 && entities.length > 0

  const openCreate = () => {
    setErrorMessage(null)
    const firstEntityId = entities[0]?.id ?? ""
    setDraft({ templateId: templates[0]?.id ?? "", target: { kind: "entity", entityId: firstEntityId } })
  }

  const closeDialog = () => setDraft(null)

  const submitDraft = async (current: AssignmentDraft) => {
    setErrorMessage(null)
    const targetEntityId = current.target.kind === "org" ? (entities[0]?.id ?? "") : current.target.entityId
    try {
      await createAssignment.mutateAsync({ entityId: targetEntityId, templateId: current.templateId, target: current.target })
      closeDialog()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (draft !== null) void submitDraft(draft)
  }

  const confirmDelete = async (assignment: Assignment) => {
    setErrorMessage(null)
    try {
      await deleteAssignment.mutateAsync(assignment.id)
      setPendingDelete(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const assignmentColumns: DataTableColumn<Assignment>[] = [
    { header: "Template", cell: (assignment) => templateNameById(templates, assignment.templateId) },
    { header: "Target", cell: (assignment) => targetKindLabel(assignment.target) },
    {
      header: "",
      cell: (assignment) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setPendingDelete(assignment)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <PageHeader title="Assignments" description="Bind a template to a target audience." />
        <Button onClick={openCreate} disabled={!canCreate}>
          New assignment
        </Button>
      </div>

      <div className="mt-6">
        {assignmentsQuery.isPending && <p className="text-sm text-muted-foreground">Loading assignments…</p>}

        {assignmentsQuery.isError && (
          <EmptyState title="Unable to load assignments" description="The assignments could not be reached. Try again in a moment." />
        )}

        {!assignmentsQuery.isPending && !assignmentsQuery.isError && !hasAssignments && (
          <EmptyState title="No assignments yet" description="Create an assignment to deliver a template to an audience." />
        )}

        {!assignmentsQuery.isError && hasAssignments && <DataTable columns={assignmentColumns} rows={assignments} getRowKey={(assignment) => assignment.id} />}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => (open ? undefined : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New assignment</DialogTitle>
            <DialogDescription>Choose a template and the audience it applies to.</DialogDescription>
          </DialogHeader>
          {draft !== null && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="assignment-template">Template</Label>
                <Select value={draft.templateId} onValueChange={(templateId) => setDraft({ ...draft, templateId })}>
                  <SelectTrigger id="assignment-template" aria-label="Assignment template">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <AssignmentTargetSelector
                value={draft.target}
                organizationId={organizationId}
                entities={entities}
                onChange={(target) => setDraft({ ...draft, target })}
              />

              {errorMessage !== null && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAssignment.isPending}>
                  {createAssignment.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete assignment</DialogTitle>
            <DialogDescription>This removes the binding. This cannot be undone.</DialogDescription>
          </DialogHeader>
          {errorMessage !== null && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={deleteAssignment.isPending} onClick={() => pendingDelete !== null && void confirmDelete(pendingDelete)}>
              {deleteAssignment.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
