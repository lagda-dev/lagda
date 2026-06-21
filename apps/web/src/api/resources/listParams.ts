import type { ListFilters } from "../queryKeys"

// The cursor-pagination inputs every list hook accepts (§4: `?cursor=&limit=`, default 25 / max 100).
// The server validates and clamps these; the SPA only forwards what the caller provides. Kept here so
// the shape is declared once and reused by every `use<Resource>List` hook.

export type CursorListParams = {
  cursor?: string
  limit?: number
}

// Build the query-key filter object from the SAME params the fetcher consumes, so two calls with a
// different `limit` cache independently. Folding only `cursor` (the old bug) collided distinct limits
// onto one cache entry, serving the wrong-sized page.
export const toListFilters = ({ cursor, limit }: CursorListParams): ListFilters => ({ cursor, limit })

// Build the `query` object the Hono RPC client expects, omitting absent values so we never send empty
// `cursor=` / `limit=` query strings. `limit` is serialized to a string because query params are strings
// on the wire (the server's `z.coerce.number()` parses it back).
export const toListQuery = ({ cursor, limit }: CursorListParams): Record<string, string> => {
  const query: Record<string, string> = {}
  if (cursor !== undefined && cursor.length > 0) query.cursor = cursor
  if (limit !== undefined) query.limit = String(limit)
  return query
}

// A list filter narrowed to a single optional id (entity / department / etc.) on top of pagination.
// Filters are merged into the query the same way; absent filters are dropped.
export const mergeFilters = (base: Record<string, string>, filters: Record<string, string | undefined>): Record<string, string> => {
  const merged = { ...base }
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value.length > 0) merged[key] = value
  }
  return merged
}
