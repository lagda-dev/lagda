import { createDatabase } from "@lagda/db"
import type { DbQuerySample } from "@lagda/observability"
import { fetchLimitFor, toPage } from "../../infrastructure/pagination"
import type { Page, PaginationQuery } from "../../infrastructure/pagination"
import { recordQuery } from "../../infrastructure/queryCounter"

// The typed Kysely client, derived from `@lagda/db`'s factory so the server needs no direct `kysely`
// dependency — the db package owns that wiring and exposes the typed client through its return type.
export type LagdaDatabase = ReturnType<typeof createDatabase>

// An optional recorder for `db_query_duration_seconds` (§9). Defaults to a no-op so the repository
// works without observability wired (tests, integration); `server.ts` passes the real recorder.
export type RecordDbQuery = (sample: DbQuerySample) => void
export const noopRecordDbQuery: RecordDbQuery = () => undefined

const SERVICE_NAME = "lagda-server"
const MILLISECONDS_PER_SECOND = 1000

type PaginateInput<TItem> = {
  operation: string
  query: PaginationQuery
  runRows: (limit: number, cursor: string | undefined) => Promise<TItem[]>
  toCursor: (item: TItem) => string
}

// The shared keyset-pagination helper each list action is bound with (alongside the db client).
export type Paginate = <TItem>(input: PaginateInput<TItem>) => Promise<Page<TItem>>

// Build a keyset-paginated list over a table reachable from `org_id`. Returns one extra row so the page
// envelope can derive `nextCursor` without a count query, and times the list under `operation` (§9).
export const buildPaginate =
  (recordDbQuery: RecordDbQuery): Paginate =>
  async ({ operation, query, runRows, toCursor }) => {
    recordQuery()
    const startedAt = performance.now()
    const rows = await runRows(fetchLimitFor(query.limit), query.cursor)
    recordDbQuery({ service: SERVICE_NAME, operation, durationSeconds: (performance.now() - startedAt) / MILLISECONDS_PER_SECOND })
    return toPage(rows, query.limit, toCursor)
  }
