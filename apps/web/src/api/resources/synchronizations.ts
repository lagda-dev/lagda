import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import type { InferRequestType, InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

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

// The optional `Idempotency-Key` header every POST accepts (§4). The server treats it as optional, but
// the typed client still expects the header object to be present, so we always pass an empty one.
const noIdempotencyHeader = { header: {} } as const

// Enqueue a new synchronization run. The server answers 202 with the accepted run id + status.
const createSynchronization = async (input: CreateSynchronizationInput): Promise<SynchronizationAccepted> => {
  const response = await api.api.v1.synchronizations.$post({ json: input, ...noIdempotencyHeader })
  if (!response.ok) throw new Error(`Request "create synchronization" failed with status ${response.status}`)
  return response.json()
}

// Cancel a running synchronization; the server returns the cancelled run.
const cancelSynchronization = async (synchronizationId: string): Promise<Synchronization> =>
  fetchJson(
    `cancel synchronization ${synchronizationId}`,
    await api.api.v1.synchronizations[":id"].cancel.$post({ param: { id: synchronizationId }, ...noIdempotencyHeader }),
  )

export const useSynchronizationsList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.synchronizations.list({ cursor: params.cursor }), queryFn: () => fetchSynchronizationsList(params) })

export const useSynchronization = (synchronizationId: string) =>
  useQuery({
    queryKey: queryKeys.synchronizations.detail(synchronizationId),
    queryFn: () => fetchSynchronization(synchronizationId),
    enabled: synchronizationId.length > 0,
  })

export const useSynchronizationDeployments = (synchronizationId: string, params: CursorListParams = {}) =>
  useQuery({
    queryKey: queryKeys.synchronizations.deployments(synchronizationId, { cursor: params.cursor }),
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
