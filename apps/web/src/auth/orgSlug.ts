// Turn a company name into a URL-safe organization slug. Org slugs are unique across the whole instance
// (open sign-up means two companies could share a name), so the caller appends a short random suffix —
// passed in here rather than generated, to keep this a pure, testable function.

const MAX_BASE_LENGTH = 32

const slugifyName = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, "")

// Build the final slug: the slugified name plus a separator and the suffix. When the name slugifies to
// nothing (e.g. all punctuation), fall back to a stable "org" base so the slug is never just the suffix.
export const toOrgSlug = (name: string, suffix: string): string => {
  const base = slugifyName(name)
  const safeBase = base.length > 0 ? base : "org"
  return `${safeBase}-${suffix}`
}
