import { createAssignment } from "./createAssignment"
import { deleteAssignment } from "./deleteAssignment"
import { getAssignment } from "./getAssignment"
import { listAssignments } from "./listAssignments"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Assembly: bind each assignment action to its dependencies.
export const createAssignmentsRepository = (db: LagdaDatabase, paginate: Paginate) => ({
  listAssignments: listAssignments(db, paginate),
  getAssignment: getAssignment(db),
  createAssignment: createAssignment(db),
  deleteAssignment: deleteAssignment(db),
})
