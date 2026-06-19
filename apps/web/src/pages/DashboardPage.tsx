import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lagda/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "../api/client"

const fetchHealth = async () => {
  const response = await api.api.v1.health.$get()
  return response.json()
}

export const DashboardPage = () => {
  const healthQuery = useQuery({ queryKey: ["health"], queryFn: fetchHealth })

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Lagda</h1>
        <p className="text-muted-foreground">Open-source email-signature management.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>API connection</CardTitle>
          <CardDescription>Typed Hono RPC call to the application service.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm">
            {healthQuery.isPending && "Checking…"}
            {healthQuery.isError && "Unable to reach the API."}
            {healthQuery.data !== undefined && `Connected to ${healthQuery.data.service} (${healthQuery.data.status}).`}
          </p>
          <Button asChild variant="outline">
            <Link to="/settings">Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
