import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `organizations` — owner-only read surface (MANAGE_ORG); the caller only ever sees its own tenant,
// enforced server-side. List + get-by-id, both inferred from the server schema.

export type OrganizationsPage = InferResponseType<typeof api.api.v1.organizations.$get, 200>
export type Organization = InferResponseType<(typeof api.api.v1.organizations)[":id"]["$get"], 200>

const fetchOrganizationsList = async (params: CursorListParams): Promise<OrganizationsPage> =>
  fetchJson("list organizations", await api.api.v1.organizations.$get({ query: toListQuery(params) }))

const fetchOrganization = async (organizationId: string): Promise<Organization> =>
  fetchJson(`get organization ${organizationId}`, await api.api.v1.organizations[":id"].$get({ param: { id: organizationId } }))

export const useOrganizationsList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.organizations.list({ cursor: params.cursor }), queryFn: () => fetchOrganizationsList(params) })

export const useOrganization = (organizationId: string) =>
  useQuery({ queryKey: queryKeys.organizations.detail(organizationId), queryFn: () => fetchOrganization(organizationId), enabled: organizationId.length > 0 })

export { fetchOrganizationsList, fetchOrganization }
