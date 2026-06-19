---
"@lagda/observability": minor
---

Add the shared `@lagda/observability` package and wire it into both services. It provides a
`prom-client` registry with the RED + domain metrics the Grafana dashboards and Prometheus alert
rules expect (`http_requests_total`, `http_request_duration_seconds`, `db_query_duration_seconds`,
`jobs_queue_depth`, `jobs_processed_total`, `sync_runs_total`), a `/metrics` Hono handler, HTTP-metrics
and request-id logging middleware, and a safe-by-default OpenTelemetry OTLP tracing bootstrap that
no-ops when `OTEL_EXPORTER_OTLP_ENDPOINT` is unset. `apps/server` and `apps/auth` now expose
`/metrics`, log with request correlation, start telemetry first, and record HTTP/DB/sync-run metrics.
