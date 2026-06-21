// The public surface of @lagda/observability (lagda-conventions §9): the prom-client metrics
// factory + typed recorders, the /metrics handler, the HTTP-metrics and request-logger Hono
// middleware, and the OpenTelemetry OTLP tracing bootstrap.
export { createMetrics } from "./metrics"
export type { Metrics, HttpRequestSample, DbQuerySample, JobStatus, SyncRunOutcome } from "./metrics"
export { metricsHandler } from "./metricsHandler"
export { httpMetrics } from "./httpMetrics"
export { requestLogger, REQUEST_LOGGER_KEY } from "./requestLogger"
export type { RequestLoggerVariables } from "./requestLogger"
export { startTelemetry } from "./telemetry"
export type { StartTelemetryOptions, TelemetryHandle } from "./telemetry"
