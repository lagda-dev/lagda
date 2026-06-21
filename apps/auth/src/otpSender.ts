import { isDevOtpEnabled } from "./devOtp"

// The OTP delivery side-effect is abstracted behind an injectable sender so the auth instance never
// hard-codes a transport. Tests pass a fake; production swaps in a real email provider later.
export type OtpDeliveryType = "sign-in" | "email-verification" | "forget-password"

export type OtpMessage = {
  email: string
  otp: string
  type: OtpDeliveryType
}

export type OtpSender = (message: OtpMessage) => Promise<void>

// TODO(email): replace this logging stub with a real transactional email provider (e.g. Resend / SES).
// SECURITY: this REDACTS the address and the code by default — including outside production (a staging
// box with no SMTP must not leak OTP codes or PII to its logs, §8). The full address and cleartext code
// are written ONLY when the local-dev affordance is explicitly opted in (AUTH_DEV_FIXED_OTP, which
// `isDevOtpEnabled` forbids in production), since that is the only way to complete a local OTP sign-in.
export const createLoggingOtpSender =
  (env: NodeJS.ProcessEnv = process.env, write: (line: string) => void = (line) => process.stdout.write(line)): OtpSender =>
  async ({ email, otp, type }) => {
    if (isDevOtpEnabled(env)) {
      write(`otp.send type=${type} to=${email} otp=${otp}  (dev only — AUTH_DEV_FIXED_OTP enabled, shown so you can sign in locally)\n`)
      return
    }
    write(`otp.send type=${type} to=${redactEmail(email)} otp=<redacted>\n`)
  }

// Reduce an email to a non-identifying shape (first char + domain) so logs stay debuggable without PII.
const redactEmail = (email: string): string => {
  const [localPart, domain] = email.split("@")
  if (!localPart || !domain) return "<invalid>"
  const firstChar = localPart.slice(0, 1)
  return `${firstChar}***@${domain}`
}
