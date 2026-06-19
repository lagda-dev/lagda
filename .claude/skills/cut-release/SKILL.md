---
name: cut-release
description: >-
  The gated release flow for Lagda (lagda-conventions §11). Use when cutting,
  publishing, or versioning a release — handling the Changesets "Version
  Packages" PR, approving the protected publish environment, tagging, creating a
  GitHub Release, publishing to npm, or setting up a canary/RC pre-release.
  Trigger on any request to ship, release, bump versions, or publish packages.
  Pairs with the always-on lagda-conventions skill — read §11 first.
---

# Cut a release (Lagda)

Trunk-based; `main` is protected. Releases are **gated** and **publish requires a
human approval** behind a protected GitHub Environment. Versioning + changelog are
driven by **Changesets** (SemVer + Keep a Changelog). Follow `lagda-conventions`
§11.

## Steps

1. **Confirm all required checks are green on `main`:** lint, typecheck, tests at
   **≥ 90% coverage**, build, **Playwright e2e**, and **Argos visual approved**.
   Do not proceed if any required check is red.

2. **Ensure pending changesets exist** — run `pnpm changeset status`. The
   Changesets GitHub Action opens (or updates) the **"Version Packages" PR**,
   which applies the **SemVer bumps** and writes the **CHANGELOG** in Keep a
   Changelog format. (Behavior-changing PRs must already carry a changeset; CI
   blocks PRs without one.)

3. **Merge the "Version Packages" PR.** Merging triggers the **publish job**,
   which re-runs the gates, builds, tags the release, creates a **GitHub
   Release**, and publishes with **npm provenance** + SBOM.

4. **Approve the protected environment.** The publish job sits behind a protected
   GitHub Environment with **required reviewers** — a human must approve before
   anything ships. Nothing publishes automatically.

5. **Pre-release channels (canary / RC):** use **Changesets pre mode**
   (`pnpm changeset pre enter <tag>` … `pnpm changeset pre exit`) to publish on a
   pre-release channel before promoting to a stable release.

## Quick checklist

- [ ] Required checks green on `main`: lint, typecheck, tests ≥ 90%, build, e2e,
      Argos approved
- [ ] `pnpm changeset status` shows pending changesets; "Version Packages" PR
      open/updated
- [ ] Merge "Version Packages" PR → publish job re-runs gates, builds, tags,
      releases, publishes with provenance
- [ ] Protected Environment approved by a required reviewer
- [ ] Canary/RC via Changesets pre mode when needed
