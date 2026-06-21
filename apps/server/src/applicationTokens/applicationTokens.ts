import { createHash, randomBytes } from "node:crypto"
import { getErrorMessage } from "@lagda/core"
import { TOKEN_SCOPES } from "@lagda/auth-contract"
import type { TokenScope } from "@lagda/auth-contract"

// Scoped, org-bound application tokens for the public REST API (§4). They carry an explicit, non-empty
// set of scopes and are stored HASHED — the plaintext secret is shown exactly once at mint time and
// never persisted. Authorization (owner/admin) is enforced ONCE at the route guard
// (`guard(MANAGE_TOKENS)`); these functions assume the caller is already authorized.

const TOKEN_BYTE_LENGTH = 32
const TOKEN_PREFIX = "lagda_at_"

export type ApplicationTokenRecord = {
  id: string
  organizationId: string
  name: string
  scopes: readonly TokenScope[]
  hashedToken: string
  createdAt: Date
  revokedAt: Date | null
}

export type MintApplicationTokenInput = {
  organizationId: string
  name: string
  scopes: readonly TokenScope[]
}

export type MintedApplicationToken = {
  record: ApplicationTokenRecord
  // The plaintext secret — returned once at mint time, never stored.
  plaintext: string
}

// A storage port so the minting/listing/revoking logic stays testable and decoupled from Postgres.
export type ApplicationTokenStore = {
  insert: (record: ApplicationTokenRecord) => Promise<void>
  listByOrganization: (organizationId: string) => Promise<readonly ApplicationTokenRecord[]>
  markRevoked: (id: string, organizationId: string, revokedAt: Date) => Promise<ApplicationTokenRecord | null>
}

const isKnownScope = (scope: string): scope is TokenScope => (TOKEN_SCOPES as readonly string[]).includes(scope)

// Validate that every requested scope is a known scope and that at least one was requested.
export const validateScopes = (scopes: readonly string[]): readonly TokenScope[] => {
  if (scopes.length === 0) {
    throw new Error("Application token requires at least one scope")
  }
  const unknownScopes = scopes.filter((scope) => !isKnownScope(scope))
  if (unknownScopes.length > 0) {
    throw new Error(`Unknown application token scope(s): ${unknownScopes.join(", ")}`)
  }
  return scopes as readonly TokenScope[]
}

// Hash a token secret for storage. SHA-256 is sufficient for a high-entropy random secret (no salt
// needed for 256-bit randomness), and lets the future verification path do a constant-shape lookup by hash.
export const hashToken = (plaintext: string): string => createHash("sha256").update(plaintext).digest("hex")

// Generate a high-entropy, prefixed secret so leaked tokens are recognizable in logs/scanners.
export const generateTokenSecret = (): string => `${TOKEN_PREFIX}${randomBytes(TOKEN_BYTE_LENGTH).toString("base64url")}`

// Mint a new application token: validate scopes, persist a hashed record, and return the one-time
// plaintext to the caller. Authorization is the route guard's responsibility (not re-checked here).
export const mintApplicationToken =
  (store: ApplicationTokenStore) =>
  async (input: MintApplicationTokenInput): Promise<MintedApplicationToken> => {
    const validatedScopes = validateScopes(input.scopes)
    const plaintext = generateTokenSecret()

    const record: ApplicationTokenRecord = {
      id: randomBytes(16).toString("hex"),
      organizationId: input.organizationId,
      name: input.name,
      scopes: validatedScopes,
      hashedToken: hashToken(plaintext),
      createdAt: new Date(),
      revokedAt: null,
    }

    try {
      await store.insert(record)
    } catch (error) {
      throw new Error(`Failed to mint application token: ${getErrorMessage(error)}`)
    }

    return { record, plaintext }
  }

// List the org's application tokens. Hashed secrets stay in the records; the route must never surface
// `hashedToken` to clients.
export const listApplicationTokens =
  (store: ApplicationTokenStore) =>
  async (organizationId: string): Promise<readonly ApplicationTokenRecord[]> => {
    try {
      return await store.listByOrganization(organizationId)
    } catch (error) {
      throw new Error(`Failed to list application tokens: ${getErrorMessage(error)}`)
    }
  }

// Revoke an application token, org-bound so a caller can never revoke another organization's token.
export const revokeApplicationToken =
  (store: ApplicationTokenStore) =>
  async (organizationId: string, tokenId: string): Promise<ApplicationTokenRecord | null> => {
    try {
      return await store.markRevoked(tokenId, organizationId, new Date())
    } catch (error) {
      throw new Error(`Failed to revoke application token: ${getErrorMessage(error)}`)
    }
  }
