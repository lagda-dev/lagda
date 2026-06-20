import { scopesForRole } from "@lagda/auth-contract"
import type { Role } from "@lagda/core"
import { betterAuth } from "better-auth"
import { bearer, emailOTP, jwt, organization } from "better-auth/plugins"
import { Pool } from "pg"
import { getErrorMessage } from "./getErrorMessage"
import { createLoggingOtpSender } from "./otpSender"
import type { OtpSender } from "./otpSender"

// The auth service owns its OWN Postgres schema (Better Auth migrations), separate from @lagda/db.
// It prefers a dedicated AUTH_DATABASE_URL so the identity store can live apart from the app data,
// falling back to the shared DATABASE_URL when a single database is acceptable.
export type AuthConfig = {
  databaseUrl: string
  baseUrl: string
  trustedOrigins?: string[]
  otpSender?: OtpSender
}

// The role vocabulary mirrors @lagda/core: Better Auth's organization plugin uses owner/admin/member,
// where `member` is our `user`. The first member of an organization becomes the `owner` (creatorRole).
const ORGANIZATION_CREATOR_ROLE = "owner" as const

// The SPA calls the auth service from its own origin (the Vite dev server in development, the app's
// public origin in production), so those origins must be trusted or Better Auth rejects them (403).
// Defaults cover local dev (Vite :5173) and the prod-served SPA (:3000); override via TRUSTED_ORIGINS.
const DEFAULT_TRUSTED_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]

// Resolve the caller's first organization membership + role, mapping Better Auth's `member` to our
// `user`. Used to enrich the JWT so the resource server can authorize (it needs orgId + role).
const resolveActiveMembership = async (database: Pool, userId: string): Promise<{ organizationId: string | null; role: string | null }> => {
  const result = await database.query<{ organizationId: string; role: string }>(
    'select "organizationId", role from "member" where "userId" = $1 order by "createdAt" asc limit 1',
    [userId],
  )
  const [row] = result.rows
  if (row === undefined) return { organizationId: null, role: null }
  return { organizationId: row.organizationId, role: row.role === "member" ? "user" : row.role }
}

// Build the Better Auth instance — the sole token authority. Email/password sign-in plus a REQUIRED
// email-OTP step, sessions, organizations with owner/admin/member roles, JWT issuance with a JWKS
// endpoint, and bearer-token authentication for header-based clients.
export const createAuth = ({ databaseUrl, baseUrl, trustedOrigins = DEFAULT_TRUSTED_ORIGINS, otpSender = createLoggingOtpSender() }: AuthConfig) => {
  const database = new Pool({ connectionString: databaseUrl })

  return betterAuth({
    baseURL: baseUrl,
    // Trust the auth service's own origin plus the SPA origins so cross-origin sign-in is accepted.
    trustedOrigins: [...new Set([baseUrl, ...trustedOrigins])],
    database,
    // Email verification is REQUIRED: a freshly signed-up account cannot authenticate until it has
    // proven control of its inbox via the email-OTP flow below. This is the OTP-required invariant.
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
    },
    databaseHooks: {
      session: {
        create: {
          // Default a new session's active organization to the user's first membership. Better Auth
          // leaves activeOrganizationId null otherwise, which makes getActiveMember() — and therefore
          // every role-gated screen and nav item — resolve to nothing. This wires the role on sign-in.
          before: async (session) => {
            try {
              const result = await database.query<{ organizationId: string }>(
                'select "organizationId" from "member" where "userId" = $1 order by "createdAt" asc limit 1',
                [session.userId],
              )
              const activeOrganizationId = result.rows[0]?.organizationId
              if (activeOrganizationId === undefined) return
              return { data: { ...session, activeOrganizationId } }
            } catch (error) {
              throw new Error(`Failed to set active organization on session: ${getErrorMessage(error)}`)
            }
          },
        },
      },
    },
    plugins: [
      // Email OTP: send on sign-up verification and on each OTP sign-in. The actual delivery is
      // delegated to the injected sender so transport stays a boundary concern (TODO: real email).
      emailOTP({
        sendVerificationOnSignUp: true,
        sendVerificationOTP: async ({ email, otp, type }) => {
          try {
            await otpSender({ email, otp, type })
          } catch (error) {
            throw new Error(`Failed to send verification OTP: ${getErrorMessage(error)}`)
          }
        },
      }),
      // Organizations with the owner/admin/member role model; the creator is always the owner.
      organization({
        creatorRole: ORGANIZATION_CREATOR_ROLE,
      }),
      // JWT issuance + the well-known JWKS endpoint the resource server verifies bearer tokens against.
      // The resource server (apps/server) authorizes on @lagda/auth-contract claims — sub, orgId, role,
      // scopes — none of which are in Better Auth's default payload, so we define them here. Scopes are
      // empty for human sessions (role-based access); application tokens carry scopes instead.
      jwt({
        jwt: {
          definePayload: async ({ user }) => {
            const { organizationId, role } = await resolveActiveMembership(database, user.id)
            // The session JWT carries the scopes the role implies, so the resource server's scope gate
            // (which also guards machine application tokens) lets a human on the SPA call scoped routes.
            const scopes = role === null ? [] : scopesForRole(role as Role)
            return { sub: user.id, orgId: organizationId, role, scopes }
          },
        },
      }),
      // Accept Authorization: Bearer <token> in addition to cookie sessions.
      bearer(),
    ],
    // TODO(sso): register a Google social provider here once SSO is in scope (§6 — stub only for now).
    // TODO(saml): wire the SAML SSO plugin here once enterprise SSO is in scope (§6 — stub only for now).
    // TODO(scim): wire SCIM provisioning here once directory provisioning is in scope (§6 — stub only).
  })
}

export type Auth = ReturnType<typeof createAuth>
