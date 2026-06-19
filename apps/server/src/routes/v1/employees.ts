import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import type { Schema } from "hono"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { itemOutcome, listOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, idParamSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `employees` — directory-synced signature recipients (§4: distinct from `users`). Readable by admin
// and owner (READ_EMPLOYEES). For the public API the `directory:read` scope is required too.

const employeeSchema = z
  .object({
    id: z.string(),
    entityId: z.string(),
    email: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    department: z.string().nullable(),
    jobTitle: z.string().nullable(),
  })
  .openapi("Employee")

export const registerEmployees = <S extends Schema>(app: OpenAPIHono<{ Variables: AuthVariables }, S>, deps: ApiDependencies) => {
  const protect = guard(deps, PERMISSIONS.READ_EMPLOYEES, "directory:read")

  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/employees",
    tags: ["employees"],
    summary: "List employees",
    middleware: [protect] as const,
    request: { query: listQuerySchema },
    responses: {
      200: { description: "A page of employees", content: { "application/json": { schema: pageResponseSchema(employeeSchema) } } },
      ...errorResponses,
    },
  })

  const itemRoute = createRoute({
    method: "get",
    path: "/api/v1/employees/{id}",
    tags: ["employees"],
    summary: "Get an employee",
    middleware: [protect] as const,
    request: { params: idParamSchema },
    responses: {
      200: { description: "The employee", content: { "application/json": { schema: employeeSchema } } },
      ...errorResponses,
    },
  })

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listEmployees)))
    .openapi(itemRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getEmployee)))
}
