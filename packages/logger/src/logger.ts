import { LOG_LEVELS, loadConfig } from "@lagda/core"
import { pino } from "pino"
import type { Logger } from "pino"
import { buildRedactOptions } from "./redaction"

// A log level mirrors the levels @lagda/core validates from the LOG_LEVEL env var,
// so the logger and the config schema can never drift apart.
export type LogLevel = (typeof LOG_LEVELS)[number]

export type CreateLoggerOptions = {
  level?: LogLevel
  name?: string
}

// The request-scoped fields we bind to every log line of a single request so Grafana can
// correlate logs with traces. Both are optional because not every entry point has both.
export type RequestContext = {
  requestId?: string
  traceId?: string
}

const DEFAULT_SERVICE_NAME = "lagda"

// Resolve the default level from @lagda/core's validated config so an operator can tune
// verbosity with a single LOG_LEVEL env var without touching code.
const resolveDefaultLevel = (): LogLevel => loadConfig().LOG_LEVEL

// createLogger returns a pino logger emitting JSON to stdout, configured for our observability
// stack: ISO timestamps, a `service` base field for Loki labelling, and the §8 redaction paths
// applied at the source so no PII or secret can ever be written.
export const createLogger = (options: CreateLoggerOptions = {}): Logger => {
  const { level, name } = options
  return pino({
    level: level ?? resolveDefaultLevel(),
    base: { service: name ?? DEFAULT_SERVICE_NAME },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: buildRedactOptions(),
  })
}

// withRequestContext is a pure wrapper over logger.child: it binds the request-id / trace-id
// to a child logger so every line emitted during that request carries the correlation ids.
export const withRequestContext = (logger: Logger, context: RequestContext): Logger => logger.child({ ...context })

export { buildRedactOptions, REDACTION_CENSOR, REDACTION_PATHS } from "./redaction"
export type { Logger } from "pino"
