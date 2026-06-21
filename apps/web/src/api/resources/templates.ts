import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { InferRequestType, InferResponseType } from "hono/client"
import { api } from "../client"
import { fetchJson, fetchVoid } from "../fetchJson"
import { noIdempotencyHeader } from "./mutationHeaders"
import { queryKeys } from "../queryKeys"
import type { CursorListParams } from "./listParams"
import { toListFilters, toListQuery } from "./listParams"

// `templates` — entity-scoped MJML signature templates (MANAGE_TEMPLATES). List + get-by-id read the
// directory; create/update/delete are the Wave-4 write routes now threaded into `AppType`. Each mutation
// invalidates `queryKeys.templates.all` on success so any open list/detail refetches; the request bodies
// are inferred from the server's Zod schemas (`InferRequestType`) so the caller cannot send a rejected shape.

export type TemplatesPage = InferResponseType<typeof api.api.v1.templates.$get, 200>
export type Template = InferResponseType<(typeof api.api.v1.templates)[":id"]["$get"], 200>

// The create/update bodies, inferred straight from the server schemas (create: `{ entityId, name, mjmlSource }`;
// update: at least one of `{ name?, mjmlSource? }`). `UpdateTemplateInput` pairs the path id with that body.
export type CreateTemplateInput = InferRequestType<typeof api.api.v1.templates.$post>["json"]
export type UpdateTemplateBody = InferRequestType<(typeof api.api.v1.templates)[":id"]["$patch"]>["json"]
export type UpdateTemplateInput = { id: string; body: UpdateTemplateBody }

const fetchTemplatesList = async (params: CursorListParams): Promise<TemplatesPage> =>
  fetchJson("list templates", await api.api.v1.templates.$get({ query: toListQuery(params) }))

const fetchTemplate = async (templateId: string): Promise<Template> =>
  fetchJson(`get template ${templateId}`, await api.api.v1.templates[":id"].$get({ param: { id: templateId } }))

export const useTemplatesList = (params: CursorListParams = {}) =>
  useQuery({ queryKey: queryKeys.templates.list(toListFilters(params)), queryFn: () => fetchTemplatesList(params) })

export const useTemplate = (templateId: string) =>
  useQuery({ queryKey: queryKeys.templates.detail(templateId), queryFn: () => fetchTemplate(templateId), enabled: templateId.length > 0 })

// Create a template: the server answers 201 with the created row.
const createTemplate = async (input: CreateTemplateInput): Promise<Template> =>
  fetchJson("create template", await api.api.v1.templates.$post({ json: input, ...noIdempotencyHeader }))

// Update a template by id with a partial body (PATCH); the server answers 200 with the updated row.
const updateTemplate = async ({ id, body }: UpdateTemplateInput): Promise<Template> =>
  fetchJson(`update template ${id}`, await api.api.v1.templates[":id"].$patch({ param: { id }, json: body }))

// Delete a template by id; the server answers 204 with no body, so we return void.
const deleteTemplate = async (templateId: string): Promise<void> =>
  fetchVoid(`delete template ${templateId}`, await api.api.v1.templates[":id"].$delete({ param: { id: templateId } }))

export const useCreateTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates.all })
    },
  })
}

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(updated.id) })
    },
  })
}

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates.all })
    },
  })
}

export { fetchTemplatesList, fetchTemplate, createTemplate, updateTemplate, deleteTemplate }
