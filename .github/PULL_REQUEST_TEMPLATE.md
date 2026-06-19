## Summary

<!-- What does this PR change, and why? -->

## Type of change

- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] docs
- [ ] test
- [ ] chore / ci / perf

## Checklist

- [ ] Conventional Commit messages
- [ ] **Changeset added** (`pnpm changeset`) for any user-facing change
- [ ] **CLA signed**
- [ ] Tests added/updated; coverage stays **≥ 90%**
- [ ] `pnpm check` passes (lint, typecheck, test, build)
- [ ] OpenAPI regenerated (`openapi.json`) if endpoints changed

## Security checklist

- [ ] All external input is Zod-validated
- [ ] Authorization enforced server-side (deny by default)
- [ ] No secrets committed; sensitive values encrypted at rest
- [ ] No PII in logs/traces/metrics
- [ ] Security-relevant changes noted under the changelog `Security` heading
