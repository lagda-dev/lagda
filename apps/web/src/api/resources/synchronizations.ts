import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import type { InferRequestType, InferResponseType } from "hono/client"
import { api } from "../client"
import { ApiError, fetchJson } from "../fetchJson"
import { noIdempotencyHeader } from "./mutationHeaders"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListFilters, toListQuery } from "./listParams"

// `synchronizations` — run and read directory→signature syncs (RUN_SYNCS). This is the one writable
// resource the server threads fully into `AppType`: list, get-by-id, the `/{id}/deployments` sub-list,
// a `$post` that enqueues a run (202 Accepted), and a `/{id}/cancel` `$post`. The verb in code is
// "synchronize" (§3) — never "sync".

export type SynchronizationsPage = InferResponseType<typeof api.api.v1.synchronizations.$get, 200>
export type Synchronization = InferResponseType<(typeof api.api.v1.synchronizations)[":id"]["$get"], 200>
export type SynchronizationAccepted = InferResponseType<typeof api.api.v1.synchronizations.$post, 202>
export type DeploymentsPage = InferResponseType<(typeof api.api.v1.synchronizations)[":id"]["deployments"]["$get"], 200>

// The POST body is inferred from the server's Zod schema (`{ target, templateId? }`), so the caller
// cannot pass a shape the server would reject.
export type CreateSynchronizationInput = InferRequestType<typeof api.api.v1.synchronizations.$post>["json"]

const fetchSynchronizationsList = async (params: CursorListParams): Promise<SynchronizationsPage> =>
  fetchJson("list synchronizations", await api.api.v1.synchronizations.$get({ query: toListQuery(params) }))

const fetchSynchronization = async (synchronizationId: string): Promise<Synchronization> =>
  fetchJson(`get synchronization ${synchronizationId}`, await api.api.v1.synchronizations[":id"].$get({ param: { id: synchronizationId } }))

const fetchDeploymentsList = async (synchronizationId: string, params: CursorListParams): Promise<DeploymentsPage> =>
  fetchJson(
    `list deployments for synchronization ${synchronizationId}`,
    await api.api.v1.synchronizations[":id"].deployments.$get({ param: { id: synchronizationId }, query: toListQuery(params) }),
  )

// Enqueue a new synchronization run. The server answers 202 with the accepted run id + status. These two
// write paths can't use `fetchJson`'s generic — the route declares non-200 success (202) and/or extra
// error statuses (409 on cancel), so the hc `.json()` union doesn't collapse to the success body — but
// they still fail loud through the SAME shared `ApiError` (never a hand-rolled `throw new Error`).
const createSynchronization = async (input: CreateSynchronizationInput): Promise<SynchronizationAccepted> => {
  const response = await api.api.v1.synchronizations.$post({ json: input, ...noIdempotencyHeader })
  if (!response.ok) throw new ApiError("create synchronization", response.status)
  return (await response.json()) as SynchronizationAccepted
}

// Cancel a running synchronization; the server returns the cancelled run (or 409 if already terminal).
const cancelSynchronization = async (synchronizationId: string): Promise<Synchronization> => {
  const response = await api.api.v1.synchronizations[":id"].cancel.$post({ param: { id: synchronizationId }, ...noIdempotencyHeader })
  if (!response.ok) throw new ApiError(`cancel synchronization ${synchronizationId}`, response.status)
  return (await response.json()) as Synchronization
}

export const useSynchronizationsList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.synchronizations.list(toListFilters(params)), queryFn: () => fetchSynchronizationsList(params) })

export const useSynchronization = (synchronizationId: string) =>
  useQuery({
    queryKey: queryKeys.synchronizations.detail(synchronizationId),
    queryFn: () => fetchSynchronization(synchronizationId),
    enabled: synchronizationId.length > 0,
  })

export const useSynchronizationDeployments = (synchronizationId: string, params: CursorListParams = {}) =>
  useQuery({
    queryKey: queryKeys.synchronizations.deployments(synchronizationId, toListFilters(params)),
    queryFn: () => fetchDeploymentsList(synchronizationId, params),
    enabled: synchronizationId.length > 0,
  })

// On a successful run the whole synchronizations list is stale — invalidate the namespace so any open
// list/detail refetches.
export const useCreateSynchronization = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSynchronization,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.synchronizations.all })
    },
  })
}

// A cancel changes both the run's detail and its place in the list, so invalidate both the namespace and
// that run's detail key.
export const useCancelSynchronization = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelSynchronization,
    onSuccess: (cancelled) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.synchronizations.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.synchronizations.detail(cancelled.id) })
    },
  })
}

export { fetchSynchronizationsList, fetchSynchronization, fetchDeploymentsList, createSynchronization, cancelSynchronization }
