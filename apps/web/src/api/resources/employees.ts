import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `employees` — the directory of synced signature recipients (read-only; READ_EMPLOYEES). The page
// envelope and the single-employee shape are both inferred straight from the server's Zod schema, so a
// schema change here is a typecheck error rather than a runtime surprise.

export type EmployeesPage = InferResponseType<typeof api.api.v1.employees.$get, 200>
export type Employee = InferResponseType<(typeof api.api.v1.employees)[":id"]["$get"], 200>

// The optional filters the directory screen narrows by — both server-validated, both forwarded as query
// params alongside pagination.
export type EmployeeListFilters = CursorListParams & {
  entityId?: string
  department?: string
}

// One named fetcher per resource (pure async, independently testable). It builds the cursor query, asks
// the typed client, and unwraps the `{ data, nextCursor }` envelope — throwing on any non-ok response.
const fetchEmployeesList = async (filters: EmployeeListFilters): Promise<EmployeesPage> => {
  const { entityId, department, ...pagination } = filters
  const query = toListQuery(pagination)
  if (entityId !== undefined && entityId.length > 0) query.entityId = entityId
  if (department !== undefined && department.length > 0) query.department = department
  return fetchJson("list employees", await api.api.v1.employees.$get({ query }))
}

const fetchEmployee = async (employeeId: string): Promise<Employee> =>
  fetchJson(`get employee ${employeeId}`, await api.api.v1.employees[":id"].$get({ param: { id: employeeId } }))

// The list key folds the active filters in so a filtered view caches independently of the unfiltered one.
const employeesListKey = ({ cursor, entityId, department }: EmployeeListFilters) => queryKeys.employees.list({ cursor, entityId, department })

export const useEmployeesList = (filters: EmployeeListFilters = {}) =>
  useQuery({ queryKey: employeesListKey(filters), queryFn: () => fetchEmployeesList(filters) })

export const useEmployee = (employeeId: string) =>
  useQuery({ queryKey: queryKeys.employees.detail(employeeId), queryFn: () => fetchEmployee(employeeId), enabled: employeeId.length > 0 })

export { fetchEmployeesList, fetchEmployee }
