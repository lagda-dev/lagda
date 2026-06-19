import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from "@lagda/ui"

// Settings is an owner-only area (gated by RequireRole MANAGE_ORG in main.tsx — UX only; the server
// enforces the same matrix). Rendered inside the AppShell.
export const SettingsPage = () => (
  <div className="mx-auto max-w-3xl px-6 py-10">
    <PageHeader title="Settings" description="Organization configuration lands here." />

    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Coming soon</CardTitle>
        <CardDescription>Members, entities, directory connections, and notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Owner-only configuration surfaces will be added in a later wave.</p>
      </CardContent>
    </Card>
  </div>
)
