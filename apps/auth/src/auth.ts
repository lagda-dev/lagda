import { scopesForRole } from "@lagda/auth-contract"
import { getErrorMessage, type Role } from "@lagda/core"
import { betterAuth } from "better-auth"
import { bearer, emailOTP, jwt, organization } from "better-auth/plugins"
import { Pool } from "pg"
import { createOtpGenerator } from "./otpGenerator"
import { createLoggingOtpSender } from "./otpSender"
import type { OtpSender } from "./otpSender"
import { provisionAppOrganization } from "./provisionAppOrganization"
import { activeOrganizationIdOf, resolveActiveMembership } from "./resolveActiveMembership"

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

// Rate-limit windows (seconds) and ceilings. The defaults guard normal app traffic; the OTP send and
// verify endpoints are far tighter to resist brute-forcing a 6-digit code and OTP-send flooding (§4).
const RATE_LIMIT_WINDOW_SECONDS = 60
const RATE_LIMIT_DEFAULT_MAX = 30
const OTP_SEND_MAX_PER_WINDOW = 3
const OTP_VERIFY_MAX_PER_WINDOW = 5
// One OTP code may be guessed at most this many times before it is invalidated (defence in depth on top
// of the per-IP rate limit above), and it lives only this long.
const OTP_ALLOWED_ATTEMPTS = 3
const OTP_LENGTH = 6
const OTP_EXPIRES_IN_SECONDS = 5 * 60

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
    // Rate limiting on every route (§4). Better Auth enables this only in production by default; we turn
    // it on in every environment so staging is protected too, and clamp the OTP send/verify and sign-up
    // endpoints hard to resist brute-force and account-flooding. Memory storage is per-instance, which is
    // acceptable for now (TODO: switch to "database" storage if the auth service is horizontally scaled).
    rateLimit: {
      enabled: true,
      window: RATE_LIMIT_WINDOW_SECONDS,
      max: RATE_LIMIT_DEFAULT_MAX,
      customRules: {
        "/email-otp/send-verification-otp": { window: RATE_LIMIT_WINDOW_SECONDS, max: OTP_SEND_MAX_PER_WINDOW },
        "/sign-in/email-otp": { window: RATE_LIMIT_WINDOW_SECONDS, max: OTP_VERIFY_MAX_PER_WINDOW },
        "/email-otp/verify-email": { window: RATE_LIMIT_WINDOW_SECONDS, max: OTP_VERIFY_MAX_PER_WINDOW },
        "/sign-up/email": { window: RATE_LIMIT_WINDOW_SECONDS, max: OTP_VERIFY_MAX_PER_WINDOW },
      },
    },
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
        // Bound the code's lifetime and how many times it may be guessed before it is invalidated, so a
        // 6-digit code is not brute-forceable within its validity window (defence in depth with the
        // per-IP rate limit above, §4/§6).
        otpLength: OTP_LENGTH,
        expiresIn: OTP_EXPIRES_IN_SECONDS,
        allowedAttempts: OTP_ALLOWED_ATTEMPTS,
        // Dev affordance only: when AUTH_DEV_FIXED_OTP is opted in (never in production), the seeded owner
        // gets a fixed code so local sign-in needs no log scraping; everyone else gets a random one.
        generateOTP: createOtpGenerator(),
        sendVerificationOTP: async ({ email, otp, type }) => {
          try {
            await otpSender({ email, otp, type })
          } catch (error) {
            throw new Error(`Failed to send verification OTP: ${getErrorMessage(error)}`)
          }
        },
      }),
      // Organizations with the owner/admin/member role model; the creator is always the owner. When a
      // user signs up and creates their organization, mirror it into the app schema (same id) with a
      // default entity, so the brand-new owner lands on a usable instance — the same provisioning the
      // first-run seed does, but driven by the UI sign-up flow.
      organization({
        creatorRole: ORGANIZATION_CREATOR_ROLE,
        organizationCreation: {
          afterCreate: async ({ organization: createdOrganization }) => {
            await provisionAppOrganization(database, {
              id: createdOrganization.id,
              name: createdOrganization.name,
              slug: createdOrganization.slug,
            })
          },
        },
      }),
      // JWT issuance + the well-known JWKS endpoint the resource server verifies bearer tokens against.
      // The resource server (apps/server) authorizes on @lagda/auth-contract claims — sub, orgId, role,
      // scopes — none of which are in Better Auth's default payload, so we define them here. Scopes are
      // empty for human sessions (role-based access); application tokens carry scopes instead.
      jwt({
        jwt: {
          definePayload: async ({ user, session }) => {
            const { organizationId, role } = await resolveActiveMembership(database, user.id, activeOrganizationIdOf(session))
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
