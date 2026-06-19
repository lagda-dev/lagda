import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import type { Schema } from "hono"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { listOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `roles` — read-only catalog of the org's role vocabulary. Readable by admin and owner
// (READ_EMPLOYEES).

const roleSchema = z.object({ name: z.string() }).openapi("Role")

export const registerRoles = <S extends Schema>(app: OpenAPIHono<{ Variables: AuthVariables }, S>, deps: ApiDependencies) => {
  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/roles",
    tags: ["roles"],
    summary: "List roles",
    middleware: [guard(deps, PERMISSIONS.READ_EMPLOYEES)] as const,
    request: { query: listQuerySchema },
    responses: {
      200: { description: "A page of roles", content: { "application/json": { schema: pageResponseSchema(roleSchema) } } },
      ...errorResponses,
    },
  })

  return app.openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listRoles)))
}
