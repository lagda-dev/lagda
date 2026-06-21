import type { Context } from "hono"
import { buildApiError } from "../../infrastructure/errors"
import type { ApiError, ApiErrorCode } from "../../infrastructure/errors"
import { getErrorMessage } from "@lagda/core"
import { paginationQuerySchema } from "../../infrastructure/pagination"
import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import { AUTH_CONTEXT_KEY } from "../../middleware/authContext"
import type { TokenClaims } from "@lagda/auth-contract"

// Shared handler logic that resolves a repository call into a tagged outcome the thin route then
// serializes with `ctx.json`. Returning a plain outcome (not a `Response`) keeps these helpers
// resource-agnostic while letting each route preserve `@hono/zod-openapi`'s typed response, so
// `AppType` stays accurate.

// A success carrying the page/item, or a failure carrying the §4 error code + envelope. The route
// reads `outcome.kind` and answers with the matching status.
export type Outcome<TData> = { kind: "ok"; data: TData } | { kind: "error"; code: ApiErrorCode; error: ApiError }

const ok = <TData>(data: TData): Outcome<TData> => ({ kind: "ok", data })
const fail = <TData>(code: ApiErrorCode, message: string, details?: unknown): Outcome<TData> => ({
  kind: "error",
  code,
  error: buildApiError(code, message, details),
})

// Read the trusted claims the RBAC middleware stashed on the context. Present on every protected
// route because `requirePermission` ran first.
export const claimsFrom = (ctx: Context): TokenClaims => ctx.get(AUTH_CONTEXT_KEY) as TokenClaims

// The validated pagination query Hono parsed for the route.
export const paginationFrom = (rawQuery: unknown): PaginationQuery => paginationQuerySchema.parse(rawQuery)

// Run a list query for the caller's org, returning the page envelope or a 500 outcome.
export const listOutcome = async <TItem>(
  ctx: Context,
  rawQuery: unknown,
  listForOrg: (orgId: string, query: PaginationQuery) => Promise<Page<TItem>>,
): Promise<Outcome<Page<TItem>>> => {
  const { orgId } = claimsFrom(ctx)
  try {
    const page = await listForOrg(orgId, paginationFrom(rawQuery))
    return ok(page)
  } catch (error) {
    return fail("internal_error", `Failed to list resource: ${getErrorMessage(error)}`)
  }
}

// Run a detail read scoped to the caller's org, returning the item, a 404 outcome, or a 500 outcome.
export const itemOutcome = async <TItem>(
  ctx: Context,
  id: string,
  getForOrg: (orgId: string, id: string) => Promise<TItem | null>,
): Promise<Outcome<TItem>> => {
  const { orgId } = claimsFrom(ctx)
  try {
    const item = await getForOrg(orgId, id)
    if (item === null) {
      return fail("not_found", "Resource not found")
    }
    return ok(item)
  } catch (error) {
    return fail("internal_error", `Failed to read resource: ${getErrorMessage(error)}`)
  }
}

// Run a create scoped to the caller's org. The validated body is mapped to the repository input by
// the caller. A `null` result means a referenced parent (entity/template) is not in the caller's
// tenant, which becomes a 404 so a forged foreign id cannot create rows in another org.
export const createOutcome = async <TItem>(create: () => Promise<TItem | null>): Promise<Outcome<TItem>> => {
  try {
    const created = await create()
    if (created === null) {
      return fail("not_found", "Referenced resource not found")
    }
    return ok(created)
  } catch (error) {
    return fail("internal_error", `Failed to create resource: ${getErrorMessage(error)}`)
  }
}

// Run an update scoped to the caller's org. The repository returns `null` when the resource is not in
// the caller's tenant, which becomes a 404 envelope so one tenant cannot probe another's ids.
export const updateOutcome = async <TItem>(update: () => Promise<TItem | null>): Promise<Outcome<TItem>> => {
  try {
    const updated = await update()
    if (updated === null) {
      return fail("not_found", "Resource not found")
    }
    return ok(updated)
  } catch (error) {
    return fail("internal_error", `Failed to update resource: ${getErrorMessage(error)}`)
  }
}

// Run a delete scoped to the caller's org. The repository reports whether a row was removed; a miss
// becomes a 404 so the response is honest, a hit becomes an empty `ok` the route renders as 204.
export const deleteOutcome = async (remove: () => Promise<boolean>): Promise<Outcome<null>> => {
  try {
    const deleted = await remove()
    if (!deleted) {
      return fail("not_found", "Resource not found")
    }
    return ok(null)
  } catch (error) {
    return fail("internal_error", `Failed to delete resource: ${getErrorMessage(error)}`)
  }
}

export { fail as failOutcome, ok as okOutcome }
