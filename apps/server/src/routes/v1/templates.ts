import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { itemOutcome, listOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, idParamSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `templates` — entity-scoped MJML signature templates. Managed by admin and owner (MANAGE_TEMPLATES).

const templateSchema = z
  .object({
    id: z.string(),
    entityId: z.string(),
    name: z.string(),
  })
  .openapi("Template")

export const registerTemplates = (app: OpenAPIHono<{ Variables: AuthVariables }>, deps: ApiDependencies) => {
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

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listTemplates)))
    .openapi(itemRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getTemplate)))
}
