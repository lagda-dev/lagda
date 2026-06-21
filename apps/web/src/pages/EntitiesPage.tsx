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
} from "@lagda/ui"
import { getErrorMessage } from "../lib/getErrorMessage"
import type { DataTableColumn } from "@lagda/ui"
import type { FormEvent } from "react"
import { useState } from "react"
import { useCreateEntity, useEntitiesList, useUpdateEntity } from "../api/resources/entities"
import type { Entity } from "../api/resources/entities"

// The entities screen (MANAGE_ENTITIES): a table of the org's brands/business units with create and edit
// in a Dialog (name + slug). The page holds only view state; writes go through typed mutation hooks that
// invalidate the entities query on success. Role gating is UX only — the server enforces.

type EntityDraft = {
  editingId: string | null
  name: string
  slug: string
}

const emptyDraft: EntityDraft = { editingId: null, name: "", slug: "" }

export const EntitiesPage = () => {
  const [draft, setDraft] = useState<EntityDraft | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const entitiesQuery = useEntitiesList()
  const createEntity = useCreateEntity()
  const updateEntity = useUpdateEntity()

  const entities = entitiesQuery.data?.data ?? []
  const hasEntities = entities.length > 0

  const openCreate = () => {
    setErrorMessage(null)
    setDraft(emptyDraft)
  }

  const openEdit = (entity: Entity) => {
    setErrorMessage(null)
    setDraft({ editingId: entity.id, name: entity.name, slug: entity.slug })
  }

  const closeDialog = () => setDraft(null)

  const submitDraft = async (current: EntityDraft) => {
    setErrorMessage(null)
    try {
      if (current.editingId === null) {
        await createEntity.mutateAsync({ name: current.name, slug: current.slug })
      } else {
        await updateEntity.mutateAsync({ id: current.editingId, body: { name: current.name, slug: current.slug } })
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

  const entityColumns: DataTableColumn<Entity>[] = [
    { header: "Name", cell: (entity) => entity.name },
    { header: "Slug", cell: (entity) => entity.slug },
    {
      header: "",
      cell: (entity) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => openEdit(entity)}>
            Edit
          </Button>
        </div>
      ),
    },
  ]

  const isSaving = createEntity.isPending || updateEntity.isPending

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <PageHeader title="Entities" description="The brands and business units under your organization." />
        <Button onClick={openCreate}>New entity</Button>
      </div>

      <div className="mt-6">
        {entitiesQuery.isPending && <p className="text-sm text-muted-foreground">Loading entities…</p>}

        {entitiesQuery.isError && <EmptyState title="Unable to load entities" description="The entities could not be reached. Try again in a moment." />}

        {!entitiesQuery.isPending && !entitiesQuery.isError && !hasEntities && (
          <EmptyState title="No entities yet" description="Create an entity to scope templates and employees." />
        )}

        {!entitiesQuery.isError && hasEntities && <DataTable columns={entityColumns} rows={entities} getRowKey={(entity) => entity.id} />}
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => (open ? undefined : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.editingId === null || draft === null ? "New entity" : "Edit entity"}</DialogTitle>
            <DialogDescription>Name the entity and give it a URL-safe slug.</DialogDescription>
          </DialogHeader>
          {draft !== null && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="entity-name">Name</Label>
                <Input id="entity-name" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity-slug">Slug</Label>
                <Input id="entity-slug" required value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
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
    </div>
  )
}
