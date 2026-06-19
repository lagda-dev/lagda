import { useQuery } from "@tanstack/react-query"
import type { InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson } from "../fetchJson"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListQuery } from "./listParams"

// `templates` — entity-scoped MJML signature templates (MANAGE_TEMPLATES). List + get-by-id are the only
// accessors the server currently threads into `AppType`; the create/update/delete write routes are not
// yet registered on the server, so there is nothing type-safe to call for them. When those POST/PATCH/
// DELETE routes land on `AppType`, add `useCreateTemplate`/`useUpdateTemplate`/`useDeleteTemplate` here,
// invalidating `queryKeys.templates.all` on success — no `any`, the types come from the client.

export type TemplatesPage = InferResponseType<typeof api.api.v1.templates.$get, 200>
export type Template = InferResponseType<(typeof api.api.v1.templates)[":id"]["$get"], 200>

const fetchTemplatesList = async (params: CursorListParams): Promise<TemplatesPage> =>
  fetchJson("list templates", await api.api.v1.templates.$get({ query: toListQuery(params) }))

const fetchTemplate = async (templateId: string): Promise<Template> =>
  fetchJson(`get template ${templateId}`, await api.api.v1.templates[":id"].$get({ param: { id: templateId } }))

export const useTemplatesList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.templates.list({ cursor: params.cursor }), queryFn: () => fetchTemplatesList(params) })

export const useTemplate = (templateId: string) =>
  useQuery({ queryKey: queryKeys.templates.detail(templateId), queryFn: () => fetchTemplate(templateId), enabled: templateId.length > 0 })

export { fetchTemplatesList, fetchTemplate }
