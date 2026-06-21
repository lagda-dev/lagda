---
name: lagda-conventions
description: >-
  Canonical engineering conventions for the Lagda repository (the open-source,
  self-hostable email-signature management platform). ALWAYS consult this skill for
  ANY code change in this repo — adding or editing API endpoints, UI components, DB
  migrations, jobs, auth, tests, CI, docs, or releases — even when the request doesn't
  name a convention. It defines the stack, the Turborepo monorepo task pipeline, REST/RPC
  API rules, RBAC, testing & 90% coverage, security-by-design, observability, release
  gates, commits/CLA/changesets, and docs. If you are about to write code in Lagda and
  have not read this, read it first.
---

# Lagda — Engineering Conventions

Lagda is an open-source, self-hostable **email-signature management platform** (an
open-core). This skill is the single source of
truth for _how_ we build it. Follow it on every change. For step-by-step recipes, defer to
the task skills:

- **`add-api-endpoint`** — adding a REST/RPC endpoint end-to-end.
- **`add-ui-component`** — adding a component to the design system.
- **`cut-release`** — performing a gated release.

---

## 1. Architecture (non-negotiable shape)

- **Monorepo, two deployables.** The _application_ is a monolith; _auth_ is a separate service.
  - `apps/server` — Hono application monolith: serves the `/api/*` routes **and** the built SPA. It is a **resource server** — it runs **no Better Auth**; it validates bearer tokens by verifying their signature against the auth service's **JWKS** (stateless).
  - `apps/auth` — Better Auth identity/token service: sign-in, email OTP, sessions, organizations/roles, and minting scoped application tokens. The **only** token authority. Owns its own schema.
  - `apps/web` — Vite + React SPA. Talks to `apps/server` via the typed Hono RPC client.
- **Token flow:** SPA → auth service (login/OTP) → JWT → calls `apps/server` with the bearer token → server verifies via JWKS → resolves org + role for authorization.
- **Jobs** (pg-boss) run in-process in `apps/server` behind a `Queue` interface.
- Do **not** collapse auth back into the app, and do **not** add Better Auth to `apps/server`.

---

## 2. Monorepo & Turborepo

Package manager is **pnpm** (workspaces in `pnpm-workspace.yaml`). Build orchestration is
**Turborepo** (`turbo.json`). Run tasks through Turbo, never hand-rolled scripts that bypass it.

**Where code goes:**

- `apps/*` — deployables (`web`, `server`, `auth`). No shared library code here.
- `packages/*` — shared libraries: `ui` (design system), `core` (domain types + Zod config), `db` (Kysely client/schema/migrations), `jobs` (pg-boss defs), `connectors` (Google + MS stub), `templating` (MJML), `auth-contract` (token/claims/permission types shared by server + auth).
- Cross-`app` imports are **type-only** (e.g., `apps/web` imports `AppType` from `apps/server`).

**`turbo.json` task pipeline (keep it like this):**

- `build`: `"dependsOn": ["^build"]`, `"outputs": ["dist/**", "storybook-static/**"]` — topological, cached.
- `lint`: no deps, no outputs (cacheable).
- `typecheck`: `"dependsOn": ["^build"]` (needs upstream `.d.ts`), no outputs.
- `test`: `"dependsOn": ["^build"]`, `"outputs": ["coverage/**"]`.
- `dev`: `"cache": false, "persistent": true`.

**Rules:**

- Every package declares its own `build`/`lint`/`typecheck`/`test` scripts; the root delegates via `turbo run …`.
- Always declare a task's `outputs` so Turbo can cache it; unchanged packages must be skippable in CI.
- CI runs `turbo run lint typecheck test build` — caching is what keeps the §gates fast.
- New shared code → a `packages/*` package with a clear single responsibility, added to the workspace.

### Package internal structure & file naming (mandatory)

A package's layout makes its story obvious. Apply DDD layering to data-access, connector, and
API-client packages (`db`, `connectors`, and the server's resource modules); `ui`, `core`, and
`templating` keep their natural shapes.

- **Entry file is named after the package**, never `index.ts` — `packages/db/src/db.ts`,
  `packages/templating/src/templating.ts`. Point the workspace alias (tsconfig `paths` +
  Vitest `resolve.alias`) at that named file.
- **Files are named after their single export, in camelCase** — `listTemplates.ts` exports
  `listTemplates`; `userMapper.ts` exports the user mappers. No kebab-case, no PascalCase files.
- **DDD layout for data-access / connector packages:**
  - `mappers/<entity>Mapper.ts` — **pure** functions: raw API/row shape → domain type. No I/O.
  - `repositories/<entity>/<action>.ts` — **one action per file**, a curried factory:
    `export const listTemplates = (db) => async (...) => { ... }`.
  - `repositories/<entity>/<entity>Repository.ts` — **assembly only**: wire actions to deps, spread them. Zero business logic.
  - `infrastructure/` — cross-cutting technical helpers (pagination, rate limiting).
  - The package entry spreads repositories into the public, typed API.
- **Single source of truth for types:** shared domain types live in `packages/core`;
  token/claims/permission types in `packages/auth-contract`. Do not scatter local
  `interface`/`type` declarations across `apps/*` — import them. No magic numbers/strings:
  centralize constants alongside the types they describe.

---

## 3. Stack rules

- **Language:** TypeScript everywhere, `strict: true`. No `any` in committed code.
- **Backend:** Hono (`@hono/node-server`); serve SPA via `serve-static` in prod.
- **Frontend:** Vite + React + **React Router**; data fetching via TanStack Query over the Hono RPC client.
- **Styling:** Tailwind, **Tailwind-native**, via the shared preset in `packages/ui`. Do not introduce a second styling system.
- **Components:** **shadcn/ui owned in `packages/ui`** (Radix + Tailwind + `cva`); `neutral` base, `new-york` style, **minimalist, monochrome aesthetic** (cool-neutral grays, a single near-black ink, 1px borders over shadows, 8px radius, **Geist** for the interface and **Geist Mono** for data/metrics/identifiers, generous whitespace; **status colors — success/warning/destructive — are the only color in the system**). Fonts are self-hosted via Fontsource (no external CDN). The SPA imports all UI from `packages/ui` — no duplicated primitives.
- **Data access:** **Kysely, no ORM. PostgreSQL only** — connection via `DATABASE_URL`; no other SQL dialect is supported (MySQL/SQLite are explicitly out of scope). Migrations via Kysely `Migrator`; regenerate the `Database` type with `kysely-codegen`. Never add an ORM.
- **Validation:** Zod everywhere (see §4).
- **Auth:** Better Auth in `apps/auth` only.
- **Lint / format / typecheck:** **OXC toolchain — `oxlint` + `oxfmt`, never ESLint/Biome/Prettier.** `oxfmt` owns whitespace (`semi: false`, double quotes, `printWidth: 160`); never hand-format. Types via `tsc --noEmit`. Lint/format/typecheck run through Turbo tasks; CI fails on any violation.

### TypeScript code style & idioms (mandatory)

Code reads like a story; each function explains one part of it.

- **`const` + arrow functions only** — never `function` declarations, never `var`.
- **Immutability** — never mutate objects/arrays; return new copies (`{ ...prev, field }`, `[...list, item]`). `as const` for static lookup tables.
- **Always destructure** when accessing 2+ properties of an object (params and locals).
- **Variable names ≥ 3 characters** — `user`/`page`/`keyResult`, never `u`/`p`/`kr`. **`ctx` is always the first parameter** of any function that takes a context object.
- **Control flow:** prefer **early returns** over `if/else`; **no nested loops** (use `flatMap`/`map`/`filter` or a named helper); **no `while` loops** (use recursion or array methods, e.g. a recursive `collectAll` for pagination); keep nesting shallow.
- **Storytelling names & steps:** function names say WHAT _and_ HOW (`getActiveEmployeesByEntity`, not `getEmployees`); use **named intermediate variables** — no chained `.filter().map().reduce()` one-liners; extract named step helpers so an orchestrator reads as a clean checklist of calls (orchestrators hold zero business logic).
- **One file per step:** each distinct phase of a multi-step process lives in its own file named after the exported function.
- **Error handling (critical):** every operation that can fail handles it explicitly — **no silent failures**. Wrap at the **source** with a shared `getErrorMessage(error)`; callers that delegate to already-wrapping functions must **not** double-wrap. Log structured context via `pino` (`{ operation, error }`), never PII (§8). At HTTP boundaries, translate to the §4 error envelope with the right status code.
- **No ambiguous abbreviations:** never `Sync` (collides with JS's synchronous-variant convention) — use `Synchronize`/`reconcile`/`push`/`pull`. (The resource is `synchronizations`; the verb in code is `synchronize`.)
- **Small, focused units:** functions ≤ 50 lines with one responsibility; pure functions for business logic, side effects at the boundaries; many small files (200–400 lines typical, 800 max), organized by domain not by type.

---

## 4. API conventions

- **Internal vs public:** the SPA uses the **Hono RPC** client (`hc<AppType>`) with the user's session/JWT. The **public API is REST**, under `/api/v1`, defined with `@hono/zod-openapi`.
- **Every request is Zod-validated** (body, query, params, relevant headers) via `@hono/zod-validator` / `@hono/zod-openapi`. No handler trusts unvalidated input.
- **Resource naming:** plural, lowercase, hyphenated nouns; collection `/api/v1/<resource>`, item `/<resource>/{id}`, sub-resources nested one level. HTTP methods are the verbs (no `/getX`); the only allowed action suffixes are explicit ones like `/cancel`.
- **Canonical resources:** `organizations`, `entities`, `users` (login members), `employees` (directory-synced people), `templates`, `assignments`, `synchronizations` (+ `/{id}/deployments`, `/cancel`), `deployments`, `directory-connections`, `notification-channels`, `application-tokens`; read-only `departments`, `roles`, `audit-events`.
- **`users` ≠ `employees`:** a _user_ is a login account/member with a role; an _employee_ is a directory-synced signature recipient. Keep them distinct.
- **Lists are always cursor-paginated:** `?cursor=&limit=`, default 25 / max 100, envelope `{ data, nextCursor }`. No unbounded list queries.
- **Errors:** one shape — `{ error: { code, message, details? } }` — with correct status codes.
- **Public-API auth:** scoped **application tokens** minted by the auth service (owner/admin only), validated by `apps/server` via JWKS; enforce token scopes. `POST`s accept an `Idempotency-Key`.
- **Default rate limiting** on every route (per token + per IP), stricter on auth/write endpoints.
- **Versioning:** `/api/v1`; breaking changes → `/api/v2` with the deprecation policy (announce in changelog, keep prior version one major cycle).

---

## 5. Data, multi-entity & performance

- **Org → entities.** An organization owns one or more **entities** (brands/business units). `templates`, `assignments`, and `employees` are **entity-scoped** (`entity_id`). Every org has a default entity.
- **Migrations** live in `packages/db/migrations`; add the migration in the same PR as the code that needs it, and **add an index for every column used in a filter/sort/FK join**.
- **Query budget — no DB query > 1s.** Postgres `statement_timeout = 1000ms` is set; do not work around it. Watch query p95/p99 in OTel.
- **No N+1 queries** unless genuinely unavoidable (justify in a comment). Prefer joined/set-based Kysely queries and batched loads. The per-request **query-count test guard** must stay green — an N+1 regression fails tests.

---

## 6. Auth & RBAC

- **Roles:** `owner`, `admin`, `user` (Better Auth org plugin: owner/admin/member, where `member` = `user`). First member of an org is `owner`.
- **Deny by default.** Every protected route goes through the server-side `requirePermission` middleware enforcing the permission matrix. **The UI is never the security boundary** — a `user` must not reach admin/owner endpoints even by direct API call.
- **Default matrix:** owner = everything; admin = manage templates/assignments, run/read syncs, read employees/departments/roles; user = view/preview own signature & profile only. Managing org settings, members/roles, entities, API/application tokens, and directory connections is **owner-only**. `admin` is **org-wide for now** (entity-scoped admin is a later step).
- **v1 auth:** email/password + **email OTP**. **Do not** build Google SSO / SAML / SCIM — they are next steps; only leave flagged `TODO` stubs.
- Application/SCIM token minting and SSO-provider registration are **owner/admin only**; disable Better Auth's personal SCIM tokens.

---

## 7. Testing & coverage

- **Unit/integration:** Vitest. **Coverage gate ≥90%** (v8 provider, `coverage.thresholds`); the test job fails below 90% and is a required check. **Add tests with every change** to hold the line.
- **E2E:** Playwright against the running app.
- **Visual regression:** Argos — Storybook stories (`@argos-ci/storybook`) for components, `@argos-ci/playwright` + `argosScreenshot` for pages. Uploads gated to CI only.
- Mock external clients (Google, etc.) in tests; never hit real third-party APIs.

---

## 8. Security by design

- **Secrets in env only** — never committed. `.env.example` documents every var. gitleaks runs in CI.
- **Encrypt at rest** (AES-GCM, key from env): OAuth tokens, application tokens, Slack webhook URLs. `directory_connections.encrypted_credentials` and `notification_channels` are never plaintext.
- Hono `secureHeaders`; CSRF protection for cookie sessions; least-privilege Google scopes (documented in `SECURITY.md`).
- Append-only `audit_log` for directory reads and signature writes.
- Supply chain: Renovate/`pnpm audit` (SCA); pinned/hash-locked GitHub Actions; SBOM + npm provenance on release. (No SAST/CodeQL — secret scanning via gitleaks is the security-scan gate.)
- **No PII in logs/traces/metrics**; scrub before shipping to Loki. Security-relevant changes go under the changelog `Security` heading.

---

## 9. Observability

- **OpenTelemetry** on **both services** + jobs + DB spans, over OTLP.
- **Metrics:** Prometheus at `/metrics` (`prom-client`) — RED, queue depth, sync-run outcomes.
- **Logging:** **`pino`** JSON logs with request-id/trace correlation, shipped to **Loki**. (Prometheus = metrics, Loki = logs, Grafana reads both.)
- **Health:** `/healthz` (liveness) + `/readyz` (DB + queue).
- **Errors & alerts are handled in Grafana** (Loki error logs + metrics + Grafana Alerting → Slack). Do not add an external error-tracking SaaS.

---

## 10. Notifications

- Per-org **Slack** webhook (owner/admin-configured, stored encrypted) for `synchronization.completed` and org/entity-change events, sourced from `audit_log`, dispatched via a retried `notify` pg-boss job. Channels are modeled generically (`type` ∈ slack/email/webhook); per-entity channels are a later step.

---

## 11. Commits, CLA, versioning & releases

- **Conventional Commits**, enforced by commitlint; small, logical commits (not one giant commit).
- **CLA required** — every contributor signs via CLA Assistant (grants the dual-licensing rights open-core needs). This **replaces DCO**; do not use `-s` sign-off as the mechanism.
- **A Changeset on every PR** that changes behavior — CI fails PRs without one. Changesets computes the SemVer bump and the changelog (Keep a Changelog format).
- **Trunk-based**; `main` is protected. **Release gates:** all required checks green (lint, typecheck, ≥90% coverage, build, e2e, Argos approved) + changeset present + manual approval (GitHub Environment) before publish; publish with npm provenance.

---

## 12. Documentation

- The OpenAPI spec is **generated from `@hono/zod-openapi`** — the committed `openapi.json` is the single source of truth, served via **Scalar** at `/api/docs`. The CI **drift gate** fails on a stale `openapi.json`, so endpoint changes update the docs in the same PR.
- Guides are markdown in `/docs` (include the **Database** section: Postgres setup, configuration, and external-DB connection). Mintlify migration is a later step.

---

## 13. Compliance (controls, not certification)

- GDPR: employee data **export** + **erasure** (cascading, logged) and configurable **retention** purge jobs; keep a data map; no PII in telemetry.
- SOC 2-aligned controls already covered by RBAC, encryption, audit log, change management, monitoring. Certification itself is an external process — out of scope for code.

---

## 14. Every-PR checklist (the short version)

1. Code in the right place (`apps/*` vs `packages/*`); Turbo tasks/outputs declared.
2. Inputs Zod-validated; REST resources follow the §4 naming + pagination + error conventions.
3. Authorization enforced server-side (`requirePermission`), deny-by-default.
4. Migrations + indexes added; no query > 1s; no N+1 (guard green).
5. Tests added; coverage stays **≥90%**.
6. No secrets committed; sensitive values encrypted at rest; no PII in logs.
7. OpenAPI regenerated if endpoints changed (drift gate green).
8. Conventional commit; CLA signed; **a changeset included**.
9. License headers/notices consistent with **AGPL-3.0**.
10. Code style holds: `const`+arrow only, immutable, early returns, storytelling names, errors wrapped at source (§3).

---

## 15. Review-derived anti-patterns (must-avoid)

These bug classes shipped (or nearly shipped) once and must never recur — scan every change
against them before writing and before committing. Each is a *category*, not a single mistake.

1. **Security/debug toggles FAIL CLOSED.** Never gate a dangerous affordance with a negative env
   check (`NODE_ENV !== "production"`) — an unset/misspelled env then enables it in prod. Use a
   positive opt-in flag and **throw at startup** if it is set under `NODE_ENV=production`.
2. **Never log credentials or PII.** No OTP codes, tokens, passwords, or full emails in
   logs/traces/metrics — redact **by default in every environment**, not only in production (§8).
3. **No documented-but-unwired config.** If a comment/`.env.example`/doc promises an env knob, it
   must actually be read, threaded through to where it is used, and covered by a test.
4. **Authz claims come from the request's actual scope.** Derive org/tenant/role from the session's
   **active** organization, never "first row"/a default. Always reason about the multi-org user (§6).
5. **Guard state-machine transitions.** A status-changing `UPDATE` must constrain the current state
   in its `WHERE` (re-assert it to survive races); return **409** on an invalid transition, **404**
   when absent. Never blind-write over terminal/immutable rows.
6. **Don't confuse id types.** Never pass one resource's id where another's is expected; resolve
   explicitly. A comment must never claim a resolution/behavior the code does not actually perform.
7. **Bound every input.** Every string/array gets a `.max(...)` at the Zod boundary, especially
   anything fed to an expensive op (MJML compile, regex, crypto) — unbounded input is a DoS vector.
8. **Crypto randomness + server-side uniqueness.** No `Math.random()` for slugs/ids/secrets; enforce
   uniqueness with a DB constraint + retry. Order multi-step creates so a later failure cannot strand
   earlier state (e.g. an account created but its org-create failing).
9. **Rate-limit auth and write endpoints explicitly.** Cap OTP/login attempts and set per-IP limits
   in code; do not rely on library defaults that are disabled outside production.
10. **Don't clobber controlled UI state from async data.** A `useEffect` that reseeds form state on
    every query-object identity change wipes in-progress edits on refetch — key on a stable id or
    seed once.
11. **Route responses through the shared error boundary.** Don't hand-roll `if (!res.ok) throw`
    duplicating the shared `fetchJson`/`ApiError` helper; extend the helper (201/204) instead.
