# Contributing to Lagda

Thanks for your interest in improving Lagda. This guide covers how to propose changes.

## Before you start

- By contributing, you agree to license your work under the project's terms and you **must sign the CLA** — the [CLA Assistant](https://github.com/cla-assistant/cla-assistant) bot will prompt you on your first pull request. Signing the CLA (not a DCO sign-off) is what lets the project be dual-licensed.
- Be excellent to each other — see [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Development setup

```bash
pnpm install
pnpm dev        # runs the SPA + API together
pnpm check      # lint, typecheck, test, build (run before pushing)
```

Requirements: Node ≥ 20 and pnpm 9 (see `.nvmrc` / `packageManager`).

## Conventions

The engineering conventions are the single source of truth and are enforced in review and CI.
They live in the `lagda-conventions` Claude Code skill (`.claude/skills/lagda-conventions/SKILL.md`)
and are summarized in [CLAUDE.md](./CLAUDE.md). Highlights:

- **TypeScript** `strict`, no `any`. `const` + arrow functions only. OXC toolchain (`oxlint` + `oxfmt`) — run `pnpm format` before committing.
- **Validate** every external input with Zod; authorize server-side (deny by default).
- **Tests** with every change — coverage must stay **≥ 90%**.
- **No secrets** committed; sensitive values encrypted at rest; no PII in logs.

## Pull requests

1. Branch off `main`; keep commits small and logical.
2. Use **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, `perf:`). `commitlint` runs on commit.
3. Add a **changeset** for any user-facing change: `pnpm changeset`. CI fails PRs without one.
4. Ensure all checks pass: lint, typecheck, tests (≥90%), build, e2e, and Argos visual review.
5. Update docs in the same PR — if you change an endpoint, regenerate `openapi.json`.
6. Fill in the PR template, including the security checklist.

## Releases

Releases are gated and automated via Changesets — see the `cut-release` skill. Maintainers approve the publish step in a protected GitHub Environment.
