import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { itemOutcome, listOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, idParamSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `assignments` — entity-scoped binding of a template to a target audience. Managed by admin and
// owner (MANAGE_TEMPLATES).

const assignmentSchema = z
  .object({
    id: z.string(),
    entityId: z.string(),
    templateId: z.string(),
    target: z.record(z.unknown()),
  })
  .openapi("Assignment")

export const registerAssignments = (app: OpenAPIHono<{ Variables: AuthVariables }>, deps: ApiDependencies) => {
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

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listAssignments)))
    .openapi(itemRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getAssignment)))
}
