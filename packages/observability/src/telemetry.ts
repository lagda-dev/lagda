import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { getErrorMessage } from "./getErrorMessage"

// The OpenTelemetry tracing bootstrap (lagda-conventions §9). EXCLUDED from coverage: it loads the
// Node auto-instrumentations and, when an OTLP endpoint is configured, exports spans to a live
// collector — neither is unit-testable without that collector running. It is designed to be a SAFE
// NO-OP when telemetry is not configured, so it can be imported unconditionally at the very top of
// each service's entry point (OTel requires the SDK to start before instrumented modules load).

// The env var the OTLP HTTP exporter reads for its endpoint. When unset, tracing stays off and
// `startTelemetry` returns an inert handle — the app must never crash because telemetry is absent.
const OTLP_ENDPOINT_ENV = "OTEL_EXPORTER_OTLP_ENDPOINT"

export type StartTelemetryOptions = {
  serviceName: string
}

// A handle the caller can await on shutdown to flush pending spans. The no-op path returns a handle
// whose `shutdown` resolves immediately, so callers treat both paths identically.
export type TelemetryHandle = {
  enabled: boolean
  shutdown: () => Promise<void>
}

const inertHandle: TelemetryHandle = {
  enabled: false,
  shutdown: async () => undefined,
}

// Initialize the OTel NodeSDK with the OTLP HTTP trace exporter and Node auto-instrumentations,
// tagging every span with the service name. Returns a no-op handle (without starting the SDK) when
// `OTEL_EXPORTER_OTLP_ENDPOINT` is unset, and never throws past this boundary — a telemetry failure
// must not take the service down.
export const startTelemetry = ({ serviceName }: StartTelemetryOptions): TelemetryHandle => {
  const endpoint = process.env[OTLP_ENDPOINT_ENV]
  if (endpoint === undefined || endpoint === "") {
    return inertHandle
  }

  try {
    // Tag spans with the service name via the standard OTEL_SERVICE_NAME env (NodeSDK reads it into
    // the resource). An explicitly-set env always wins; this avoids coupling to a specific
    // @opentelemetry/resources version's API.
    if (process.env.OTEL_SERVICE_NAME === undefined || process.env.OTEL_SERVICE_NAME === "") {
      process.env.OTEL_SERVICE_NAME = serviceName
    }
    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter(),
      instrumentations: [getNodeAutoInstrumentations()],
    })
    sdk.start()
    return {
      enabled: true,
      shutdown: async () => {
        try {
          await sdk.shutdown()
        } catch (error) {
          throw new Error(`Failed to shut down telemetry: ${getErrorMessage(error)}`)
        }
      },
    }
  } catch (error) {
    process.stderr.write(`Telemetry failed to start, continuing without tracing: ${getErrorMessage(error)}\n`)
    return inertHandle
  }
}
