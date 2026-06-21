---
name: add-ui-component
description: >-
  Recipe for adding a UI component to the Lagda design system. Use when creating
  or modifying a shared component, shadcn primitive, Storybook story, or anything
  in packages/ui, or when the SPA (apps/web) needs a new reusable component.
  Trigger whenever the task involves React components, styling/Tailwind tokens,
  the minimalist aesthetic, or visual regression baselines. Pairs with the always-on
  lagda-conventions skill (§3 stack + code style) — read that first.
---

# Add a UI component (Lagda)

Components are **shadcn/ui owned in `packages/ui`** (Radix + Tailwind + `cva`),
`neutral` base, `new-york` style, **minimalist, neutral aesthetic**. The SPA
imports every primitive from `@lagda/ui` — never duplicate primitives in
`apps/web`. Follow `lagda-conventions` §3 for the full detail.

## Steps

1. **Add the component to `packages/ui`** (owned source, shadcn `new-york` /
   `neutral`). Never duplicate primitives in `apps/web`. One file per component,
   organized by domain; small focused units (§3).

2. **Style with the design tokens** via the shared Tailwind preset and the `cn`
   util — Tailwind-native, no second styling system. Aesthetic: cool-neutral
   grays, a single near-black ink, **1px borders over shadows**, **8px radius**,
   **Geist** (`font-sans`) for the interface and **Geist Mono** (`font-mono`) for
   data/metrics/identifiers, generous whitespace. **Status colors
   (success/warning/destructive) are the only color** — reach for the `StatusBadge`
   primitive rather than re-styling pills inline.

3. **Follow the code style** (§3): `const` + arrow functions only (no
   `function`, no `var`, no `any`); no semicolons, double quotes (`oxfmt` owns
   whitespace — never hand-format); `import type` for type-only imports;
   immutable props handling; storytelling names.

4. **Export it from the package barrel** — add the export to `src/ui.ts` (the
   named package entry, not `index.ts`).

5. **Write a Storybook story** covering the main variants. This is the **Argos
   visual baseline** (`@argos-ci/storybook`); the variants you story are what
   visual regression locks in.

6. **Consume it in the SPA** by importing from `@lagda/ui` (cross-package import,
   never a copy). Data fetching stays in the SPA via TanStack Query over the Hono
   RPC client — keep the component presentational where possible.

7. **Wrap up:** add a **changeset** (CI fails PRs without one) and use a
   **Conventional Commit**. Keep coverage ≥ 90% if the component carries logic
   (§7).

## Quick checklist

- [ ] Component lives in `packages/ui` (shadcn `new-york` / `neutral`), no
      `apps/web` duplication
- [ ] Design tokens via shared Tailwind preset + `cn`; 1px borders, 8px radius,
      Geist / Geist Mono, cool-neutral grays, status colors only
- [ ] Code style: const+arrow, no semicolons, double quotes, `import type`
- [ ] Exported from `src/ui.ts`
- [ ] Storybook story covers main variants (Argos baseline)
- [ ] SPA consumes it via `@lagda/ui`
- [ ] Changeset + Conventional Commit
