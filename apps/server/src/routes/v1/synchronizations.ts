import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi"
import { PERMISSIONS } from "@lagda/auth-contract"
import type { Context, Schema } from "hono"
import { getErrorMessage } from "../../infrastructure/getErrorMessage"
import type { AuthVariables } from "../../middleware/authContext"
import { claimsFrom, failOutcome, itemOutcome, listOutcome, okOutcome, paginationFrom } from "./handlers"
import type { Outcome } from "./handlers"
import { respondOutcome } from "./respond"
import type { DeploymentRecord } from "../../repositories/types"
import type { Page } from "../../infrastructure/pagination"
import { errorResponses, idParamSchema, idempotencyHeaderSchema, listQuerySchema, pageResponseSchema } from "./schemas"
import { guard } from "./dependencies"
import type { ApiDependencies } from "./dependencies"
import { createSynchronization } from "./createSynchronization"
import { syncTargetSchema } from "./syncTargetSchema"

// `synchronizations` — run/read directory→signature syncs (§4). Owner and admin (RUN_SYNCS), public
// API scope `syncs:write` for POST/cancel and `syncs:read` for status/deployments. POST creates a
// sync_run, enqueues the deploy jobs, and returns 202. The verb in code is "synchronize" (§3).

const syncRunStatusSchema = z.enum(["pending", "running", "succeeded", "failed", "cancelled"])

const syncRunSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    status: syncRunStatusSchema,
    templateId: z.string().nullable(),
    counts: z.record(z.number()),
    createdAt: z.string(),
  })
  .openapi("SyncRun")

const acceptedSchema = z
  .object({
    id: z.string(),
    status: syncRunStatusSchema,
  })
  .openapi("SyncRunAccepted")

const deploymentSchema = z
  .object({
    id: z.string(),
    syncRunId: z.string(),
    employeeId: z.string(),
    status: z.enum(["pending", "succeeded", "failed"]),
    error: z.string().nullable(),
  })
  .openapi("Deployment")

const createBodySchema = z
  .object({
    target: syncTargetSchema,
    templateId: z.string().min(1).optional(),
  })
  .openapi("CreateSyncRun")

// List a sync run's deployments, scoped to the caller's org so one tenant cannot read another's. The
// validated pagination query is read from the context the route already parsed.
const deploymentsOutcome = async (ctx: Context, deps: ApiDependencies, syncRunId: string): Promise<Outcome<Page<DeploymentRecord>>> => {
  const { orgId } = claimsFrom(ctx)
  try {
    const page = await deps.repository.listDeployments(orgId, syncRunId, paginationFrom(ctx.req.query()))
    return okOutcome(page)
  } catch (error) {
    return failOutcome("internal_error", `Failed to list deployments: ${getErrorMessage(error)}`)
  }
}

export const registerSynchronizations = <S extends Schema>(app: OpenAPIHono<{ Variables: AuthVariables }, S>, deps: ApiDependencies) => {
  const readGuard = guard(deps, PERMISSIONS.RUN_SYNCS, "syncs:read")
  const writeGuard = guard(deps, PERMISSIONS.RUN_SYNCS, "syncs:write")

  const listRoute = createRoute({
    method: "get",
    path: "/api/v1/synchronizations",
    tags: ["synchronizations"],
    summary: "List synchronizations",
    middleware: [readGuard] as const,
    request: { query: listQuerySchema },
    responses: {
      200: { description: "A page of synchronizations", content: { "application/json": { schema: pageResponseSchema(syncRunSchema) } } },
      ...errorResponses,
    },
  })

  const createSyncRoute = createRoute({
    method: "post",
    path: "/api/v1/synchronizations",
    tags: ["synchronizations"],
    summary: "Create a synchronization",
    middleware: [writeGuard] as const,
    request: {
      headers: idempotencyHeaderSchema,
      body: { content: { "application/json": { schema: createBodySchema } } },
    },
    responses: {
      202: { description: "Synchronization accepted and queued", content: { "application/json": { schema: acceptedSchema } } },
      ...errorResponses,
    },
  })

  const statusRoute = createRoute({
    method: "get",
    path: "/api/v1/synchronizations/{id}",
    tags: ["synchronizations"],
    summary: "Get synchronization status",
    middleware: [readGuard] as const,
    request: { params: idParamSchema },
    responses: {
      200: { description: "The synchronization", content: { "application/json": { schema: syncRunSchema } } },
      ...errorResponses,
    },
  })

  const deploymentsRoute = createRoute({
    method: "get",
    path: "/api/v1/synchronizations/{id}/deployments",
    tags: ["synchronizations"],
    summary: "List a synchronization's deployments",
    middleware: [readGuard] as const,
    request: { params: idParamSchema, query: listQuerySchema },
    responses: {
      200: { description: "A page of deployments", content: { "application/json": { schema: pageResponseSchema(deploymentSchema) } } },
      ...errorResponses,
    },
  })

  const cancelRoute = createRoute({
    method: "post",
    path: "/api/v1/synchronizations/{id}/cancel",
    tags: ["synchronizations"],
    summary: "Cancel a synchronization",
    middleware: [writeGuard] as const,
    request: { params: idParamSchema, headers: idempotencyHeaderSchema },
    responses: {
      200: { description: "The cancelled synchronization", content: { "application/json": { schema: syncRunSchema } } },
      ...errorResponses,
    },
  })

  return app
    .openapi(listRoute, async (ctx) => respondOutcome(ctx, await listOutcome(ctx, ctx.req.valid("query"), deps.repository.listSyncRuns)))
    .openapi(createSyncRoute, async (ctx) => respondOutcome(ctx, await createSynchronization(ctx, deps, ctx.req.valid("json")), 202))
    .openapi(deploymentsRoute, async (ctx) => respondOutcome(ctx, await deploymentsOutcome(ctx, deps, ctx.req.valid("param").id)))
    .openapi(statusRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.getSyncRun)))
    .openapi(cancelRoute, async (ctx) => respondOutcome(ctx, await itemOutcome(ctx, ctx.req.valid("param").id, deps.repository.cancelSyncRun)))
}
