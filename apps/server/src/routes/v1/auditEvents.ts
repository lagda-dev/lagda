import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { listOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `audit-events` — read-only view of the append-only audit log (§8). Owner-only (MANAGE_ORG) because
// it surfaces security-relevant activity across the org.

const auditEventSchema = z
  .object({
    id: z.string(),
    actor: z.string(),
    action: z.string(),
    target: z.string(),
    createdAt: z.string(),
  })
  .openapi("AuditEvent")

export const registerAuditEvents = (app: OpenAPIHono<{ Variables: AuthVariables }>, deps: ApiDependencies) => {
  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/audit-events",
    tags: ["audit-events"],
    summary: "List audit events",
    middleware: [guard(deps, PERMISSIONS.MANAGE_ORG)] as const,
    request: { query: listQuerySchema },
    responses: {
      200: { description: "A page of audit events", content: { "application/json": { schema: pageResponseSchema(auditEventSchema) } } },
      ...errorResponses,
    },
  })

  return app.openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listAuditEvents)))
}
