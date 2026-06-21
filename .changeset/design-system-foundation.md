---
"@lagda/ui": minor
---

Apply the lagda design-system foundation. Switch the type system to **Geist / Geist Mono**
(self-hosted via Fontsource — no external CDN call, works offline). Extend the token ramp with
cool-neutral surface steps (`--subtle`, `--hover`, `--border-strong`, `--faint`, `--body`) and a
functional **status palette** (`--success`, `--warning`, retuned `--destructive`) wired into the
Tailwind preset with opacity support, plus an 8px base radius (6/8/12 scale) and a `pulse-dot`
animation. Add two new primitives: **`Logo`/`Logomark`** (the "l on a signature line" mark, token-driven
so it inverts in dark mode) and **`StatusBadge`** (Synced / Syncing / Failed / Queued, with a pulsing
dot on Syncing). Both ship with Storybook stories as the Argos visual baseline.
