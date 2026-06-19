import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { InferRequestType, InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { noIdempotencyHeader } from "./mutationHeaders"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `entities` — brands/business units under an org (§5; MANAGE_ENTITIES). Read here as list + detail, the
// list feeding the employee directory's entity filter; create + update are the Wave-4 write routes now
// threaded into `AppType`. Bodies are inferred from the server schemas; mutations invalidate
// `queryKeys.entities.all`. Always scoped to the caller's org server-side.

export type EntitiesPage = InferResponseType<typeof api.api.v1.entities.$get, 200>
export type Entity = InferResponseType<(typeof api.api.v1.entities)[":id"]["$get"], 200>

// The create/update bodies, inferred straight from the server schemas (create: `{ name, slug }`; update:
// at least one of `{ name?, slug? }`). `UpdateEntityInput` pairs the path id with that partial body.
export type CreateEntityInput = InferRequestType<typeof api.api.v1.entities.$post>["json"]
export type UpdateEntityBody = InferRequestType<(typeof api.api.v1.entities)[":id"]["$patch"]>["json"]
export type UpdateEntityInput = { id: string; body: UpdateEntityBody }

const fetchEntitiesList = async (params: CursorListParams): Promise<EntitiesPage> =>
  fetchJson("list entities", await api.api.v1.entities.$get({ query: toListQuery(params) }))

const fetchEntity = async (entityId: string): Promise<Entity> =>
  fetchJson(`get entity ${entityId}`, await api.api.v1.entities[":id"].$get({ param: { id: entityId } }))

export const useEntitiesList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.entities.list({ cursor: params.cursor }), queryFn: () => fetchEntitiesList(params) })

export const useEntity = (entityId: string) =>
  useQuery({ queryKey: queryKeys.entities.detail(entityId), queryFn: () => fetchEntity(entityId), enabled: entityId.length > 0 })

// Create an entity: the server answers 201 with the created row.
const createEntity = async (input: CreateEntityInput): Promise<Entity> =>
  fetchJson("create entity", await api.api.v1.entities.$post({ json: input, ...noIdempotencyHeader }))

// Update an entity by id with a partial body (PATCH); the server answers 200 with the updated row.
const updateEntity = async ({ id, body }: UpdateEntityInput): Promise<Entity> =>
  fetchJson(`update entity ${id}`, await api.api.v1.entities[":id"].$patch({ param: { id }, json: body }))

export const useCreateEntity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEntity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entities.all })
    },
  })
}

export const useUpdateEntity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateEntity,
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entities.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.entities.detail(updated.id) })
    },
  })
}

export { fetchEntitiesList, fetchEntity, createEntity, updateEntity }
