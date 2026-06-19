# Lagda — Container Deployment (zero-config)

`docker compose up` boots a complete, usable Lagda instance with **no required configuration**:
bundled Postgres, both schemas migrated on boot, both services running, and a first organization +
owner already seeded. Everything below has a sane dev default.

## Quick start

```bash
# from the repo root
docker compose up --build
```

Boot order (enforced via healthchecks + `depends_on`):

1. **postgres** — `postgres:16`, healthchecked, data in a named volume.
2. **migrate** (one-shot) — applies the **app schema** (`@lagda/db` Kysely migrations) **and** the
   **Better Auth schema** (Better Auth CLI), then exits 0.
3. **auth** — the Better Auth identity/token service on `:3100` (healthchecked on `/healthz`).
4. **seed** (one-shot) — creates the first organization + owner once auth is healthy. Idempotent.
5. **server** — the Hono monolith (API + SPA host) on `:3000` (healthchecked on `/healthz`).

Open the app at **http://localhost:3000**. The auth service is at **http://localhost:3100**.

## Default seeded owner credentials (DEV-ONLY)

The `seed` step creates one organization and one owner user:

| Field          | Default value          |
| -------------- | ---------------------- |
| Owner email    | `owner@lagda.local`    |
| Owner password | `lagda-dev-owner`      |
| Owner name     | `Lagda Owner`          |
| Organization   | `Lagda` (slug `lagda`) |

> ⚠️ **These are dev-only defaults and are intentionally well-known.** Change them before exposing the
> instance to anyone. There is a matching `// TODO(security)` in
> `apps/auth/scripts/seedFirstOrganization.ts`. The seed marks the owner's email verified directly in
> Postgres (the zero-config path has no real email transport), so you can sign in immediately.

Override them by exporting env vars before `docker compose up`:

```bash
SEED_OWNER_EMAIL=you@example.com \
SEED_OWNER_PASSWORD='a-strong-password' \
SEED_ORGANIZATION_NAME='Acme' \
docker compose up --build
```

The seed is **idempotent**: if an organization already exists it exits early, so re-running never
creates a duplicate org/owner. To re-seed from scratch, drop the volume: `docker compose down -v`.

## Environment overrides

Every variable is optional; defaults are shown.

| Variable                                                          | Default                                      | Used by                          |
| ----------------------------------------------------------------- | -------------------------------------------- | -------------------------------- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`             | `lagda`                                      | postgres                         |
| `POSTGRES_PORT` / `AUTH_PORT` / `SERVER_PORT`                     | `5432` / `3100` / `3000`                     | host port mapping                |
| `DATABASE_URL`                                                    | `postgres://lagda:lagda@postgres:5432/lagda` | migrate, auth, server, seed      |
| `AUTH_BASE_URL`                                                   | `http://auth:3100`                           | auth (JWT issuer), migrate, seed |
| `AUTH_JWKS_URL`                                                   | `http://auth:3100/api/auth/jwks`             | server (token verification)      |
| `LOG_LEVEL`                                                       | `info`                                       | auth, server                     |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_GLOBAL` / `RATE_LIMIT_WRITE` | `60000` / `120` / `30`                       | server                           |
| `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` / `SEED_OWNER_NAME`    | see table above                              | seed                             |
| `SEED_ORGANIZATION_NAME` / `SEED_ORGANIZATION_SLUG`               | `Lagda` / `lagda`                            | seed                             |

A dedicated identity database is supported too: set `AUTH_DATABASE_URL` (the auth service prefers it
over the shared `DATABASE_URL`). The zero-config path keeps both schemas in one `lagda` database —
the app and Better Auth table names are distinct, so they coexist safely.

## How token verification is wired (JWKS / issuer)

Lagda's auth model (conventions §1): the **auth** service is the only token authority; the **server**
is a stateless **resource server** that trusts a bearer JWT only after verifying its **signature**
against the auth service's **JWKS**.

- The server resolves its key set from `AUTH_JWKS_URL`, which defaults to
  `http://auth:3100/api/auth/jwks`. Inside the compose network the auth service is reachable by its
  **service name** `auth`, so the server fetches the JWKS directly from it. A token minted by `auth`
  is therefore accepted by `server`.
- The server's verifier checks the signature only (it does **not** pin issuer/audience), so the single
  coherence requirement is: **`AUTH_JWKS_URL` must point at the same auth service that minted the
  token.** `AUTH_BASE_URL` is that auth service's own public base URL (the JWT `iss`).

### localhost vs. service-name caveat (important)

`AUTH_BASE_URL` defaults to `http://auth:3100`, which is only resolvable **inside** the compose
network. The browser-facing SPA, however, runs on your **host** and must reach auth at
`http://localhost:3100`. For purely local API/token testing this is fine. For a browser-facing or real
deployment, put both services behind one reverse proxy / public hostname and set `AUTH_BASE_URL` (and
`AUTH_JWKS_URL`) to that externally-reachable URL so the issuer the browser sees matches the origin the
server verifies against. Keep `server`→`auth` JWKS resolution on the internal service name.

## Images & stages

- `apps/server/Dockerfile` — `builder` (workspace install + Turbo build of `@lagda/web` and
  `@lagda/server`, SPA `dist` folded into `./public`) → `pruner` (`pnpm deploy --prod`) → `runner`
  (slim `node:20-slim`, non-root `node` user, `node dist/server.js`, port 3000).
- `apps/auth/Dockerfile` — same `builder`/`pruner`/`runner` pattern for `@lagda/auth` (port 3100), plus
  a `tooling` stage (full install incl. dev deps + source) used by the **migrate** and **seed**
  one-shot services, which need `tsx` and the Better Auth CLI.

## Migrate & seed commands (run by compose; reproducible standalone)

```bash
# App schema (Kysely migrator) + Better Auth schema (CLI), against $DATABASE_URL:
pnpm --filter @lagda/db migrate
pnpm --filter @lagda/auth run migrate:auth        # npx @better-auth/cli migrate --config better-auth.config.ts --yes

# First org + owner (idempotent), against $DATABASE_URL once auth can sign in:
pnpm --filter @lagda/auth run seed                # tsx scripts/seedFirstOrganization.ts
```

## Validate

```bash
docker compose config        # render & validate the merged compose spec
docker compose build         # build all images
docker compose up            # bring the stack up; watch migrate -> auth -> seed -> server
curl -s localhost:3000/healthz   # {"status":"ok"}
curl -s localhost:3100/healthz   # {"status":"ok"}
docker compose down -v       # tear down and drop the data volume
```
