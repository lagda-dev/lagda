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
  Input,
  Label,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@lagda/ui"
import type { DataTableColumn } from "@lagda/ui"
import type { FormEvent } from "react"
import { useState } from "react"
import { useEntitiesList } from "../api/resources/entities"
import { useCreateTemplate, useDeleteTemplate, useTemplatesList, useUpdateTemplate } from "../api/resources/templates"
import type { Template } from "../api/resources/templates"

// The templates screen (MANAGE_TEMPLATES): a table of entity-scoped MJML templates with create/edit in a
// Dialog and a delete confirm. The page holds only view state; every write goes through a typed mutation
// hook that invalidates the templates query on success. Role gating is UX only — the server enforces.

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : "Something went wrong. Please try again.")

// The dialog's editable form state. `editingId` is null when creating, the template id when editing.
type TemplateDraft = {
  editingId: string | null
  name: string
  entityId: string
  mjmlSource: string
}

const emptyDraft: TemplateDraft = { editingId: null, name: "", entityId: "", mjmlSource: "" }

const entityNameById = (entities: { id: string; name: string }[], entityId: string): string => entities.find((entity) => entity.id === entityId)?.name ?? "—"

export const TemplatesPage = () => {
  const [draft, setDraft] = useState<TemplateDraft | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Template | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const templatesQuery = useTemplatesList()
  const entitiesQuery = useEntitiesList()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()

  const templates = templatesQuery.data?.data ?? []
  const entities = entitiesQuery.data?.data ?? []
  const hasTemplates = templates.length > 0

  const openCreate = () => {
    setErrorMessage(null)
    setDraft({ ...emptyDraft, entityId: entities[0]?.id ?? "" })
  }

  const openEdit = (template: Template) => {
    setErrorMessage(null)
    // The list/detail Template shape carries no mjmlSource (it is write-only on the schema), so editing
    // starts from an empty source the user re-supplies. TODO: fetch the stored mjmlSource via a detail
    // endpoint that returns it once the server exposes it.
    setDraft({ editingId: template.id, name: template.name, entityId: template.entityId, mjmlSource: "" })
  }

  const closeDialog = () => setDraft(null)

  const submitDraft = async (current: TemplateDraft) => {
    setErrorMessage(null)
    try {
      if (current.editingId === null) {
        await createTemplate.mutateAsync({ entityId: current.entityId, name: current.name, mjmlSource: current.mjmlSource })
      } else {
        await updateTemplate.mutateAsync({ id: current.editingId, body: { name: current.name, mjmlSource: current.mjmlSource } })
      }
      closeDialog()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (draft !== null) void submitDraft(draft)
  }

  const confirmDelete = async (template: Template) => {
    setErrorMessage(null)
    try {
      await deleteTemplate.mutateAsync(template.id)
      setPendingDelete(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const templateColumns: DataTableColumn<Template>[] = [
    { header: "Name", cell: (template) => template.name },
    { header: "Entity", cell: (template) => entityNameById(entities, template.entityId) },
    {
      header: "",
      cell: (template) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(template)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPendingDelete(template)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const isSaving = createTemplate.isPending || updateTemplate.isPending

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <PageHeader title="Templates" description="Entity-scoped MJML signature templates." />
        <Button onClick={openCreate} disabled={entities.length === 0}>
          New template
        </Button>
      </div>

      <div className="mt-6">
        {templatesQuery.isPending && <p className="text-sm text-muted-foreground">Loading templates…</p>}

        {templatesQuery.isError && <EmptyState title="Unable to load templates" description="The templates could not be reached. Try again in a moment." />}

        {!templatesQuery.isPending && !templatesQuery.isError && !hasTemplates && (
          <EmptyState title="No templates yet" description="Create a template to start managing signatures." />
        )}

        {!templatesQuery.isError && hasTemplates && <DataTable columns={templateColumns} rows={templates} getRowKey={(template) => template.id} />}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => (open ? undefined : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.editingId === null || draft === null ? "New template" : "Edit template"}</DialogTitle>
            <DialogDescription>Name the template, pick its entity, and provide its MJML source.</DialogDescription>
          </DialogHeader>
          {draft !== null && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input id="template-name" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-entity">Entity</Label>
                <Select value={draft.entityId} onValueChange={(entityId) => setDraft({ ...draft, entityId })}>
                  <SelectTrigger id="template-entity" aria-label="Template entity">
                    <SelectValue placeholder="Choose an entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-mjml">MJML source</Label>
                {/* TODO: render a live MJML preview here once the server exposes a render endpoint; for now we show the raw source. */}
                <Textarea
                  id="template-mjml"
                  required
                  rows={8}
                  value={draft.mjmlSource}
                  onChange={(event) => setDraft({ ...draft, mjmlSource: event.target.value })}
                />
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
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => (open ? undefined : setPendingDelete(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template</DialogTitle>
            <DialogDescription>This permanently removes “{pendingDelete?.name}”. This cannot be undone.</DialogDescription>
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
            <Button type="button" disabled={deleteTemplate.isPending} onClick={() => pendingDelete !== null && void confirmDelete(pendingDelete)}>
              {deleteTemplate.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
