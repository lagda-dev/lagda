import type { TokenScope } from "@lagda/auth-contract"
import type { ApplicationTokenRecord } from "../../applicationTokens/applicationTokens"

// The columns every application-token query selects (raw row shape).
export const APPLICATION_TOKEN_COLUMNS = ["id", "org_id", "name", "scopes", "hashed_token", "created_at", "revoked_at"] as const

type ApplicationTokenRow = {
  id: string
  org_id: string
  name: string
  scopes: string[]
  hashed_token: string
  created_at: Date
  revoked_at: Date | null
}

// Translate a stored row into the domain record (scopes jsonb → typed scopes; never drops the hash —
// the route is responsible for not exposing it).
export const toApplicationTokenRecord = (row: ApplicationTokenRow): ApplicationTokenRecord => ({
  id: row.id,
  organizationId: row.org_id,
  name: row.name,
  scopes: row.scopes as readonly TokenScope[],
  hashedToken: row.hashed_token,
  createdAt: row.created_at,
  revokedAt: row.revoked_at,
})
