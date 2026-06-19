# lagda

Open-source, self-hostable **email-signature management platform** (open-core, AGPL-3.0).

## Canonical conventions live in the skill

**Before writing any code in this repo, read the `lagda-conventions` skill**
(`.claude/skills/lagda-conventions/SKILL.md`). It is the single source of truth for the
architecture, stack, API rules, RBAC, testing, security, observability, release gates, and
code style. This file only summarizes; the skill governs.

## Always-on essentials

- **Architecture:** monorepo, two deployables — `apps/server` (Hono monolith: `/api/*` + serves the SPA, verifies JWTs via the auth service's JWKS, runs pg-boss jobs) and `apps/auth` (Better Auth, sole token authority). SPA is `apps/web`. Never add Better Auth to `apps/server`.
- **Stack:** TypeScript `strict`, pnpm + Turborepo, Hono, Vite + React + React Router, Tailwind + shadcn owned in `packages/ui`, Kysely (no ORM), Zod everywhere.
- **Toolchain:** OXC only — `oxlint` + `oxfmt` (`semi: false`, double quotes, 160 width). Never ESLint/Biome/Prettier.
- **Code style:** `const` + arrow functions only (no `function`, no `var`, no `any`); immutability; early returns, no nested/`while` loops; storytelling names + named intermediate steps; one file per step; wrap errors at the source with `getErrorMessage`, never double-wrap; never `Sync` (use `Synchronize`).
- **Every PR:** Zod-validate inputs; authorize server-side (`requirePermission`, deny-by-default); add migrations + indexes; no query > 1s, no N+1; **tests, coverage ≥90%**; no secrets/PII committed; regenerate `openapi.json` if endpoints changed; Conventional Commit; CLA signed; **a changeset included**.

See the skill for the full detail and the per-task skills (`add-api-endpoint`, `add-ui-component`, `cut-release`).
