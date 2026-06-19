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
  otpSender?: OtpSender
}

// The role vocabulary mirrors @lagda/core: Better Auth's organization plugin uses owner/admin/member,
// where `member` is our `user`. The first member of an organization becomes the `owner` (creatorRole).
const ORGANIZATION_CREATOR_ROLE = "owner" as const

// Build the Better Auth instance — the sole token authority. Email/password sign-in plus a REQUIRED
// email-OTP step, sessions, organizations with owner/admin/member roles, JWT issuance with a JWKS
// endpoint, and bearer-token authentication for header-based clients.
export const createAuth = ({ databaseUrl, baseUrl, otpSender = createLoggingOtpSender() }: AuthConfig) => {
  const database = new Pool({ connectionString: databaseUrl })

  return betterAuth({
    baseURL: baseUrl,
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
      jwt(),
      // Accept Authorization: Bearer <token> in addition to cookie sessions.
      bearer(),
    ],
    // TODO(sso): register a Google social provider here once SSO is in scope (§6 — stub only for now).
    // TODO(saml): wire the SAML SSO plugin here once enterprise SSO is in scope (§6 — stub only for now).
    // TODO(scim): wire SCIM provisioning here once directory provisioning is in scope (§6 — stub only).
  })
}

export type Auth = ReturnType<typeof createAuth>
