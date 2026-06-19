import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `assignments` — entity-scoped binding of a template to a target audience (MANAGE_TEMPLATES). As with
// templates, only the read routes (list + get-by-id) are threaded into `AppType` today; the create/
// update/delete write routes are not registered server-side. Add the matching mutation hooks here once
// those routes exist on the client, invalidating `queryKeys.assignments.all` on success.

export type AssignmentsPage = InferResponseType<typeof api.api.v1.assignments.$get, 200>
export type Assignment = InferResponseType<(typeof api.api.v1.assignments)[":id"]["$get"], 200>

const fetchAssignmentsList = async (params: CursorListParams): Promise<AssignmentsPage> =>
  fetchJson("list assignments", await api.api.v1.assignments.$get({ query: toListQuery(params) }))

const fetchAssignment = async (assignmentId: string): Promise<Assignment> =>
  fetchJson(`get assignment ${assignmentId}`, await api.api.v1.assignments[":id"].$get({ param: { id: assignmentId } }))

export const useAssignmentsList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.assignments.list({ cursor: params.cursor }), queryFn: () => fetchAssignmentsList(params) })

export const useAssignment = (assignmentId: string) =>
  useQuery({ queryKey: queryKeys.assignments.detail(assignmentId), queryFn: () => fetchAssignment(assignmentId), enabled: assignmentId.length > 0 })

export { fetchAssignmentsList, fetchAssignment }
