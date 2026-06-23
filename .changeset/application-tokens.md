---
"@lagda/db": minor
"@lagda/auth-contract": minor
"@lagda/server": minor
"@lagda/web": minor
"@lagda/auth": patch
---

Add the Application tokens screen (first of the design's missing screens). Owners and admins can mint
scoped, org-bound bearer tokens for the REST API, list them, and revoke them; the plaintext secret is
shown exactly once at mint and stored only as a SHA-256 hash. Adds the `application_tokens` table, a
DDD Kysely store, the `/api/v1/application-tokens` routes (guarded by `MANAGE_TOKENS`, now granted to
admins too), and the SPA screen. The token domain logic that was orphaned in `apps/auth` is consolidated
into `apps/server`. Server-side verification of a presented token (M2M auth) is a separate follow-up.
