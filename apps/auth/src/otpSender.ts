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
// Production NEVER logs the code or the full address (§8 no-PII) — it only records that a send was
// attempted. In development there is no email transport, so we print the full address and the code in
// cleartext to stdout, which is the only way to complete a local OTP sign-in.
export const createLoggingOtpSender =
  (write: (line: string) => void = (line) => process.stdout.write(line)): OtpSender =>
  async ({ email, otp, type }) => {
    if (process.env.NODE_ENV === "production") {
      write(`otp.send type=${type} to=${redactEmail(email)} otp=<redacted>\n`)
      return
    }
    write(`otp.send type=${type} to=${email} otp=${otp}  (dev only — shown so you can sign in locally)\n`)
  }

// Reduce an email to a non-identifying shape (first char + domain) so logs stay debuggable without PII.
const redactEmail = (email: string): string => {
  const [localPart, domain] = email.split("@")
  if (!localPart || !domain) return "<invalid>"
  const firstChar = localPart.slice(0, 1)
  return `${firstChar}***@${domain}`
}
