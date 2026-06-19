# Lagda Observability Stack

Self-hostable **Prometheus + Loki + Grafana** for the Lagda platform, matching
[`lagda-conventions` §9](../../.claude/skills/lagda-conventions/SKILL.md): OpenTelemetry
over OTLP, Prometheus scraping `/metrics`, pino JSON logs shipped to Loki, Grafana reading
both, and **Grafana Alerting → Slack**. Errors and alerts are handled here — there is **no
external error-tracking SaaS**.

This directory is **config only**. It observes the running services; it does not run them.

## Run it

```bash
# from the repo root
docker compose -f docker-compose.observability.yml up

# tear down (keeps volumes)
docker compose -f docker-compose.observability.yml down
```

## Ports

| Service    | Host port | Purpose                                                       |
| ---------- | --------- | ------------------------------------------------------------- |
| Grafana    | `3001`    | UI — `3000` is avoided because it clashes with `apps/server`. |
| Prometheus | `9090`    | Metrics scraping + alert-rule evaluation.                     |
| Loki       | `3100`    | Log ingest + query (apps push pino logs here).                |

Grafana default login: `admin` / `admin` (override with `GRAFANA_ADMIN_USER` /
`GRAFANA_ADMIN_PASSWORD`). Datasources and dashboards are auto-provisioned.

## Local dev vs. full stack

- **Local dev (default):** the app (`:3000`) and auth (`:3100`) services run on the **host**,
  so Prometheus scrapes them via `host.docker.internal` (`extra_hosts` maps it on Linux).
- **Full containerised stack:** run the services as containers on the `observability` network
  and edit `prometheus/prometheus.yml` to scrape `server:3000` / `auth:3100` instead (the
  alternative targets are already present, commented out).

## Dashboards

Provisioned under the **Lagda** folder in Grafana:

1. **RED + Query Latency** (`red-latency.json`) — request rate, 5xx error ratio, HTTP p95/p99
   latency, and DB query p95 against the 1s ceiling (§5).
2. **Jobs + Sync-run Health** (`jobs-sync-health.json`) — pg-boss queue depth, job
   success/failure throughput, sync-run outcomes, and recent error logs pulled from Loki.

## Metric names (must stay consistent across scrape, alert rules, dashboards)

The apps emit these via `prom-client`:

| Metric                                 | Type      | Key labels                                  |
| -------------------------------------- | --------- | ------------------------------------------- |
| `http_requests_total`                  | counter   | `service`, `method`, `route`, `status_code` |
| `http_request_duration_seconds_bucket` | histogram | `service`, `method`, `route`, `le`          |
| `db_query_duration_seconds_bucket`     | histogram | `service`, `operation`, `le`                |
| `jobs_queue_depth`                     | gauge     | `queue`                                     |
| `jobs_processed_total`                 | counter   | `queue`, `status` (`completed`/`failed`)    |
| `sync_runs_total`                      | counter   | `outcome` (`succeeded`/`failed`/`partial`)  |

## Alerts

Prometheus rules live in `prometheus/alert-rules.yml` (Grafana Alerting can consume the same
metrics). They cover high HTTP error rate (RED), p95 latency SLO breach near the 1s ceiling,
DB query latency, job-queue backlog, and high job failure rate. Routing to Slack is provisioned
in `grafana/provisioning/alerting/slack.yml` via the `slack-alerts` contact point.

## Environment variables

### This stack

| Var                       | Used by | Notes                                                          |
| ------------------------- | ------- | -------------------------------------------------------------- |
| `SLACK_ALERT_WEBHOOK_URL` | Grafana | Slack incoming-webhook URL for alerts. **Never commit it.**    |
| `GRAFANA_ADMIN_USER`      | Grafana | Admin username (default `admin`).                              |
| `GRAFANA_ADMIN_PASSWORD`  | Grafana | Admin password (default `admin` — change for any real deploy). |

### The apps must expose / set

For this stack to receive data, `apps/server` and `apps/auth` must:

- Serve Prometheus metrics at **`/metrics`** (prom-client) on `:3000` and `:3100` respectively.
- Expose health endpoints **`/healthz`** (liveness) and **`/readyz`** (DB + queue readiness).
- Ship **pino JSON logs to Loki** with `service` set to `lagda-server` / `lagda-auth`, plus
  request-id / trace correlation (e.g. via a Loki transport or a sidecar log shipper pointed at
  `http://<loki-host>:3100/loki/api/v1/push`). **No PII in logs** (§8).
- Emit OpenTelemetry traces/metrics over **OTLP**. Recommended app env vars:

  | Var                           | Example                       | Purpose                        |
  | ----------------------------- | ----------------------------- | ------------------------------ |
  | `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318`       | OTLP collector endpoint.       |
  | `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf`               | OTLP transport.                |
  | `OTEL_SERVICE_NAME`           | `lagda-server` / `lagda-auth` | Service identity in telemetry. |
  | `LOKI_URL`                    | `http://localhost:3100`       | Where pino logs are shipped.   |
  | `METRICS_PORT` (if separated) | `3000` / `3100`               | Port exposing `/metrics`.      |

> Note: an OTLP collector (and an optional trace datasource in Grafana) is a later addition.
> This stack ships the metrics + logs + dashboards + alerting foundation.
