import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client"

// The Prometheus metrics layer (lagda-conventions §9). `createMetrics` builds an isolated registry
// with the RED + domain metrics the Grafana dashboards and Prometheus alert rules expect, and
// returns typed record helpers so callers never touch metric internals or risk a label typo. The
// metric NAMES and LABELS here MUST match docker/observability exactly — do not rename them.

// Histogram buckets in seconds. Tuned around the §5 1s query/response ceiling so p95/p99 panels and
// the SLO-breach alerts have resolution right where it matters.
const DURATION_BUCKETS_SECONDS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 0.8, 1, 2.5, 5, 10] as const

// The HTTP request outcome we record once per request: which service handled it, the method, the
// matched route template (low-cardinality — never the raw URL), the status code, and how long it
// took in seconds.
export type HttpRequestSample = {
  service: string
  method: string
  route: string
  statusCode: number
  durationSeconds: number
}

// A single timed DB query: the service that issued it, the logical operation name, and its duration.
export type DbQuerySample = {
  service: string
  operation: string
  durationSeconds: number
}

// The terminal status of a processed pg-boss job, matching the dashboard's success/failure split.
export type JobStatus = "completed" | "failed"

// The outcome of a directory→signature synchronization run, matching the sync-run outcomes panel.
export type SyncRunOutcome = "succeeded" | "failed" | "partial"

// The public metrics surface: the registry to expose at /metrics, plus typed recorders for each
// metric. Apps depend on this shape, never on prom-client directly.
export type Metrics = {
  registry: Registry
  recordHttp: (sample: HttpRequestSample) => void
  recordDbQuery: (sample: DbQuerySample) => void
  setQueueDepth: (queue: string, depth: number) => void
  recordJob: (queue: string, status: JobStatus) => void
  recordSyncRun: (outcome: SyncRunOutcome) => void
}

// Build a fresh, isolated metrics registry with Node/OS default metrics plus the Lagda RED + domain
// metrics. Pure factory: every call returns an independent registry so tests never share state and
// two services in one process could each own theirs.
export const createMetrics = (): Metrics => {
  const registry = new Registry()
  collectDefaultMetrics({ register: registry })

  const httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total HTTP requests handled, by service, method, matched route, and status code.",
    labelNames: ["service", "method", "route", "status_code"],
    registers: [registry],
  })

  const httpRequestDurationSeconds = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds, by service, method, and matched route.",
    labelNames: ["service", "method", "route"],
    buckets: [...DURATION_BUCKETS_SECONDS],
    registers: [registry],
  })

  const dbQueryDurationSeconds = new Histogram({
    name: "db_query_duration_seconds",
    help: "Database query duration in seconds, by service and logical operation.",
    labelNames: ["service", "operation"],
    buckets: [...DURATION_BUCKETS_SECONDS],
    registers: [registry],
  })

  const jobsQueueDepth = new Gauge({
    name: "jobs_queue_depth",
    help: "Pending job count per pg-boss queue.",
    labelNames: ["queue"],
    registers: [registry],
  })

  const jobsProcessedTotal = new Counter({
    name: "jobs_processed_total",
    help: "Total processed jobs per queue, split by terminal status.",
    labelNames: ["queue", "status"],
    registers: [registry],
  })

  const syncRunsTotal = new Counter({
    name: "sync_runs_total",
    help: "Total synchronization runs by outcome.",
    labelNames: ["outcome"],
    registers: [registry],
  })

  const recordHttp = ({ service, method, route, statusCode, durationSeconds }: HttpRequestSample): void => {
    const statusLabel = String(statusCode)
    httpRequestsTotal.inc({ service, method, route, status_code: statusLabel })
    httpRequestDurationSeconds.observe({ service, method, route }, durationSeconds)
  }

  const recordDbQuery = ({ service, operation, durationSeconds }: DbQuerySample): void => {
    dbQueryDurationSeconds.observe({ service, operation }, durationSeconds)
  }

  const setQueueDepth = (queue: string, depth: number): void => {
    jobsQueueDepth.set({ queue }, depth)
  }

  const recordJob = (queue: string, status: JobStatus): void => {
    jobsProcessedTotal.inc({ queue, status })
  }

  const recordSyncRun = (outcome: SyncRunOutcome): void => {
    syncRunsTotal.inc({ outcome })
  }

  return { registry, recordHttp, recordDbQuery, setQueueDepth, recordJob, recordSyncRun }
}
