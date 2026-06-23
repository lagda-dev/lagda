import { recordQuery } from "../../infrastructure/queryCounter"
import type { ApplicationTokenRecord } from "../../applicationTokens/applicationTokens"
import type { LagdaDatabase } from "../shared/paginate"
import { APPLICATION_TOKEN_COLUMNS, toApplicationTokenRecord } from "./applicationTokenMapper"

// List all of the org's tokens, newest first. Bounded (an org has few tokens), so no keyset pagination.
export const listApplicationTokensByOrg =
  (db: LagdaDatabase) =>
  async (organizationId: string): Promise<readonly ApplicationTokenRecord[]> => {
    recordQuery()
    const rows = await db
      .selectFrom("application_tokens")
      .select(APPLICATION_TOKEN_COLUMNS)
      .where("org_id", "=", organizationId)
      .orderBy("created_at desc")
      .execute()
    return rows.map(toApplicationTokenRecord)
  }
