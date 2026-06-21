// Static marketing copy for the landing page, kept as data so sections render by mapping rather than
// repeating markup. Pure content — no logic, no JSX.

export interface NavLink {
  label: string
  href: string
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Self-host", href: "#selfhost" },
  { label: "Open source", href: "#opensource" },
]

export interface Feature {
  glyph: string
  title: string
  description: string
}

export const FEATURES: readonly Feature[] = [
  {
    glyph: "↺",
    title: "Directory sync",
    description: "Pull employees, titles and photos from Google Workspace or Microsoft Entra — kept current on a schedule.",
  },
  {
    glyph: "⌗",
    title: "Signature templates",
    description: "Design brand-consistent signatures with live merge fields. Stacked, horizontal or minimal — preview as you build.",
  },
  {
    glyph: "⤳",
    title: "Assignment rules",
    description: "Map templates to people by entity, department, title or domain. Rules resolve top-down — first match wins.",
  },
  {
    glyph: "◷",
    title: "Scheduled deploys",
    description: "Push to every mailbox automatically, or run on demand. Track deployed, failed and skipped per run.",
  },
  {
    glyph: "⚿",
    title: "RBAC & audit log",
    description: "Owner, admin and user roles enforced server-side. Every change is recorded in an immutable audit trail.",
  },
  {
    glyph: "{ }",
    title: "REST API & tokens",
    description: "A typed, documented API with scoped bearer tokens — wire signature deploys straight into your CI.",
  },
]

export interface Step {
  number: string
  title: string
  description: string
}

export const STEPS: readonly Step[] = [
  {
    number: "1",
    title: "Connect your directory",
    description: "Authorize Google Workspace or Microsoft Entra. Lagda imports your people, read-only, in seconds.",
  },
  {
    number: "2",
    title: "Design & assign",
    description: "Build a template, then write rules so the right signature lands on the right team automatically.",
  },
  {
    number: "3",
    title: "Sync to every inbox",
    description: "Hit run — or let the schedule do it. Signatures deploy to every mailbox, with failures surfaced instantly.",
  },
]

export interface Stat {
  value: string
  label: string
}

export const TRUST_STATS: readonly Stat[] = [
  { value: "100%", label: "self-hosted, your data" },
  { value: "38s", label: "to sync 1,200 mailboxes" },
  { value: "2", label: "directory providers" },
  { value: "0", label: "third-party data sharing" },
  { value: "AGPL", label: "free & open forever" },
]

// TODO: replace these mock figures with real metrics (GitHub API / project stats) before launch.
export const PROJECT_STATS: readonly Stat[] = [
  { value: "2.4k", label: "GitHub stars" },
  { value: "63", label: "contributors" },
  { value: "∞", label: "seats, no per-user fees" },
]

export interface SelfHostPoint {
  text: string
}

export const SELF_HOST_POINTS: readonly SelfHostPoint[] = [
  { text: "Docker-first — no Node or pnpm required to run" },
  { text: "Postgres-backed, with Prometheus metrics & Grafana" },
  { text: "AGPL-3.0 — audit it, fork it, run it forever" },
]

export interface FooterColumn {
  heading: string
  links: readonly string[]
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  { heading: "Product", links: ["Features", "How it works", "Self-host"] },
  { heading: "Resources", links: ["Documentation", "API reference", "Changelog"] },
  { heading: "Project", links: ["GitHub", "License", "Security"] },
]
