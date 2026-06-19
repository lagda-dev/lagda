import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `audit-events` — the read-only window onto the append-only audit log (owner-only, MANAGE_ORG). One
// list query, cursor-paginated; the row shape (actor / action / target / createdAt) is inferred from the
// server schema so the screen and the type can never drift apart.

export type AuditEventsPage = InferResponseType<(typeof api.api.v1)["audit-events"]["$get"], 200>
export type AuditEvent = AuditEventsPage["data"][number]

const fetchAuditEventsList = async (params: CursorListParams): Promise<AuditEventsPage> =>
  fetchJson("list audit events", await api.api.v1["audit-events"].$get({ query: toListQuery(params) }))

export const useAuditEventsList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.auditEvents.list({ cursor: params.cursor }), queryFn: () => fetchAuditEventsList(params) })

export { fetchAuditEventsList }
