import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { itemOutcome, listOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, idParamSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `entities` — brands/business units under an org (§5). Owner-only management, read here as list +
// detail, always scoped to the caller's org.

const entitySchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    name: z.string(),
    slug: z.string(),
  })
  .openapi("Entity")

export const registerEntities = (app: OpenAPIHono<{ Variables: AuthVariables }>, deps: ApiDependencies) => {
  const protect = guard(deps, PERMISSIONS.MANAGE_ENTITIES)

  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/entities",
    tags: ["entities"],
    summary: "List entities",
    middleware: [protect] as const,
    request: { query: listQuerySchema },
    responses: {
      200: { description: "A page of entities", content: { "application/json": { schema: pageResponseSchema(entitySchema) } } },
      ...errorResponses,
    },
  })

  const itemRoute = createRoute({
    method: "get",
    path: "/api/v1/entities/{id}",
    tags: ["entities"],
    summary: "Get an entity",
    middleware: [protect] as const,
    request: { params: idParamSchema },
    responses: {
      200: { description: "The entity", content: { "application/json": { schema: entitySchema } } },
      ...errorResponses,
    },
  })

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listEntities)))
    .openapi(itemRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getEntity)))
}
