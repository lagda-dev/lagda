import { randomUUID } from "node:crypto"
import { withRequestContext } from "@lagda/logger"
import type { Logger } from "@lagda/logger"
import type { MiddlewareHandler } from "hono"

// The inbound header an upstream proxy or the auth service may set to propagate a request id across
// service hops, and the response header we echo it back on so a client can correlate too.
const REQUEST_ID_HEADER = "x-request-id"

// The Hono context key under which the per-request child logger is stored. Handlers read it with
// `ctx.get(REQUEST_LOGGER_KEY)` to log with the request id already bound — no re-threading.
export const REQUEST_LOGGER_KEY = "requestLogger"

const MILLISECONDS_PER_SECOND = 1000

// The Hono Variables this middleware contributes, so a typed app can read the request logger back.
export type RequestLoggerVariables = {
  [REQUEST_LOGGER_KEY]: Logger
}

// Resolve the request id: reuse the propagated one from the inbound header so a trace spans services,
// otherwise mint a fresh UUID for this hop.
const resolveRequestId = (incoming: string | undefined): string => (incoming === undefined || incoming === "" ? randomUUID() : incoming)

// requestLogger is a Hono middleware that establishes per-request log correlation (§9): it resolves
// a request id, binds a child logger via `@lagda/logger`'s `withRequestContext`, stores it on the
// context for handlers to reuse, echoes the id on the response, and logs request start and finish.
// It logs only non-PII fields (method, matched route, status, duration) — never the URL, body, or
// headers (§8).
export const requestLogger =
  (baseLogger: Logger): MiddlewareHandler =>
  async (ctx, next) => {
    const requestId = resolveRequestId(ctx.req.header(REQUEST_ID_HEADER))
    const logger = withRequestContext(baseLogger, { requestId })
    ctx.set(REQUEST_LOGGER_KEY, logger)
    ctx.header(REQUEST_ID_HEADER, requestId)

    const startedAt = performance.now()
    // The matched route pattern is only known after routing completes (post-next), so the start log
    // carries just the method; the finish log adds the route, status, and duration.
    logger.info({ operation: "request.start", method: ctx.req.method })

    await next()

    const durationSeconds = (performance.now() - startedAt) / MILLISECONDS_PER_SECOND
    logger.info({ operation: "request.finish", method: ctx.req.method, route: ctx.req.routePath, status: ctx.res.status, durationSeconds })
  }
