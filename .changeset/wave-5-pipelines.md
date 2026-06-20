---
"@lagda/server": patch
"@lagda/web": patch
---

Add the Wave 5 CI pipelines: an OpenAPI drift gate (regenerates and diffs the committed
apps/server/openapi.json), a Playwright end-to-end smoke against the booted `docker compose up` stack,
and an Argos visual-regression workflow gated on the ARGOS_TOKEN secret. Adds a `pnpm --filter
@lagda/server openapi` generator and a Playwright scaffold under apps/web/e2e.
