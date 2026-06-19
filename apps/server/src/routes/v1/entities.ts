import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import type { Schema } from "hono"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { AuthVariables } from "../../middleware/authContext"
import { claimsFrom, createOutcome, itemOutcome, listOutcome, updateOutcome } from "./handlers"
import { respondOutcome } from "./respond"
import { errorResponses, idParamSchema, idempotencyHeaderSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"

// `entities` — brands/business units under an org (§5). Owner-only management (MANAGE_ENTITIES); read
// here as list + detail, write as create + update, always scoped to the caller's org via the claims.

const entitySchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    name: z.string(),
    slug: z.string(),
  })
  .openapi("Entity")

const createEntityBodySchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
  })
  .openapi("CreateEntity")

// At least one editable field must be present so a PATCH is never a no-op.
const updateEntityBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
  })
  .refine((body) => body.name !== undefined || body.slug !== undefined, { message: "At least one of name or slug is required" })
  .openapi("UpdateEntity")

export const registerEntities = <S extends Schema>(app: OpenAPIHono<{ Variables: AuthVariables }, S>, deps: ApiDependencies) => {
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

  const createEntityRoute = createRoute({
    method: "post",
    path: "/api/v1/entities",
    tags: ["entities"],
    summary: "Create an entity",
    middleware: [protect] as const,
    request: {
      headers: idempotencyHeaderSchema,
      body: { content: { "application/json": { schema: createEntityBodySchema } } },
    },
    responses: {
      201: { description: "The created entity", content: { "application/json": { schema: entitySchema } } },
      ...errorResponses,
    },
  })

  const updateEntityRoute = createRoute({
    method: "patch",
    path: "/api/v1/entities/{id}",
    tags: ["entities"],
    summary: "Update an entity",
    middleware: [protect] as const,
    request: {
      params: idParamSchema,
      body: { content: { "application/json": { schema: updateEntityBodySchema } } },
    },
    responses: {
      200: { description: "The updated entity", content: { "application/json": { schema: entitySchema } } },
      ...errorResponses,
    },
  })

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listEntities)))
    .openapi(itemRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getEntity)))
    .openapi(createEntityRoute, async (ctx) => {
      const { orgId } = claimsFrom(ctx)
      const { name, slug } = ctx.req.valid("json")
      return respondOutcome(ctx, await createOutcome(() => deps.repository.createEntity({ orgId, name, slug })), 201)
    })
    .openapi(updateEntityRoute, async (ctx) => {
      const { orgId } = claimsFrom(ctx)
      const { id } = ctx.req.valid("param")
      const { name, slug } = ctx.req.valid("json")
      return respondOutcome(ctx, await updateOutcome(() => deps.repository.updateEntity({ orgId, id, name, slug })))
    })
}
