import { Button, EmptyState } from "@lagda/ui"
import { useNavigate } from "react-router-dom"

// Friendly catch-all for unknown routes inside the authed shell, so a stray URL shows a usable page
// instead of the framework's raw error boundary.
export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <EmptyState
        title="Page not found"
        description="That page doesn't exist yet — it may be a feature still in progress."
        action={<Button onClick={() => navigate("/")}>Back to dashboard</Button>}
      />
    </main>
  )
}
