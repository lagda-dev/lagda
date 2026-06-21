import { listDepartments } from "./listDepartments"
import { listRoles } from "./listRoles"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Assembly: read-only directory lookups (departments need the db; roles are static).
export const createDirectoryRepository = (db: LagdaDatabase, paginate: Paginate) => ({
  listDepartments: listDepartments(db, paginate),
  listRoles: listRoles(),
})
