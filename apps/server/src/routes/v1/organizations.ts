import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import type { Schema } from "hono"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { itemOutcome, listOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, idParamSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `organizations` — owner-only management surface, read here as list + detail. The caller only ever
// sees its own tenant (claims.orgId), enforced in the handler.

const organizationSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  })
  .openapi("Organization")

export const registerOrganizations = <S extends Schema>(app: OpenAPIHono<{ Variables: AuthVariables }, S>, deps: ApiDependencies) => {
  const protect = guard(deps, PERMISSIONS.MANAGE_ORG)

  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/organizations",
    tags: ["organizations"],
    summary: "List organizations",
    middleware: [protect] as const,
    request: { query: listQuerySchema },
    responses: {
      200: { description: "A page of organizations", content: { "application/json": { schema: pageResponseSchema(organizationSchema) } } },
      ...errorResponses,
    },
  })

  const itemRoute = createRoute({
    method: "get",
    path: "/api/v1/organizations/{id}",
    tags: ["organizations"],
    summary: "Get an organization",
    middleware: [protect] as const,
    request: { params: idParamSchema },
    responses: {
      200: { description: "The organization", content: { "application/json": { schema: organizationSchema } } },
      ...errorResponses,
    },
  })

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listOrganizations)))
    .openapi(itemRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getOrganization)))
}
