import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import type { Schema } from "hono"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { claimsFrom, createOutcome, deleteOutcome, itemOutcome, listOutcome, updateOutcome } from "./handlers"
import { respondNoContent, respondOutcome } from "./respond"
import { errorResponses, idParamSchema, idempotencyHeaderSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `templates` — entity-scoped MJML signature templates. Managed by admin and owner (MANAGE_TEMPLATES).
// Create/update/delete bodies are Zod-validated at the boundary; the `entityId` and `id` are checked
// against the caller's org in the data layer so one tenant cannot write into another.

// Cap the MJML source so an authenticated client cannot post a multi-megabyte body that the renderer
// (`mjml2html`, CPU-heavy) would then compile — an unbounded-input exhaustion vector (§5). 256 KiB is
// far above any real signature template while keeping the compile bounded.
const MAX_MJML_SOURCE_LENGTH = 256 * 1024
// A signature template name is a short label; bound it too rather than accept arbitrary length.
const MAX_TEMPLATE_NAME_LENGTH = 200

const templateSchema = z
  .object({
    id: z.string(),
    entityId: z.string(),
    name: z.string(),
  })
  .openapi("Template")

const createTemplateBodySchema = z
  .object({
    entityId: z.string().min(1),
    name: z.string().min(1).max(MAX_TEMPLATE_NAME_LENGTH),
    mjmlSource: z.string().min(1).max(MAX_MJML_SOURCE_LENGTH),
  })
  .openapi("CreateTemplate")

// At least one editable field must be present so a PATCH is never a no-op.
const updateTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(MAX_TEMPLATE_NAME_LENGTH).optional(),
    mjmlSource: z.string().min(1).max(MAX_MJML_SOURCE_LENGTH).optional(),
  })
  .refine((body) => body.name !== undefined || body.mjmlSource !== undefined, { message: "At least one of name or mjmlSource is required" })
  .openapi("UpdateTemplate")

export const registerTemplates = <S extends Schema>(app: OpenAPIHono<{ Variables: AuthVariables }, S>, deps: ApiDependencies) => {
  const protect = guard(deps, PERMISSIONS.MANAGE_TEMPLATES)

  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/templates",
    tags: ["templates"],
    summary: "List templates",
    middleware: [protect] as const,
    request: { query: listQuerySchema },
    responses: {
      200: { description: "A page of templates", content: { "application/json": { schema: pageResponseSchema(templateSchema) } } },
      ...errorResponses,
    },
  })

  const itemRoute = createRoute({
    method: "get",
    path: "/api/v1/templates/{id}",
    tags: ["templates"],
    summary: "Get a template",
    middleware: [protect] as const,
    request: { params: idParamSchema },
    responses: {
      200: { description: "The template", content: { "application/json": { schema: templateSchema } } },
      ...errorResponses,
    },
  })

  const createTemplateRoute = createRoute({
    method: "post",
    path: "/api/v1/templates",
    tags: ["templates"],
    summary: "Create a template",
    middleware: [protect] as const,
    request: {
      headers: idempotencyHeaderSchema,
      body: { content: { "application/json": { schema: createTemplateBodySchema } } },
    },
    responses: {
      201: { description: "The created template", content: { "application/json": { schema: templateSchema } } },
      ...errorResponses,
    },
  })

  const updateTemplateRoute = createRoute({
    method: "patch",
    path: "/api/v1/templates/{id}",
    tags: ["templates"],
    summary: "Update a template",
    middleware: [protect] as const,
    request: {
      params: idParamSchema,
      body: { content: { "application/json": { schema: updateTemplateBodySchema } } },
    },
    responses: {
      200: { description: "The updated template", content: { "application/json": { schema: templateSchema } } },
      ...errorResponses,
    },
  })

  const deleteTemplateRoute = createRoute({
    method: "delete",
    path: "/api/v1/templates/{id}",
    tags: ["templates"],
    summary: "Delete a template",
    middleware: [protect] as const,
    request: { params: idParamSchema },
    responses: {
      204: { description: "The template was deleted" },
      ...errorResponses,
    },
  })

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listTemplates)))
    .openapi(itemRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getTemplate)))
    .openapi(createTemplateRoute, async (ctx) => {
      const { orgId } = claimsFrom(ctx)
      const { entityId, name, mjmlSource } = ctx.req.valid("json")
      return respondOutcome(ctx, await createOutcome(() => deps.repository.createTemplate({ orgId, entityId, name, mjmlSource })), 201)
    })
    .openapi(updateTemplateRoute, async (ctx) => {
      const { orgId } = claimsFrom(ctx)
      const { id } = ctx.req.valid("param")
      const { name, mjmlSource } = ctx.req.valid("json")
      return respondOutcome(ctx, await updateOutcome(() => deps.repository.updateTemplate({ orgId, id, name, mjmlSource })))
    })
    .openapi(deleteTemplateRoute, async (ctx) => {
      const { orgId } = claimsFrom(ctx)
      return respondNoContent(ctx, await deleteOutcome(() => deps.repository.deleteTemplate(orgId, ctx.req.valid("param").id)))
    })
}
