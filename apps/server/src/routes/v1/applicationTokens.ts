import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { PERMISSIONS, TOKEN_SCOPES } from "@lagda/auth-contract"
import { getErrorMessage } from "@lagda/core"
import type { Context, Schema } from "hono"
import type { ApplicationTokenRecord } from "../../applicationTokens/applicationTokens"
import { listApplicationTokens, mintApplicationToken, revokeApplicationToken } from "../../applicationTokens/applicationTokens"
import type { AuthVariables } from "../../middleware/authContext"
import { claimsFrom, failOutcome, okOutcome } from "./handlers"
import type { Outcome } from "./handlers"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"
import { respondOutcome } from "./respond"
import { errorResponses, idParamSchema, idempotencyHeaderSchema } from "./schemas"

// `application-tokens` — scoped, org-bound bearer tokens for the public REST API (§4, §6). Owner and
// admin only (`MANAGE_TOKENS`, enforced once by the route guard). The plaintext secret is returned only
// at mint time and never again; list/revoke responses expose the metadata but NEVER the hash.

const scopeSchema = z.enum(TOKEN_SCOPES)

// The client-safe view of a token — no `hashedToken`, no plaintext.
const applicationTokenSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    scopes: z.array(scopeSchema),
    createdAt: z.string(),
    revokedAt: z.string().nullable(),
  })
  .openapi("ApplicationToken")

// The one-time mint response: the safe view plus the plaintext secret, shown exactly once.
const mintedApplicationTokenSchema = applicationTokenSchema.extend({ token: z.string() }).openapi("MintedApplicationToken")

const createBodySchema = z
  .object({
    name: z.string().min(1).max(100),
    scopes: z.array(scopeSchema).min(1),
  })
  .openapi("CreateApplicationToken")

type ApplicationTokenSummary = z.infer<typeof applicationTokenSchema>

// Project a domain record to the client-safe summary (drops the hash; serialises timestamps to ISO).
const toSummary = (record: ApplicationTokenRecord): ApplicationTokenSummary => ({
  id: record.id,
  name: record.name,
  scopes: [...record.scopes],
  createdAt: record.createdAt.toISOString(),
  revokedAt: record.revokedAt === null ? null : record.revokedAt.toISOString(),
})

const listTokensOutcome = async (ctx: Context, deps: ApiDependencies): Promise<Outcome<ApplicationTokenSummary[]>> => {
  const { orgId } = claimsFrom(ctx)
  try {
    const records = await listApplicationTokens(deps.applicationTokenStore)(orgId)
    return okOutcome(records.map(toSummary))
  } catch (error) {
    return failOutcome("internal_error", `Failed to list application tokens: ${getErrorMessage(error)}`)
  }
}

const mintTokenOutcome = async (
  ctx: Context,
  deps: ApiDependencies,
  body: z.infer<typeof createBodySchema>,
): Promise<Outcome<z.infer<typeof mintedApplicationTokenSchema>>> => {
  const { orgId } = claimsFrom(ctx)
  try {
    const { record, plaintext } = await mintApplicationToken(deps.applicationTokenStore)({ organizationId: orgId, name: body.name, scopes: body.scopes })
    return okOutcome({ ...toSummary(record), token: plaintext })
  } catch (error) {
    return failOutcome("internal_error", `Failed to mint application token: ${getErrorMessage(error)}`)
  }
}

const revokeTokenOutcome = async (ctx: Context, deps: ApiDependencies, id: string): Promise<Outcome<ApplicationTokenSummary>> => {
  const { orgId } = claimsFrom(ctx)
  try {
    const revoked = await revokeApplicationToken(deps.applicationTokenStore)(orgId, id)
    if (revoked === null) return failOutcome("not_found", `Application token not found: ${id}`)
    return okOutcome(toSummary(revoked))
  } catch (error) {
    return failOutcome("internal_error", `Failed to revoke application token: ${getErrorMessage(error)}`)
  }
}

export const registerApplicationTokens = <S extends Schema>(app: OpenAPIHono<{ Variables: AuthVariables }, S>, deps: ApiDependencies) => {
  const manageGuard = guard(deps, PERMISSIONS.MANAGE_TOKENS)

  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/application-tokens",
    tags: ["application-tokens"],
    summary: "List application tokens",
    middleware: [manageGuard] as const,
    responses: {
      200: { description: "The organization's application tokens", content: { "application/json": { schema: z.array(applicationTokenSchema) } } },
      ...errorResponses,
    },
  })

  const mintRoute = createRoute({
    method: "post",
    path: "/api/v1/application-tokens",
    tags: ["application-tokens"],
    summary: "Mint an application token",
    middleware: [manageGuard] as const,
    request: {
      headers: idempotencyHeaderSchema,
      body: { content: { "application/json": { schema: createBodySchema } } },
    },
    responses: {
      201: {
        description: "The minted token — its plaintext secret is shown only here",
        content: { "application/json": { schema: mintedApplicationTokenSchema } },
      },
      ...errorResponses,
    },
  })

  const revokeRoute = createRoute({
    method: "post",
    path: "/api/v1/application-tokens/{id}/revoke",
    tags: ["application-tokens"],
    summary: "Revoke an application token",
    middleware: [manageGuard] as const,
    request: { params: idParamSchema, headers: idempotencyHeaderSchema },
    responses: {
      200: { description: "The revoked token", content: { "application/json": { schema: applicationTokenSchema } } },
      ...errorResponses,
    },
  })

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listTokensOutcome(ctx, deps)))
    .openapi(mintRoute, async (ctx) => respondOutcome(ctx, await mintTokenOutcome(ctx, deps, ctx.req.valid("json")), 201))
    .openapi(revokeRoute, async (ctx) => respondOutcome(ctx, await revokeTokenOutcome(ctx, deps, ctx.req.valid("param").id)))
}
