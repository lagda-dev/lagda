import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `roles` — read-only catalog of the org's role vocabulary (READ_EMPLOYEES). List-only, cursor-paginated.

export type RolesPage = InferResponseType<typeof api.api.v1.roles.$get, 200>
export type RoleRecord = RolesPage["data"][number]

const fetchRolesList = async (params: CursorListParams): Promise<RolesPage> =>
  fetchJson("list roles", await api.api.v1.roles.$get({ query: toListQuery(params) }))

export const useRolesList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.roles.list({ cursor: params.cursor }), queryFn: () => fetchRolesList(params) })

export { fetchRolesList }
