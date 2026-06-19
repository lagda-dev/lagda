import type { Context } from "hono"
import { getErrorMessage } from "./getErrorMessage"
import type { Metrics } from "./metrics"

// The Prometheus scrape endpoint (lagda-conventions §9). Returns the registry's exposition text with
// the registry-provided content-type so Prometheus parses it correctly. Bound to a `Metrics`
// instance so each service exposes its own registry; mount it at `GET /metrics`.
export const metricsHandler =
  (metrics: Metrics) =>
  async (ctx: Context): Promise<Response> => {
    try {
      const body = await metrics.registry.metrics()
      return ctx.body(body, 200, { "content-type": metrics.registry.contentType })
    } catch (error) {
      throw new Error(`Failed to render Prometheus metrics: ${getErrorMessage(error)}`)
    }
  }
