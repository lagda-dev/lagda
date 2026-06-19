import type { Context } from "hono"
import { buildApiError } from "../../infrastructure/errors"
import type { ApiError, ApiErrorCode } from "../../infrastructure/errors"
import { getErrorMessage } from "../../infrastructure/getErrorMessage"
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

export { fail as failOutcome, ok as okOutcome }
