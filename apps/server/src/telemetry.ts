import { startTelemetry } from "@lagda/observability"

// OpenTelemetry must start BEFORE any instrumented module loads (§9), so `server.ts` imports this
// file first — its top-level side effect starts the SDK. A safe no-op when OTEL_EXPORTER_OTLP_ENDPOINT
// is unset. Excluded from coverage: it needs a live OTLP collector to do anything observable.
export const telemetry = startTelemetry({ serviceName: "lagda-server" })
