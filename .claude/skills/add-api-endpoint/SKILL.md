---
name: add-api-endpoint
description: >-
  End-to-end recipe for adding or modifying a REST or RPC endpoint in the Lagda
  server (apps/server). Use when you are creating, changing, or removing an
  /api/* route, a public /api/v1 resource, a Hono RPC handler, request/response
  Zod schemas, or anything that touches AppType, the OpenAPI spec, or endpoint
  authorization. Pairs with the always-on lagda-conventions skill (§4 API, §5
  data/perf, §6 RBAC) — read that first if you have not.
---

# Add an API endpoint (Lagda)

Follow `lagda-conventions` for the canonical rules; this is the ordered recipe.
The SPA talks to `apps/server` over the typed **Hono RPC** client; the **public
API is REST under `/api/v1`** defined with `@hono/zod-openapi`. Never add Better
Auth to `apps/server` — it is a JWKS-verifying resource server.

## Steps

1. **Define the route with `@hono/zod-openapi`.** Use `createRoute` with Zod
   request and response schemas. Honor §4 REST conventions:
   - Resource names: plural, lowercase, hyphenated nouns under `/api/v1`;
     collection `/api/v1/<resource>`, item `/<resource>/{id}`, sub-resources
     nested one level. HTTP methods are the verbs — no `/getX`; the only allowed
     action suffixes are explicit ones like `/cancel`.
   - Lists are cursor-paginated: `?cursor=&limit=`, **default 25 / max 100**,
     envelope `{ data, nextCursor }`. No unbounded list queries.
   - Errors use the one shape `{ error: { code, message, details? } }` with the
     correct status code.

2. **Validate every input with Zod** — body, query, params, and relevant headers
   via `@hono/zod-validator` / `@hono/zod-openapi`. No handler trusts unvalidated
   input. Fail fast with the §4 error envelope.

3. **Chain the route onto the app** (`app.openapi(...)` / `app.route(...)`) so
   the exported `AppType` stays accurate — the SPA's `hc<AppType>` client derives
   its types from it. Keep handlers thin: orchestrate named step helpers, push
   business logic into `packages/*` / repository actions, keep zero logic in the
   route wiring (§3 storytelling style, `const` + arrow, no `function`).

4. **Enforce authorization server-side, deny by default.** Every protected route
   goes through `requirePermission` against the permission matrix (§6) — the UI
   is never the security boundary; a `user` must not reach admin/owner endpoints
   even by direct call. For **public-API routes**, require an **application-token
   scope** (tokens minted by `apps/auth`, owner/admin only, verified via JWKS)
   and enforce that scope. **`POST`s accept an `Idempotency-Key`.** Default rate
   limiting (per token + per IP), stricter on auth/write endpoints.

5. **Add migrations + indexes if the schema changes** (§5). Migrations go in
   `packages/db/migrations` in the **same PR**; add an index for **every column
   used in a filter / sort / FK join**, then regenerate the `Database` type with
   `kysely-codegen`. Keep every query **< 1s** (do not bypass the 1000ms
   `statement_timeout`) and **avoid N+1** — use joined/set-based Kysely queries
   and batched loads so the per-request **query-count test guard stays green**.

6. **Add unit + integration tests** (Vitest). Mock external clients; never hit
   real third-party APIs. **Coverage must stay ≥ 90%** — the test job fails below
   it. Include the query-count guard for new list/detail paths.

7. **Regenerate and commit `openapi.json`.** It is generated from
   `@hono/zod-openapi` and is the single source of truth (served via Scalar at
   `/api/docs`). The CI **drift gate fails on a stale spec**, so update it in the
   same PR as the endpoint change.

8. **Wrap up the contribution.** Add a **changeset** (CI fails PRs without one),
   use a **Conventional Commit**, and **sign the CLA**. Breaking changes go to
   `/api/v2` with the deprecation policy (§4).

## Quick checklist

- [ ] Route via `createRoute` + Zod schemas, §4 naming / pagination / error shape
- [ ] All inputs Zod-validated
- [ ] Route chained so `AppType` is current
- [ ] `requirePermission` (deny-by-default); public API = token scope +
      `Idempotency-Key` on POST; rate limiting on
- [ ] Migrations + indexes; `< 1s`; no N+1 (guard green); `Database` type regen
- [ ] Tests added; coverage ≥ 90%
- [ ] `openapi.json` regenerated (drift gate green)
- [ ] Changeset + Conventional Commit + CLA signed
