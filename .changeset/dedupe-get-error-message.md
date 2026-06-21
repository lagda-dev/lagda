---
"@lagda/core": minor
"@lagda/db": patch
"@lagda/jobs": patch
"@lagda/connectors": patch
"@lagda/templating": patch
"@lagda/observability": patch
"@lagda/email": patch
"@lagda/auth": patch
"@lagda/server": patch
---

Consolidate the duplicated `getErrorMessage` helper. It was copy-pasted in 8 places with drifted
fallback branches (`"Unexpected error"`, `JSON.stringify`, `String`); it now lives once in `@lagda/core`
with a single robust implementation that never throws. Every package imports it from there.
