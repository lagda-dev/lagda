import { createAuthClient } from "better-auth/react"
import { emailOTPClient, jwtClient, organizationClient } from "better-auth/client/plugins"

// The SPA talks to the Better Auth identity service (apps/auth on :3100), NOT the application server.
// The Better Auth client requires an ABSOLUTE base URL. We default to the SPA's own origin + "/api/auth",
// which the dev Vite proxy routes to :3100 and a prod same-origin reverse proxy routes to the auth
// service; set VITE_AUTH_BASE_URL to target a different auth origin.
const sameOriginAuthUrl = typeof window === "undefined" ? "http://localhost:3100/api/auth" : `${window.location.origin}/api/auth`
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL ?? sameOriginAuthUrl

// Where the captured Better Auth JWT is stored so the app-server API client (src/api/client.ts) can
// attach it as `Authorization: Bearer <token>`. The server verifies the signature via the auth JWKS.
export const BEARER_TOKEN_STORAGE_KEY = "lagda.bearerToken"

const readStoredBearerToken = (): string => {
  try {
    return localStorage.getItem(BEARER_TOKEN_STORAGE_KEY) ?? ""
  } catch {
    // localStorage can throw in private-mode/SSR-like contexts; degrade to an unauthenticated request
    // rather than crashing the whole client.
    return ""
  }
}

const storeBearerToken = (token: string): void => {
  try {
    localStorage.setItem(BEARER_TOKEN_STORAGE_KEY, token)
  } catch {
    // Non-fatal: the next authenticated call will simply fall back to re-fetching a token.
  }
}

// The single Better Auth React client. Plugins mirror the server (apps/auth/src/auth.ts):
//   - emailOTPClient   → emailOtp.sendVerificationOtp / signIn.emailOtp
//   - organizationClient → active-organization + member-role lookups for UX gating
//   - jwtClient        → authClient.token() to mint the bearer JWT the app server verifies via JWKS
// `fetchOptions.onSuccess` opportunistically captures the rotating session bearer token from the
// `set-auth-token` response header so authenticated calls have a token without an extra round-trip.
export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [emailOTPClient(), organizationClient(), jwtClient()],
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: readStoredBearerToken,
    },
    onSuccess: (ctx) => {
      const refreshedToken = ctx.response.headers.get("set-auth-token")
      if (refreshedToken !== null && refreshedToken.length > 0) storeBearerToken(refreshedToken)
    },
  },
})

// Typed re-exports so feature code never reaches into the raw client surface.
export const { signIn, signUp, signOut, useSession, getSession, organization, useActiveOrganization } = authClient

// Send a sign-in OTP to the given email (the OTP-required step after email/password).
export const sendOtp = (email: string) => authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })

// Complete sign-in by exchanging the emailed OTP for a session.
export const verifyOtp = (email: string, otp: string) => signIn.emailOtp({ email, otp })

// --- Sign-up (self-service: a new account that owns a brand-new organization) ---

// Create the account. Email verification is required, so this yields no usable session yet; the emailOTP
// plugin sends an "email-verification" code on sign-up which the next step exchanges.
export const signUpWithEmail = (params: { email: string; password: string; name: string }) => signUp.email(params)

// (Re)send the sign-up email-verification OTP — used by the resend affordance on the verify step.
export const sendSignupOtp = (email: string) => authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" })

// Verify the account's email with the emailed code, marking it verified so sign-in can proceed.
export const verifyEmailOtp = (email: string, otp: string) => authClient.emailOtp.verifyEmail({ email, otp })

// Sign in with email + password (used right after verification to establish the new account's session).
export const signInWithPassword = (email: string, password: string) => signIn.email({ email, password })

// Create the caller's organization (they become its owner via creatorRole) and make it the active one,
// so the session — and the bearer JWT minted from it — carry the org id + owner role.
export const createOrganization = (params: { name: string; slug: string }) => organization.create(params)
export const setActiveOrganization = (organizationId: string) => organization.setActive({ organizationId })

// Fetch a fresh application JWT from the auth service and persist it for the app-server API client.
// Returns the token string, or throws with context so callers surface the failure (no silent failure).
export const fetchBearerToken = async (): Promise<string> => {
  const { data, error } = await authClient.token()
  if (error !== null) throw new Error(`Failed to obtain bearer token: ${error.message ?? "unknown error"}`)
  if (data === null) throw new Error("Failed to obtain bearer token: empty response")
  return data.token
}
