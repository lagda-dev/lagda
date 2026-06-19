import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `entities` — brands/business units under an org (§5; MANAGE_ENTITIES). Read here as list + detail, the
// list feeding the employee directory's entity filter. Always scoped to the caller's org server-side.

export type EntitiesPage = InferResponseType<typeof api.api.v1.entities.$get, 200>
export type Entity = InferResponseType<(typeof api.api.v1.entities)[":id"]["$get"], 200>

const fetchEntitiesList = async (params: CursorListParams): Promise<EntitiesPage> =>
  fetchJson("list entities", await api.api.v1.entities.$get({ query: toListQuery(params) }))

const fetchEntity = async (entityId: string): Promise<Entity> =>
  fetchJson(`get entity ${entityId}`, await api.api.v1.entities[":id"].$get({ param: { id: entityId } }))

export const useEntitiesList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.entities.list({ cursor: params.cursor }), queryFn: () => fetchEntitiesList(params) })

export const useEntity = (entityId: string) =>
  useQuery({ queryKey: queryKeys.entities.detail(entityId), queryFn: () => fetchEntity(entityId), enabled: entityId.length > 0 })

export { fetchEntitiesList, fetchEntity }
