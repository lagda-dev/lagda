import { useQuery } from "@tanstack/react-query"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"

// System health probe — the readiness signal surfaced on the dashboard. Not a `/api/v1` resource, just
// the typed system probe, kept alongside the resource hooks so the dashboard has a single import surface.

const fetchHealth = async () => fetchJson("health check", await api.api.v1.health.$get())

export const useHealth = () => useQuery({ queryKey: queryKeys.health, queryFn: fetchHealth })

export { fetchHealth }
