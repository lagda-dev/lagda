import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { listOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `departments` — read-only catalog of department names seen across the org's employees. Readable by
// admin and owner (READ_EMPLOYEES).

const departmentSchema = z.object({ name: z.string() }).openapi("Department")

export const registerDepartments = (app: OpenAPIHono<{ Variables: AuthVariables }>, deps: ApiDependencies) => {
  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/departments",
    tags: ["departments"],
    summary: "List departments",
    middleware: [guard(deps, PERMISSIONS.READ_EMPLOYEES)] as const,
    request: { query: listQuerySchema },
    responses: {
      200: { description: "A page of departments", content: { "application/json": { schema: pageResponseSchema(departmentSchema) } } },
      ...errorResponses,
    },
  })

  return app.openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listDepartments)))
}
