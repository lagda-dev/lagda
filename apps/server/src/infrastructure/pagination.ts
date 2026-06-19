import { z } from "zod"

// Cursor-pagination contract for every list endpoint (§4): `?cursor=&limit=`, default 25, max 100,
// response envelope `{ data, nextCursor }`. Pure functions only — no I/O — so they are unit-tested
// in isolation and reused by every resource.

export const DEFAULT_PAGE_SIZE = 25
export const MAX_PAGE_SIZE = 100

// The validated query parameters every list route accepts. `cursor` is opaque to clients; `limit`
// is coerced from the query string and clamped to [1, MAX_PAGE_SIZE] with a sensible default.
export const paginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

// The response envelope for a page of `TItem`. `nextCursor` is `null` when there are no more pages.
export type Page<TItem> = {
  data: TItem[]
  nextCursor: string | null
}

// We fetch one extra row beyond the requested limit to detect whether another page exists without
// a second count query. This is the page size to ask the data layer for.
export const fetchLimitFor = (limit: number): number => limit + 1

// Turn an over-fetched batch (limit + 1 rows) into the page envelope: trim to `limit`, and derive
// `nextCursor` from the last kept item only when an extra row proved more pages exist.
export const toPage = <TItem>(rows: readonly TItem[], limit: number, toCursor: (item: TItem) => string): Page<TItem> => {
  const hasMore = rows.length > limit
  const pageItems = hasMore ? rows.slice(0, limit) : [...rows]
  const lastItem = pageItems.at(-1)
  const nextCursor = hasMore && lastItem !== undefined ? toCursor(lastItem) : null
  return { data: pageItems, nextCursor }
}
