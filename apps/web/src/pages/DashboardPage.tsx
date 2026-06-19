import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from "@lagda/ui"
import { useHealth } from "../api/hooks"

// Dashboard rendered inside the AppShell. Data fetching goes through the shared TanStack Query hook over
// the bearer-authenticated Hono RPC client (src/api/hooks.ts).
export const DashboardPage = () => {
  const healthQuery = useHealth()

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader title="Dashboard" description="Open-source email-signature management." />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>API connection</CardTitle>
          <CardDescription>Typed Hono RPC call to the application service.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {healthQuery.isPending && "Checking…"}
            {healthQuery.isError && "Unable to reach the API."}
            {healthQuery.data !== undefined && `Connected to ${healthQuery.data.service} (${healthQuery.data.status}).`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
