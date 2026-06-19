import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { InferRequestType, InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `organizations` — owner-only management surface (MANAGE_ORG); the caller only ever sees or mutates its
// own tenant, enforced server-side. List + get-by-id read it; PATCH updates its name (settings land here
// as more fields are exposed). The update body is inferred from the server schema, and the mutation
// invalidates `queryKeys.organizations.all` + that tenant's detail on success.

export type OrganizationsPage = InferResponseType<typeof api.api.v1.organizations.$get, 200>
export type Organization = InferResponseType<(typeof api.api.v1.organizations)[":id"]["$get"], 200>

// The update body, inferred straight from the server schema (currently `{ name?: string }`, refined to
// require at least one field). `UpdateOrganizationInput` pairs the path id with that partial body.
export type UpdateOrganizationBody = InferRequestType<(typeof api.api.v1.organizations)[":id"]["$patch"]>["json"]
export type UpdateOrganizationInput = { id: string; body: UpdateOrganizationBody }

const fetchOrganizationsList = async (params: CursorListParams): Promise<OrganizationsPage> =>
  fetchJson("list organizations", await api.api.v1.organizations.$get({ query: toListQuery(params) }))

const fetchOrganization = async (organizationId: string): Promise<Organization> =>
  fetchJson(`get organization ${organizationId}`, await api.api.v1.organizations[":id"].$get({ param: { id: organizationId } }))

export const useOrganizationsList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.organizations.list({ cursor: params.cursor }), queryFn: () => fetchOrganizationsList(params) })

export const useOrganization = (organizationId: string) =>
  useQuery({ queryKey: queryKeys.organizations.detail(organizationId), queryFn: () => fetchOrganization(organizationId), enabled: organizationId.length > 0 })

// Update an organization by id with a partial body (PATCH); the server answers 200 with the updated row.
const updateOrganization = async ({ id, body }: UpdateOrganizationInput): Promise<Organization> =>
  fetchJson(`update organization ${id}`, await api.api.v1.organizations[":id"].$patch({ param: { id }, json: body }))

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateOrganization,
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(updated.id) })
    },
  })
}

export { fetchOrganizationsList, fetchOrganization, updateOrganization }
