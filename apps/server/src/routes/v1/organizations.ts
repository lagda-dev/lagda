import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import type { Schema } from "hono"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { claimsFrom, itemOutcome, listOutcome, updateOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, idParamSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `organizations` — owner-only management surface (MANAGE_ORG), read here as list + detail and
// updated via PATCH. The caller only ever sees or mutates its own tenant (claims.orgId), enforced in
// the handler and re-checked in the data layer (`id === orgId`).

const organizationSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  })
  .openapi("Organization")

// At least one editable field must be present so a PATCH is never a no-op. Settings land here as more
// fields are exposed; for now the name is the only mutable field.
const updateOrganizationBodySchema = z
  .object({
    name: z.string().min(1).optional(),
  })
  .refine((body) => body.name !== undefined, { message: "At least one updatable field is required" })
  .openapi("UpdateOrganization")

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

  const updateOrganizationRoute = createRoute({
    method: "patch",
    path: "/api/v1/organizations/{id}",
    tags: ["organizations"],
    summary: "Update an organization",
    middleware: [protect] as const,
    request: {
      params: idParamSchema,
      body: { content: { "application/json": { schema: updateOrganizationBodySchema } } },
    },
    responses: {
      200: { description: "The updated organization", content: { "application/json": { schema: organizationSchema } } },
      ...errorResponses,
    },
  })

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listOrganizations)))
    .openapi(itemRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getOrganization)))
    .openapi(updateOrganizationRoute, async (ctx) => {
      const { orgId } = claimsFrom(ctx)
      const { id } = ctx.req.valid("param")
      const { name } = ctx.req.valid("json")
      return respondOutcome(ctx, await updateOutcome(() => deps.repository.updateOrganization({ orgId, id, name })))
    })
}
