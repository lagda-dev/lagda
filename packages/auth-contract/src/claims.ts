import { z } from "zod"
import type { Role } from "@lagda/core"
import { TOKEN_SCOPES } from "./permissions"
import type { TokenScope } from "./permissions"

// The role vocabulary lives in @lagda/core; we mirror it here as a Zod enum so token claims can be
// validated at the trust boundary without depending on a runtime value from core.
const ROLES = ["owner", "admin", "user"] as const

const roleSchema: z.ZodType<Role> = z.enum(ROLES)

const tokenScopeSchema: z.ZodType<TokenScope> = z.enum(TOKEN_SCOPES)

// Claims carried by a user JWT minted by the auth service and verified by the resource server via JWKS.
// `sub` is the user id, `orgId` resolves the tenant, `role` drives the RBAC matrix, and `scopes` narrow
// what the bearer may do on the public API.
export const tokenClaimsSchema = z.object({
  sub: z.string().min(1),
  orgId: z.string().min(1),
  role: roleSchema,
  scopes: z.array(tokenScopeSchema),
})

export type TokenClaims = z.infer<typeof tokenClaimsSchema>

// Machine tokens are minted for an application rather than a human, so they always carry the `admin`
// role for now and an explicit, non-empty set of scopes that gate the public API calls they may make.
export const applicationTokenClaimsSchema = tokenClaimsSchema.extend({
  role: z.literal("admin"),
  scopes: z.array(tokenScopeSchema).nonempty(),
})

export type ApplicationTokenClaims = z.infer<typeof applicationTokenClaimsSchema>

// Validate raw, untrusted claims at the boundary and fail fast with a descriptive, non-leaking error.
export const parseClaims = (raw: unknown): TokenClaims => {
  const parsed = tokenClaimsSchema.safeParse(raw)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
    throw new Error(`Invalid token claims: ${issues}`)
  }
  return parsed.data
}
