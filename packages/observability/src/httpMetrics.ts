import type { MiddlewareHandler } from "hono"
import type { Metrics } from "./metrics"

// The fallback route label when Hono has not matched a registered route (e.g. a 404). Using a fixed
// literal instead of the raw URL keeps metric cardinality bounded (§5) — an unbounded set of unknown
// paths would otherwise explode the `route` label space.
const UNMATCHED_ROUTE = "unmatched"

// Convert a high-resolution duration in milliseconds to the seconds unit Prometheus histograms use.
const MILLISECONDS_PER_SECOND = 1000

// httpMetrics is a Hono middleware that times every request and records the RED metrics
// (`http_requests_total` + `http_request_duration_seconds`) for the given service. It labels by the
// MATCHED route template (`ctx.req.routePath`), never the concrete URL, so `/employees/{id}` is one
// series rather than one per id. It records even when the downstream handler throws, so error rates
// stay accurate, then re-throws so the error still reaches Hono's handler.
export const httpMetrics =
  (serviceName: string, metrics: Metrics): MiddlewareHandler =>
  async (ctx, next) => {
    const startedAt = performance.now()
    try {
      await next()
    } finally {
      const durationSeconds = (performance.now() - startedAt) / MILLISECONDS_PER_SECOND
      const route = ctx.req.routePath === "/*" ? UNMATCHED_ROUTE : ctx.req.routePath
      metrics.recordHttp({
        service: serviceName,
        method: ctx.req.method,
        route,
        statusCode: ctx.res.status,
        durationSeconds,
      })
    }
  }
