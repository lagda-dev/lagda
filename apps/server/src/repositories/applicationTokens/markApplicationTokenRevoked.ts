import { recordQuery } from "../../infrastructure/queryCounter"
import type { ApplicationTokenRecord } from "../../applicationTokens/applicationTokens"
import type { LagdaDatabase } from "../shared/paginate"
import { APPLICATION_TOKEN_COLUMNS, toApplicationTokenRecord } from "./applicationTokenMapper"

// Revoke a token, org-bound (a caller can never revoke another org's token). Returns null when nothing
// matched in this tenant (the route turns that into a 404).
export const markApplicationTokenRevoked =
  (db: LagdaDatabase) =>
  async (id: string, organizationId: string, revokedAt: Date): Promise<ApplicationTokenRecord | null> => {
    recordQuery()
    const row = await db
      .updateTable("application_tokens")
      .set({ revoked_at: revokedAt })
      .where("id", "=", id)
      .where("org_id", "=", organizationId)
      .returning(APPLICATION_TOKEN_COLUMNS)
      .executeTakeFirst()
    return row === undefined ? null : toApplicationTokenRecord(row)
  }
