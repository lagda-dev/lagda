import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `departments` — read-only catalog of department names (READ_EMPLOYEES). Used to populate the employee
// directory's department filter. Cursor-paginated like every list, though the catalog is typically small.

export type DepartmentsPage = InferResponseType<typeof api.api.v1.departments.$get, 200>
export type Department = DepartmentsPage["data"][number]

const fetchDepartmentsList = async (params: CursorListParams): Promise<DepartmentsPage> =>
  fetchJson("list departments", await api.api.v1.departments.$get({ query: toListQuery(params) }))

export const useDepartmentsList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.departments.list({ cursor: params.cursor }), queryFn: () => fetchDepartmentsList(params) })

export { fetchDepartmentsList }
