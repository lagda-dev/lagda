import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createLogger, REDACTION_CENSOR, withRequestContext } from "../logger"

// Capture every JSON line pino writes to stdout so we can assert on the shipped log shape
// (level, base fields, ISO timestamp, redaction) exactly as Loki would receive it.
const captureLogLines = (): { lines: () => Array<Record<string, unknown>>; restore: () => void } => {
  const written: string[] = []
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array): boolean => {
    written.push(chunk.toString())
    return true
  })
  const lines = () =>
    written
      .flatMap((entry) => entry.trim().split("\n"))
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>)
  return { lines, restore: () => spy.mockRestore() }
}

describe("createLogger", () => {
  beforeEach(() => {
    delete process.env.LOG_LEVEL
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("defaults its level to the LOG_LEVEL resolved from @lagda/core config", () => {
    // Arrange
    process.env.LOG_LEVEL = "warn"

    // Act
    const logger = createLogger()

    // Assert
    expect(logger.level).toBe("warn")
  })

  it("honors an explicit level option over the config default", () => {
    // Arrange
    process.env.LOG_LEVEL = "warn"

    // Act
    const logger = createLogger({ level: "debug" })

    // Assert
    expect(logger.level).toBe("debug")
  })

  it("writes JSON with the service base field and an ISO timestamp", () => {
    // Arrange
    const capture = captureLogLines()
    const logger = createLogger({ name: "auth", level: "info" })

    // Act
    logger.info("service is up")
    const [entry] = capture.lines()
    capture.restore()

    // Assert
    expect(entry?.service).toBe("auth")
    expect(entry?.msg).toBe("service is up")
    expect(typeof entry?.time).toBe("string")
    expect(() => new Date(entry?.time as string).toISOString()).not.toThrow()
  })

  it("uses the default service name when none is provided", () => {
    // Arrange
    const capture = captureLogLines()
    const logger = createLogger({ level: "info" })

    // Act
    logger.info("hello")
    const [entry] = capture.lines()
    capture.restore()

    // Assert
    expect(entry?.service).toBe("lagda")
  })

  it("redacts PII and secret fields before they are written", () => {
    // Arrange
    const capture = captureLogLines()
    const logger = createLogger({ level: "info" })

    // Act
    logger.info({ user: { email: "person@example.com", password: "hunter2", id: "user-1" } }, "sign-in attempt")
    const [entry] = capture.lines()
    capture.restore()
    const user = entry?.user as Record<string, unknown>

    // Assert
    expect(user.email).toBe(REDACTION_CENSOR)
    expect(user.password).toBe(REDACTION_CENSOR)
    expect(user.id).toBe("user-1")
  })
})

describe("withRequestContext", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("binds the request-id and trace-id to every line of the child logger", () => {
    // Arrange
    const capture = captureLogLines()
    const logger = createLogger({ level: "info" })
    const requestLogger = withRequestContext(logger, { requestId: "req-123", traceId: "trace-abc" })

    // Act
    requestLogger.info("handling request")
    const [entry] = capture.lines()
    capture.restore()

    // Assert
    expect(entry?.requestId).toBe("req-123")
    expect(entry?.traceId).toBe("trace-abc")
  })

  it("exposes the bound context via the child logger bindings", () => {
    // Arrange
    const logger = createLogger({ level: "info" })

    // Act
    const requestLogger = withRequestContext(logger, { requestId: "req-456" })

    // Assert
    expect(requestLogger.bindings()).toMatchObject({ requestId: "req-456" })
  })
})
