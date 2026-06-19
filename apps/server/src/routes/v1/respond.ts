import type { Context } from "hono"
import { API_ERROR_STATUS } from "../../infrastructure/errors"
import type { Outcome } from "./handlers"

// Serialize a handler `Outcome` into the HTTP response: the success body at `okStatus`, or the §4
// error envelope at the status mapped from its code.
//
// `@hono/zod-openapi` types a handler's return as a precise `TypedResponse` union derived from the
// route's declared responses. A resource-agnostic, generic serializer cannot reconstruct that exact
// union, so we serialize to a plain `Response` here and register handlers through `openapiHandler`,
// which asserts the handler shape in one confined place. `AppType` is derived from the route configs
// (request/response schemas), not from handler return types, so it stays accurate; and zod-openapi
// validates each body against its response schema at runtime, so the wire contract is still enforced.
// The return is asserted to `never` so an inline `@hono/zod-openapi` handler can `return
// respondOutcome(...)` while keeping its `ctx.req.valid(...)` inputs fully typed against the route.
// The assertion is confined to this one function.
//
// Write routes use the REST success codes: `201` for a create, `200` for an update; a `204` delete
// carries no body, handled by `respondNoContent`.
export const respondOutcome = <TData>(ctx: Context, outcome: Outcome<TData>, okStatus: 200 | 201 | 202 = 200): never => {
  if (outcome.kind === "ok") {
    return ctx.json(outcome.data, okStatus) as never
  }
  return ctx.json(outcome.error, API_ERROR_STATUS[outcome.code]) as never
}

// Serialize a delete `Outcome`: a `204 No Content` with an empty body on success, or the §4 error
// envelope on failure. A successful delete carries no payload, so its `ok` data is ignored.
export const respondNoContent = (ctx: Context, outcome: Outcome<unknown>): never => {
  if (outcome.kind === "ok") {
    return ctx.body(null, 204) as never
  }
  return ctx.json(outcome.error, API_ERROR_STATUS[outcome.code]) as never
}
