---
"@lagda/auth-contract": minor
"@lagda/auth": minor
"@lagda/server": patch
"@lagda/db": patch
"@lagda/web": minor
---

Add the Synchronizations screen and make scoped routes work for human sessions. Token scopes are now
derived from a role (`scopesForRole`) and embedded in the session JWT, so the resource server's scope
gate admits a signed-in user on the SPA as well as machine application tokens. `sync_runs.created_by`
becomes text (it holds a Better Auth user id), and the server starts pg-boss before serving so a
synchronization can be enqueued. The SPA gains a Synchronizations screen to run and cancel syncs.
