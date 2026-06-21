---
"@lagda/auth": patch
"@lagda/server": patch
"@lagda/web": patch
---

Fix the bugs found in the PR review. Auth: scope the minted JWT to the session's **active**
organization (not the first-joined one) so a multi-org user is never authorized against the wrong
tenant; make the dev fixed-OTP a fail-closed `AUTH_DEV_FIXED_OTP` opt-in that refuses to start in
production; never log OTP codes or full emails outside an explicit dev opt-in; wire `TRUSTED_ORIGINS`
from the environment (a self-hosted SPA origin would otherwise 403); and add explicit OTP attempt
limits + rate limiting. Server: guard sync cancel so a terminal run is never silently overwritten
(409 instead), resolve an org-wide sync target to the org's default entity instead of forwarding the
org id as an entity id, and bound template `mjmlSource` length. Web: use cryptographic randomness for
the org slug suffix, stop the settings form clobbering in-progress edits on refetch, key list caches on
`limit` as well as `cursor`, and route writes through the shared error boundary.
