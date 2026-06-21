import { getOrganization } from "./getOrganization"
import { listOrganizations } from "./listOrganizations"
import { updateOrganization } from "./updateOrganization"
import type { LagdaDatabase, Paginate } from "../shared/paginate"

// Assembly: bind each organization action to its dependencies. No business logic here.
export const createOrganizationsRepository = (db: LagdaDatabase, paginate: Paginate) => ({
  listOrganizations: listOrganizations(db, paginate),
  getOrganization: getOrganization(db),
  updateOrganization: updateOrganization(db),
})
