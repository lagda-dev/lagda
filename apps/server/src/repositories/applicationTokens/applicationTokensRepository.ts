import type { ApplicationTokenStore } from "../../applicationTokens/applicationTokens"
import type { LagdaDatabase } from "../shared/paginate"
import { insertApplicationToken } from "./insertApplicationToken"
import { listApplicationTokensByOrg } from "./listApplicationTokensByOrg"
import { markApplicationTokenRevoked } from "./markApplicationTokenRevoked"

// Assembly: the Kysely-backed implementation of the ApplicationTokenStore port the domain logic uses.
export const createApplicationTokenStore = (db: LagdaDatabase): ApplicationTokenStore => ({
  insert: insertApplicationToken(db),
  listByOrganization: listApplicationTokensByOrg(db),
  markRevoked: markApplicationTokenRevoked(db),
})
