import { useQuery } from "@tanstack/react-query"
import { api } from "./client"

// The typed query-hook pattern over the bearer-authenticated Hono RPC client. Wave 4 follows this shape:
// one named fetcher per resource (storytelling name + explicit error handling), wrapped in a thin hook
// whose only job is the query-key + queryFn wiring. Keep fetchers pure async functions so they stay
// unit-testable independently of React.
//
// Only the health probe is wired here: the public /api/v1 resources are registered on the server but
// not yet part of the RPC AppType, so they aren't reachable through the typed client. Wave 4 exposes the
// v1 routes in AppType (a server change) and then adds the per-resource hooks against this same pattern.

const QUERY_KEYS = {
  health: ["health"] as const,
}

// System health probe — the readiness signal surfaced on the dashboard.
const fetchHealth = async () => {
  const response = await api.api.v1.health.$get()
  if (!response.ok) throw new Error(`Health check failed with status ${response.status}`)
  return response.json()
}

export const useHealth = () => useQuery({ queryKey: QUERY_KEYS.health, queryFn: fetchHealth })
