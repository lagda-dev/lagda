import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import type { Schema } from "hono"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { claimsFrom, createOutcome, deleteOutcome, itemOutcome, listOutcome } from "./handlers"
import { respondNoContent, respondOutcome } from "./respond"
import { errorResponses, idParamSchema, idempotencyHeaderSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `assignments` — entity-scoped binding of a template to a target audience. Managed by admin and
// owner (MANAGE_TEMPLATES). Create/delete bodies are Zod-validated; the entity and template ids are
// checked against the caller's org in the data layer so one tenant cannot bind another's resources.

const assignmentSchema = z
  .object({
    id: z.string(),
    entityId: z.string(),
    templateId: z.string(),
    target: z.record(z.unknown()),
  })
  .openapi("Assignment")

const createAssignmentBodySchema = z
  .object({
    entityId: z.string().min(1),
    templateId: z.string().min(1),
    target: z.record(z.unknown()),
  })
  .openapi("CreateAssignment")

export const registerAssignments = <S extends Schema>(app: OpenAPIHono<{ Variables: AuthVariables }, S>, deps: ApiDependencies) => {
  const protect = guard(deps, PERMISSIONS.MANAGE_TEMPLATES)

  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/assignments",
    tags: ["assignments"],
    summary: "List assignments",
    middleware: [protect] as const,
    request: { query: listQuerySchema },
    responses: {
      200: { description: "A page of assignments", content: { "application/json": { schema: pageResponseSchema(assignmentSchema) } } },
      ...errorResponses,
    },
  })

  const itemRoute = createRoute({
    method: "get",
    path: "/api/v1/assignments/{id}",
    tags: ["assignments"],
    summary: "Get an assignment",
    middleware: [protect] as const,
    request: { params: idParamSchema },
    responses: {
      200: { description: "The assignment", content: { "application/json": { schema: assignmentSchema } } },
      ...errorResponses,
    },
  })

  const createAssignmentRoute = createRoute({
    method: "post",
    path: "/api/v1/assignments",
    tags: ["assignments"],
    summary: "Create an assignment",
    middleware: [protect] as const,
    request: {
      headers: idempotencyHeaderSchema,
      body: { content: { "application/json": { schema: createAssignmentBodySchema } } },
    },
    responses: {
      201: { description: "The created assignment", content: { "application/json": { schema: assignmentSchema } } },
      ...errorResponses,
    },
  })

  const deleteAssignmentRoute = createRoute({
    method: "delete",
    path: "/api/v1/assignments/{id}",
    tags: ["assignments"],
    summary: "Delete an assignment",
    middleware: [protect] as const,
    request: { params: idParamSchema },
    responses: {
      204: { description: "The assignment was deleted" },
      ...errorResponses,
    },
  })

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listAssignments)))
    .openapi(itemRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getAssignment)))
    .openapi(createAssignmentRoute, async (ctx) => {
      const { orgId } = claimsFrom(ctx)
      const { entityId, templateId, target } = ctx.req.valid("json")
      return respondOutcome(ctx, await createOutcome(() => deps.repository.createAssignment({ orgId, entityId, templateId, target })), 201)
    })
    .openapi(deleteAssignmentRoute, async (ctx) => {
      const { orgId } = claimsFrom(ctx)
      return respondNoContent(ctx, await deleteOutcome(() => deps.repository.deleteAssignment(orgId, ctx.req.valid("param").id)))
    })
}
