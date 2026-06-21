import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { InferRequestType, InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson, fetchVoid } from "../fetchJson"
import { noIdempotencyHeader } from "./mutationHeaders"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListFilters, toListQuery } from "./listParams"

// `assignments` — entity-scoped binding of a template to a target audience (MANAGE_TEMPLATES). Read here
// as list + get-by-id; create + delete are the Wave-4 write routes now threaded into `AppType`. The create
// body (`{ entityId, templateId, target }`) is inferred from the server schema, and both mutations
// invalidate `queryKeys.assignments.all` on success so any open list refetches.

export type AssignmentsPage = InferResponseType<typeof api.api.v1.assignments.$get, 200>
export type Assignment = InferResponseType<(typeof api.api.v1.assignments)[":id"]["$get"], 200>

// The create body, inferred straight from the server's Zod schema — `target` is the open record the
// server validates further (the SPA builds it from the §15 discriminated target selector).
export type CreateAssignmentInput = InferRequestType<typeof api.api.v1.assignments.$post>["json"]

const fetchAssignmentsList = async (params: CursorListParams): Promise<AssignmentsPage> =>
  fetchJson("list assignments", await api.api.v1.assignments.$get({ query: toListQuery(params) }))

const fetchAssignment = async (assignmentId: string): Promise<Assignment> =>
  fetchJson(`get assignment ${assignmentId}`, await api.api.v1.assignments[":id"].$get({ param: { id: assignmentId } }))

export const useAssignmentsList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.assignments.list(toListFilters(params)), queryFn: () => fetchAssignmentsList(params) })

export const useAssignment = (assignmentId: string) =>
  useQuery({ queryKey: queryKeys.assignments.detail(assignmentId), queryFn: () => fetchAssignment(assignmentId), enabled: assignmentId.length > 0 })

// Create an assignment: the server answers 201 with the created row.
const createAssignment = async (input: CreateAssignmentInput): Promise<Assignment> =>
  fetchJson("create assignment", await api.api.v1.assignments.$post({ json: input, ...noIdempotencyHeader }))

// Delete an assignment by id; the server answers 204 with no body, so we return void.
const deleteAssignment = async (assignmentId: string): Promise<void> =>
  fetchVoid(`delete assignment ${assignmentId}`, await api.api.v1.assignments[":id"].$delete({ param: { id: assignmentId } }))

export const useCreateAssignment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all })
    },
  })
}

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all })
    },
  })
}

export { fetchAssignmentsList, fetchAssignment, createAssignment, deleteAssignment }
