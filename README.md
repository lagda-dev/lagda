# lagda

Open-source, self-hostable email-signature management platform — [lagda.dev](https://lagda.dev)

> **Status: Beta.** Pre-1.0 and under active development — APIs and schema may change between releases, which are published as `-beta` pre-releases.

## Tech Stack

TypeScript · Node.js · [Hono](https://hono.dev) · [Vite](https://vitejs.dev) + React · [Kysely](https://kysely.dev) (PostgreSQL) · [Turborepo](https://turbo.build) · [pnpm](https://pnpm.io) · [oxlint + oxfmt](https://oxc.rs)

## Prerequisites

- **Node.js:** 20+ (`node --version`)
- **pnpm:** 9+ (`npm install -g pnpm`)
- **Docker:** for the full local stack (Postgres + services)

## Setup

```bash
pnpm install
cp .env.example .env   # fill in any required values
```

## Commands

```bash
pnpm dev          # run the app (web + API + auth)
pnpm test         # run tests
pnpm typecheck    # type check
pnpm lint         # lint with oxlint
pnpm format       # format with oxfmt
pnpm check        # full verification: lint + typecheck + test + build
```

## Local development

`pnpm dev` runs all three apps via Turborepo. The SPA proxies API calls to the two
services, so you browse everything through `http://localhost:5173`.

> The auth service and the API need a running PostgreSQL (plus migrations + seed) to
> function fully — the quickest way is `docker compose up`, which boots Postgres, runs
> migrations, seeds the first org/owner, and starts both services. Run `pnpm dev` on top
> when you want hot-reload against that database.

### Services

| Service          | URL                   | Notes                                            |
| ---------------- | --------------------- | ------------------------------------------------ |
| Web SPA (Vite)   | http://localhost:5173 | proxies `/api/auth` → :3100 and `/api` → :3000   |
| App API (server) | http://localhost:3000 | REST `/api/v1`, typed RPC, OpenAPI docs          |
| Auth service     | http://localhost:3100 | Better Auth (sign-in, email OTP, sessions, orgs) |
| PostgreSQL       | localhost:5432        | via `docker compose up` (db/user/pass: `lagda`)  |

### App API endpoints (`:3000`)

| Endpoint                                                                   | Purpose                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/api/v1/health`                                                           | service health (typed RPC probe)                                   |
| `/api/v1/{organizations,entities,users,employees}`                         | core resources                                                     |
| `/api/v1/{templates,assignments,synchronizations,deployments}`             | signatures + sync (`synchronizations/{id}/deployments`, `/cancel`) |
| `/api/v1/{directory-connections,notification-channels,application-tokens}` | owner/admin config                                                 |
| `/api/v1/{departments,roles,audit-events}`                                 | read-only                                                          |
| `/api/docs`                                                                | interactive API reference (Scalar)                                 |
| `/api/openapi.json`                                                        | OpenAPI spec                                                       |
| `/healthz` · `/readyz` · `/metrics`                                        | liveness · readiness · Prometheus metrics                          |

### Auth service endpoints (`:3100`)

| Endpoint                            | Purpose                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `/api/auth/*`                       | Better Auth (email/password + email OTP, sessions, organizations, app tokens) |
| `/api/auth/jwks`                    | JWKS the app API verifies bearer tokens against                               |
| `/healthz` · `/readyz` · `/metrics` | liveness · readiness · Prometheus metrics                                     |

### Observability stack (optional)

```bash
docker compose -f docker-compose.observability.yml up
```

| Tool       | URL                   |
| ---------- | --------------------- |
| Grafana    | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| Loki       | http://localhost:3102 |

## Project Structure

```
lagda/
├── packages/   # reusable libraries (one domain per package, DDD layout)
└── apps/       # deployable applications (web, server, auth)
```

See [CLAUDE.md](./CLAUDE.md) for the full coding standards, architecture, and contribution conventions.

## License

[AGPL-3.0](./LICENSE)
