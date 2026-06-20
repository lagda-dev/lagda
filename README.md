# lagda

Open-source, self-hostable email-signature management platform — [lagda.dev](https://lagda.dev)

> **Status: Beta.** Pre-1.0 and under active development — APIs and schema may change between releases, which are published as `-beta` pre-releases.

## Quick start

The only thing you need is **Docker** — no Node, no pnpm.

```bash
git clone https://github.com/lagda-dev/lagda
cd lagda
docker compose up
```

That boots PostgreSQL, runs the migrations, seeds the first organization + owner, and
starts the app and auth services. Then open **http://localhost:3000** and sign in with the
seeded owner:

- **email:** `owner@lagda.local`
- **password:** `lagda-dev-owner`

(Dev-only defaults — change them via the `SEED_OWNER_*` env vars; see [`docker/README.md`](./docker/README.md).)

### What's running

| Service         | URL                   | Notes                                                     |
| --------------- | --------------------- | --------------------------------------------------------- |
| App (SPA + API) | http://localhost:3000 | the UI plus the REST `/api/v1` and OpenAPI docs           |
| Auth service    | http://localhost:3100 | Better Auth (sign-in, email OTP, sessions, organizations) |
| PostgreSQL      | localhost:5432        | db/user/pass `lagda`                                      |

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

## Tech Stack

TypeScript · Node.js · [Hono](https://hono.dev) · [Vite](https://vitejs.dev) + React · [Kysely](https://kysely.dev) (PostgreSQL) · [Turborepo](https://turbo.build) · [pnpm](https://pnpm.io) · [oxlint + oxfmt](https://oxc.rs)

## Development (contributing)

Hot-reload development runs entirely in Docker — **no host Node or pnpm required**:

```bash
docker compose -f docker-compose.dev.yml up        # Postgres + migrate + seed + the three watch servers
```

This brings up Postgres, applies the schema, seeds the first org/owner, and starts all three apps
with live reload: **web (Vite HMR) on http://localhost:5173**, server on :3000, auth on :3100. The
SPA proxies `/api` → :3000 and `/api/auth` → :3100. Edit any file under `apps/` or `packages/` and the
change reloads in the running container. Sign in as `owner@lagda.local` / `lagda-dev-owner`; the dev
email-OTP is printed to the auth service logs:

```bash
docker compose -f docker-compose.dev.yml logs -f auth   # watch for the one-time code on sign-in
docker compose -f docker-compose.dev.yml down -v        # stop and wipe the dev database
```

### Running the toolchain (tests, lint, types)

The verification toolchain still uses **Node 20+** and **pnpm 9+** on the host:

```bash
pnpm install
pnpm check        # full verification: lint + typecheck + test + build
pnpm test         # run tests
pnpm typecheck    # type check
pnpm lint         # lint with oxlint
pnpm format       # format with oxfmt
```

## Project Structure

```
lagda/
├── packages/   # reusable libraries (one domain per package, DDD layout)
└── apps/       # deployable applications (web, server, auth)
```

See [CLAUDE.md](./CLAUDE.md) for the full coding standards, architecture, and contribution conventions.

## License

[AGPL-3.0](./LICENSE)
