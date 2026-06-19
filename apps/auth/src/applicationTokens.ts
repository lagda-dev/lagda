import { createHash, randomBytes } from "node:crypto"
import { TOKEN_SCOPES } from "@lagda/auth-contract"
import type { TokenScope } from "@lagda/auth-contract"
import type { Role } from "@lagda/core"
import { getErrorMessage } from "./getErrorMessage"

// Scoped, org-bound application tokens for the public REST API. They are minted ONLY by owners/admins
// (§6), carry an explicit, non-empty set of scopes, and are stored HASHED — the plaintext secret is
// shown exactly once at mint time and never persisted.

// Only owners and admins may mint, list, or revoke application tokens. A plain user is denied.
const TOKEN_MANAGING_ROLES: readonly Role[] = ["owner", "admin"] as const

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

// Guard the mint/list/revoke authorization explicitly: deny by default, allow only owner/admin.
export const canManageApplicationTokens = (role: Role): boolean => TOKEN_MANAGING_ROLES.includes(role)

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

const isKnownScope = (scope: string): scope is TokenScope => (TOKEN_SCOPES as readonly string[]).includes(scope)

// Hash a token secret for storage. SHA-256 is sufficient for a high-entropy random secret (no salt
// needed for 256-bit randomness), and lets the resource path do a constant-shape lookup by hash.
export const hashToken = (plaintext: string): string => createHash("sha256").update(plaintext).digest("hex")

// Generate a high-entropy, prefixed secret so leaked tokens are recognizable in logs/scanners.
export const generateTokenSecret = (): string => `${TOKEN_PREFIX}${randomBytes(TOKEN_BYTE_LENGTH).toString("base64url")}`

// Mint a new application token. Authorization is enforced FIRST (deny-by-default), then scopes are
// validated, then a hashed record is persisted and the one-time plaintext is returned to the caller.
export const mintApplicationToken =
  (store: ApplicationTokenStore) =>
  async (actorRole: Role, input: MintApplicationTokenInput): Promise<MintedApplicationToken> => {
    if (!canManageApplicationTokens(actorRole)) {
      throw new Error("Forbidden: only owners and admins may mint application tokens")
    }

    const { organizationId, name, scopes } = input
    const validatedScopes = validateScopes(scopes)
    const plaintext = generateTokenSecret()

    const record: ApplicationTokenRecord = {
      id: randomBytes(16).toString("hex"),
      organizationId,
      name,
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

// List the org's application tokens (owner/admin only). Hashed secrets stay in the records; callers
// must never surface `hashedToken` to clients.
export const listApplicationTokens =
  (store: ApplicationTokenStore) =>
  async (actorRole: Role, organizationId: string): Promise<readonly ApplicationTokenRecord[]> => {
    if (!canManageApplicationTokens(actorRole)) {
      throw new Error("Forbidden: only owners and admins may list application tokens")
    }
    try {
      return await store.listByOrganization(organizationId)
    } catch (error) {
      throw new Error(`Failed to list application tokens: ${getErrorMessage(error)}`)
    }
  }

// Revoke an application token (owner/admin only). Revocation is org-bound so a caller can never revoke
// a token belonging to another organization.
export const revokeApplicationToken =
  (store: ApplicationTokenStore) =>
  async (actorRole: Role, organizationId: string, tokenId: string): Promise<ApplicationTokenRecord> => {
    if (!canManageApplicationTokens(actorRole)) {
      throw new Error("Forbidden: only owners and admins may revoke application tokens")
    }
    const revoked = await revokeOrThrow(store, organizationId, tokenId)
    return revoked
  }

const revokeOrThrow = async (store: ApplicationTokenStore, organizationId: string, tokenId: string): Promise<ApplicationTokenRecord> => {
  try {
    const revoked = await store.markRevoked(tokenId, organizationId, new Date())
    if (!revoked) {
      throw new Error(`Application token not found: ${tokenId}`)
    }
    return revoked
  } catch (error) {
    throw new Error(`Failed to revoke application token: ${getErrorMessage(error)}`)
  }
}
