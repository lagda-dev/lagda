import { listAuditEvents } from "./listAuditEvents"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Assembly: read-only audit listing.
export const createAuditRepository = (db: LagdaDatabase, paginate: Paginate) => ({
  listAuditEvents: listAuditEvents(db, paginate),
})
