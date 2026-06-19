import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lagda/ui"
import { Link } from "react-router-dom"

export const SettingsPage = () => (
  <main className="mx-auto max-w-3xl px-6 py-16">
    <header className="mb-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-muted-foreground">Organization configuration lands here.</p>
    </header>

    <Card>
      <CardHeader>
        <CardTitle>Coming soon</CardTitle>
        <CardDescription>Members, entities, directory connections, and notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  </main>
)
