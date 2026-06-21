import { getEmployee } from "./getEmployee"
import { listEmployees } from "./listEmployees"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Assembly: employee reads (write paths arrive via directory synchronization, not the API).
export const createEmployeesRepository = (db: LagdaDatabase, paginate: Paginate) => ({
  listEmployees: listEmployees(db, paginate),
  getEmployee: getEmployee(db),
})
