import { Hono } from "hono"
import { describe, expect, it, vi } from "vitest"
import type { Logger } from "@lagda/logger"
import { REQUEST_LOGGER_KEY, requestLogger } from "../requestLogger"
import type { RequestLoggerVariables } from "../requestLogger"

// The requestLogger middleware resolves a request id, binds a child logger via `withRequestContext`,
// stores it on the context, echoes the id on the response, and logs start/finish with non-PII fields.

// A spyable pino-like logger. `child` records the bound context and returns a logger whose `info`
// captures every entry, so a test can assert what was logged and what context was bound.
const createSpyLogger = () => {
  const childInfo = vi.fn()
  const boundContexts: Array<Record<string, unknown>> = []
  const child = vi.fn((context: Record<string, unknown>) => {
    boundContexts.push(context)
    return { info: childInfo, child } as unknown as Logger
  })
  const logger = { info: vi.fn(), child } as unknown as Logger
  return { logger, child, childInfo, boundContexts }
}

const buildApp = (logger: Logger) => {
  const app = new Hono<{ Variables: RequestLoggerVariables }>()
  app.use("*", requestLogger(logger))
  app.get("/ping", (ctx) => {
    const requestScoped = ctx.get(REQUEST_LOGGER_KEY)
    return ctx.json({ hasLogger: requestScoped !== undefined })
  })
  return app
}

describe("requestLogger", () => {
  it("binds a generated request id to a child logger and echoes it on the response", async () => {
    // Arrange
    const { logger, boundContexts } = createSpyLogger()
    const app = buildApp(logger)

    // Act
    const response = await app.request("/ping")

    // Assert
    expect(response.status).toBe(200)
    const echoed = response.headers.get("x-request-id")
    expect(echoed).toBeTruthy()
    expect(boundContexts).toHaveLength(1)
    expect(boundContexts[0]).toEqual({ requestId: echoed })
  })

  it("propagates an inbound x-request-id instead of minting a new one", async () => {
    // Arrange
    const { logger, boundContexts } = createSpyLogger()
    const app = buildApp(logger)

    // Act
    const response = await app.request("/ping", { headers: { "x-request-id": "trace-from-upstream" } })

    // Assert
    expect(response.headers.get("x-request-id")).toBe("trace-from-upstream")
    expect(boundContexts[0]).toEqual({ requestId: "trace-from-upstream" })
  })

  it("stores the request-scoped child logger on the context for handlers to reuse", async () => {
    // Arrange
    const { logger } = createSpyLogger()
    const app = buildApp(logger)

    // Act
    const response = await app.request("/ping")

    // Assert
    expect(await response.json()).toEqual({ hasLogger: true })
  })

  it("logs request start and finish with non-PII fields only", async () => {
    // Arrange
    const { logger, childInfo } = createSpyLogger()
    const app = buildApp(logger)

    // Act
    await app.request("/ping")

    // Assert — two entries (start + finish); finish carries the status, neither carries the URL/body
    expect(childInfo).toHaveBeenCalledTimes(2)
    expect(childInfo).toHaveBeenNthCalledWith(1, expect.objectContaining({ operation: "request.start", method: "GET" }))
    expect(childInfo).toHaveBeenNthCalledWith(2, expect.objectContaining({ operation: "request.finish", method: "GET", route: "/ping", status: 200 }))
  })
})
