import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Input, Label, PageHeader } from "@lagda/ui"
import { getErrorMessage } from "../lib/getErrorMessage"
import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import { useOrganizationsList, useUpdateOrganization } from "../api/resources/organizations"

// Organization settings is an owner-only area (gated by RequireRole MANAGE_ORG in main.tsx — UX only; the
// server enforces the same matrix). It loads the caller's own organization (the list only ever returns
// that one tenant) and lets the owner rename it via `useUpdateOrganization`. More settings land here as
// the server exposes them.

export const SettingsPage = () => {
  const organizationsQuery = useOrganizationsList()
  const updateOrganization = useUpdateOrganization()

  const organization = organizationsQuery.data?.data[0] ?? null
  const persistedName = organization?.name ?? null

  const [name, setName] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  // Seed the editable name from the PERSISTED name (a primitive), not the organization object. Keying on
  // the object re-ran on every refetch (window refocus, post-save invalidation) and clobbered in-progress
  // edits, because a refetch yields a new object even when the name is unchanged. Keying on the string
  // only reseeds when the persisted name actually changes.
  useEffect(() => {
    if (persistedName !== null) setName(persistedName)
  }, [persistedName])

  const submitName = async (organizationId: string) => {
    setErrorMessage(null)
    setSavedMessage(null)
    try {
      await updateOrganization.mutateAsync({ id: organizationId, body: { name } })
      setSavedMessage("Saved.")
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (organization !== null) void submitName(organization.id)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader title="Settings" description="Organization configuration." />

      {organizationsQuery.isPending && <p className="mt-8 text-sm text-muted-foreground">Loading organization…</p>}

      {organizationsQuery.isError && (
        <div className="mt-8">
          <EmptyState title="Unable to load organization" description="The organization could not be reached. Try again in a moment." />
        </div>
      )}

      {!organizationsQuery.isPending && !organizationsQuery.isError && organization === null && (
        <div className="mt-8">
          <EmptyState title="No organization found" description="Your account is not attached to an organization." />
        </div>
      )}

      {organization !== null && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Rename your organization. Its slug is fixed.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="organization-name">Name</Label>
                <Input id="organization-name" required value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-slug">Slug</Label>
                <Input id="organization-slug" value={organization.slug} disabled />
              </div>
              {errorMessage !== null && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              {savedMessage !== null && <p className="text-sm text-muted-foreground">{savedMessage}</p>}
              <Button type="submit" disabled={updateOrganization.isPending}>
                {updateOrganization.isPending ? "Saving…" : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
