import { getErrorMessage } from "@lagda/core"
import type { ApplicationTokenRecord } from "../../applicationTokens/applicationTokens"
import { recordQuery } from "../../infrastructure/queryCounter"
import type { LagdaDatabase } from "../shared/paginate"

// Persist a freshly minted token. The id/created_at/revoked_at are app-authoritative or DB-defaulted;
// only the insertable columns are written. The unique hashed_token guards against collisions.
export const insertApplicationToken =
  (db: LagdaDatabase) =>
  async (record: ApplicationTokenRecord): Promise<void> => {
    recordQuery()
    try {
      await db
        .insertInto("application_tokens")
        .values({ id: record.id, org_id: record.organizationId, name: record.name, scopes: JSON.stringify(record.scopes), hashed_token: record.hashedToken })
        .execute()
    } catch (error) {
      throw new Error(`Failed to insert application token: ${getErrorMessage(error)}`)
    }
  }
